"""
System Tools
=============

Tools for reading application state and settings.
Delegates to existing /api/v1/settings and /api/v1/system endpoints.

Tools:
  get_settings()      — returns current UI language, theme
  get_system_health() — backend health check
"""

import json
from pathlib import Path
import sys

import httpx

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.System")

_config = load_config_with_main("main.yaml", _project_root)
_BACKEND_PORT = _config.get("server", {}).get("backend_port", 8001)
_BASE_URL = f"http://localhost:{_BACKEND_PORT}/api/v1"

# ---------------------------------------------------------------------------
# OpenAI function-calling tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "get_settings",
            "description": (
                "Get the current UI settings of TecktalTutor: language (en/zh) and theme (light/dark). "
                "Use this to tailor your responses to the student's language preference."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_system_health",
            "description": (
                "Check if the TecktalTutor backend is healthy and operational. "
                "Use this if a previous tool call failed unexpectedly."
            ),
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Tool handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "get_settings":
        return await _get_settings()
    elif name == "get_system_health":
        return await _get_system_health()
    else:
        return json.dumps({"error": f"Unknown system tool: {name}"})


async def _get_settings() -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/settings")
            resp.raise_for_status()
            data = resp.json()
            ui = data.get("ui", {})
            result = {
                "language": ui.get("language", "en"),
                "theme": ui.get("theme", "light"),
                "sidebar_description": ui.get("sidebar_description", ""),
            }
            logger.info(f"[get_settings] {result}")
            return json.dumps(result)
    except Exception as e:
        logger.error(f"[get_settings] Error: {e}")
        return json.dumps({"error": str(e)})


async def _get_system_health() -> str:
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"http://localhost:{_BACKEND_PORT}/")
            healthy = resp.status_code == 200
            return json.dumps({
                "status": "healthy" if healthy else "unhealthy",
                "backend_url": f"http://localhost:{_BACKEND_PORT}",
                "http_status": resp.status_code,
            })
    except Exception as e:
        logger.error(f"[get_system_health] Error: {e}")
        return json.dumps({
            "status": "unreachable",
            "error": str(e),
            "backend_url": f"http://localhost:{_BACKEND_PORT}",
        })

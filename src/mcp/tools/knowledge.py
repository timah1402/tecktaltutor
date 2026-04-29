"""
Knowledge Base Tools
=====================

Tools that let the agent query and manage the knowledge bases.
All calls delegate to the existing /api/v1/knowledge REST endpoints.

Tools:
  list_knowledge_bases()               — list all KBs with stats
  get_knowledge_base(kb_name)          — details for one KB
  get_default_knowledge_base()         — which KB is currently default
  set_default_knowledge_base(kb_name)  — change the default KB
"""

import json
from pathlib import Path
import sys

import httpx

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Knowledge")

# Load backend port from config
_config = load_config_with_main("main.yaml", _project_root)
_BACKEND_PORT = _config.get("server", {}).get("backend_port", 8001)
_BASE_URL = f"http://localhost:{_BACKEND_PORT}/api/v1/knowledge"

# ---------------------------------------------------------------------------
# OpenAI function-calling tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_knowledge_bases",
            "description": (
                "List all available knowledge bases in TecktalTutor with their document counts "
                "and initialization status. Use this to know what learning material is available "
                "before running research or generating questions."
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
            "name": "get_knowledge_base",
            "description": "Get detailed information about a specific knowledge base.",
            "parameters": {
                "type": "object",
                "properties": {
                    "kb_name": {
                        "type": "string",
                        "description": "The name of the knowledge base to retrieve.",
                    }
                },
                "required": ["kb_name"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_default_knowledge_base",
            "description": (
                "Get the name of the currently active (default) knowledge base. "
                "Use this when you need to know which KB will be used by default in solve/research/question tools."
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
            "name": "set_default_knowledge_base",
            "description": (
                "Change the default knowledge base. Call this when the student asks to "
                "switch to a different subject or knowledge source."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "kb_name": {
                        "type": "string",
                        "description": "The name of the knowledge base to set as default.",
                    }
                },
                "required": ["kb_name"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Tool handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "list_knowledge_bases":
        return await _list_knowledge_bases()
    elif name == "get_knowledge_base":
        return await _get_knowledge_base(args)
    elif name == "get_default_knowledge_base":
        return await _get_default_knowledge_base()
    elif name == "set_default_knowledge_base":
        return await _set_default_knowledge_base(args)
    else:
        return json.dumps({"error": f"Unknown knowledge tool: {name}"})


async def _list_knowledge_bases() -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/list")
            resp.raise_for_status()
            kbs = resp.json()

        # Simplify output for the agent
        simplified = [
            {
                "name": kb.get("name"),
                "is_default": kb.get("is_default", False),
                "document_count": kb.get("statistics", {}).get("raw_documents", 0),
                "rag_ready": kb.get("statistics", {}).get("rag_initialized", False),
            }
            for kb in kbs
        ]

        logger.info(f"[list_knowledge_bases] Found {len(simplified)} KBs")
        return json.dumps({"knowledge_bases": simplified, "total": len(simplified)})

    except httpx.HTTPError as e:
        logger.error(f"[list_knowledge_bases] HTTP error: {e}")
        return json.dumps({"error": f"Failed to list knowledge bases: {e}"})
    except Exception as e:
        logger.error(f"[list_knowledge_bases] Error: {e}")
        return json.dumps({"error": str(e)})


async def _get_knowledge_base(args: dict) -> str:
    kb_name = args.get("kb_name", "").strip()
    if not kb_name:
        return json.dumps({"error": "kb_name is required"})
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/{kb_name}")
            if resp.status_code == 404:
                return json.dumps({"error": f"Knowledge base '{kb_name}' not found"})
            resp.raise_for_status()
            return json.dumps(resp.json())
    except Exception as e:
        logger.error(f"[get_knowledge_base] Error: {e}")
        return json.dumps({"error": str(e)})


async def _get_default_knowledge_base() -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/default")
            resp.raise_for_status()
            data = resp.json()
            default_kb = data.get("default_kb", "")
            logger.info(f"[get_default_knowledge_base] Default KB: {default_kb}")
            return json.dumps({"default_kb": default_kb})
    except Exception as e:
        logger.error(f"[get_default_knowledge_base] Error: {e}")
        return json.dumps({"error": str(e)})


async def _set_default_knowledge_base(args: dict) -> str:
    kb_name = args.get("kb_name", "").strip()
    if not kb_name:
        return json.dumps({"error": "kb_name is required"})
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.put(f"{_BASE_URL}/default/{kb_name}")
            if resp.status_code == 404:
                return json.dumps({"error": f"Knowledge base '{kb_name}' not found"})
            resp.raise_for_status()
            logger.info(f"[set_default_knowledge_base] Set default to: {kb_name}")
            return json.dumps({"success": True, "default_kb": kb_name})
    except Exception as e:
        logger.error(f"[set_default_knowledge_base] Error: {e}")
        return json.dumps({"error": str(e)})

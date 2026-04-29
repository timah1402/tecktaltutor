"""
Notebook Tools
==============

MCP tools for listing, reading, and creating notebooks.
All calls delegate to the existing /api/v1/notebook REST endpoints.

Tools:
  list_notebooks()                          — list all notebooks with record counts
  get_notebook(notebook_id)                 — get a notebook with all its records
  create_notebook(name, description?, color?, icon?)
"""

import json
from pathlib import Path
import sys

import httpx

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Notebook")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_BASE_URL = f"http://localhost:{_PORT}/api/v1/notebook"

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "list_notebooks",
            "description": (
                "List all the student's notebooks with their names, descriptions, "
                "and record counts. Use this when the student asks about their saved notes "
                "or when you need to find a notebook to run IdeaGen or Guided Learning on."
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
            "name": "get_notebook",
            "description": (
                "Get the full contents of a specific notebook including all saved records "
                "(research results, solved problems, generated questions, etc.). "
                "Use this to show the student what they've saved or to reference content."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "notebook_id": {
                        "type": "string",
                        "description": "The ID of the notebook to retrieve.",
                    }
                },
                "required": ["notebook_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_notebook",
            "description": (
                "Create a new NOTEBOOK (NOT a knowledge base — these are different things). "
                "A notebook is the student's personal collection of saved learning records. "
                "Use this when the student says: 'create a notebook called X', 'make a new notebook', "
                "'start a notebook'. "
                "Do NOT use knowledge base tools for this — call create_notebook directly."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the new notebook.",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional description of what this notebook is for.",
                        "default": "",
                    },
                    "color": {
                        "type": "string",
                        "description": "Hex color for the notebook (e.g. '#3B82F6'). Optional.",
                        "default": "#3B82F6",
                    },
                    "icon": {
                        "type": "string",
                        "description": "Icon name for the notebook (e.g. 'book', 'star'). Optional.",
                        "default": "book",
                    },
                },
                "required": ["name"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "list_notebooks":
        return await _list_notebooks()
    elif name == "get_notebook":
        return await _get_notebook(args)
    elif name == "create_notebook":
        return await _create_notebook(args)
    else:
        return json.dumps({"error": f"Unknown notebook tool: {name}"})


async def _list_notebooks() -> str:
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/list")
            resp.raise_for_status()
            data = resp.json()

        notebooks = data.get("notebooks", [])
        simplified = [
            {
                "notebook_id": nb.get("notebook_id"),
                "name": nb.get("name"),
                "description": nb.get("description", ""),
                "color": nb.get("color"),
                "record_count": nb.get("record_count", 0),
                "created_at": nb.get("created_at"),
            }
            for nb in notebooks
        ]
        logger.info(f"[list_notebooks] Found {len(simplified)} notebooks")
        return json.dumps({"notebooks": simplified, "total": len(simplified)})

    except Exception as e:
        logger.error(f"[list_notebooks] Error: {e}")
        return json.dumps({"error": str(e)})


async def _get_notebook(args: dict) -> str:
    notebook_id = args.get("notebook_id", "").strip()
    if not notebook_id:
        return json.dumps({"error": "notebook_id is required"})

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/{notebook_id}")
            if resp.status_code == 404:
                return json.dumps({"error": f"Notebook '{notebook_id}' not found"})
            resp.raise_for_status()
            data = resp.json()

        # Summarise records for the agent (avoid massive payloads)
        records = data.get("records", [])
        summarised_records = [
            {
                "record_id": r.get("record_id"),
                "type": r.get("record_type"),
                "title": r.get("title"),
                "user_query": r.get("user_query", "")[:100],
                "created_at": r.get("created_at"),
            }
            for r in records
        ]

        result = {
            "notebook_id": data.get("notebook_id"),
            "name": data.get("name"),
            "description": data.get("description", ""),
            "record_count": len(records),
            "records": summarised_records,
        }
        logger.info(f"[get_notebook] {notebook_id}: {len(records)} records")
        return json.dumps(result)

    except Exception as e:
        logger.error(f"[get_notebook] Error: {e}")
        return json.dumps({"error": str(e)})


async def _create_notebook(args: dict) -> str:
    name = args.get("name", "").strip()
    if not name:
        return json.dumps({"error": "name is required"})

    payload = {
        "name": name,
        "description": args.get("description", ""),
        "color": args.get("color", "#3B82F6"),
        "icon": args.get("icon", "book"),
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(f"{_BASE_URL}/create", json=payload)
            resp.raise_for_status()
            data = resp.json()

        nb = data.get("notebook", {})
        logger.info(f"[create_notebook] Created: {nb.get('notebook_id')} - {name}")
        return json.dumps({
            "success": True,
            "notebook_id": nb.get("notebook_id"),
            "name": nb.get("name"),
            "description": nb.get("description", ""),
        })

    except Exception as e:
        logger.error(f"[create_notebook] Error: {e}")
        return json.dumps({"error": str(e)})

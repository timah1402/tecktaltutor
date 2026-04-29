"""
Guide Tool
==========

MCP tools for the Guided Learning feature.
All calls use the existing REST endpoints (no WS needed — guide is all REST).

Endpoints used:
  POST /guide/create_session  — creates a session from a notebook
  POST /guide/start           — gets the first knowledge point (HTML page)
  POST /guide/next            — moves to next knowledge point
  POST /guide/chat            — asks a question within the session

Tools:
  start_guided_learning(notebook_id)
  next_knowledge_point(session_id)
  chat_in_guide(session_id, message)
  get_guide_session(session_id)
"""

import json
from pathlib import Path
import sys

import httpx

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Guide")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_BASE_URL = f"http://localhost:{_PORT}/api/v1/guide"

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "start_guided_learning",
            "description": (
                "Start a guided learning session from a student's notebook. "
                "The session creates an interactive HTML lesson from the notebook's saved records. "
                "IMPORTANT: call navigate_to('guide') BEFORE this tool, and call list_notebooks() "
                "first to find the notebook_id. "
                "Returns a session_id to use for next_knowledge_point and chat_in_guide."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "notebook_id": {
                        "type": "string",
                        "description": "ID of the notebook to create the learning session from.",
                    },
                },
                "required": ["notebook_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "next_knowledge_point",
            "description": (
                "Advance to the next knowledge point in an active guided learning session. "
                "Call this when the student says 'next', 'continue', or 'move on'. "
                "Returns whether learning is complete."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "The active guide session ID (from start_guided_learning).",
                    },
                },
                "required": ["session_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "chat_in_guide",
            "description": (
                "Send a question or message within an active guided learning session. "
                "Use this when the student asks a clarifying question during a learning session."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "The active guide session ID.",
                    },
                    "message": {
                        "type": "string",
                        "description": "The student's question or message.",
                    },
                },
                "required": ["session_id", "message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_guide_session",
            "description": "Get the current state of a guided learning session.",
            "parameters": {
                "type": "object",
                "properties": {
                    "session_id": {
                        "type": "string",
                        "description": "The guide session ID to query.",
                    },
                },
                "required": ["session_id"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "start_guided_learning":
        return await _start_guided_learning(args)
    elif name == "next_knowledge_point":
        return await _next_knowledge_point(args)
    elif name == "chat_in_guide":
        return await _chat_in_guide(args)
    elif name == "get_guide_session":
        return await _get_guide_session(args)
    else:
        return json.dumps({"error": f"Unknown guide tool: {name}"})


async def _start_guided_learning(args: dict) -> str:
    notebook_id = args.get("notebook_id", "").strip()
    if not notebook_id:
        return json.dumps({"error": "notebook_id is required"})

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            # Step 1: Create session
            create_resp = await client.post(
                f"{_BASE_URL}/create_session",
                json={"notebook_id": notebook_id},
            )
            if create_resp.status_code == 404:
                return json.dumps({"error": f"Notebook '{notebook_id}' not found"})
            if create_resp.status_code == 400:
                return json.dumps({"error": create_resp.json().get("detail", "Bad request")})
            create_resp.raise_for_status()
            session_data = create_resp.json()
            session_id = session_data.get("session_id")

            if not session_id:
                return json.dumps({"error": "Session creation failed — no session_id returned"})

            logger.info(f"[start_guided_learning] session_id={session_id}")

            # Step 2: Start learning (get first knowledge point)
            start_resp = await client.post(
                f"{_BASE_URL}/start",
                json={"session_id": session_id},
            )
            start_resp.raise_for_status()
            start_data = start_resp.json()

        knowledge_points = session_data.get("knowledge_points", [])
        current_kp = start_data.get("knowledge_point") or start_data.get("title", "")

        logger.info(
            f"[start_guided_learning] session={session_id}, "
            f"{len(knowledge_points)} knowledge points, current='{current_kp[:40]}'"
        )

        return json.dumps({
            "success": True,
            "session_id": session_id,
            "total_knowledge_points": len(knowledge_points),
            "current_knowledge_point": current_kp,
            "progress": f"1 / {len(knowledge_points)}",
        })

    except Exception as e:
        logger.error(f"[start_guided_learning] Error: {e}")
        return json.dumps({"error": str(e)})


async def _next_knowledge_point(args: dict) -> str:
    session_id = args.get("session_id", "").strip()
    if not session_id:
        return json.dumps({"error": "session_id is required"})

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{_BASE_URL}/next",
                json={"session_id": session_id},
            )
            if resp.status_code == 404:
                return json.dumps({"error": "Guide session not found"})
            resp.raise_for_status()
            data = resp.json()

        learning_complete = data.get("learning_complete", False)
        current_kp = data.get("knowledge_point") or data.get("title", "")

        logger.info(
            f"[next_knowledge_point] session={session_id}, "
            f"complete={learning_complete}, current='{current_kp[:40]}'"
        )

        return json.dumps({
            "success": True,
            "session_id": session_id,
            "learning_complete": learning_complete,
            "current_knowledge_point": current_kp,
            "message": (
                "Learning session complete! Great job." if learning_complete
                else f"Moved to next knowledge point: {current_kp}"
            ),
        })

    except Exception as e:
        logger.error(f"[next_knowledge_point] Error: {e}")
        return json.dumps({"error": str(e)})


async def _chat_in_guide(args: dict) -> str:
    session_id = args.get("session_id", "").strip()
    message = args.get("message", "").strip()

    if not session_id:
        return json.dumps({"error": "session_id is required"})
    if not message:
        return json.dumps({"error": "message is required"})

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{_BASE_URL}/chat",
                json={"session_id": session_id, "message": message},
            )
            if resp.status_code == 404:
                return json.dumps({"error": "Guide session not found"})
            resp.raise_for_status()
            data = resp.json()

        reply = data.get("response") or data.get("content") or data.get("message", "")
        logger.info(f"[chat_in_guide] session={session_id}, reply={len(reply)} chars")

        return json.dumps({
            "success": True,
            "session_id": session_id,
            "reply": reply,
        })

    except Exception as e:
        logger.error(f"[chat_in_guide] Error: {e}")
        return json.dumps({"error": str(e)})


async def _get_guide_session(args: dict) -> str:
    session_id = args.get("session_id", "").strip()
    if not session_id:
        return json.dumps({"error": "session_id is required"})

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_BASE_URL}/session/{session_id}")
            if resp.status_code == 404:
                return json.dumps({"error": "Guide session not found"})
            resp.raise_for_status()
            data = resp.json()

        return json.dumps({
            "session_id": session_id,
            "notebook_id": data.get("notebook_id"),
            "notebook_name": data.get("notebook_name"),
            "current_index": data.get("current_index", 0),
            "total_points": data.get("total_points", 0),
            "learning_complete": data.get("learning_complete", False),
        })

    except Exception as e:
        logger.error(f"[get_guide_session] Error: {e}")
        return json.dumps({"error": str(e)})

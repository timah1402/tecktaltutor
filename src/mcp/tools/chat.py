"""
Chat Tool
=========

MCP tool that lets the agent send a message to the Chat endpoint.
Wraps the WebSocket /api/v1/chat protocol.

WS Send:    {"message": str, "session_id": str|null, "kb_name": str,
             "enable_rag": bool, "enable_web_search": bool}
WS Receive: {"type": "session"} → {"type": "status"} →
            {"type": "stream"} × N → {"type": "sources"} → {"type": "result"}

Tools:
  chat(message, session_id?, kb_name?, enable_rag?, enable_web_search?)
  list_chat_sessions(limit?)
"""

import json
from pathlib import Path
import sys

import httpx
import websockets

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Chat")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_WS_BASE  = f"ws://localhost:{_PORT}/api/v1"
_HTTP_BASE = f"http://localhost:{_PORT}/api/v1"

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "chat",
            "description": (
                "Send a message to the TecktalTutor AI chat and get a response. "
                "Optionally search the knowledge base (RAG) or the web for grounded answers. "
                "Use this when the student asks a question that benefits from knowledge base context "
                "or when you want to have a focused conversation on a topic."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The message or question to send to the chat agent.",
                    },
                    "session_id": {
                        "type": "string",
                        "description": "Existing session ID for continuity. Omit to start a new session.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base name for RAG. Required if enable_rag is true.",
                    },
                    "enable_rag": {
                        "type": "boolean",
                        "description": "Search the knowledge base for relevant context.",
                        "default": False,
                    },
                    "enable_web_search": {
                        "type": "boolean",
                        "description": "Search the web for up-to-date information.",
                        "default": False,
                    },
                },
                "required": ["message"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_chat_sessions",
            "description": "List recent chat sessions with their titles and timestamps.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Maximum number of sessions to return.",
                        "default": 10,
                    }
                },
                "required": [],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "chat":
        return await _chat(args)
    elif name == "list_chat_sessions":
        return await _list_chat_sessions(args)
    else:
        return json.dumps({"error": f"Unknown chat tool: {name}"})


async def _chat(args: dict) -> str:
    message = args.get("message", "").strip()
    if not message:
        return json.dumps({"error": "message is required"})

    session_id     = args.get("session_id")
    kb_name        = args.get("kb_name", "")
    enable_rag     = args.get("enable_rag", False)
    enable_web     = args.get("enable_web_search", False)

    ws_payload = {
        "message": message,
        "session_id": session_id,
        "kb_name": kb_name,
        "enable_rag": enable_rag,
        "enable_web_search": enable_web,
    }

    logger.info(f"[chat] message={message[:60]}... rag={enable_rag} web={enable_web}")

    full_response = ""
    result_session_id = session_id
    sources = {"rag": [], "web": []}

    try:
        async with websockets.connect(
            f"{_WS_BASE}/chat",
            open_timeout=10,
            close_timeout=5,
        ) as ws:
            await ws.send(json.dumps(ws_payload))

            async for raw in ws:
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue

                t = msg.get("type")
                if t == "session":
                    result_session_id = msg.get("session_id", result_session_id)
                elif t == "stream":
                    full_response += msg.get("content", "")
                elif t == "sources":
                    sources["rag"] = msg.get("rag", [])
                    sources["web"] = msg.get("web", [])
                elif t == "result":
                    full_response = msg.get("content", full_response)
                    # Chat WS stays open (multi-turn); close after result
                    break
                elif t == "error":
                    return json.dumps({"error": msg.get("message", "Chat error")})

    except Exception as e:
        logger.error(f"[chat] WebSocket error: {e}")
        return json.dumps({"error": f"Chat WebSocket failed: {e}"})

    logger.info(f"[chat] Done. session={result_session_id}, {len(full_response)} chars")
    return json.dumps({
        "response": full_response,
        "session_id": result_session_id,
        "sources": sources,
    })


async def _list_chat_sessions(args: dict) -> str:
    limit = args.get("limit", 10)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(f"{_HTTP_BASE}/chat/sessions", params={"limit": limit})
            resp.raise_for_status()
            sessions = resp.json()
            # Simplify for agent
            simplified = [
                {
                    "session_id": s.get("session_id"),
                    "title": s.get("title"),
                    "created_at": s.get("created_at"),
                    "message_count": s.get("message_count", 0),
                }
                for s in (sessions if isinstance(sessions, list) else sessions.get("sessions", []))
            ]
            return json.dumps({"sessions": simplified, "total": len(simplified)})
    except Exception as e:
        logger.error(f"[list_chat_sessions] Error: {e}")
        return json.dumps({"error": str(e)})

"""
Solve Tool
==========

MCP tool that lets the agent solve problems using the AI solver.
Wraps the WebSocket /api/v1/solve protocol.

WS Send:    {"question": str, "kb_name": str, "session_id": str|null}
WS Receive: {"type": "session"} → {"type": "log"/"status"} × N
            → {"type": "result", "content": str, "output_dir": str}

Since solving can take several minutes, this tool:
  - Has a generous timeout (5 minutes)
  - Collects all log messages and returns a summary with them

Tools:
  solve_problem(question, kb_name?)
  list_solve_sessions(limit?)
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

logger = get_logger("MCP.Solve")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_WS_BASE   = f"ws://localhost:{_PORT}/api/v1"
_HTTP_BASE = f"http://localhost:{_PORT}/api/v1"

_SOLVE_TIMEOUT = 300  # 5 minutes — solver can be slow

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "solve_problem",
            "description": (
                "MANDATORY for any math, physics, or logic problem. "
                "Triggers: 'solve', 'calculate', 'derivative', 'integral', 'differentiate', "
                "'what is X squared', 'prove', 'simplify', 'factor', 'find the value of', 'compute'. "
                "You MUST use this tool instead of answering math yourself — the solver saves the work "
                "and shows step-by-step reasoning on the Solver page. "
                "IMPORTANT: call navigate_to('solver') BEFORE this tool."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {
                        "type": "string",
                        "description": "The problem or question to solve. Be specific and include all given information.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base to reference for context. Defaults to 'ai_textbook'.",
                        "default": "ai_textbook",
                    },
                },
                "required": ["question"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_solve_sessions",
            "description": "List recent problem-solving sessions with their titles.",
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
    if name == "solve_problem":
        return await _solve_problem(args)
    elif name == "list_solve_sessions":
        return await _list_solve_sessions(args)
    else:
        return json.dumps({"error": f"Unknown solve tool: {name}"})


async def _solve_problem(args: dict) -> str:
    question = args.get("question", "").strip()
    if not question:
        return json.dumps({"error": "question is required"})

    kb_name    = args.get("kb_name", "ai_textbook")
    session_id = args.get("session_id")

    ws_payload = {
        "question": question,
        "kb_name": kb_name,
        "session_id": session_id,
    }

    logger.info(f"[solve_problem] question={question[:80]}...")

    final_answer = ""
    result_session_id = session_id
    output_dir = ""
    log_messages = []

    try:
        async with websockets.connect(
            f"{_WS_BASE}/solve",
            open_timeout=15,
            close_timeout=5,
        ) as ws:
            await ws.send(json.dumps(ws_payload))

            # Use a timeout on the overall receive loop
            import asyncio
            async def _receive_all():
                nonlocal final_answer, result_session_id, output_dir
                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except json.JSONDecodeError:
                        continue

                    t = msg.get("type")

                    if t == "session":
                        result_session_id = msg.get("session_id", result_session_id)

                    elif t in ("log", "status", "thinking", "step"):
                        # Collect log/status messages for context
                        content = (
                            msg.get("content")
                            or msg.get("message")
                            or msg.get("text", "")
                        )
                        if content:
                            log_messages.append(content[:200])

                    elif t == "result":
                        final_answer = msg.get("content", "")
                        output_dir   = msg.get("output_dir", "")
                        break

                    elif t == "error":
                        raise RuntimeError(msg.get("content") or msg.get("message", "Solver error"))

            await asyncio.wait_for(_receive_all(), timeout=_SOLVE_TIMEOUT)

    except asyncio.TimeoutError:
        return json.dumps({
            "error": f"Solver timed out after {_SOLVE_TIMEOUT}s",
            "partial_logs": log_messages[-5:],
        })
    except Exception as e:
        logger.error(f"[solve_problem] Error: {e}")
        return json.dumps({"error": f"Solver failed: {e}"})

    logger.info(
        f"[solve_problem] Done. session={result_session_id}, "
        f"answer={len(final_answer)} chars, {len(log_messages)} log messages"
    )

    return json.dumps({
        "final_answer": final_answer,
        "session_id": result_session_id,
        "output_dir": output_dir,
        "step_count": len(log_messages),
    })


async def _list_solve_sessions(args: dict) -> str:
    limit = args.get("limit", 10)
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                f"{_HTTP_BASE}/solve/sessions", params={"limit": limit}
            )
            resp.raise_for_status()
            sessions = resp.json()
            simplified = [
                {
                    "session_id": s.get("session_id"),
                    "title": s.get("title"),
                    "created_at": s.get("created_at"),
                    "kb_name": s.get("kb_name"),
                }
                for s in (sessions if isinstance(sessions, list) else sessions.get("sessions", []))
            ]
            return json.dumps({"sessions": simplified, "total": len(simplified)})
    except Exception as e:
        logger.error(f"[list_solve_sessions] Error: {e}")
        return json.dumps({"error": str(e)})

"""
Question Generation Tool
=========================

MCP tool that generates practice questions from the knowledge base.
Wraps the WebSocket /api/v1/question/generate protocol.

WS Send:    {"requirement": {"knowledge_point": str, ...}, "kb_name": str, "count": int}
WS Receive: {"type": "task_id"} → {"type": "log"} × N → {"type": "result"/"complete"}

Tools:
  generate_questions(knowledge_point, kb_name?, count?, difficulty?, question_types?)
"""

import asyncio
import json
from pathlib import Path
import sys

import websockets

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Question")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_WS_BASE = f"ws://localhost:{_PORT}/api/v1/question"

_QUESTION_TIMEOUT = 180  # 3 min

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "generate_questions",
            "description": (
                "Generate AI practice questions on a specific topic from the knowledge base. "
                "IMPORTANT: call navigate_to('question') BEFORE this tool. "
                "Returns the generated questions with answers and explanations. "
                "Requires a knowledge base to be set up."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "knowledge_point": {
                        "type": "string",
                        "description": "The specific topic or knowledge point to generate questions about.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base to use. Use list_knowledge_bases() if unsure.",
                        "default": "ai_textbook",
                    },
                    "count": {
                        "type": "integer",
                        "description": "Number of questions to generate (1-10).",
                        "default": 3,
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["easy", "medium", "hard", "mixed"],
                        "description": "Difficulty level of questions.",
                        "default": "medium",
                    },
                    "question_types": {
                        "type": "array",
                        "items": {
                            "type": "string",
                            "enum": ["multiple_choice", "true_false", "short_answer", "essay"]
                        },
                        "description": "Types of questions to generate.",
                        "default": ["multiple_choice", "short_answer"],
                    },
                },
                "required": ["knowledge_point"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "generate_questions":
        return await _generate_questions(args)
    else:
        return json.dumps({"error": f"Unknown question tool: {name}"})


async def _generate_questions(args: dict) -> str:
    knowledge_point = args.get("knowledge_point", "").strip()
    if not knowledge_point:
        return json.dumps({"error": "knowledge_point is required"})

    kb_name        = args.get("kb_name", "ai_textbook")
    count          = min(max(int(args.get("count", 3)), 1), 10)
    difficulty     = args.get("difficulty", "medium")
    question_types = args.get("question_types", ["multiple_choice", "short_answer"])

    # Build the requirement object the coordinator expects
    requirement = {
        "knowledge_point": knowledge_point,
        "difficulty": difficulty,
        "question_types": question_types,
    }

    ws_payload = {
        "requirement": requirement,
        "kb_name": kb_name,
        "count": count,
    }

    logger.info(f"[generate_questions] topic={knowledge_point[:60]} count={count} kb={kb_name}")

    task_id = None
    questions = []
    log_count = 0

    try:
        async with websockets.connect(
            f"{_WS_BASE}/generate",
            open_timeout=15,
            close_timeout=5,
        ) as ws:
            await ws.send(json.dumps(ws_payload))

            async def _receive():
                nonlocal task_id, questions, log_count
                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue

                    t = msg.get("type")
                    if t == "task_id":
                        task_id = msg.get("task_id")

                    elif t in ("log", "status", "progress"):
                        log_count += 1

                    elif t == "result":
                        # Single question result pushed during generation
                        q = msg.get("question") or msg.get("content")
                        if q:
                            questions.append(q)

                    elif t == "complete":
                        # All done — may include final list
                        final = msg.get("questions")
                        if final and isinstance(final, list):
                            questions = final
                        break

                    elif t == "error":
                        raise RuntimeError(
                            msg.get("content") or msg.get("message", "Question gen error")
                        )

            await asyncio.wait_for(_receive(), timeout=_QUESTION_TIMEOUT)

    except asyncio.TimeoutError:
        return json.dumps({
            "error": f"Question generation timed out after {_QUESTION_TIMEOUT}s",
            "task_id": task_id,
            "partial_questions": questions,
        })
    except Exception as e:
        logger.error(f"[generate_questions] Error: {e}")
        return json.dumps({"error": f"Question generation failed: {e}"})

    logger.info(
        f"[generate_questions] Done. {len(questions)} questions, {log_count} log steps"
    )

    return json.dumps({
        "success": True,
        "knowledge_point": knowledge_point,
        "task_id": task_id,
        "question_count": len(questions),
        "questions": questions,
    })

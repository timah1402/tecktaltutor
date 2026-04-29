"""
Research Tool
=============

MCP tool that starts deep multi-source research on a topic.
Wraps the WebSocket /api/v1/research/run protocol.

WS Send:    {"topic": str, "kb_name": str, "plan_mode": str, "enabled_tools": list}
WS Receive: {"type": "task_id"} → {"type": "log"} × N → {"type": "result"/"done"}

plan_mode options:
  "quick"  — 2 subtopics, 2 iterations (~2-3 min)
  "medium" — 5 subtopics, 4 iterations (~5-8 min)
  "deep"   — 8 subtopics, 7 iterations (~15-20 min)
  "auto"   — Adaptive, 6 iterations (~10-15 min)

Tools:
  run_research(topic, kb_name?, plan_mode?, enabled_tools?)
  optimize_research_topic(topic, kb_name?)
"""

import asyncio
import json
from pathlib import Path
import sys

import httpx
import websockets

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.services.config import load_config_with_main

logger = get_logger("MCP.Research")

_config = load_config_with_main("main.yaml", _project_root)
_PORT = _config.get("server", {}).get("backend_port", 8001)
_WS_BASE   = f"ws://localhost:{_PORT}/api/v1/research"
_HTTP_BASE = f"http://localhost:{_PORT}/api/v1/research"

_RESEARCH_TIMEOUT = 600  # 10 min — deep research can be slow

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "run_research",
            "description": (
                "Run deep multi-source AI research on any academic or technical topic. "
                "Uses RAG (knowledge base), web search, and/or academic paper search. "
                "IMPORTANT: call navigate_to('research') BEFORE this tool. "
                "Returns a research report with findings and citations. "
                "plan_mode controls depth: 'quick' (2-3 min), 'medium' (5-8 min), 'deep' (15-20 min)."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The research topic or question.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base to search. Defaults to 'ai_textbook'.",
                        "default": "ai_textbook",
                    },
                    "plan_mode": {
                        "type": "string",
                        "enum": ["quick", "medium", "deep", "auto"],
                        "description": "Research depth. Use 'quick' unless the student explicitly wants deep research.",
                        "default": "quick",
                    },
                    "enabled_tools": {
                        "type": "array",
                        "items": {"type": "string", "enum": ["RAG", "Paper", "Web"]},
                        "description": "Which sources to search. RAG=knowledge base, Paper=arxiv, Web=internet.",
                        "default": ["RAG"],
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "optimize_research_topic",
            "description": (
                "Optimize and rephrase a research topic to improve research quality. "
                "Use this before run_research if the student's topic is vague or too broad."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The raw topic to optimize.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base context for optimization.",
                        "default": "ai_textbook",
                    },
                },
                "required": ["topic"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "run_research":
        return await _run_research(args)
    elif name == "optimize_research_topic":
        return await _optimize_research_topic(args)
    else:
        return json.dumps({"error": f"Unknown research tool: {name}"})


async def _run_research(args: dict) -> str:
    topic = args.get("topic", "").strip()
    if not topic:
        return json.dumps({"error": "topic is required"})

    kb_name       = args.get("kb_name", "ai_textbook")
    plan_mode     = args.get("plan_mode", "quick")
    enabled_tools = args.get("enabled_tools", ["RAG"])

    if not isinstance(enabled_tools, list):
        enabled_tools = ["RAG"]

    ws_payload = {
        "topic": topic,
        "kb_name": kb_name,
        "plan_mode": plan_mode,
        "enabled_tools": enabled_tools,
        "skip_rephrase": True,  # Agent already phrased the topic clearly
    }

    logger.info(f"[run_research] topic={topic[:60]}... mode={plan_mode} tools={enabled_tools}")

    task_id = None
    result_content = ""
    log_count = 0

    try:
        async with websockets.connect(
            f"{_WS_BASE}/run",
            open_timeout=15,
            close_timeout=5,
        ) as ws:
            await ws.send(json.dumps(ws_payload))

            async def _receive():
                nonlocal task_id, result_content, log_count
                async for raw in ws:
                    try:
                        msg = json.loads(raw)
                    except Exception:
                        continue

                    t = msg.get("type")
                    if t == "task_id":
                        task_id = msg.get("task_id")
                        logger.info(f"[run_research] task_id={task_id}")

                    elif t in ("log", "progress", "status"):
                        log_count += 1

                    elif t == "result":
                        result_content = (
                            msg.get("content")
                            or msg.get("report")
                            or msg.get("text", "")
                        )
                        break

                    elif t == "done":
                        if not result_content:
                            result_content = msg.get("content") or msg.get("report", "")
                        break

                    elif t == "error":
                        raise RuntimeError(
                            msg.get("content") or msg.get("message", "Research error")
                        )

            await asyncio.wait_for(_receive(), timeout=_RESEARCH_TIMEOUT)

    except asyncio.TimeoutError:
        return json.dumps({
            "error": f"Research timed out after {_RESEARCH_TIMEOUT}s",
            "task_id": task_id,
            "tip": "Research is still running. Check the Research page for progress.",
        })
    except Exception as e:
        logger.error(f"[run_research] Error: {e}")
        return json.dumps({"error": f"Research failed: {e}"})

    logger.info(f"[run_research] Done. {log_count} log steps, {len(result_content)} chars")

    return json.dumps({
        "success": True,
        "topic": topic,
        "task_id": task_id,
        "report_length": len(result_content),
        # Return a summary (full report can be very long)
        "summary": result_content[:2000] + ("..." if len(result_content) > 2000 else ""),
    })


async def _optimize_research_topic(args: dict) -> str:
    topic  = args.get("topic", "").strip()
    kb_name = args.get("kb_name", "ai_textbook")

    if not topic:
        return json.dumps({"error": "topic is required"})

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_HTTP_BASE}/optimize_topic",
                json={"topic": topic, "iteration": 0, "kb_name": kb_name},
            )
            resp.raise_for_status()
            data = resp.json()
            optimized = data.get("optimized_topic") or data.get("topic") or topic
            logger.info(f"[optimize_research_topic] '{topic[:40]}' -> '{optimized[:40]}'")
            return json.dumps({"original_topic": topic, "optimized_topic": optimized})
    except Exception as e:
        logger.error(f"[optimize_research_topic] Error: {e}")
        return json.dumps({"error": str(e), "original_topic": topic})

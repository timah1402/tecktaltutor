"""
UI Action Tools
===============

MCP tools that drive frontend page interactions via SSE page_action events.

Instead of calling backend services directly (which bypasses the UI),
these tools emit SSE events that the page components in the browser pick up
and act on — giving the student a real, visual, interactive experience.

SSE event format:
  {
    "type":   "page_action",
    "page":   "solver",       # which page to target
    "action": "submit",       # what to do
    "data":   { ... }         # action-specific payload
  }

Tools:
  solver_submit(problem, kb_name?)     — submit a problem to the Solver page
  research_start(topic, mode?)         — start research on the Research page
  question_generate(topic, kb_name?)   — generate questions on the Question page
  cowriter_start(topic, content_type?) — populate Co-Writer with a prompt
  guide_start(topic)                   — start a Guided Learning session
  ideagen_run(topic)                   — trigger IdeaGen on the IdeaGen page
  get_current_page()                   — ask frontend what page is currently shown
  send_notification(message, type?)    — show a toast notification to the user
"""

import json
from pathlib import Path
import sys

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger

logger = get_logger("MCP.UIAction")

# ---------------------------------------------------------------------------
# Tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "solver_submit",
            "description": (
                "PREFERRED tool for solving any math, physics, chemistry, or logic problem. "
                "Navigates to the Solver page AND submits the problem so the student sees "
                "it solving live with step-by-step reasoning. "
                "Use this instead of solve_problem when the student wants to watch the solution. "
                "Triggers on: 'solve', 'calculate', 'find the derivative', 'integrate', "
                "'factor', 'simplify', 'prove', 'what is X', 'compute'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "problem": {
                        "type": "string",
                        "description": "The full problem or equation to solve. Be specific.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base to reference. Defaults to 'ai_textbook'.",
                        "default": "ai_textbook",
                    },
                },
                "required": ["problem"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "research_start",
            "description": (
                "Navigates to the Research Lab page AND starts a deep multi-source research "
                "session on the given topic. The student will see the research running live. "
                "Use for: 'research X', 'look into X', 'find information about X', "
                "'deep dive on X', 'what do we know about X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "The research topic or question.",
                    },
                    "mode": {
                        "type": "string",
                        "enum": ["quick", "medium", "deep", "auto"],
                        "description": "Research depth. Defaults to 'auto'.",
                        "default": "auto",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "question_generate",
            "description": (
                "Navigates to the Question Generator page AND generates practice questions "
                "on the given topic. The student will see questions appear live. "
                "Use for: 'generate questions on X', 'quiz me on X', 'practice questions for X', "
                "'test me on X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic to generate questions about.",
                    },
                    "kb_name": {
                        "type": "string",
                        "description": "Knowledge base to pull from.",
                        "default": "",
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["easy", "medium", "hard", "mixed"],
                        "default": "mixed",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "cowriter_start",
            "description": (
                "Navigates to Co-Writer AND populates the writing prompt so the student "
                "can immediately start an AI-assisted writing session. "
                "Use for: 'write X', 'help me write about X', 'draft a X', 'essay on X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "What to write about.",
                    },
                    "content_type": {
                        "type": "string",
                        "enum": ["essay", "report", "summary", "notes", "explanation", "other"],
                        "description": "Type of document to write.",
                        "default": "other",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "guide_start",
            "description": (
                "Navigates to Guided Learning AND starts a structured learning session "
                "on the given topic. The student will be walked through the material step by step. "
                "Use for: 'teach me X', 'guide me through X', 'explain X step by step', "
                "'I want to learn X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic to guide the student through.",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "ideagen_run",
            "description": (
                "Navigates to IdeaGen AND generates novel research ideas on the given topic. "
                "Use for: 'generate ideas on X', 'brainstorm X', 'what are some research ideas for X', "
                "'suggest topics related to X'."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {
                        "type": "string",
                        "description": "Topic to generate ideas for.",
                    },
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "send_notification",
            "description": (
                "Show a toast notification to the student. "
                "Use to confirm actions, warn about something, or give quick status updates "
                "without cluttering the conversation."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "message": {
                        "type": "string",
                        "description": "The notification text (keep it short, 1-2 sentences).",
                    },
                    "type": {
                        "type": "string",
                        "enum": ["info", "success", "warning", "error"],
                        "description": "Visual style of the notification.",
                        "default": "info",
                    },
                },
                "required": ["message"],
            },
        },
    },
]

# ---------------------------------------------------------------------------
# Page name → panel path mapping
# ---------------------------------------------------------------------------

_PAGE_PANELS = {
    "solver":    "/solver",
    "research":  "/research",
    "question":  "/question",
    "co_writer": "/co_writer",
    "guide":     "/guide",
    "ideagen":   "/ideagen",
}

# ---------------------------------------------------------------------------
# Shared helper
# ---------------------------------------------------------------------------


async def _navigate_and_act(page: str, action: str, data: dict) -> None:
    """Push navigate + page_action events to all connected browser clients."""
    from src.api.routers.sse import push_event

    panel = _PAGE_PANELS.get(page)

    # 1. Navigate first
    if panel:
        await push_event({"type": "open_panel", "panel": panel, "path": panel})

    # 2. Then send the action (slight delay so the page has time to mount)
    import asyncio
    await asyncio.sleep(0.3)
    await push_event({
        "type":   "page_action",
        "page":   page,
        "action": action,
        "data":   data,
    })

# ---------------------------------------------------------------------------
# Handlers
# ---------------------------------------------------------------------------


async def handle(name: str, args: dict) -> str:
    if name == "solver_submit":
        return await _solver_submit(args)
    elif name == "research_start":
        return await _research_start(args)
    elif name == "question_generate":
        return await _question_generate(args)
    elif name == "cowriter_start":
        return await _cowriter_start(args)
    elif name == "guide_start":
        return await _guide_start(args)
    elif name == "ideagen_run":
        return await _ideagen_run(args)
    elif name == "send_notification":
        return await _send_notification(args)
    else:
        return json.dumps({"error": f"Unknown ui_action tool: {name}"})


async def _solver_submit(args: dict) -> str:
    problem = args.get("problem", "").strip()
    if not problem:
        return json.dumps({"error": "problem is required"})
    kb_name = args.get("kb_name", "ai_textbook")

    await _navigate_and_act("solver", "submit", {"problem": problem, "kb_name": kb_name})
    logger.info(f"[solver_submit] problem={problem[:80]}")
    return json.dumps({"success": True, "page": "solver", "problem": problem})


async def _research_start(args: dict) -> str:
    topic = args.get("topic", "").strip()
    if not topic:
        return json.dumps({"error": "topic is required"})
    mode = args.get("mode", "auto")

    await _navigate_and_act("research", "start", {"topic": topic, "mode": mode})
    logger.info(f"[research_start] topic={topic[:80]}, mode={mode}")
    return json.dumps({"success": True, "page": "research", "topic": topic, "mode": mode})


async def _question_generate(args: dict) -> str:
    topic = args.get("topic", "").strip()
    if not topic:
        return json.dumps({"error": "topic is required"})
    kb_name    = args.get("kb_name", "")
    difficulty = args.get("difficulty", "mixed")

    await _navigate_and_act("question", "generate", {
        "topic": topic, "kb_name": kb_name, "difficulty": difficulty,
    })
    logger.info(f"[question_generate] topic={topic[:80]}")
    return json.dumps({"success": True, "page": "question", "topic": topic})


async def _cowriter_start(args: dict) -> str:
    topic        = args.get("topic", "").strip()
    content_type = args.get("content_type", "other")
    if not topic:
        return json.dumps({"error": "topic is required"})

    await _navigate_and_act("co_writer", "write", {
        "topic": topic, "content_type": content_type,
    })
    logger.info(f"[cowriter_start] topic={topic[:80]}")
    return json.dumps({"success": True, "page": "co_writer", "topic": topic})


async def _guide_start(args: dict) -> str:
    topic = args.get("topic", "").strip()
    if not topic:
        return json.dumps({"error": "topic is required"})

    await _navigate_and_act("guide", "start", {"topic": topic})
    logger.info(f"[guide_start] topic={topic[:80]}")
    return json.dumps({"success": True, "page": "guide", "topic": topic})


async def _ideagen_run(args: dict) -> str:
    topic = args.get("topic", "").strip()
    if not topic:
        return json.dumps({"error": "topic is required"})

    await _navigate_and_act("ideagen", "generate", {"topic": topic})
    logger.info(f"[ideagen_run] topic={topic[:80]}")
    return json.dumps({"success": True, "page": "ideagen", "topic": topic})


async def _send_notification(args: dict) -> str:
    message      = args.get("message", "").strip()
    notif_type   = args.get("type", "info")
    if not message:
        return json.dumps({"error": "message is required"})

    from src.api.routers.sse import push_event
    await push_event({"type": "notification", "message": message, "notif_type": notif_type})
    logger.info(f"[send_notification] [{notif_type}] {message[:80]}")
    return json.dumps({"success": True})

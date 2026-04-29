"""
Navigation Tools
================

Tools that control which page the frontend displays.
Works by pushing SSE events to connected browser clients via the SSE event bus.

Tools:
  navigate_to(page)       — navigate the browser to a named page
  get_available_pages()   — list all pages the agent can navigate to
"""

import json
from pathlib import Path
import sys

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger

logger = get_logger("MCP.Navigation")

# ---------------------------------------------------------------------------
# Page registry — the single source of truth for navigable pages
# ---------------------------------------------------------------------------

PAGES = [
    {
        "name": "home",
        "path": "/",
        "label": "Home",
        "description": "Main page with voice orb and quick actions. Return here after completing a task.",
        "panel": None,  # Full page navigation
    },
    {
        "name": "research",
        "path": "/research",
        "label": "Deep Research",
        "description": "Run deep multi-source research on any academic or technical topic.",
        "panel": "/research",
    },
    {
        "name": "solver",
        "path": "/solver",
        "label": "Smart Solver",
        "description": "Solve math, physics, or complex problems step by step with AI.",
        "panel": "/solver",
    },
    {
        "name": "question",
        "path": "/question",
        "label": "Question Generator",
        "description": "Generate practice questions from a knowledge base.",
        "panel": "/question",
    },
    {
        "name": "guide",
        "path": "/guide",
        "label": "Guided Learning",
        "description": "Step-by-step guided learning sessions from notebook records.",
        "panel": "/guide",
    },
    {
        "name": "ideagen",
        "path": "/ideagen",
        "label": "IdeaGen",
        "description": "Generate novel research ideas from notebook content.",
        "panel": "/ideagen",
    },
    {
        "name": "knowledge",
        "path": "/knowledge",
        "label": "Knowledge Base",
        "description": "Manage knowledge bases (upload documents, view stats).",
        "panel": "/knowledge",
    },
    {
        "name": "notebook",
        "path": "/notebook",
        "label": "Notebooks",
        "description": "Manage learning notebooks and saved records.",
        "panel": "/notebook",
    },
    {
        "name": "co_writer",
        "path": "/co_writer",
        "label": "Co-Writer",
        "description": "AI-assisted collaborative writing and editing.",
        "panel": "/co_writer",
    },
    {
        "name": "history",
        "path": "/history",
        "label": "History",
        "description": "View past sessions and activity history.",
        "panel": "/history",
    },
    {
        "name": "settings",
        "path": "/settings",
        "label": "Settings",
        "description": "UI preferences: theme, language, sidebar order.",
        "panel": None,
    },
    {
        "name": "voice",
        "path": "/voice",
        "label": "Voice",
        "description": "Voice settings and TTS playback controls.",
        "panel": "/voice",
    },
]

_PAGE_BY_NAME = {p["name"]: p for p in PAGES}
_PAGE_BY_PATH = {p["path"]: p for p in PAGES}

# ---------------------------------------------------------------------------
# OpenAI function-calling tool definitions
# ---------------------------------------------------------------------------

TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "navigate_to",
            "description": (
                "Navigate the student's browser to a specific page of the TecktalTutor application. "
                "Always call this BEFORE starting a long operation so the student sees the relevant page. "
                "For example: call navigate_to('solver') before calling solve_problem()."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "page": {
                        "type": "string",
                        "enum": [p["name"] for p in PAGES],
                        "description": "The page to navigate to. Use 'home' to return to the main screen.",
                    }
                },
                "required": ["page"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_pages",
            "description": (
                "Get a list of all pages available in TecktalTutor with their descriptions. "
                "Use this if you are unsure which page is most appropriate for a student's request."
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
    """
    Route a tool call to the correct handler.

    Args:
        name: Tool name (navigate_to | get_available_pages)
        args: Tool arguments dict

    Returns:
        JSON string result
    """
    if name == "navigate_to":
        return await _navigate_to(args)
    elif name == "get_available_pages":
        return await _get_available_pages()
    else:
        return json.dumps({"error": f"Unknown navigation tool: {name}"})


async def _navigate_to(args: dict) -> str:
    """Push a navigation event to the browser via the SSE event bus."""
    page_name = args.get("page", "").strip().lower()

    if page_name not in _PAGE_BY_NAME:
        available = [p["name"] for p in PAGES]
        return json.dumps({
            "success": False,
            "error": f"Unknown page '{page_name}'. Available: {available}",
        })

    page = _PAGE_BY_NAME[page_name]

    # Import here to avoid circular imports at module load time
    from src.api.routers.sse import push_event

    # If the page has a panel (home page slides), open it as a panel
    # Otherwise do a full-page navigation
    if page["panel"] and page["panel"] != "/":
        event = {"type": "open_panel", "panel": page["panel"], "path": page["path"]}
    else:
        event = {"type": "navigate", "path": page["path"]}

    await push_event(event)

    logger.info(f"[navigate_to] Navigated to '{page_name}' ({page['path']})")

    return json.dumps({
        "success": True,
        "page": page_name,
        "path": page["path"],
        "label": page["label"],
    })


async def _get_available_pages() -> str:
    """Return all available pages with their descriptions."""
    pages_info = [
        {
            "name": p["name"],
            "path": p["path"],
            "label": p["label"],
            "description": p["description"],
        }
        for p in PAGES
    ]
    return json.dumps({"pages": pages_info, "total": len(pages_info)})

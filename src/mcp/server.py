"""
TecktalTutor MCP Server
========================

Runs as a standalone process with stdio transport.
Compatible with MCP Inspector and any MCP-capable client.

Start:
    python -m src.mcp.server

Debug with MCP Inspector:
    npx @modelcontextprotocol/inspector python -m src.mcp.server

The server exposes all TecktalTutor backend features as MCP tools.
Tools are organized by module in src/mcp/tools/.
"""

import asyncio
import json
from pathlib import Path
import sys

# Ensure project root is on sys.path when run as __main__
_project_root = Path(__file__).parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp import types

from src.logging import get_logger

logger = get_logger("MCPServer")

# ---------------------------------------------------------------------------
# Import tool modules
# ---------------------------------------------------------------------------

from src.mcp.tools import navigation, knowledge, system, chat, solve, notebook, research, question, guide

# All tool modules in one list — add new modules here as phases progress
_TOOL_MODULES = [
    navigation,
    notebook,
    system,
    chat,
    solve,
    knowledge,
    research,
    question,
    guide,
]

# Flatten all tool definitions into a single list
_ALL_TOOL_DEFS: list[dict] = []
for _mod in _TOOL_MODULES:
    _ALL_TOOL_DEFS.extend(_mod.TOOL_DEFINITIONS)

# Build a dispatch table: tool_name → module.handle
_TOOL_DISPATCH: dict[str, object] = {}
for _mod in _TOOL_MODULES:
    for _def in _mod.TOOL_DEFINITIONS:
        _tool_name = _def["function"]["name"]
        _TOOL_DISPATCH[_tool_name] = _mod.handle

logger.info(
    f"MCP Server loaded {len(_ALL_TOOL_DEFS)} tools: "
    f"{[d['function']['name'] for d in _ALL_TOOL_DEFS]}"
)

# ---------------------------------------------------------------------------
# MCP Server
# ---------------------------------------------------------------------------

app = Server("tecktaltutor")


@app.list_tools()
async def list_tools() -> list[types.Tool]:
    """Return all registered tools with their JSON schemas."""
    tools = []
    for tool_def in _ALL_TOOL_DEFS:
        fn = tool_def["function"]
        tools.append(
            types.Tool(
                name=fn["name"],
                description=fn["description"],
                inputSchema=fn["parameters"],
            )
        )
    return tools


@app.call_tool()
async def call_tool(
    name: str, arguments: dict
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    """
    Route a tool call to the correct tool module handler.

    All handlers return a JSON string. We wrap it in TextContent.
    """
    logger.info(f"[call_tool] name={name} args={json.dumps(arguments, ensure_ascii=False)[:200]}")

    handler = _TOOL_DISPATCH.get(name)
    if handler is None:
        error_msg = json.dumps({"error": f"Tool '{name}' not found. Available: {list(_TOOL_DISPATCH.keys())}"})
        logger.warning(f"[call_tool] Unknown tool: {name}")
        return [types.TextContent(type="text", text=error_msg)]

    try:
        result_str = await handler(name, arguments)
        logger.info(f"[call_tool] {name} → {result_str[:200]}")
        return [types.TextContent(type="text", text=result_str)]

    except Exception as e:
        error_msg = json.dumps({"error": f"Tool '{name}' raised an exception: {e}"})
        logger.error(f"[call_tool] {name} failed: {e}", exc_info=True)
        return [types.TextContent(type="text", text=error_msg)]


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def main():
    logger.info("Starting TecktalTutor MCP Server (stdio transport)...")
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())

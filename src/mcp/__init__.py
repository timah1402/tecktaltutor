"""
TecktalTutor MCP Server Package
================================

Provides a Model Context Protocol (MCP) server that exposes the TecktalTutor
backend features as callable tools for an AI agent (GPT-4o / Claude).

Usage:
    # Start MCP server (stdio transport — MCP Inspector compatible)
    python -m src.mcp.server

    # Debug with MCP Inspector
    npx @modelcontextprotocol/inspector python -m src.mcp.server
"""

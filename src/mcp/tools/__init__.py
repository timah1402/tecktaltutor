"""
MCP Tool Modules
================

Each module exposes:
  - TOOL_DEFINITIONS: list[dict]  — OpenAI function-calling compatible schemas
  - handle(name, args) -> str     — tool executor, returns JSON string

Modules:
  navigation  — navigate_to, get_available_pages
  knowledge   — list_knowledge_bases, get_knowledge_base, get_default_knowledge_base, set_default_knowledge_base
  system      — get_settings, get_system_health
  chat        — chat (Phase 3)
  solve       — solve_problem, list_solve_sessions (Phase 3)
  research    — run_research, optimize_research_topic (Phase 4)
  question    — generate_questions (Phase 4)
  guide       — create_guide_session, start_learning, next_knowledge_point, chat_in_guide (Phase 4)
  notebook    — list_notebooks, get_notebook, create_notebook (Phase 3)
"""

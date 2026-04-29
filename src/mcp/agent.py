"""
TecktalTutor Backend Agent
===========================

GPT-4o agent that receives student transcripts and responds by:
  1. Calling MCP tools (navigate, solve, research, etc.) as needed
  2. Streaming the final text response back to the caller

Architecture note:
  - Tool DEFINITIONS come from each src/mcp/tools/*.py module (same schema as MCP server)
  - Tool EXECUTION calls the module's handle() function directly (no subprocess overhead)
  - This means the agent and MCP Inspector share the exact same tool implementations
  - Sessions (conversation history) are kept in-memory, keyed by session_id

Usage:
    agent = TecktalAgent()
    async for chunk in agent.process(transcript, session_id):
        # chunk is a str — either a text delta or a JSON event
        print(chunk)
"""

import asyncio
import json
from pathlib import Path
import sys
import uuid

_project_root = Path(__file__).parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from openai import AsyncOpenAI

from src.logging import get_logger
from src.services.config import load_config_with_main
from src.services.llm.config import get_llm_config

# Import all tool modules
from src.mcp.tools import navigation, notebook, system, chat, knowledge, research, question, guide, ui_action

logger = get_logger("MCPAgent")

# ---------------------------------------------------------------------------
# Tool registry — flat list of all OpenAI function-calling tool definitions
# ---------------------------------------------------------------------------

_TOOL_MODULES = [navigation, notebook, system, chat, knowledge, research, question, guide, ui_action]

ALL_TOOLS: list[dict] = []
for _mod in _TOOL_MODULES:
    ALL_TOOLS.extend(_mod.TOOL_DEFINITIONS)

_TOOL_DISPATCH: dict[str, object] = {}
for _mod in _TOOL_MODULES:
    for _def in _mod.TOOL_DEFINITIONS:
        _TOOL_DISPATCH[_def["function"]["name"]] = _mod.handle

logger.info(
    f"Agent loaded {len(ALL_TOOLS)} tools: {[t['function']['name'] for t in ALL_TOOLS]}"
)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are TecktalTutor, a warm and intelligent AI learning companion embedded in an educational platform.

## Your Personality
- Conversational and encouraging, never robotic
- Concise — 1-3 sentences for confirmations
- Use the student's own words when confirming actions

## How You Work
You have two types of tools:
1. **UI-action tools** — navigate AND interact with a page (preferred, student sees it happen live)
2. **Data tools** — read/write backend data (notebooks, knowledge bases)

ALWAYS prefer UI-action tools. Complete tasks from start to finish without stopping halfway.

## Tool Selection Guide

### Solving / Math / Physics / Chemistry
- USE: `solver_submit(problem)` — navigates to Solver + submits the problem live
- Then in your TEXT RESPONSE: work out the solution yourself step by step and include the full answer
- Example: after calling solver_submit, respond with: "I've opened the Solver for you! Here's the solution:\n\n**Step 1:** ...\n**Answer:** x = 2, x = 3"
- NEVER call any background solver tool — only `solver_submit` then answer in chat

### Research
- USE: `research_start(topic, mode?)` — navigates to Research + starts the session live
- NEVER describe what research would find without actually doing it

### Practice Questions / Quizzes
- USE: `question_generate(topic, kb_name?, difficulty?)` — navigates + generates live

### Writing / Essays
- USE: `cowriter_start(topic, content_type?)` — navigates to Co-Writer + fills prompt

### Guided Learning / Teaching
- USE: `guide_start(topic)` — navigates to Guided Learning + starts session

### Idea Generation / Brainstorming
- USE: `ideagen_run(topic)` — navigates to IdeaGen + triggers generation

### Navigation Only (no action needed)
- USE: `navigate_to(page)` when student just wants to open a page

### Notebooks
- "show/list notebooks" → `list_notebooks` then `navigate_to("notebook")`
- "create notebook X" → `create_notebook(name="X")` then `navigate_to("notebook")`
- "what's in notebook X" → `list_notebooks` (get ID) then `get_notebook(id=...)`

### Knowledge Bases
- "what KBs do I have" → `list_knowledge_bases`

### General questions you can answer directly
- Answer directly, no tools needed
- "what can you do", "help", "what is this" → explain briefly

### Notifications
- Use `send_notification` for quick confirmations or warnings that don't need a chat response

## Response Style
- After `solver_submit`: always include the full worked solution in your text reply
- After a UI action (non-solver): "I've opened [Page] and started [action] for you! [follow-up]"
- After creating/saving: "Done! I've [action]. [next-step hint]"
- After listing data: clean bullet points
- Never just navigate and stop — always explain what happens next or ask what to do
"""

# ---------------------------------------------------------------------------
# Session store — in-memory conversation history per session_id
# ---------------------------------------------------------------------------

_sessions: dict[str, list[dict]] = {}
_MAX_HISTORY_TURNS = 20  # Keep last 20 turns to avoid token overflow


def get_or_create_session(session_id: str | None) -> tuple[str, list[dict]]:
    """Return (session_id, history). Creates a new session if session_id is None."""
    if not session_id or session_id not in _sessions:
        session_id = session_id or str(uuid.uuid4())
        _sessions[session_id] = []
        logger.info(f"Created new agent session: {session_id}")
    return session_id, _sessions[session_id]


def trim_history(history: list[dict]) -> list[dict]:
    """Keep last N turns to avoid blowing the context window."""
    if len(history) > _MAX_HISTORY_TURNS * 2:  # *2 because each turn = user + assistant
        history = history[-(  _MAX_HISTORY_TURNS * 2):]
    return history


# ---------------------------------------------------------------------------
# Main agent class
# ---------------------------------------------------------------------------


class TecktalAgent:
    """
    GPT-4o agent with tool-calling support.

    Processes a student transcript, calls tools as needed, and yields
    response chunks for streaming back to the browser.

    Yields:
        str — JSON-encoded event dicts:
            {"type": "tool_call",  "name": "navigate_to", "args": {...}}
            {"type": "tool_result","name": "navigate_to", "result": {...}}
            {"type": "stream",     "content": "text chunk..."}
            {"type": "done",       "session_id": "..."}
            {"type": "error",      "message": "..."}
    """

    def __init__(self):
        try:
            llm_config = get_llm_config()
            self._client = AsyncOpenAI(
                api_key=llm_config.api_key,
                base_url=llm_config.base_url if llm_config.base_url else None,
            )
            self._model = llm_config.model or "gpt-4o"
        except Exception as e:
            logger.warning(f"Could not load LLM config, falling back to env: {e}")
            self._client = AsyncOpenAI()  # reads OPENAI_API_KEY from env
            self._model = "gpt-4o"

        logger.info(f"TecktalAgent initialized with model: {self._model}")

    async def process(self, transcript: str, session_id: str | None = None):
        """
        Process a student transcript and yield response chunks.

        Args:
            transcript: The student's spoken/typed input
            session_id:  Existing session ID for conversation continuity, or None for new session

        Yields:
            JSON-encoded event strings
        """
        session_id, history = get_or_create_session(session_id)

        # Add user message to history
        history.append({"role": "user", "content": transcript})
        history = trim_history(history)

        logger.info(f"[{session_id}] Processing: {transcript[:80]}...")

        # Build messages: system prompt + conversation history
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history

        full_response = ""
        tool_call_count = 0
        MAX_TOOL_CALLS = 10  # Safety limit to prevent infinite loops

        try:
            while tool_call_count < MAX_TOOL_CALLS:
                # Call GPT-4o with retry on timeout
                last_exc = None
                response = None
                for _attempt in range(2):  # 1 retry on timeout
                    try:
                        response = await self._client.chat.completions.create(
                            model=self._model,
                            messages=messages,
                            tools=ALL_TOOLS,
                            tool_choice="auto",
                            temperature=0.5,
                            max_tokens=2048,
                            timeout=90.0,
                        )
                        break  # success
                    except Exception as exc:
                        last_exc = exc
                        err_str = str(exc).lower()
                        if "timeout" in err_str or "timed out" in err_str:
                            logger.warning(
                                f"[{session_id}] OpenAI timeout on attempt {_attempt + 1}, "
                                f"{'retrying' if _attempt == 0 else 'giving up'}"
                            )
                            if _attempt == 0:
                                await asyncio.sleep(2)
                                continue
                        raise  # non-timeout errors re-raised immediately
                if response is None:
                    raise last_exc

                choice = response.choices[0]
                msg = choice.message

                # ── Case 1: Model wants to call tools ──────────────────────
                if msg.tool_calls:
                    # Append assistant message with tool_calls to history
                    messages.append(msg.model_dump(exclude_unset=True))

                    for tc in msg.tool_calls:
                        tool_name = tc.function.name
                        try:
                            tool_args = json.loads(tc.function.arguments or "{}")
                        except json.JSONDecodeError:
                            tool_args = {}

                        logger.info(f"[{session_id}] Tool call: {tool_name}({tool_args})")

                        # Notify the browser about the tool call
                        yield json.dumps({
                            "type": "tool_call",
                            "name": tool_name,
                            "args": tool_args,
                        })

                        # Execute the tool
                        handler = _TOOL_DISPATCH.get(tool_name)
                        if handler:
                            try:
                                result_str = await handler(tool_name, tool_args)
                                result_data = json.loads(result_str)
                            except Exception as e:
                                result_str = json.dumps({"error": str(e)})
                                result_data = {"error": str(e)}
                        else:
                            result_str = json.dumps({"error": f"Unknown tool: {tool_name}"})
                            result_data = {"error": f"Unknown tool: {tool_name}"}

                        logger.info(f"[{session_id}] Tool result: {result_str[:200]}")

                        # Notify the browser about the result
                        yield json.dumps({
                            "type": "tool_result",
                            "name": tool_name,
                            "result": result_data,
                        })

                        # Append tool result to messages for next GPT-4o call
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc.id,
                            "content": result_str,
                        })

                    tool_call_count += len(msg.tool_calls)

                # ── Case 2: Model gives a final text response ──────────────
                elif choice.finish_reason in ("stop", "length"):
                    final_text = msg.content or ""

                    # Stream the final response word-by-word for a live feel
                    # (GPT-4o non-streaming returns the full text at once —
                    #  we simulate streaming by chunking on spaces)
                    words = final_text.split(" ")
                    chunk_size = 5  # words per chunk
                    for i in range(0, len(words), chunk_size):
                        chunk = " ".join(words[i:i + chunk_size])
                        if i + chunk_size < len(words):
                            chunk += " "
                        full_response += chunk
                        yield json.dumps({"type": "stream", "content": chunk})
                        await asyncio.sleep(0.02)  # slight delay for natural feel

                    # Save the full response to history
                    history.append({"role": "assistant", "content": full_response})
                    _sessions[session_id] = history

                    logger.info(
                        f"[{session_id}] Response complete ({len(full_response)} chars, "
                        f"{tool_call_count} tool calls)"
                    )
                    yield json.dumps({"type": "done", "session_id": session_id})
                    return

                else:
                    # Unexpected finish reason
                    logger.warning(f"[{session_id}] Unexpected finish_reason: {choice.finish_reason}")
                    break

            # Exceeded max tool calls — return whatever we have
            if not full_response:
                fallback = "I've completed the requested actions. Is there anything else you need?"
                yield json.dumps({"type": "stream", "content": fallback})
                history.append({"role": "assistant", "content": fallback})
                _sessions[session_id] = history

            yield json.dumps({"type": "done", "session_id": session_id})

        except Exception as e:
            logger.error(f"[{session_id}] Agent error: {e}", exc_info=True)
            yield json.dumps({"type": "error", "message": str(e)})


def register_tools(*modules):
    """
    Register additional tool modules (called by Phase 3+ tool additions).

    Example:
        from src.mcp.tools import solve, research
        register_tools(solve, research)
    """
    global ALL_TOOLS, _TOOL_DISPATCH
    for mod in modules:
        for tool_def in mod.TOOL_DEFINITIONS:
            tool_name = tool_def["function"]["name"]
            if tool_name not in _TOOL_DISPATCH:
                ALL_TOOLS.append(tool_def)
                _TOOL_DISPATCH[tool_name] = mod.handle
                logger.info(f"Registered tool: {tool_name}")

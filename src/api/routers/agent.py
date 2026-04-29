"""
Agent WebSocket Router
=======================

Exposes the TecktalTutor backend agent over WebSocket so the browser
(VoiceProvider) can send student transcripts and receive streamed responses.

Endpoint: WS /api/v1/agent/ws

Protocol:
  Browser → Server:
    {"type": "query",  "transcript": "...", "session_id": "..." | null}
    {"type": "cancel"}   ← aborts the current running query
    {"type": "ping"}

  Server → Browser (streamed):
    {"type": "tool_call",   "name": "navigate_to", "args": {...}}
    {"type": "tool_result", "name": "navigate_to", "result": {...}}
    {"type": "stream",      "content": "text chunk"}
    {"type": "done",        "session_id": "abc-123"}
    {"type": "cancelled"}
    {"type": "error",       "message": "..."}
    {"type": "pong"}
"""

import asyncio
from pathlib import Path
import sys

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

_project_root = Path(__file__).parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from src.logging import get_logger
from src.mcp.agent import TecktalAgent

logger = get_logger("AgentWS")

router = APIRouter()


async def _run_agent(websocket: WebSocket, transcript: str, session_id: str | None):
    """Run the agent and stream chunks. Designed to be run as a cancellable task."""
    agent = TecktalAgent()
    async for chunk in agent.process(transcript, session_id):
        try:
            await websocket.send_text(chunk)
        except (WebSocketDisconnect, RuntimeError):
            return


@router.websocket("/agent/ws")
async def agent_websocket(websocket: WebSocket):
    """
    WebSocket endpoint for the TecktalTutor backend agent.

    Runs agent processing as a cancellable asyncio.Task so the receive loop
    can handle 'cancel' messages mid-stream without blocking.
    """
    await websocket.accept()
    logger.info("Agent WebSocket client connected")

    current_task: asyncio.Task | None = None

    async def cancel_current():
        nonlocal current_task
        if current_task and not current_task.done():
            current_task.cancel()
            try:
                await current_task
            except asyncio.CancelledError:
                pass
        current_task = None

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "query")

            # ── Ping ──────────────────────────────────────────────────────
            if msg_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            # ── Cancel ────────────────────────────────────────────────────
            if msg_type == "cancel":
                await cancel_current()
                try:
                    await websocket.send_json({"type": "cancelled"})
                except (WebSocketDisconnect, RuntimeError):
                    return
                logger.info("Agent query cancelled by client")
                continue

            # ── Query ─────────────────────────────────────────────────────
            transcript = data.get("transcript", "").strip()
            session_id = data.get("session_id")

            if not transcript:
                await websocket.send_json({
                    "type": "error",
                    "message": "transcript is required",
                })
                continue

            # Cancel any in-flight query before starting a new one
            await cancel_current()

            logger.info(f"Agent query: session={session_id}, transcript={transcript[:80]}")

            await websocket.send_json({
                "type": "status",
                "status": "processing",
                "message": "Agent is thinking...",
            })

            # Run as a task so incoming 'cancel' messages can interrupt it
            current_task = asyncio.create_task(
                _run_agent(websocket, transcript, session_id)
            )

            def _on_done(task: asyncio.Task):
                if task.cancelled():
                    return
                exc = task.exception()
                if exc:
                    logger.error(f"Agent task error: {exc}", exc_info=exc)
                    asyncio.create_task(
                        websocket.send_json({"type": "error", "message": str(exc)})
                    )

            current_task.add_done_callback(_on_done)

    except WebSocketDisconnect:
        logger.info("Agent WebSocket client disconnected")
        await cancel_current()
    except Exception as e:
        logger.error(f"Agent WebSocket error: {e}", exc_info=True)
        await cancel_current()
        try:
            await websocket.send_json({"type": "error", "message": str(e)})
        except Exception:
            pass
    finally:
        await cancel_current()
        logger.info("Agent WebSocket connection closed")

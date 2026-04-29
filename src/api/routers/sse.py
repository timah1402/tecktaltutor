"""
SSE Event Bus Router
=====================

Provides a Server-Sent Events (SSE) endpoint that the browser connects to.
When the MCP navigate_to() tool fires, it calls push_event() here which
broadcasts to all connected browser clients.

Endpoint: GET /api/v1/events

Event types pushed to browser:
  {"type": "navigate",     "path": "/solver"}
  {"type": "open_panel",   "panel": "/research"}
  {"type": "notification", "message": "Research started..."}
  {"type": "agent_status", "status": "thinking" | "done"}
"""

import asyncio
import json
from pathlib import Path
import sys

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

_project_root = Path(__file__).parent.parent.parent.parent
sys.path.insert(0, str(_project_root))

from src.logging import get_logger

logger = get_logger("SSE")

router = APIRouter()

# All currently connected browser SSE clients (each gets its own queue)
_clients: list[asyncio.Queue] = []


async def push_event(event: dict) -> None:
    """
    Push an event to ALL connected browser clients.

    Call this from any MCP tool that needs to control the frontend.

    Args:
        event: dict with at minimum a "type" field.
               Examples:
                 {"type": "navigate", "path": "/solver"}
                 {"type": "open_panel", "panel": "/research"}
                 {"type": "notification", "message": "Research started"}
                 {"type": "agent_status", "status": "thinking"}
    """
    if not _clients:
        logger.debug(f"SSE push: no clients connected — event dropped: {event}")
        return

    logger.info(f"SSE push to {len(_clients)} client(s): {event}")
    dead = []
    for q in _clients:
        try:
            await q.put(event)
        except Exception as e:
            logger.warning(f"SSE queue put failed: {e}")
            dead.append(q)

    # Clean up dead queues
    for q in dead:
        if q in _clients:
            _clients.remove(q)


def push_event_sync(event: dict) -> None:
    """
    Synchronous version of push_event for use in non-async contexts.
    Uses call_soon_threadsafe if an event loop is running.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.call_soon_threadsafe(
                lambda: asyncio.ensure_future(push_event(event))
            )
        else:
            loop.run_until_complete(push_event(event))
    except RuntimeError:
        logger.warning("SSE push_event_sync: no running event loop")


async def _event_generator(queue: asyncio.Queue, request: Request):
    """
    Async generator that yields SSE-formatted strings from the queue.
    Keeps the connection alive with periodic heartbeats.
    """
    try:
        # Send initial connection confirmation
        yield f"data: {json.dumps({'type': 'connected'})}\n\n"

        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                logger.debug("SSE client disconnected (request check)")
                break

            try:
                # Wait for event with timeout for heartbeat
                event = await asyncio.wait_for(queue.get(), timeout=25.0)
                payload = f"data: {json.dumps(event)}\n\n"
                yield payload
                queue.task_done()
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                yield ": heartbeat\n\n"

    except asyncio.CancelledError:
        logger.debug("SSE stream cancelled")
    except Exception as e:
        logger.error(f"SSE generator error: {e}")
    finally:
        # Remove this client's queue on disconnect
        if queue in _clients:
            _clients.remove(queue)
        logger.debug(f"SSE client removed. Active clients: {len(_clients)}")


@router.get("/events")
async def sse_events(request: Request):
    """
    Server-Sent Events endpoint for the browser to receive real-time
    navigation and status events from the MCP agent.

    The browser connects once and stays connected. Events are pushed
    whenever the MCP agent calls navigate_to() or other control tools.

    Response: text/event-stream
    """
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _clients.append(queue)
    logger.info(f"New SSE client connected. Total clients: {len(_clients)}")

    return StreamingResponse(
        _event_generator(queue, request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )


@router.get("/events/health")
async def sse_health():
    """Check how many browser clients are connected to the SSE stream."""
    return {
        "status": "ok",
        "connected_clients": len(_clients),
    }

import { NextResponse } from "next/server";

/**
 * SSE Proxy — /api/mcp-events
 *
 * Forwards the Server-Sent Events stream from the TecktalTutor backend
 * (/api/v1/events) to the browser. This proxy avoids CORS issues when
 * the backend is on a different port (8001) than the Next.js dev server (3000).
 *
 * The browser connects to this endpoint once and stays connected.
 * Navigation events pushed by the MCP agent appear here and are forwarded.
 */

const BACKEND_SSE_URL =
  process.env.BACKEND_URL
    ? `${process.env.BACKEND_URL}/api/v1/events`
    : "http://localhost:8001/api/v1/events";

/** Returns a silent open SSE stream — used when the backend is not reachable.
 *  Avoids 503 spam in the Next.js log and prevents rapid EventSource reconnects.
 */
function silentStream() {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const ping = setInterval(() => {
        try { controller.enqueue(encoder.encode(": ping\n\n")); }
        catch { clearInterval(ping); }
      }, 30_000);
    },
  });
  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

export async function GET() {
  let backendRes: Response;

  try {
    backendRes = await fetch(BACKEND_SSE_URL, {
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
      },
      // @ts-ignore — node-fetch / undici supports this
      duplex: "half",
    });
  } catch {
    // Backend is not running — stay silent instead of 503
    return silentStream();
  }

  if (!backendRes.ok || !backendRes.body) {
    return NextResponse.json(
      { error: `Backend SSE returned ${backendRes.status}` },
      { status: 502 }
    );
  }

  // Pipe the backend SSE stream directly to the browser
  return new Response(backendRes.body, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Disable Next.js body parsing for this route (streaming response)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

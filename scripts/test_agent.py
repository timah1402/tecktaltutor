"""
Quick smoke test for the TecktalTutor backend agent WebSocket.
Run with: python scripts/test_agent.py
"""

import asyncio
import json
import websockets


WS_URL = "ws://localhost:8001/api/v1/agent/ws"

TESTS = [
    {
        "label": "Navigation (navigate_to expected)",
        "transcript": "Take me to the solver page",
    },
    {
        "label": "List notebooks (list_notebooks expected)",
        "transcript": "Show me my notebooks",
    },
    {
        "label": "Create notebook (create_notebook + navigate_to expected)",
        "transcript": "Create a new notebook called Physics Study Notes",
    },
    {
        "label": "Solve math (navigate_to + solve_problem expected)",
        "transcript": "Solve this: what is the derivative of x squared plus 3x plus 5",
    },
    {
        "label": "Chat tool (chat expected)",
        "transcript": "Use the chat to briefly explain what a neural network is",
    },
]


async def run_test(label: str, transcript: str, session_id: str = None):
    print(f"\n{'='*60}")
    print(f"TEST: {label}")
    print(f"INPUT: {transcript}")
    print(f"{'='*60}")

    tool_calls = []
    response_text = ""

    async with websockets.connect(WS_URL) as ws:
        # Send query
        await ws.send(json.dumps({
            "type": "query",
            "transcript": transcript,
            "session_id": session_id,
        }))

        # Collect all events until done/error
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                print(f"  [RAW] {raw}")
                continue

            t = msg.get("type")

            if t == "status":
                print(f"  [STATUS] {msg.get('message')}")

            elif t == "tool_call":
                name = msg.get("name")
                args = msg.get("args", {})
                tool_calls.append(name)
                print(f"  [TOOL CALL] {name}({json.dumps(args)})")

            elif t == "tool_result":
                name = msg.get("name")
                result = msg.get("result", {})
                print(f"  [TOOL RESULT] {name} -> {json.dumps(result)[:120]}")

            elif t == "stream":
                content = msg.get("content", "")
                response_text += content
                print(content, end="", flush=True)

            elif t == "done":
                returned_session = msg.get("session_id")
                print(f"\n  [DONE] session_id={returned_session}")
                print(f"  Tools called: {tool_calls if tool_calls else 'none'}")
                print(f"  Response length: {len(response_text)} chars")
                break

            elif t == "error":
                print(f"  [ERROR] {msg.get('message')}")
                break

    return response_text, tool_calls


async def main():
    print("\nTecktalTutor Agent Smoke Test")
    print("Backend: ws://localhost:8001/api/v1/agent/ws")

    session_id = None
    for i, test in enumerate(TESTS):
        text, tools = await run_test(
            label=test["label"],
            transcript=test["transcript"],
            session_id=session_id,
        )
        # Reuse the same session for continuity test
        if i == 0:
            # After first test we don't have session_id yet; it comes in done msg
            pass

        print()

    print("\n" + "="*60)
    print("All tests complete.")


if __name__ == "__main__":
    asyncio.run(main())

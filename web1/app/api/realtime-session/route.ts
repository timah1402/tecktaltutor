import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const voice = body.voice ?? "alloy";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2024-12-17",
        voice,
        // Role: STT (speech-to-text) + TTS (text-to-speech) ONLY.
        // All AI responses are handled by the backend MCP agent.
        // The Realtime model should NOT generate its own answers.
        instructions:
          "You are the voice interface for TecktalTutor. Your ONLY job is to listen to the student, " +
          "transcribe their speech accurately, and speak back the responses you receive. " +
          "Do NOT generate your own answers or explanations. " +
          "Simply acknowledge you heard the student with a very brief phrase like 'Got it, let me check that for you.' " +
          "The real answer will come from the backend agent.",
        input_audio_transcription: { model: "whisper-1" },
        turn_detection: {
          type: "server_vad",
          threshold: 0.65,
          prefix_padding_ms: 300,
          silence_duration_ms: 700,
          // Disable auto-response — VoiceProvider will cancel it anyway
          // and forward the transcript to the backend agent instead
          create_response: false,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      return NextResponse.json({ error: `OpenAI error ${res.status}: ${text}` }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError" || err?.code === "UND_ERR_CONNECT_TIMEOUT";
    return NextResponse.json(
      { error: isTimeout ? "Connection to OpenAI timed out — check your network" : String(err?.message ?? err) },
      { status: 503 }
    );
  }
}

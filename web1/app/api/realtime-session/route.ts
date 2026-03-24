import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const voice = body.voice ?? "alloy";

  const res = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview-2024-12-17",
      voice,
      instructions:
        "You are Tecktal Tutor, a friendly and knowledgeable AI learning assistant. Be concise, engaging, and educational. Speak naturally and conversationally. Keep responses short unless a detailed explanation is truly needed.",
      input_audio_transcription: { model: "whisper-1" },
    }),
  });

  const data = await res.json();
  return NextResponse.json(data);
}

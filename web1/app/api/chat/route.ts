import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { message } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { answer: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local" },
      { status: 200 }
    );
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are Tecktal Tutor, a friendly and knowledgeable AI learning assistant. Give clear, concise, educational answers. Keep responses under 150 words unless a detailed explanation is needed.",
        },
        { role: "user", content: message },
      ],
      max_tokens: 400,
    }),
  });

  const data = await res.json();
  const answer =
    data.choices?.[0]?.message?.content ?? "Sorry, I could not get a response.";
  return NextResponse.json({ answer });
}

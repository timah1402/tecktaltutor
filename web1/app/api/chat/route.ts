import { NextResponse } from "next/server";

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      return res;
    } catch (err: any) {
      clearTimeout(timeout);
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error("All retries failed");
}

export async function POST(req: Request) {
  const { message } = await req.json();
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      spoken: "API key not configured.",
      written: "OpenAI API key not configured. Add OPENAI_API_KEY to .env.local",
    });
  }

  try {
    const res = await fetchWithRetry("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are Tecktal Tutor, a friendly AI learning assistant.
Always respond with a JSON object with exactly two fields:
- "spoken": 1-2 short conversational sentences (max 30 words) to be read aloud. No markdown, no bullet points, plain natural speech only.
- "written": the full detailed answer (up to 200 words, can use markdown formatting like bullet points and headers).`,
          },
          { role: "user", content: message },
        ],
        max_tokens: 600,
      }),
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: { spoken?: string; written?: string } = {};
    try { parsed = JSON.parse(raw); } catch {}

    return NextResponse.json({
      spoken: parsed.spoken ?? "Sorry, I could not get a response.",
      written: parsed.written ?? parsed.spoken ?? "Sorry, I could not get a response.",
    });
  } catch {
    return NextResponse.json({
      spoken: "Network error. Please check your connection.",
      written: "Network error reaching OpenAI. Please check your connection and try again.",
    });
  }
}

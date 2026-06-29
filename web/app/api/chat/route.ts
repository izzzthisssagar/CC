import { NextRequest, NextResponse } from "next/server";

const WORKER_URL = process.env.WORKER_URL ?? "http://localhost:8000";

// Proxy: browser → this route → worker /chat (Groq LLaMA over the transcript).
export async function POST(req: NextRequest) {
  const { transcript, question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  try {
    const res = await fetch(`${WORKER_URL}/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ transcript: transcript ?? "", question }),
    });
    if (!res.ok) throw new Error(`worker /chat ${res.status}`);
    return NextResponse.json(await res.json());
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

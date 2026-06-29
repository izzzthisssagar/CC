import { NextRequest, NextResponse } from "next/server";
import { chatDirect } from "@/lib/groq-server";

export const runtime = "nodejs";

const WORKER_URL = process.env.WORKER_URL;

// Prefer the worker if configured; else answer directly via Groq (serverless).
export async function POST(req: NextRequest) {
  const { transcript, question } = await req.json();
  if (!question?.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  try {
    if (WORKER_URL) {
      const res = await fetch(`${WORKER_URL}/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript: transcript ?? "", question }),
      });
      if (!res.ok) throw new Error(`worker /chat ${res.status}`);
      return NextResponse.json(await res.json());
    }
    const answer = await chatDirect(transcript ?? "", question);
    return NextResponse.json({ answer });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

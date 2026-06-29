import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/worker";
import { transcribeDirect } from "@/lib/groq-server";

export const runtime = "nodejs";
export const maxDuration = 60; // Groq turbo is fast; allow headroom for fetch+STT

// Hybrid: prefer the ffmpeg worker (any size + burn-in parity) when WORKER_URL is
// configured; otherwise transcribe directly via Groq (serverless, no worker needed).
export async function POST(req: NextRequest) {
  const { video_url, provider, language } = await req.json();
  if (!video_url) {
    return NextResponse.json({ error: "video_url required" }, { status: 400 });
  }
  try {
    if (process.env.WORKER_URL) {
      const data = await transcribe(video_url, { provider, language });
      return NextResponse.json(data);
    }
    const data = await transcribeDirect(video_url, language);
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

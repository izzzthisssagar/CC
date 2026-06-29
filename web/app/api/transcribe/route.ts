import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/lib/worker";

// Proxy: browser → this route → Python worker /transcribe.
export async function POST(req: NextRequest) {
  const { video_url, provider, language } = await req.json();
  if (!video_url) {
    return NextResponse.json({ error: "video_url required" }, { status: 400 });
  }
  try {
    const data = await transcribe(video_url, { provider, language });
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

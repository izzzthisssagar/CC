import { NextRequest, NextResponse } from "next/server";
import { exportVideo } from "@/lib/worker";

// Proxy: browser → this route → Python worker /export (pysubs2 + FFmpeg burn-in).
export async function POST(req: NextRequest) {
  const { video_url, words, style } = await req.json();
  if (!video_url || !words) {
    return NextResponse.json({ error: "video_url and words required" }, { status: 400 });
  }
  try {
    const data = await exportVideo(video_url, words, style ?? {});
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

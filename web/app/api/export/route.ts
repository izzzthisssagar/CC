import { NextRequest, NextResponse } from "next/server";
import { exportVideo } from "@/lib/worker";

// Burn-in needs FFmpeg + libass → the dedicated worker. Unlike transcribe/chat,
// this cannot run on Vercel serverless. Returns a clear message if no worker.
export async function POST(req: NextRequest) {
  const { video_url, words, style } = await req.json();
  if (!video_url || !words) {
    return NextResponse.json({ error: "video_url and words required" }, { status: 400 });
  }
  if (!process.env.WORKER_URL) {
    return NextResponse.json(
      { error: "Burned-in export needs the FFmpeg worker (set WORKER_URL). Transcribe, edit & SRT work without it." },
      { status: 503 }
    );
  }
  try {
    const data = await exportVideo(video_url, words, style ?? {});
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 502 });
  }
}

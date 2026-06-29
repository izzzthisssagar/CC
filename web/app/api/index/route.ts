import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { chunkWords } from "@/lib/rag";
import { embedAll } from "@/lib/embed";
import type { Word } from "@/lib/transcripts";

export const runtime = "nodejs";

// Index a transcript into transcript_chunks for cross-video RAG. Server-only: writes
// go through the service-role key (RLS bypass), so the browser never touches chunks.
// Re-indexable: clears the video's existing chunks first (re-transcribe / edits).
// Stub-safe: no-op acknowledgement when Supabase isn't configured.
export async function POST(req: NextRequest) {
  const { videoId, words } = (await req.json()) as { videoId?: string; words?: Word[] };
  if (!videoId || !Array.isArray(words)) {
    return NextResponse.json({ error: "videoId and words required" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ indexed: 0, stub: true });

  const chunks = chunkWords(words);
  if (!chunks.length) return NextResponse.json({ indexed: 0 });

  const embeddings = embedAll(chunks);
  const rows = chunks.map((chunk_text, i) => ({
    video_id: videoId,
    chunk_text,
    embedding: embeddings[i],
  }));

  // Replace prior chunks for this video so re-indexing is idempotent.
  await sb.from("transcript_chunks").delete().eq("video_id", videoId);
  const { error } = await sb.from("transcript_chunks").insert(rows);
  if (error) {
    return NextResponse.json({ indexed: 0, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ indexed: rows.length });
}

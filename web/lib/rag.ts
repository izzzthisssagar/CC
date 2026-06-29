import { getSupabase } from "./supabase";
import { embed } from "./embed";
import type { Word } from "./transcripts";

// Group consecutive words into ~chunkChars text chunks (with a small overlap so a
// phrase split across a boundary is still retrievable). Each chunk is one row in
// transcript_chunks. Tuned for short creator clips, not long-form.
const CHUNK_CHARS = 280;
const OVERLAP_WORDS = 4;

export function chunkWords(words: Word[], chunkChars = CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  let cur: string[] = [];
  let len = 0;
  for (const w of words) {
    cur.push(w.word);
    len += w.word.length + 1;
    if (len >= chunkChars) {
      chunks.push(cur.join(" "));
      cur = cur.slice(-OVERLAP_WORDS); // carry a little context into the next chunk
      len = cur.join(" ").length;
    }
  }
  if (cur.length && cur.join(" ").trim()) chunks.push(cur.join(" "));
  return chunks;
}

/** Index a video's transcript for cross-video RAG (server-side, best-effort). */
export async function indexTranscript(videoId: string, words: Word[]): Promise<void> {
  if (!words.length) return;
  await fetch("/api/index", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ videoId, words }),
  });
}

export type Hit = { video_id: string; chunk_text: string; similarity: number };

/** Retrieve the most relevant chunks across ALL of the signed-in user's videos.
 *  RLS + the match_user_chunks RPC scope results to auth.uid() — no userId passed. */
export async function searchAcrossVideos(question: string, k = 8): Promise<Hit[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb.rpc("match_user_chunks", {
    query_embedding: embed(question),
    match_count: k,
  });
  if (error || !data) return [];
  return data as Hit[];
}

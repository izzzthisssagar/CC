import { getSupabase } from "./supabase";

export type Word = { word: string; start: number; end: number };
export type Transcript = { id: string; words: Word[]; language: string | null };

/** Load the latest transcript for a video, or null (none / stub mode). */
export async function loadTranscript(videoId: string): Promise<Transcript | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("transcripts")
    .select("id, words, language")
    .eq("video_id", videoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { id: data.id, words: (data.words as Word[]) ?? [], language: data.language };
}

/** Persist a transcript and return its id (null in stub mode). */
export async function saveTranscript(
  videoId: string,
  words: Word[],
  language: string | null
): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data, error } = await sb
    .from("transcripts")
    .insert({ video_id: videoId, words, language })
    .select("id")
    .single();
  if (error) throw new Error(`transcript save failed: ${error.message}`);
  return data.id;
}

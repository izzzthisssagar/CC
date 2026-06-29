import { getSupabase } from "./supabase";

export type VideoRow = {
  id: string;
  storage_path: string;
  status: string;
  created_at: string;
};

/** List the signed-in user's videos (RLS-scoped). Empty in stub mode. */
export async function listVideos(): Promise<VideoRow[]> {
  const sb = getSupabase();
  if (!sb) return [];
  const { data, error } = await sb
    .from("videos")
    .select("id, storage_path, status, created_at")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data as VideoRow[];
}

/** Public URL for a stored video (feeds the editor's ?src=). */
export function videoPublicUrl(storagePath: string): string {
  const sb = getSupabase();
  if (!sb) return "";
  return sb.storage.from("videos").getPublicUrl(storagePath).data.publicUrl;
}

/** Delete a video: storage object + DB row (RLS-scoped; transcripts/jobs cascade). */
export async function deleteVideo(id: string, storagePath: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  await sb.storage.from("videos").remove([storagePath]);
  const { error } = await sb.from("videos").delete().eq("id", id);
  if (error) throw new Error(`delete failed: ${error.message}`);
}

import { getSupabase } from "./supabase";

const BUCKET = "videos";

export type Upload = { id: string; url: string };

/**
 * Upload a video to Supabase Storage AND create its `videos` row (RLS-scoped to
 * the signed-in user). Returns the video id + public URL, or null in stub mode.
 */
export async function uploadVideo(file: File): Promise<Upload | null> {
  const sb = getSupabase();
  if (!sb) return null; // stub mode

  const { data: u } = await sb.auth.getUser();
  const userId = u.user?.id;
  if (!userId) throw new Error("not signed in");

  const id = crypto.randomUUID();
  const path = `${id}/${file.name}`;
  const up = await sb.storage.from(BUCKET).upload(path, file, { upsert: false });
  if (up.error) throw new Error(`upload failed: ${up.error.message}`);

  const ins = await sb.from("videos").insert({
    id,
    user_id: userId,
    storage_path: path,
    status: "uploaded",
  });
  if (ins.error) throw new Error(`videos insert failed: ${ins.error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { id, url: data.publicUrl };
}

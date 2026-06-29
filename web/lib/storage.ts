import { getSupabase } from "./supabase";

const BUCKET = "videos";

export type Upload = { id: string; url: string };

/**
 * Upload a video to Supabase Storage and return its id + public URL.
 * Returns null in stub mode (no Supabase env) so callers fall back to the demo flow.
 *
 * NOTE: uses a public URL for MVP simplicity. For private content, switch to
 * createSignedUrl (and keep the bucket private). The worker's SSRF guard requires
 * the Supabase host to be in ALLOWED_SOURCE_HOSTS.
 */
export async function uploadVideo(file: File): Promise<Upload | null> {
  const sb = getSupabase();
  if (!sb) return null; // stub mode

  const id = crypto.randomUUID();
  const path = `${id}/${file.name}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw new Error(`upload failed: ${error.message}`);

  const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
  return { id, url: data.publicUrl };
}

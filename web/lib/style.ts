import { getSupabase } from "./supabase";

export type CaptionStyle = { template: string };

/** Load the user's last-used caption style (RAG Feature 1 — style memory). */
export async function loadLastStyle(): Promise<CaptionStyle | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return null;
  const { data, error } = await sb
    .from("users")
    .select("last_style")
    .eq("id", u.user.id)
    .maybeSingle();
  if (error || !data?.last_style) return null;
  return data.last_style as CaptionStyle;
}

/** Persist the user's chosen style so it auto-applies next time. */
export async function saveLastStyle(style: CaptionStyle): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { data: u } = await sb.auth.getUser();
  if (!u.user) return;
  // users row exists via the signup trigger; update own (RLS: users self).
  await sb.from("users").update({ last_style: style }).eq("id", u.user.id);
}

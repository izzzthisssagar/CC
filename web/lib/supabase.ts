import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Cached browser client. MUST be a singleton: getSupabase() is called during
// render (e.g. AuthProvider), and a fresh client each call returns a new object
// reference, which retriggers effects keyed on it AND opens a new realtime
// socket every render — an unbounded alloc loop that OOM-kills the tab/browser.
// Build it once, hand back the same instance forever.
let browserClient: SupabaseClient | null = null;

// Returns a Supabase client, or null in stub mode (no env keys yet).
// Callers must handle null and fall back to mock data.
export function getSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  // On the server, don't cache: a module-level singleton would be shared across
  // requests and could leak one user's session into another's. The render-loop
  // problem only exists in the browser, so only the browser needs the cache.
  if (typeof window === "undefined") return createClient(url, key);
  if (!browserClient) browserClient = createClient(url, key);
  return browserClient;
}

export const STUB_MODE =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Server-only admin client (service role) for writes like corrections.
// Returns null in stub mode. NEVER import this into client components.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, STUB_MODE } from "@/lib/supabase";

type AuthCtx = {
  email: string | null;
  loading: boolean;
  stub: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!STUB_MODE);

  useEffect(() => {
    if (!sb) return; // stub mode — no auth
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  async function signIn(email: string, password: string) {
    if (!sb) return;
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function signUp(email: string, password: string) {
    if (!sb) return;
    const { error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
  }
  async function signOut() {
    if (!sb) return;
    await sb.auth.signOut();
  }

  return (
    <Ctx.Provider
      value={{
        email: session?.user.email ?? null,
        loading,
        stub: STUB_MODE,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used within AuthProvider");
  return c;
}

/** Redirect to /login when auth is required and the user is signed out. */
export function useRequireAuth() {
  const { email, loading, stub } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!stub && !loading && !email) router.replace("/login");
  }, [stub, loading, email, router]);
  return { ready: stub || (!loading && !!email) };
}

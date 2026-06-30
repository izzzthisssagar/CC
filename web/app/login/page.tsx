"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, stub, email: authedEmail, loading } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Redirect whenever a session is present — covers both "signed in just now"
  // (the auth state flips async after signIn, so an immediate push races
  // useRequireAuth and bounces back here) and "already signed in but landed on
  // /login". Driving off the real session is what makes it reliable.
  useEffect(() => {
    if (!stub && !loading && authedEmail) router.replace("/upload");
  }, [stub, loading, authedEmail, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password);
      // Navigation handled by the effect above once the session resolves.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
      setBusy(false);
    }
  }

  if (stub) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <span className="kicker">Demo edition</span>
        <h1 className="mt-5 font-display text-3xl font-semibold">Sign in</h1>
        <p className="mt-2 text-muted">
          Auth is disabled (stub mode — no Supabase keys). Go straight to{" "}
          <a className="text-saffron underline decoration-saffron/40 underline-offset-2" href="/upload">
            upload
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <span className="kicker">{mode === "in" ? "Welcome back" : "Join the masthead"}</span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
        {mode === "in" ? "Sign in" : "Create account"}
      </h1>
      <form onSubmit={onSubmit} className="mt-7 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          spellCheck={false}
          className="rounded-sm border border-rule bg-ink-raised px-3.5 py-2.5 text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        />
        <input
          type="password"
          name="password"
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          required
          minLength={6}
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-sm border border-rule bg-ink-raised px-3.5 py-2.5 text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        />
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="mt-1 rounded-sm bg-brand-600 px-4 py-2.5 font-semibold text-paper transition hover:bg-brand-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
        >
          {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-brand-400">
        {error}
      </p>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-5 text-sm text-muted underline decoration-rule underline-offset-4 transition hover:text-saffron"
      >
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </main>
  );
}

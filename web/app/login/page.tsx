"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { signIn, signUp, stub } = useAuth();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "in") await signIn(email, password);
      else await signUp(email, password);
      router.push("/upload");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Auth failed");
    } finally {
      setBusy(false);
    }
  }

  if (stub) {
    return (
      <main className="mx-auto max-w-sm px-6 py-24">
        <h1 className="text-2xl font-bold">Sign in</h1>
        <p className="mt-2 text-neutral-400">
          Auth is disabled (stub mode — no Supabase keys). Go straight to{" "}
          <a className="underline" href="/upload">
            upload
          </a>
          .
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-24">
      <h1 className="text-2xl font-bold">{mode === "in" ? "Sign in" : "Create account"}</h1>
      <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          spellCheck={false}
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
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
          className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className="rounded bg-yellow-400 px-4 py-2 font-semibold text-black disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          {busy ? "…" : mode === "in" ? "Sign in" : "Create account"}
        </button>
      </form>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-red-400">
        {error}
      </p>
      <button
        type="button"
        onClick={() => setMode(mode === "in" ? "up" : "in")}
        className="mt-4 text-sm text-neutral-400 underline"
      >
        {mode === "in" ? "Need an account? Sign up" : "Have an account? Sign in"}
      </button>
    </main>
  );
}

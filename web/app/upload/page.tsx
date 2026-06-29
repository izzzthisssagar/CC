"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { uploadVideo } from "@/lib/storage";
import { useRequireAuth } from "@/components/AuthProvider";

type Phase = "idle" | "uploading" | "error";

export default function UploadPage() {
  const router = useRouter();
  const { ready } = useRequireAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase("uploading");
    setError(null);
    try {
      // Live: upload to Supabase Storage, then open the editor with the real URL
      // (editor fires /api/transcribe). Stub mode (no Supabase) → demo editor.
      const result = await uploadVideo(file);
      if (result) {
        router.push(`/editor/${result.id}?src=${encodeURIComponent(result.url)}`);
      } else {
        router.push(`/editor/demo`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  const busy = phase === "uploading";

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-neutral-500">Loading…</main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="font-display text-4xl font-extrabold">Upload video</h1>
      <p className="mt-2 text-neutral-400">
        MP4 / MOV. We extract audio, transcribe with word timestamps, then you
        style the captions.
      </p>

      <label className="rise mt-10 flex h-56 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-neutral-400 transition hover:border-brand-500 hover:bg-brand-500/5 focus-within:ring-2 focus-within:ring-brand-400">
        <span className="text-3xl">{busy ? "⏳" : "🎬"}</span>
        <span className="font-medium">{busy ? "Processing…" : "Click to choose a video"}</span>
        <span className="text-xs text-neutral-600">Devanagari · Roman · Ninglish</span>
        <input
          type="file"
          accept="video/*"
          className="sr-only"
          onChange={onUpload}
          disabled={busy}
          aria-busy={busy}
        />
      </label>

      {/* Status announced to screen readers. */}
      <p role="status" aria-live="polite" className="mt-4 text-sm text-neutral-500">
        {busy ? "Uploading and starting transcription…" : ""}
        {error && <span className="text-red-400">{error}</span>}
      </p>
    </main>
  );
}

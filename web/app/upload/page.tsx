"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Phase = "idle" | "uploading" | "error";

export default function UploadPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhase("uploading");
    setError(null);
    try {
      // Scaffold: real flow = upload to Supabase Storage, create `videos` row,
      // POST /api/transcribe (worker returns a job_id), then route to the editor
      // which polls the job. For now jump to the stub editor.
      const id = "demo";
      router.push(`/editor/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setPhase("error");
    }
  }

  const busy = phase === "uploading";

  return (
    <main className="mx-auto max-w-2xl px-6 py-24">
      <h1 className="text-3xl font-bold">Upload video</h1>
      <p className="mt-2 text-neutral-400">
        MP4 / MOV. We extract audio, transcribe with word timestamps, then you
        style the captions.
      </p>

      <label className="mt-10 flex h-48 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-700 text-neutral-400 hover:border-yellow-400 focus-within:ring-2 focus-within:ring-yellow-400">
        <span>{busy ? "Processing…" : "Click to choose a video"}</span>
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

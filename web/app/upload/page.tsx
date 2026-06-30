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
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.type && !file.type.startsWith("video/")) {
      setError("That doesn't look like a video file (MP4 / MOV).");
      setPhase("error");
      return;
    }
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

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0]);
  }

  // Drag-and-drop path: dropping a file goes through DataTransfer and never opens
  // the native OS file picker — a workaround for the macOS file-dialog crash some
  // browser builds hit. Same handleFile path as the click-to-choose input.
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (busy) return;
    handleFile(e.dataTransfer.files?.[0]);
  }

  const busy = phase === "uploading";

  if (!ready) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-24 text-faint">Loading…</main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <span className="kicker">Step 01 · Upload</span>
      <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        Bring your video.
      </h1>
      <p className="mt-3 max-w-md text-muted">
        MP4 / MOV. We extract the audio, transcribe it with word timestamps, then you
        style the captions.
      </p>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`rise mt-10 flex h-60 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed bg-ink-raised text-muted transition focus-within:ring-2 focus-within:ring-saffron hover:border-brand-500/70 hover:bg-brand-700/10 ${
          dragging ? "border-saffron bg-brand-700/20" : "border-rule"
        }`}
      >
        <span className="font-deva-display text-5xl text-brand-500">{busy ? "…" : "स्व"}</span>
        <span className="font-display text-lg text-fg">
          {busy ? "Processing…" : dragging ? "Drop to upload" : "Click or drop a video"}
        </span>
        <span className="text-xs uppercase tracking-[0.16em] text-faint">
          Devanagari · Roman · Ninglish
        </span>
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
      <p role="status" aria-live="polite" className="mt-4 text-sm text-muted">
        {busy ? "Uploading and starting transcription…" : ""}
        {error && <span className="text-brand-400">{error}</span>}
      </p>
    </main>
  );
}

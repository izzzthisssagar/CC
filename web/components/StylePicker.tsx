"use client";

import { useState } from "react";

type Word = { word: string; start: number; end: number };

// Caption templates from BLUEPRINT.md §8.
const TEMPLATES = [
  "Devanagari Bold",
  "Hormozi Impact",
  "MrBeast Pop",
  "Bubble Nepali",
  "Podcast Clean",
  "Ninglish Mix",
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

type ExportResult = { mp4_url: string; srt_url: string };

export function StylePicker({
  words,
  videoId,
  videoUrl,
}: {
  words: Word[];
  videoId: string;
  videoUrl?: string;
}) {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);

  async function onExport() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl ?? `stub://${videoId}`,
          words,
          style: { template },
        }),
      });
      if (!res.ok) throw new Error(`export failed (${res.status})`);
      setResult((await res.json()) as ExportResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-xl border border-neutral-800 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        Style
      </h2>
      <div className="mt-3 flex flex-col gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={t === template}
            onClick={() => setTemplate(t)}
            className={`rounded-lg px-3 py-2 text-left text-sm ${focusRing} ${
              t === template
                ? "bg-yellow-400 text-black"
                : "bg-neutral-900 hover:bg-neutral-800"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={onExport}
        disabled={busy}
        aria-busy={busy}
        className={`mt-6 w-full rounded-lg bg-white px-4 py-3 font-semibold text-black hover:bg-neutral-200 disabled:opacity-60 ${focusRing}`}
      >
        {busy ? "Exporting…" : "Export MP4 + SRT"}
      </button>

      <div role="status" aria-live="polite" className="mt-3 text-xs">
        {error && <p className="text-red-400">{error}</p>}
        {result && (
          <div className="flex flex-col gap-1 text-neutral-300">
            <a className="underline hover:text-white" href={result.mp4_url}>
              Download MP4
            </a>
            <a className="underline hover:text-white" href={result.srt_url}>
              Download SRT
            </a>
            {result.mp4_url.startsWith("stub://") && (
              <span className="text-neutral-600">
                (stub URLs — real files once API keys are set)
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

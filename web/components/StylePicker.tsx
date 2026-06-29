"use client";

import { useEffect, useState } from "react";
import { loadLastStyle, saveLastStyle } from "@/lib/style";

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
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

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
  const [remembered, setRemembered] = useState(false);

  // RAG Feature 1 — style memory: pre-select the user's last-used template.
  useEffect(() => {
    let cancelled = false;
    loadLastStyle().then((s) => {
      if (!cancelled && s?.template && TEMPLATES.includes(s.template)) {
        setTemplate(s.template);
        setRemembered(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

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
      saveLastStyle({ template }); // remember choice for next time
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-sm border border-rule bg-ink-raised p-5">
      <h2 className="kicker">
        Style {remembered && <span className="ml-1 normal-case tracking-normal text-brand-400">· remembered</span>}
      </h2>
      <div className="mt-4 flex flex-col gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={t === template}
            onClick={() => setTemplate(t)}
            className={`rounded-sm px-3 py-2 text-left text-sm transition ${focusRing} ${
              t === template
                ? "bg-brand-600 font-semibold text-paper"
                : "bg-ink text-fg hover:bg-ink-sunken"
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
        className={`mt-6 w-full rounded-sm bg-paper px-4 py-3 font-semibold text-ink transition hover:bg-paper/90 disabled:opacity-60 ${focusRing}`}
      >
        {busy ? "Exporting…" : "Export MP4 + SRT"}
      </button>

      <div role="status" aria-live="polite" className="mt-3 text-xs">
        {error && <p className="text-brand-400">{error}</p>}
        {result && (
          <div className="flex flex-col gap-1 text-muted">
            <a className="text-saffron underline decoration-saffron/40 underline-offset-2 hover:text-fg" href={result.mp4_url}>
              Download MP4
            </a>
            <a className="text-saffron underline decoration-saffron/40 underline-offset-2 hover:text-fg" href={result.srt_url}>
              Download SRT
            </a>
            {result.mp4_url.startsWith("stub://") && (
              <span className="text-faint">
                (stub URLs — real files once API keys are set)
              </span>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}

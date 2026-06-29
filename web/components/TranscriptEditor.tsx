"use client";

import { useEffect, useState } from "react";
import { CaptionPreview } from "./CaptionPreview";
import { StylePicker } from "./StylePicker";

type Word = { word: string; start: number; end: number };

// Fallback transcript (matches worker stub). Rendered immediately so the editor
// works offline and in tests; replaced by the worker's response when reachable.
const MOCK_WORDS: Word[] = [
  { word: "नमस्ते", start: 0.0, end: 0.45 },
  { word: "आज", start: 0.45, end: 0.8 },
  { word: "हामी", start: 0.8, end: 1.1 },
  { word: "video", start: 1.1, end: 1.55 },
  { word: "editing", start: 1.55, end: 2.1 },
  { word: "सिक्छौं", start: 2.1, end: 2.7 },
];

export function TranscriptEditor({
  videoId,
  videoUrl,
}: {
  videoId: string;
  videoUrl?: string;
}) {
  const [words, setWords] = useState<Word[]>(MOCK_WORDS);
  const [source, setSource] = useState<"mock" | "worker">("mock");

  useEffect(() => {
    let cancelled = false;
    // Same-origin proxy → worker submit+poll → words. Uses the real Storage URL
    // when present (from upload), else a stub URL (worker returns mock in stub mode).
    fetch("/api/transcribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ video_url: videoUrl ?? `stub://${videoId}` }),
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        if (!cancelled && Array.isArray(data.words) && data.words.length) {
          setWords(data.words);
          setSource("worker");
        }
      })
      .catch(() => {
        /* worker offline → keep mock */
      });
    return () => {
      cancelled = true;
    };
  }, [videoId, videoUrl]);

  // Correction loop: a real edit updates the preview AND records training data.
  async function onWordEdit(i: number, raw: string) {
    const next = raw.trim();
    const original = words[i].word;
    if (!next || next === original) return;
    setWords((prev) => prev.map((w, j) => (j === i ? { ...w, word: next } : w)));
    try {
      await fetch("/api/corrections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          word_index: i,
          original_text: original,
          corrected_text: next,
          start_s: words[i].start,
          end_s: words[i].end,
        }),
      });
    } catch {
      /* non-blocking — correction capture is best-effort */
    }
  }

  return (
    <>
      <p className="mt-1 text-sm text-neutral-500">
        Word-level transcript ({source === "worker" ? "from worker" : "mock — worker offline"}).
        Edit a word to correct it, pick a style, preview, export.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <CaptionPreview words={words} videoUrl={videoUrl} />
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
              Transcript — edit to correct
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {words.map((w, i) => (
                <input
                  key={i}
                  defaultValue={w.word}
                  aria-label={`word ${i + 1}`}
                  spellCheck={false}
                  onBlur={(e) => onWordEdit(i, e.target.value)}
                  className="w-24 rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
                />
              ))}
            </div>
          </div>
        </div>
        <StylePicker words={words} videoId={videoId} videoUrl={videoUrl} />
      </div>
    </>
  );
}

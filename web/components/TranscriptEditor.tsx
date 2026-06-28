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

export function TranscriptEditor({ videoId }: { videoId: string }) {
  const [words, setWords] = useState<Word[]>(MOCK_WORDS);
  const [source, setSource] = useState<"mock" | "worker">("mock");

  useEffect(() => {
    let cancelled = false;
    // Same-origin proxy → worker submit+poll → words. video_url is a stub here
    // (real flow passes the Storage URL); the worker returns mock words in stub mode.
    fetch("/api/transcribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ video_url: `stub://${videoId}` }),
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
  }, [videoId]);

  return (
    <>
      <p className="mt-1 text-sm text-neutral-500">
        Word-level transcript ({source === "worker" ? "from worker" : "mock — worker offline"}).
        Pick a style, preview, export.
      </p>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        <CaptionPreview words={words} />
        <StylePicker />
      </div>
    </>
  );
}

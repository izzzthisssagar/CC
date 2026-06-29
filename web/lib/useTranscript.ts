"use client";

import { useEffect, useState } from "react";
import { loadTranscript, saveTranscript, type Word } from "@/lib/transcripts";
import { indexTranscript } from "@/lib/rag";

export type { Word };
export type TranscriptSource = "mock" | "worker" | "saved";

// Fallback transcript (matches worker stub). Rendered immediately so the editor
// works offline and in tests; replaced by the worker's response when reachable.
export const MOCK_WORDS: Word[] = [
  { word: "नमस्ते", start: 0.0, end: 0.45 },
  { word: "आज", start: 0.45, end: 0.8 },
  { word: "हामी", start: 0.8, end: 1.1 },
  { word: "video", start: 1.1, end: 1.55 },
  { word: "editing", start: 1.55, end: 2.1 },
  { word: "सिक्छौं", start: 2.1, end: 2.7 },
];

type TranscribeResult = { words: Word[]; language: string | null };

// One transcribe round-trip. Returns null when the response has no usable words.
async function requestTranscribe(
  videoId: string,
  videoUrl: string | undefined,
  opts?: { provider?: string; language?: string }
): Promise<TranscribeResult | null> {
  const res = await fetch("/api/transcribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      video_url: videoUrl ?? `stub://${videoId}`,
      ...opts,
    }),
  });
  if (!res.ok) throw new Error(`transcribe ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.words) && data.words.length
    ? { words: data.words as Word[], language: data.language ?? null }
    : null;
}

/** Owns the editor's transcript lifecycle: initial load (saved → transcribe),
 *  re-transcribe, and the correction loop. Persistence + RAG indexing are
 *  best-effort and run only for real (non-demo) videos. */
export function useTranscript(videoId: string, videoUrl?: string) {
  const persistable = videoId !== "demo";
  const [words, setWords] = useState<Word[]>(MOCK_WORDS);
  const [source, setSource] = useState<TranscriptSource>("mock");
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [retranscribing, setRetranscribing] = useState(false);

  // Save the transcript + index it for cross-video RAG. Both best-effort.
  async function persistAndIndex(w: Word[], language: string | null) {
    if (!persistable) return;
    try {
      const tid = await saveTranscript(videoId, w, language);
      if (tid) setTranscriptId(tid);
      indexTranscript(videoId, w).catch(() => {}); // RAG index, best-effort
    } catch {
      /* best-effort */
    }
  }

  // Initial load: prefer a saved transcript (skip re-paying Groq), else transcribe.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (persistable) {
        try {
          const saved = await loadTranscript(videoId);
          if (saved && saved.words.length) {
            if (!cancelled) {
              setWords(saved.words);
              setTranscriptId(saved.id);
              setSource("saved");
            }
            return;
          }
        } catch {
          /* fall through to transcribe */
        }
      }
      try {
        const result = await requestTranscribe(videoId, videoUrl);
        if (result && !cancelled) {
          setWords(result.words);
          setSource("worker");
          await persistAndIndex(result.words, result.language);
        }
      } catch {
        /* worker offline → keep mock */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId, videoUrl, persistable]);

  // Re-run STT with a chosen engine + language, replace words, persist.
  async function reTranscribe(provider: string, language: string) {
    setRetranscribing(true);
    try {
      const result = await requestTranscribe(videoId, videoUrl, {
        provider,
        language: language || undefined,
      });
      if (result) {
        setWords(result.words);
        setSource("worker");
        await persistAndIndex(result.words, result.language);
      }
    } catch {
      /* keep current words */
    } finally {
      setRetranscribing(false);
    }
  }

  // Correction loop: a real edit updates the preview AND records training data.
  function editWord(i: number, raw: string) {
    const next = raw.trim();
    const original = words[i].word;
    if (!next || next === original) return;
    setWords((prev) => prev.map((w, j) => (j === i ? { ...w, word: next } : w)));
    fetch("/api/corrections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        transcript_id: transcriptId,
        word_index: i,
        original_text: original,
        corrected_text: next,
        start_s: words[i].start,
        end_s: words[i].end,
      }),
    }).catch(() => {
      /* non-blocking — correction capture is best-effort */
    });
  }

  return { words, source, retranscribing, reTranscribe, editWord };
}

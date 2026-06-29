"use client";

import { useEffect, useState } from "react";
import { CaptionPreview } from "./CaptionPreview";
import { StylePicker } from "./StylePicker";
import { ChatPanel } from "./ChatPanel";
import { useRequireAuth } from "./AuthProvider";
import { loadTranscript, saveTranscript } from "@/lib/transcripts";
import { indexTranscript } from "@/lib/rag";

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
  const { ready } = useRequireAuth();
  const [words, setWords] = useState<Word[]>(MOCK_WORDS);
  const [source, setSource] = useState<"mock" | "worker" | "saved">("mock");
  const [transcriptId, setTranscriptId] = useState<string | null>(null);
  const [provider, setProvider] = useState("groq");
  const [language, setLanguage] = useState(""); // "" = auto, "ne" = force Nepali
  const [retranscribing, setRetranscribing] = useState(false);
  const persistable = videoId !== "demo"; // real uploaded video

  // Re-run STT with the chosen engine + language, replace words, persist.
  async function reTranscribe() {
    setRetranscribing(true);
    try {
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          video_url: videoUrl ?? `stub://${videoId}`,
          provider,
          language: language || undefined,
        }),
      });
      if (!res.ok) throw new Error(`transcribe ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data.words) && data.words.length) {
        setWords(data.words);
        setSource("worker");
        if (persistable) {
          try {
            const tid = await saveTranscript(videoId, data.words, data.language ?? null);
            if (tid) setTranscriptId(tid);
            indexTranscript(videoId, data.words).catch(() => {}); // RAG index, best-effort
          } catch {
            /* best-effort */
          }
        }
      }
    } catch {
      /* keep current words */
    } finally {
      setRetranscribing(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      // 1. Load a previously saved transcript (skip re-transcribing / re-paying Groq).
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
      // 2. Transcribe via worker (same-origin proxy → submit+poll).
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ video_url: videoUrl ?? `stub://${videoId}` }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && Array.isArray(data.words) && data.words.length) {
          setWords(data.words);
          setSource("worker");
          // 3. Persist for next load (real videos only).
          if (persistable) {
            try {
              const tid = await saveTranscript(videoId, data.words, data.language ?? null);
              if (tid && !cancelled) setTranscriptId(tid);
              indexTranscript(videoId, data.words).catch(() => {}); // RAG index, best-effort
            } catch {
              /* save best-effort */
            }
          }
        }
      } catch {
        /* worker offline → keep mock */
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [videoId, videoUrl, persistable]);

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
          transcript_id: transcriptId,
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

  if (!ready) return <p className="mt-4 text-sm text-neutral-500">Loading…</p>;

  return (
    <>
      <p className="mt-1 text-sm text-neutral-500">
        Word-level transcript ({source === "saved" ? "saved" : source === "worker" ? "from worker" : "mock — worker offline"}).
        Edit a word to correct it, pick a style, preview, export.
      </p>

      {/* STT engine + language toggle (real Nepali is hard — let users try both) */}
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-neutral-500">Engine</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <option value="groq">Groq Whisper</option>
            <option value="gladia">Gladia</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-neutral-500">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            <option value="">Auto (Ninglish)</option>
            <option value="ne">Force Nepali</option>
          </select>
        </label>
        <button
          type="button"
          onClick={reTranscribe}
          disabled={retranscribing}
          aria-busy={retranscribing}
          className="rounded bg-neutral-200 px-3 py-1 font-semibold text-black disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          {retranscribing ? "Transcribing…" : "Re-transcribe"}
        </button>
      </div>
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
      <ChatPanel words={words} />
    </>
  );
}

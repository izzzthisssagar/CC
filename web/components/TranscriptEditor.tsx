"use client";

import { useState } from "react";
import { CaptionPreview } from "./CaptionPreview";
import { StylePicker } from "./StylePicker";
import { ChatPanel } from "./ChatPanel";
import { useRequireAuth } from "./AuthProvider";
import { useTranscript } from "@/lib/useTranscript";

export function TranscriptEditor({
  videoId,
  videoUrl,
}: {
  videoId: string;
  videoUrl?: string;
}) {
  const { ready } = useRequireAuth();
  const { words, source, retranscribing, reTranscribe, editWord } = useTranscript(videoId, videoUrl);
  const [provider, setProvider] = useState("groq");
  const [language, setLanguage] = useState(""); // "" = auto, "ne" = force Nepali

  if (!ready) return <p className="mt-4 text-sm text-faint">Loading…</p>;

  return (
    <>
      <p className="mt-2 text-sm text-muted">
        Word-level transcript ({source === "saved" ? "saved" : source === "worker" ? "from worker" : "mock — worker offline"}).
        Edit a word to correct it, pick a style, preview, export.
      </p>

      {/* STT engine + language toggle (real Nepali is hard — let users try both) */}
      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-faint">Engine</span>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="rounded-sm border border-rule bg-ink-raised px-2 py-1 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <option value="groq">Groq Whisper</option>
            <option value="gladia">Gladia</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-[0.14em] text-faint">Language</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="rounded-sm border border-rule bg-ink-raised px-2 py-1 text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
          >
            <option value="">Auto (Ninglish)</option>
            <option value="ne">Force Nepali</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() => reTranscribe(provider, language)}
          disabled={retranscribing}
          aria-busy={retranscribing}
          className="rounded-sm bg-paper px-3 py-1 font-semibold text-ink transition hover:bg-paper/90 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          {retranscribing ? "Transcribing…" : "Re-transcribe"}
        </button>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        <div className="flex flex-col gap-4">
          <CaptionPreview words={words} videoUrl={videoUrl} />
          <div>
            <h2 className="kicker">Transcript — edit to correct</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {words.map((w, i) => (
                <input
                  key={i}
                  defaultValue={w.word}
                  aria-label={`word ${i + 1}`}
                  spellCheck={false}
                  onBlur={(e) => editWord(i, e.target.value)}
                  className="w-24 rounded-sm border border-rule bg-ink-raised px-2 py-1 text-sm text-fg focus-visible:border-brand-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
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

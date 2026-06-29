"use client";

import { useEffect, useRef, useState } from "react";
import { fontClassFor } from "@/lib/script";

type Word = { word: string; start: number; end: number };

// Karaoke caption preview. Highlights the active word by playback time.
// Drives off a real <video> when a URL is present; otherwise a play-simulation
// over the word timeline so the effect is visible in stub mode too.
export function CaptionPreview({ words, videoUrl }: { words: Word[]; videoUrl?: string }) {
  const [t, setT] = useState(0);
  const [simPlaying, setSimPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const end = words.length ? words[words.length - 1].end : 0;

  // Simulated playback (no real video).
  useEffect(() => {
    if (videoUrl || !simPlaying) return;
    let raf = 0;
    const startedAt = performance.now() - t * 1000;
    const tick = (now: number) => {
      const cur = (now - startedAt) / 1000;
      if (cur >= end) {
        setT(0);
        setSimPlaying(false);
        return;
      }
      setT(cur);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simPlaying, videoUrl, end]);

  const activeIdx = words.findIndex((w) => t >= w.start && t < w.end);

  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-6">
      <div className="relative aspect-video overflow-hidden rounded-lg bg-neutral-900">
        {videoUrl ? (
          <video
            ref={videoRef}
            src={videoUrl}
            controls
            className="h-full w-full object-contain"
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-neutral-700">
            no video — preview simulates timing
          </div>
        )}

        {/* Caption overlay — stroke gives legibility over any frame (matches burn-in). */}
        <p
          className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-wrap justify-center gap-1 px-4 text-2xl font-bold text-caption-fill"
          style={{ WebkitTextStroke: "1px var(--caption-outline)", paintOrder: "stroke fill" }}
        >
          {words.map((w, i) => (
            <span
              key={i}
              className={`${fontClassFor(w.word)} transition-transform`}
              style={
                i === activeIdx
                  ? { color: "var(--caption-active)", transform: "scale(1.12)" }
                  : undefined
              }
            >
              {w.word}
            </span>
          ))}
        </p>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center gap-3">
        {!videoUrl && (
          <button
            type="button"
            onClick={() => setSimPlaying((p) => !p)}
            className="rounded bg-yellow-400 px-3 py-1 text-sm font-semibold text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            {simPlaying ? "Pause" : "Play"}
          </button>
        )}
        <input
          type="range"
          min={0}
          max={end || 1}
          step={0.01}
          value={t}
          onChange={(e) => {
            const v = Number(e.target.value);
            setT(v);
            if (videoRef.current) videoRef.current.currentTime = v;
          }}
          aria-label="scrub timeline"
          className="flex-1 accent-yellow-400"
        />
        <span className="w-12 text-right text-xs tabular-nums text-neutral-500">
          {t.toFixed(1)}s
        </span>
      </div>

      <p className="mt-2 text-xs text-neutral-600">
        {words.length} words · active word highlighted in real time · Devanagari + Latin
        auto per-word.
      </p>
    </div>
  );
}

import { fontClassFor } from "@/lib/script";

type Word = { word: string; start: number; end: number };

export function CaptionPreview({ words }: { words: Word[] }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-black p-6">
      <div className="aspect-video rounded-lg bg-neutral-900 flex items-center justify-center">
        {/* Black stroke mirrors the worker's .ass outline=3 — caption legibility
            comes from the outline (contrast over arbitrary video), not the fill. */}
        <p
          className="flex flex-wrap justify-center gap-1 text-2xl font-bold text-caption-fill"
          style={{
            WebkitTextStroke: "1px var(--caption-outline)",
            paintOrder: "stroke fill",
          }}
        >
          {words.map((w, i) => (
            <span key={i} className={fontClassFor(w.word)}>
              {w.word}
            </span>
          ))}
        </p>
      </div>
      <p className="mt-3 text-xs text-neutral-600">
        {words.length} words · Devanagari rendered with font-deva, Latin with
        font-sans (auto per-word).
      </p>
    </div>
  );
}

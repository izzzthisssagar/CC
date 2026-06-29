"use client";

import { useEffect, useState } from "react";
import { fontClassFor } from "@/lib/script";

// Live karaoke demo — the product's signature, shown not told. Cycles the active
// word through a Ninglish line, highlighting it like the real caption preview.
const LINE = [
  "नमस्ते", "guys", "आज", "हामी", "video", "editing", "सिक्छौं", "—",
  "captions", "एकदम", "perfect", "देखिन्छ", "!",
];

export function HeroCaption() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActive((i) => (i + 1) % LINE.length), 420);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto aspect-video w-full max-w-xl overflow-hidden rounded-sm border border-rule bg-gradient-to-br from-ink-raised to-ink-sunken shadow-2xl ring-1 ring-black/40">
      {/* faux video frame texture */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(220,82,109,0.2),transparent_55%)]" />
      <div className="absolute left-4 top-4 flex items-center gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full bg-brand-500" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-fg/40">
          ● REC · Nepali
        </span>
      </div>
      <p
        className="absolute inset-x-0 bottom-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-6 text-center text-2xl font-bold leading-tight text-white sm:text-3xl"
        style={{ WebkitTextStroke: "1.5px #000", paintOrder: "stroke fill" }}
      >
        {LINE.map((w, i) => (
          <span
            key={i}
            className={`${fontClassFor(w)} transition-all duration-200`}
            style={
              i === active
                ? { color: "var(--caption-active)", transform: "scale(1.15)", display: "inline-block" }
                : { opacity: 0.85 }
            }
          >
            {w}
          </span>
        ))}
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";

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

export function StylePicker() {
  const [template, setTemplate] = useState(TEMPLATES[0]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onExport() {
    setBusy(true);
    setStatus(`Exporting "${template}"…`);
    // Scaffold: POST /api/export → worker /export, then poll the job.
    setStatus(`"${template}" export wires to the worker once keys are set.`);
    setBusy(false);
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

      <p role="status" aria-live="polite" className="mt-3 text-xs text-neutral-500">
        {status}
      </p>
    </aside>
  );
}

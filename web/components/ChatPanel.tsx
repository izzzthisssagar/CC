"use client";

import { useState } from "react";
import { searchAcrossVideos } from "@/lib/rag";

type Word = { word: string; start: number; end: number };
type Turn = { q: string; a: string };
type Scope = "video" | "all";

// Ask questions about the video. Scope "video" sends the current (corrected) transcript;
// scope "all" retrieves the most relevant chunks across ALL the user's videos (RAG).
export function ChatPanel({ words }: { words: Word[] }) {
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [scope, setScope] = useState<Scope>("video");

  async function ask(e: React.FormEvent) {
    e.preventDefault();
    const question = q.trim();
    if (!question || busy) return;
    setBusy(true);
    setQ("");
    // Build the context: this video's words, or top RAG hits across all videos.
    let transcript: string;
    if (scope === "all") {
      const hits = await searchAcrossVideos(question);
      transcript = hits.length
        ? hits.map((h) => h.chunk_text).join("\n")
        : words.map((w) => w.word).join(" "); // fall back to this video if nothing indexed
    } else {
      transcript = words.map((w) => w.word).join(" ");
    }
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript, question }),
      });
      const data = await res.json();
      setTurns((t) => [...t, { q: question, a: data.answer ?? data.error ?? "No answer." }]);
    } catch {
      setTurns((t) => [...t, { q: question, a: "Chat failed — is the worker running?" }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-neutral-800 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
          {scope === "all" ? "Ask across my videos" : "Ask about this video"}
        </h2>
        <div className="flex rounded border border-neutral-700 text-xs" role="group" aria-label="chat scope">
          {(["video", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className={`px-2.5 py-1 ${
                scope === s ? "bg-yellow-400 font-semibold text-black" : "text-neutral-400"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400`}
            >
              {s === "video" ? "This video" : "All videos"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-3" aria-live="polite">
        {turns.length === 0 && (
          <p className="text-sm text-neutral-600">
            e.g. &ldquo;What is this video about?&rdquo; · &ldquo;यो भिडियोमा के भनिएको छ?&rdquo;
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className="text-sm">
            <p className="text-neutral-400">{t.q}</p>
            <p className="mt-1 whitespace-pre-wrap">{t.a}</p>
          </div>
        ))}
        {busy && <p className="text-sm text-neutral-500">Thinking…</p>}
      </div>

      <form onSubmit={ask} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question…"
          aria-label="question"
          className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded bg-yellow-400 px-4 py-2 text-sm font-semibold text-black disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          Ask
        </button>
      </form>
    </section>
  );
}

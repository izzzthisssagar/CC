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
    <section className="mt-8 rounded-sm border border-rule bg-ink-raised p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="kicker">
          {scope === "all" ? "Ask across my videos" : "Ask about this video"}
        </h2>
        <div className="flex overflow-hidden rounded-sm border border-rule text-xs" role="group" aria-label="chat scope">
          {(["video", "all"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScope(s)}
              aria-pressed={scope === s}
              className={`px-2.5 py-1 transition ${
                scope === s ? "bg-brand-600 font-semibold text-paper" : "text-muted hover:text-fg"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron`}
            >
              {s === "video" ? "This video" : "All videos"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3" aria-live="polite">
        {turns.length === 0 && (
          <p className="text-sm italic text-faint">
            e.g. &ldquo;What is this video about?&rdquo; · &ldquo;यो भिडियोमा के भनिएको छ?&rdquo;
          </p>
        )}
        {turns.map((t, i) => (
          <div key={i} className="border-l-2 border-brand-700/50 pl-3 text-sm">
            <p className="font-medium text-muted">{t.q}</p>
            <p className="mt-1 whitespace-pre-wrap text-fg">{t.a}</p>
          </div>
        ))}
        {busy && <p className="text-sm italic text-faint">Thinking…</p>}
      </div>

      <form onSubmit={ask} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Ask a question…"
          aria-label="question"
          className="flex-1 rounded-sm border border-rule bg-ink px-3 py-2 text-sm text-fg placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-sm bg-brand-600 px-4 py-2 text-sm font-semibold text-paper transition hover:bg-brand-500 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
        >
          Ask
        </button>
      </form>
    </section>
  );
}

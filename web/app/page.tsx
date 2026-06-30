import Link from "next/link";
import { HeroCaption } from "@/components/HeroCaption";

const FEATURES = [
  {
    k: "अ",
    no: "01",
    title: "Devanagari, set right",
    body: "Conjuncts and matras render perfectly — burned in via libass, never the broken fallbacks CapCut and Premiere ship.",
  },
  {
    k: "रो",
    no: "02",
    title: "Ninglish-native",
    body: "Nepali र English in one line, captured as you actually speak. Code-switching is the default here, not an error.",
  },
  {
    k: "स्व",
    no: "03",
    title: "Karaoke word-sync",
    body: "Word-level timestamps light each word as it's spoken — the MrBeast / Hormozi style, in your own script.",
  },
  {
    k: "एआई",
    no: "04",
    title: "Self-improving",
    body: "Every correction trains a Nepali model that sharpens over time. The captions get better because you use it.",
  },
];

const STEPS = [
  ["०१", "Upload", "Drop your video. We pull the audio and transcribe it with word-level timing."],
  ["०२", "Refine", "Fix any word in one click — your corrections quietly train the Nepali model."],
  ["०३", "Export", "Pick a style, burn the captions in, download MP4 + SRT. Ask the video questions too."],
] as const;

export default function Home() {
  return (
    <main>
      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Oversized Devanagari artwork bleeding off the right edge. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-10 select-none font-deva-display text-[28rem] leading-none text-brand-700/10 md:-right-16 md:text-[40rem]"
        >
          स्वर
        </span>

        <div className="relative mx-auto max-w-6xl px-6 pb-24 pt-16 md:pt-24">
          <div className="grid items-center gap-14 md:grid-cols-[1.05fr_0.95fr]">
            <div>
              <span className="kicker inkbleed">Nepali-first AI captions</span>

              <h1 className="rise mt-6 font-display text-5xl font-semibold leading-[1.02] tracking-tight md:text-[4.4rem]">
                Captions that speak{" "}
                <span className="font-deva-display font-normal text-brand-500">नेपाली</span>
                <br className="hidden md:block" /> — and{" "}
                <em className="font-display italic text-saffron">Ninglish</em>.
              </h1>

              <p className="dropcap rise mt-7 max-w-md text-lg leading-relaxed text-muted" style={{ animationDelay: "0.08s" }}>
                Upload a video and get karaoke-style, word-level captions in Devanagari,
                Roman Nepali, and Ninglish. Export a burned-in MP4 + SRT in minutes — set
                in type that finally respects the script.
              </p>

              <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "0.16s" }}>
                <Link
                  href="/upload"
                  className="rounded-sm bg-brand-600 px-7 py-3.5 font-semibold text-paper shadow-[0_1px_0_0_rgba(0,0,0,0.4)] transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  Start captioning — free
                </Link>
                <Link
                  href="/login"
                  className="rounded-sm border border-rule px-7 py-3.5 font-semibold text-fg transition hover:border-saffron/60 hover:text-saffron focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron"
                >
                  Sign in
                </Link>
              </div>

              <p className="mt-5 text-xs uppercase tracking-[0.16em] text-faint">
                No card · Devanagari · Roman · Ninglish · English
              </p>
            </div>

            <div className="rise" style={{ animationDelay: "0.2s" }}>
              <figure>
                <HeroCaption />
                <figcaption className="mt-3 text-center font-display text-sm italic text-faint">
                  Live preview — each word lights as it&rsquo;s spoken.
                </figcaption>
              </figure>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="kicker">The masthead</span>
          <h2 className="mt-5 max-w-2xl font-display text-3xl font-semibold leading-tight md:text-[2.7rem]">
            Built for Nepali creators,{" "}
            <span className="text-muted">not retrofitted for them.</span>
          </h2>

          <div className="mt-12 grid gap-px overflow-hidden border border-rule bg-rule sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.title} className="group relative bg-ink-raised p-8 transition-colors hover:bg-ink">
                <div className="flex items-baseline justify-between">
                  <span className="font-deva-display text-3xl text-brand-500">{f.k}</span>
                  <span className="font-display text-sm italic text-faint">{f.no}</span>
                </div>
                <h3 className="mt-5 font-display text-xl font-semibold text-fg">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted">{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="border-t border-rule">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="kicker">In three movements</span>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {STEPS.map(([n, t, b]) => (
              <div key={t} className="relative">
                <div className="font-deva-display text-6xl leading-none text-brand-700/50">{n}</div>
                <h3 className="mt-4 font-display text-xl font-semibold text-fg">{t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{b}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-col items-center gap-5">
            <div className="rule-diamond w-full max-w-xs">◆</div>
            <Link
              href="/upload"
              className="rounded-sm bg-brand-600 px-9 py-4 text-lg font-semibold text-paper transition hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-saffron focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Caption your first video →
            </Link>
          </div>
        </div>
      </section>

      {/* ── COLOPHON ──────────────────────────────────────────────────── */}
      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-10 text-sm text-faint sm:flex-row">
          <span className="flex items-baseline gap-2">
            <span className="font-deva-display text-lg text-brand-500">बो</span>
            <span className="font-display font-semibold text-muted">BoldaBoldai</span>
            <span className="font-deva text-xs text-faint">— बोल्दाबोल्दै, captions as you speak</span>
          </span>
          <span className="font-display italic">
            Set in Fraunces &amp; Mukta · Devanagari · Roman · Ninglish · made for Nepal 🇳🇵
          </span>
        </div>
      </footer>
    </main>
  );
}

import Link from "next/link";
import { HeroCaption } from "@/components/HeroCaption";

const FEATURES = [
  {
    k: "देवनागरी",
    title: "Devanagari, done right",
    body: "Conjuncts and matras render perfectly — burned in via libass, never the broken fallbacks CapCut and Premiere ship.",
  },
  {
    k: "Ninglish",
    title: "Ninglish-native",
    body: "Nepali र English in the same line, captured as you actually speak. Code-switching is the default, not an error.",
  },
  {
    k: "★",
    title: "Karaoke word-sync",
    body: "Word-level timestamps highlight each word as it's spoken — the MrBeast / Hormozi style, in your script.",
  },
  {
    k: "AI",
    title: "Self-improving",
    body: "Every correction trains a Nepali model that gets better over time. The captions improve because you use it.",
  },
];

export default function Home() {
  return (
    <main>
      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-neutral-300">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Nepali-first AI captions
            </span>
            <h1 className="mt-6 font-display text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              Captions that{" "}
              <span className="text-brand-500">speak Nepali</span> —
              <br className="hidden md:block" /> and{" "}
              <span className="font-deva">Ninglish</span>.
            </h1>
            <p className="mt-5 max-w-md text-lg text-neutral-400">
              Upload a video, get karaoke-style word-level captions in Devanagari,
              Roman Nepali, and Ninglish. Export a burned-in MP4 + SRT in minutes.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/upload"
                className="rounded-xl bg-brand-500 px-6 py-3 font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Start captioning — free
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/15 px-6 py-3 font-semibold text-neutral-200 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                Sign in
              </Link>
            </div>
            <p className="mt-4 text-sm text-neutral-600">
              No credit card · Devanagari · Roman · Ninglish · English
            </p>
          </div>

          <div className="rise" style={{ animationDelay: "0.15s" }}>
            <HeroCaption />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="border-t border-white/5 bg-white/[0.015]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="font-display text-3xl font-bold md:text-4xl">
            Built for Nepali creators,{" "}
            <span className="text-neutral-500">not retrofitted for them.</span>
          </h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0b0a0e] p-8">
                <div className="font-deva text-2xl font-bold text-brand-500">{f.k}</div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            ["01", "Upload", "Drop your video. We extract the audio and transcribe with word-level timing."],
            ["02", "Refine", "Fix any word in one click — your corrections train the Nepali model."],
            ["03", "Export", "Pick a style, burn captions in, download MP4 + SRT. Ask the video questions too."],
          ].map(([n, t, b]) => (
            <div key={n}>
              <div className="font-display text-5xl font-extrabold text-white/10">{n}</div>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-neutral-400">{b}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 flex justify-center">
          <Link
            href="/upload"
            className="rounded-xl bg-brand-500 px-8 py-4 text-lg font-semibold text-white transition hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Caption your first video →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-neutral-600 sm:flex-row">
          <span className="font-display font-bold text-neutral-400">Nepali AI Caption</span>
          <span>Devanagari · Roman · Ninglish — made for Nepal 🇳🇵</span>
        </div>
      </footer>
    </main>
  );
}

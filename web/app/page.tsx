import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-24">
      <h1 className="font-deva text-5xl font-black leading-tight">
        Nepali AI Caption
      </h1>
      <p className="mt-4 text-lg text-neutral-400">
        Upload a video → karaoke-style word-level captions in Devanagari, Roman
        Nepali, and Ninglish → export burned-in MP4 + SRT.
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/upload"
          className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black hover:bg-yellow-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Upload Video
        </Link>
        <a
          href="https://github.com"
          className="rounded-lg border border-neutral-700 px-6 py-3 font-semibold hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          Docs
        </a>
      </div>

      <p className="mt-16 text-sm text-neutral-600">
        Scaffold build — services run in stub mode until API keys are configured.
      </p>
    </main>
  );
}

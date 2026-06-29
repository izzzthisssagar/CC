import { TranscriptEditor } from "@/components/TranscriptEditor";

// Next 15: params + searchParams are async (Promises) — await them before use.
export default async function EditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ src?: string }>;
}) {
  const { id } = await params;
  const { src } = await searchParams;
  const videoUrl = typeof src === "string" ? src : undefined;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <span className="kicker">The desk · Step 02</span>
      <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
        Edit &amp; style
        <span className="ml-3 align-middle font-display text-sm italic text-faint">№ {id.slice(0, 8)}</span>
      </h1>
      <TranscriptEditor videoId={id} videoUrl={videoUrl} />
    </main>
  );
}

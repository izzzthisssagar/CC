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
      <h1 className="text-2xl font-bold">Editor · {id}</h1>
      <TranscriptEditor videoId={id} videoUrl={videoUrl} />
    </main>
  );
}

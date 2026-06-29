import { TranscriptEditor } from "@/components/TranscriptEditor";

export default function EditorPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { src?: string };
}) {
  const videoUrl =
    typeof searchParams.src === "string" ? searchParams.src : undefined;
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">Editor · {params.id}</h1>
      <TranscriptEditor videoId={params.id} videoUrl={videoUrl} />
    </main>
  );
}

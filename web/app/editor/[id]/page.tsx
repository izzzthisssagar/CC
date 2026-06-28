import { TranscriptEditor } from "@/components/TranscriptEditor";

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">Editor · {params.id}</h1>
      <TranscriptEditor videoId={params.id} />
    </main>
  );
}

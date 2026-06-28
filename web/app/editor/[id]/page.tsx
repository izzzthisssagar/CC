import { CaptionPreview } from "@/components/CaptionPreview";
import { StylePicker } from "@/components/StylePicker";

// Mock transcript (matches worker stub output). Real version fetches from Supabase.
const MOCK_WORDS = [
  { word: "नमस्ते", start: 0.0, end: 0.45 },
  { word: "आज", start: 0.45, end: 0.8 },
  { word: "हामी", start: 0.8, end: 1.1 },
  { word: "video", start: 1.1, end: 1.55 },
  { word: "editing", start: 1.55, end: 2.1 },
  { word: "सिक्छौं", start: 2.1, end: 2.7 },
];

export default function EditorPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-bold">Editor · {params.id}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Word-level transcript (stub). Pick a style, preview, export.
      </p>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_280px]">
        <CaptionPreview words={MOCK_WORDS} />
        <StylePicker />
      </div>
    </main>
  );
}

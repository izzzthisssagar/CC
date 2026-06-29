// Server-only Groq calls so transcribe + chat work on Vercel WITHOUT the ffmpeg
// worker. Groq accepts MP4 directly (no audio extraction needed). For large/long
// videos or burn-in export, the dedicated worker (WORKER_URL) is still preferred.
import Groq, { toFile } from "groq-sdk";

const NINGLISH = "नमस्ते, यो video मा Nepali र English mixed language प्रयोग हुनेछ।";
const CHAT_MODEL = process.env.GROQ_CHAT_MODEL ?? "llama-3.3-70b-versatile";

export type Word = { word: string; start: number; end: number };

function client(): Groq | null {
  const key = process.env.GROQ_API_KEY;
  return key ? new Groq({ apiKey: key }) : null;
}

const STUB_WORDS: Word[] = [
  { word: "नमस्ते", start: 0, end: 0.45 },
  { word: "आज", start: 0.45, end: 0.8 },
  { word: "video", start: 0.8, end: 1.2 },
  { word: "editing", start: 1.2, end: 1.8 },
  { word: "सिक्छौं", start: 1.8, end: 2.4 },
];

export async function transcribeDirect(
  videoUrl: string,
  language?: string
): Promise<{ words: Word[]; language: string }> {
  const groq = client();
  if (!groq) return { words: STUB_WORDS, language: "ne" };

  const resp = await fetch(videoUrl);
  if (!resp.ok) throw new Error(`fetch video ${resp.status}`);
  const buf = Buffer.from(await resp.arrayBuffer());
  const file = await toFile(buf, "video.mp4");

  const tr = await groq.audio.transcriptions.create({
    file,
    model: "whisper-large-v3-turbo",
    response_format: "verbose_json",
    timestamp_granularities: ["word"],
    prompt: NINGLISH,
    ...(language ? { language } : {}),
  } as never);

  const words = ((tr as { words?: Word[] }).words ?? []).map((w) => ({
    word: w.word,
    start: w.start,
    end: w.end,
  }));
  return { words, language: (tr as { language?: string }).language ?? "ne" };
}

export async function chatDirect(transcript: string, question: string): Promise<string> {
  const groq = client();
  if (!groq) return `(stub) You asked: ${question}. Set GROQ_API_KEY for real answers.`;
  const res = await groq.chat.completions.create({
    model: CHAT_MODEL,
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      {
        role: "system",
        content:
          "Answer questions about a video using ONLY its transcript (Nepali/Romanized/Ninglish, may have errors). If not in the transcript, say so. Reply in the user's language; be concise.",
      },
      { role: "user", content: `Transcript:\n${transcript}\n\nQuestion: ${question}` },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}

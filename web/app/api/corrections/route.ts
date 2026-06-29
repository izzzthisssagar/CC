import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

// Correction-loop capture (the data moat). Every user fix → a corrections row →
// Whisper fine-tune training data (see worker/app/training_export.py + docs/DATA.md).
// Stub-safe: no-op when Supabase isn't configured.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { word_index, original_text, corrected_text } = body ?? {};

  // Minimal gate (mirrors worker training_export validation).
  if (
    typeof word_index !== "number" ||
    !corrected_text?.trim() ||
    corrected_text.trim() === (original_text ?? "").trim()
  ) {
    return NextResponse.json({ stored: false, reason: "invalid or no-op correction" }, { status: 400 });
  }

  const sb = getSupabaseAdmin();
  if (!sb) {
    // Stub mode — acknowledge without persisting so the UI flow works pre-keys.
    return NextResponse.json({ stored: false, stub: true });
  }

  const { error } = await sb.from("corrections").insert({
    transcript_id: body.transcript_id ?? null,
    word_index,
    original_text,
    corrected_text: corrected_text.trim(),
    audio_clip_path: body.audio_clip_path ?? null,
    start_s: body.start_s ?? null,
    end_s: body.end_s ?? null,
  });
  if (error) {
    return NextResponse.json({ stored: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ stored: true });
}

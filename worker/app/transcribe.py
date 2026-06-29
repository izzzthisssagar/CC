"""Groq Whisper transcription with word-level timestamps.

HARD RULE: word-level timestamps are mandatory (karaoke). HARD RULE: prime Whisper
with a Ninglish prompt to stop hallucination / forced English translation.
"""

import os
import tempfile

# Ninglish priming prompt — keep verbatim (see CLAUDE.md rule 3).
NINGLISH_PROMPT = "नमस्ते, यो video मा Nepali र English mixed language प्रयोग हुनेछ।"

# Mock data for stub mode — a short Ninglish line with fake word timings.
_STUB_WORDS = [
    {"word": "नमस्ते", "start": 0.00, "end": 0.45},
    {"word": "आज", "start": 0.45, "end": 0.80},
    {"word": "हामी", "start": 0.80, "end": 1.10},
    {"word": "video", "start": 1.10, "end": 1.55},
    {"word": "editing", "start": 1.55, "end": 2.10},
    {"word": "सिक्छौं", "start": 2.10, "end": 2.70},
]


def _extract_audio(video_url: str) -> str:
    """Extract 64kbps mono MP3 from video for STT. Returns temp file path."""
    import ffmpeg

    from .security import validate_source_url

    video_url = validate_source_url(video_url)  # SSRF / file-read guard
    out = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    (
        ffmpeg
        .input(video_url)
        .output(out, format="mp3", audio_bitrate="64k", ac=1)
        .overwrite_output()
        .run(quiet=True)
    )
    return out


def transcribe_audio(video_url: str, stub: bool = False) -> tuple[list[dict], str]:
    """Return (words, language). words = [{word, start, end}, ...]."""
    if stub:
        return _STUB_WORDS, "ne"

    from groq import Groq

    audio_path = _extract_audio(video_url)
    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    with open(audio_path, "rb") as f:
        res = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["word"],
            prompt=NINGLISH_PROMPT,
        )

    # Groq returns words as dicts (some lib versions as objects) — handle both.
    def field(w, k):
        return w[k] if isinstance(w, dict) else getattr(w, k)

    words = [
        {"word": field(w, "word"), "start": field(w, "start"), "end": field(w, "end")}
        for w in (res.words or [])
    ]
    language = getattr(res, "language", "ne")
    return words, language

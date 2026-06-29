"""A/B STT providers on a set of videos. Compares whatever providers have keys.

Usage:
    python -m scripts.ab_stt "/path/to/videos/*.mp4" [--language ne]

Runs Groq always (GROQ_API_KEY) and Gladia if GLADIA_API_KEY is set — prints
transcripts side by side so quality is directly comparable on real audio.
"""

import argparse
import glob
import os
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.stt import PROVIDERS, transcribe  # noqa: E402


def extract_audio(video: str) -> str:
    out = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    subprocess.run(["ffmpeg", "-y", "-i", video, "-ar", "16000", "-ac", "1", out],
                   capture_output=True)
    return out


def available() -> list[str]:
    provs = []
    if os.getenv("GROQ_API_KEY"):
        provs.append("groq")
    if os.getenv("GLADIA_API_KEY"):
        provs.append("gladia")
    return provs


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("pattern", help="glob of video files")
    p.add_argument("--language", default=None)
    args = p.parse_args(argv)

    provs = available()
    if not provs:
        print("No STT keys set (GROQ_API_KEY / GLADIA_API_KEY).", file=sys.stderr)
        return 2
    print(f"Providers: {', '.join(provs)}  (language={args.language or 'auto'})\n")

    for video in sorted(glob.glob(args.pattern)):
        print("=" * 70)
        print(Path(video).name)
        audio = extract_audio(video)
        for prov in provs:
            try:
                words, lang = transcribe(audio, provider=prov, language=args.language)
                text = " ".join(w["word"] for w in words)
                print(f"\n[{prov}] lang={lang} words={len(words)}")
                print(f"  {text[:280]}")
            except Exception as e:  # noqa: BLE001
                print(f"\n[{prov}] FAILED: {e}")
        os.remove(audio)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

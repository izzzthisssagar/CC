"""Seed the fine-tune dataset from a real local video + a corrected transcript.

The moat needs real (audio, correct-text) pairs. Base STT is too weak to trust, so
the human-corrected transcript is the ground truth. Two modes:

  # 1. bootstrap a starter transcript (rough STT segments) to correct by hand:
  python -m scripts.seed_dataset --video clip.mp4 --bootstrap > segments.json

  # 2. after correcting segments.json, generate clips + training JSONL:
  python -m scripts.seed_dataset --video clip.mp4 --segments segments.json --out datasets/seed

segments.json: [{"text": "correct Nepali text", "start": 0.0, "end": 5.2}, ...]
Local file is trusted (no SSRF guard — these are your own videos).
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path


def _extract_audio(video: str) -> str:
    out = tempfile.NamedTemporaryFile(suffix=".mp3", delete=False).name
    subprocess.run(["ffmpeg", "-y", "-i", video, "-ar", "16000", "-ac", "1", out],
                   capture_output=True, check=True)
    return out


def _cut(video: str, start: float, end: float, out_path: str) -> None:
    pad = 0.05
    ss = max(0.0, float(start) - pad)
    dur = max(0.1, float(end) - float(start) + 2 * pad)
    subprocess.run(
        ["ffmpeg", "-y", "-ss", str(ss), "-t", str(dur), "-i", video,
         "-ar", "16000", "-ac", "1", out_path],
        capture_output=True, check=True,
    )


def bootstrap(video: str) -> list[dict]:
    """Rough STT → segment starters (text intentionally rough; correct by hand)."""
    import os
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    from app.stt import transcribe

    audio = _extract_audio(video)
    words, _ = transcribe(audio, language="ne")
    os.remove(audio)
    # group words into ~6s segments for sentence-level correction
    segs, cur, t0 = [], [], None
    for w in words:
        if t0 is None:
            t0 = w["start"]
        cur.append(w["word"])
        if w["end"] - t0 >= 6.0:
            segs.append({"text": " ".join(cur), "start": t0, "end": w["end"]})
            cur, t0 = [], None
    if cur:
        segs.append({"text": " ".join(cur), "start": t0, "end": words[-1]["end"]})
    return segs


def seed(video: str, segments: list[dict], out_dir: str) -> tuple[int, str]:
    out = Path(out_dir)
    (out / "clips").mkdir(parents=True, exist_ok=True)
    jsonl = out / "train.jsonl"
    n = 0
    with jsonl.open("w", encoding="utf-8") as f:
        for i, s in enumerate(segments):
            text = (s.get("text") or "").strip()
            if not text:
                continue
            clip = out / "clips" / f"seg_{i:04d}.wav"
            _cut(video, s["start"], s["end"], str(clip))
            f.write(json.dumps({"audio": str(clip), "text": text}, ensure_ascii=False) + "\n")
            n += 1
    return n, str(jsonl)


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--video", required=True)
    p.add_argument("--bootstrap", action="store_true")
    p.add_argument("--segments")
    p.add_argument("--out", default="datasets/seed")
    args = p.parse_args(argv)

    if args.bootstrap:
        print(json.dumps(bootstrap(args.video), ensure_ascii=False, indent=2))
        return 0

    if not args.segments:
        print("provide --segments segments.json (or --bootstrap to make a starter)", file=sys.stderr)
        return 2
    segments = json.loads(Path(args.segments).read_text(encoding="utf-8"))
    n, path = seed(args.video, segments, args.out)
    print(f"seeded {n} (audio, text) pairs → {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

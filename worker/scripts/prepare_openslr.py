"""Turn an OpenSLR Nepali ASR set (SLR54 / SLR43) into the fine-tune JSONL.

OpenSLR ships audio (one file per utterance, named <FileID>.flac/.wav) plus a TSV
mapping `FileID <tab> UserID <tab> transcription`. Our training pipeline
(training/finetune_whisper.py) wants JSONL of {"audio": <path>, "text": <correct>}.
This joins the two: for every TSV row whose audio file is present under --audio-dir,
emit one record. Files referenced by the TSV but not extracted are skipped (so you can
download just a few of SLR54's 16 parts and still get a valid, consistent subset).

Usage:
    python -m scripts.prepare_openslr \
        --tsv datasets/openslr54/utt_spk_text.tsv \
        --audio-dir datasets/openslr54 \
        --out datasets/openslr54/train.jsonl
"""

import argparse
import json
import sys
from pathlib import Path

AUDIO_EXTS = (".flac", ".wav", ".mp3", ".m4a", ".ogg")


def index_audio(audio_dir: Path) -> dict[str, Path]:
    """Map FileID (stem) → audio path for every audio file under audio_dir."""
    idx: dict[str, Path] = {}
    for p in audio_dir.rglob("*"):
        if p.suffix.lower() in AUDIO_EXTS:
            idx[p.stem] = p
    return idx


def read_tsv(tsv: Path) -> list[tuple[str, str]]:
    """Return [(file_id, transcription), ...] from the OpenSLR TSV."""
    rows: list[tuple[str, str]] = []
    for line in tsv.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        file_id, _user, text = parts[0], parts[1], "\t".join(parts[2:]).strip()
        if text:
            rows.append((file_id, text))
    return rows


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="OpenSLR Nepali → fine-tune JSONL")
    p.add_argument("--tsv", required=True)
    p.add_argument("--audio-dir", required=True)
    p.add_argument("--out", required=True)
    args = p.parse_args(argv)

    audio = index_audio(Path(args.audio_dir))
    rows = read_tsv(Path(args.tsv))

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    matched = missing = 0
    with out.open("w", encoding="utf-8") as f:
        for file_id, text in rows:
            ap = audio.get(file_id)
            if ap is None:
                missing += 1
                continue
            f.write(json.dumps({"audio": str(ap.resolve()), "text": text}, ensure_ascii=False) + "\n")
            matched += 1

    print(f"audio files found  : {len(audio)}")
    print(f"tsv rows           : {len(rows)}")
    print(f"matched → JSONL    : {matched} → {out}")
    print(f"tsv rows w/o audio : {missing} (skipped — download more SLR54 parts to include)")
    if matched == 0:
        print("No matches — is the audio extracted under --audio-dir?", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

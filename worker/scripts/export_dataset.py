"""Export the correction loop into a Whisper fine-tune dataset (blueprint Phase 2).

Closes the moat loop end to end:
  1. pull corrections from Supabase (joined to their source video),
  2. extract each corrected word's audio segment from that video (app.clips),
  3. upload the clip to the private `clips` bucket → set audio_clip_path,
  4. run the validated transform (training_export) → versioned JSONL of {audio, text}.

Rejected rows are reported with reasons (never silently dropped). See docs/DATA.md.

Usage:
    python -m scripts.export_dataset [--out datasets/train.jsonl] [--no-clips]
Env: SUPABASE_URL, SUPABASE_SERVICE_KEY.
"""

import argparse
import json
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.training_export import corrections_to_jsonl  # noqa: E402


def _sb():
    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    return url, key


def fetch_corrections() -> list[dict]:
    import httpx

    url, key = _sb()
    # embed the source video's storage_path via transcript → video
    r = httpx.get(
        f"{url}/rest/v1/corrections",
        params={"select": "id,original_text,corrected_text,start_s,end_s,word_index,audio_clip_path,transcripts(videos(storage_path))"},
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def _video_url(row: dict) -> str | None:
    """Public URL of the source video for a correction row, if joinable."""
    url, _ = _sb()
    t = row.get("transcripts") or {}
    v = (t or {}).get("videos") or {}
    sp = v.get("storage_path")
    return f"{url}/storage/v1/object/public/videos/{sp}" if sp else None


def _upload_clip(local_path: str, key: str) -> str:
    import httpx

    url, skey = _sb()
    data = Path(local_path).read_bytes()
    r = httpx.post(
        f"{url}/storage/v1/object/clips/{key}",
        headers={"apikey": skey, "Authorization": f"Bearer {skey}", "content-type": "audio/wav", "x-upsert": "true"},
        content=data,
        timeout=60,
    )
    r.raise_for_status()
    return f"clips/{key}"


def isolate_clips(rows: list[dict]) -> int:
    """Extract + upload the audio clip for each correction missing one. Returns count made."""
    from app.clips import extract_segment

    made = 0
    for row in rows:
        if row.get("audio_clip_path"):
            continue
        if row.get("start_s") is None or row.get("end_s") is None:
            continue
        vurl = _video_url(row)
        if not vurl:
            continue
        try:
            local = extract_segment(vurl, row["start_s"], row["end_s"])
            path = _upload_clip(local, f"{row['id']}.wav")
            row["audio_clip_path"] = path  # enrich in-memory for the transform
            made += 1
        except Exception as e:  # noqa: BLE001
            print(f"  clip failed for {row['id']}: {e}", file=sys.stderr)
    return made


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Export corrections → Whisper fine-tune JSONL")
    p.add_argument("--out", default=None)
    p.add_argument("--no-clips", action="store_true", help="skip audio isolation (text only)")
    args = p.parse_args(argv)

    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_KEY"):
        print("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — cannot export.", file=sys.stderr)
        return 2

    corrections = fetch_corrections()
    made = 0 if args.no_clips else isolate_clips(corrections)
    records, rejected = corrections_to_jsonl(corrections)

    out = Path(args.out) if args.out else Path("datasets") / f"train_{len(records)}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"corrections pulled : {len(corrections)}")
    print(f"clips isolated     : {made}")
    print(f"training-ready     : {len(records)} → {out}")
    print(f"rejected           : {len(rejected)}")
    reasons: dict[str, int] = {}
    for rj in rejected:
        reasons[rj.reason] = reasons.get(rj.reason, 0) + 1
    for reason, n in sorted(reasons.items(), key=lambda kv: -kv[1]):
        print(f"  {n:4} × {reason}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"""Export the correction loop into a Whisper fine-tune dataset (blueprint Phase 2).

Pulls corrections from Supabase, runs the validated transform (training_export),
and writes a version-pinned JSONL of {audio, text} pairs. Rejected rows are reported
with reasons (never silently dropped).

Usage:
    python -m scripts.export_dataset            # writes datasets/train_<n>.jsonl
    python -m scripts.export_dataset --out X    # custom output path

Env: SUPABASE_URL, SUPABASE_SERVICE_KEY (service key bypasses RLS for the batch job).

NOTE: a correction is training-ready only once its word audio is isolated
(audio_clip_path set). Until the correction flow uploads per-word audio clips,
rows are reported as rejected ("missing audio_clip_path") — the pipeline is correct;
the input isn't populated yet. See docs/DATA.md.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# allow running as a script or module
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.training_export import corrections_to_jsonl  # noqa: E402


def fetch_corrections() -> list[dict]:
    import httpx

    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_KEY"]
    r = httpx.get(
        f"{url}/rest/v1/corrections",
        params={"select": "*"},
        headers={"apikey": key, "Authorization": f"Bearer {key}"},
        timeout=30,
    )
    r.raise_for_status()
    return r.json()


def main(argv: list[str] | None = None) -> int:
    p = argparse.ArgumentParser(description="Export corrections → Whisper fine-tune JSONL")
    p.add_argument("--out", default=None, help="output JSONL path")
    args = p.parse_args(argv)

    if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_SERVICE_KEY"):
        print("SUPABASE_URL / SUPABASE_SERVICE_KEY not set — cannot export.", file=sys.stderr)
        return 2

    corrections = fetch_corrections()
    records, rejected = corrections_to_jsonl(corrections)

    out = Path(args.out) if args.out else Path("datasets") / f"train_{len(records)}.jsonl"
    out.parent.mkdir(parents=True, exist_ok=True)
    with out.open("w", encoding="utf-8") as f:
        for rec in records:
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"corrections pulled : {len(corrections)}")
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

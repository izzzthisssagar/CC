"""Correction-loop → Whisper fine-tune dataset.

The data moat (blueprint Phase 2): every user caption correction is a labeled
(audio, text) pair. This module is the *validated transform* — corrections in,
clean Whisper-fine-tune JSONL out, with quality gates. It is pure (no DB/IO) so
it is testable now and wires to the `corrections` table later.

Batch, not streaming: corrections trickle in; fine-tuning runs periodically on an
accumulated, deduplicated, version-pinned snapshot. No Airflow/Spark — the volume
is tiny; a scheduled job (Supabase cron / GitHub Action) exporting JSONL is enough.
"""

from dataclasses import dataclass

# A correction must isolate at least this much audio to be useful for alignment.
MIN_CLIP_SECONDS = 0.20
# Below this the "correction" is likely noise/typo, not a real label.
MIN_TEXT_CHARS = 1


@dataclass
class Rejected:
    correction: dict
    reason: str


def validate_correction(c: dict) -> str | None:
    """Return None if the correction is training-worthy, else a reject reason."""
    corrected = (c.get("corrected_text") or "").strip()
    original = (c.get("original_text") or "").strip()

    if len(corrected) < MIN_TEXT_CHARS:
        return "empty corrected_text"
    if corrected == original:
        return "no-op correction (corrected == original)"
    if not c.get("audio_clip_path"):
        return "missing audio_clip_path"

    start, end = c.get("start_s"), c.get("end_s")
    if start is None or end is None:
        return "missing clip timing"
    if (end - start) < MIN_CLIP_SECONDS:
        return f"clip shorter than {MIN_CLIP_SECONDS}s"

    return None


def corrections_to_jsonl(corrections: list[dict]) -> tuple[list[dict], list[Rejected]]:
    """Transform validated corrections into Whisper fine-tune records.

    Output record: {"audio": <clip path>, "text": <correct text>}.
    Deduplicates on (audio_clip_path, corrected_text). Returns (records, rejected).
    """
    records: list[dict] = []
    rejected: list[Rejected] = []
    seen: set[tuple[str, str]] = set()

    for c in corrections:
        reason = validate_correction(c)
        if reason:
            rejected.append(Rejected(c, reason))
            continue

        key = (c["audio_clip_path"], c["corrected_text"].strip())
        if key in seen:
            rejected.append(Rejected(c, "duplicate (audio, text) pair"))
            continue
        seen.add(key)

        records.append({"audio": c["audio_clip_path"], "text": c["corrected_text"].strip()})

    return records, rejected

# Data — Correction Loop & Fine-tune Pipeline

The data moat. Every user caption correction becomes a labeled `(audio, text)` pair
that fine-tunes Whisper for Nepali/Ninglish. Incumbents can't copy this without your
correction dataset. Collection starts **Phase 2, month 2** — but the schema + transform
exist now so no data is lost.

## Architecture decision: batch, not streaming

Per the senior-data-engineer framework:

| Question | Answer |
|----------|--------|
| Real-time insight required? | No — fine-tuning is periodic, not live |
| Data volume | Tiny (corrections trickle; thousands, not TB) |
| → Verdict | **Batch.** No Kafka/Flink. No Airflow/Spark (overkill at this volume) |

Implementation: a scheduled job (Supabase cron or GitHub Action) reads accumulated
`corrections`, runs the validated transform, writes a version-pinned JSONL snapshot to
storage. Fine-tune consumes that snapshot. Reprocessing = re-run against the table.

## Data contract — `corrections` row

(table in `supabase/migrations/0001_init.sql`)

| Field | Rule |
|-------|------|
| `transcript_id` | FK, required |
| `word_index` | position in `transcripts.words[]` |
| `original_text` | what the model produced |
| `corrected_text` | what the user fixed it to — **the label** |
| `audio_clip_path` | Storage key for the isolated word audio — **required for training** |
| `start_s` / `end_s` | clip bounds; must span ≥ 0.20s |

## Quality gates (enforced in `worker/app/training_export.py`)

A correction becomes training data ONLY if it passes every gate:

1. `corrected_text` non-empty.
2. `corrected_text != original_text` (a no-op isn't a label).
3. `audio_clip_path` present.
4. clip timing present and ≥ `MIN_CLIP_SECONDS` (0.20s).
5. de-duplicated on `(audio_clip_path, corrected_text)`.

Rejected rows are returned with a reason (not silently dropped) for observability.
Output record: `{"audio": <clip>, "text": <correct text>}` — Whisper fine-tune JSONL.

## Lineage

```
user fixes word in editor
  → corrections row  (audio clip uploaded to Storage)
  → [batch job] corrections_to_jsonl()  ← quality gates
  → versioned train.jsonl snapshot in Storage
  → Whisper fine-tune run  (blueprint §7; WhisperX for ms alignment)
  → improved model → better captions → fewer corrections (flywheel)
```

## Built (Phase 2)

- **Export job** `worker/scripts/export_dataset.py` — pulls corrections from Supabase →
  `corrections_to_jsonl` → versioned `train_<n>.jsonl` of `{audio, text}` pairs; reports
  rejected rows with reasons. Verified live.

## Remaining feeder (the real prerequisite)

- **Per-word audio isolation.** A correction is training-ready only when `audio_clip_path`
  is set. Next step: at correction time, the worker extracts the word's audio segment
  (`start_s..end_s`) from the source video, uploads it to Storage, and stores the path.
  Until then the exporter correctly rejects audio-less corrections ("missing audio_clip_path").
- Scheduled cadence (Supabase cron / GH Action) + snapshot manifest.

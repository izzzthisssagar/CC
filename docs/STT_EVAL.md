# STT Evaluation — real Nepali audio

Method + findings from testing STT engines on real Nepali videos (3 clips: normal
speech, Ninglish gossip, speech over music/guitar). Transcripts themselves are not
reproduced here (personal footage, public repo) — only the methodology and verdict.

## Harness

`worker/scripts/ab_stt.py` — extracts 16kHz mono audio, runs each provider with a key,
prints transcripts side by side. Providers behind `worker/app/stt.py` (`STT_PROVIDER`).

```
python -m scripts.ab_stt '<videos>/*.mp4' --language ne
```

## Findings (2026-06-29, groq whisper-large-v3-turbo vs gladia v2)

| Content | Groq | Gladia |
|---------|------|--------|
| Conversational Nepali (clean) | many words, garbled | fewer words, cleaner, drops content |
| **Ninglish (code-switch)** | **good** | **good** (but a repetition-runaway glitch) |
| Speech over music | over-produces / hallucinates | conservative, misses content |

**Verdict:** neither engine is production-quality on casual/noisy Nepali. No clear winner —
Gladia hallucinates less on hard audio; Groq is more complete on Ninglish. The
**code-switching (Ninglish) case is the easiest for both**, which aligns with the
Ninglish/tech beachhead (see `MARKET.md`).

## Implications

1. The fine-tune moat (`DATA.md`) is not optional — base STT is the bottleneck, confirmed
   across language-forcing, audio-denoise, and a two-engine A/B (all tested).
2. Both engines stay selectable (`STT_PROVIDER`); default `groq` (generous free tier),
   `gladia` available for noisy content.
3. Earlier negative results (kept for honesty): forcing `language=ne` stops English-mode
   but not garble; ffmpeg denoise/normalize gave no improvement — not shipped.

## Next

Seed real training data (`scripts/seed_dataset.py`) from corrected transcripts → fine-tune
→ re-run this harness to measure WER improvement against the same 3 clips as a fixed benchmark.

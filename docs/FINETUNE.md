# Fine-tuning the Nepali Whisper model (Phase 4)

The payoff of the correction-loop moat: continue-train Whisper on your own
(audio, correct-text) pairs so it beats the base model on Nepali/Ninglish — the thing
no competitor can copy without your data. Base STT is weak on casual Nepali (proven in
`STT_EVAL.md`); this is how it gets better over time.

## The loop

```
user corrections ──► export_dataset.py ──► train.jsonl {audio, text}
                                              │
                                  finetune_whisper.py (GPU)
                                              ▼
                                     models/whisper-ne  ──► eval_wer.py (vs base)
                                              ▼
                                  serve behind the worker (new STT provider)
```

## 0. Bootstrap with public data (before you have corrections)

**What kind of data?** Whisper fine-tuning needs `(audio clip, correct transcript)` pairs —
short utterances (~1–15s) of Nepali speech, each with a verified Devanagari transcript, as
JSONL `{"audio": <path>, "text": <correct text>}`. The model resamples to 16 kHz mono on
load, so source sample rate doesn't matter.

Your own corrections are the moat, but the `corrections` table starts empty — so bootstrap
the base Nepali competence with **public Nepali ASR corpora**, then layer your corrections
on top:

| Dataset | Size | Format | License | Notes |
|---------|------|--------|---------|-------|
| **OpenSLR SLR54** (Large Nepali ASR, Google) | ~157k utts, 16 parts ×~580 MB (~9 GB) | wav + `utt_spk_text.tsv` | CC BY-SA 4.0 | **Primary.** Free, no login. Download a few parts to start. |
| OpenSLR SLR43 (Nepali multi-speaker) | smaller, cleaner | flac + index | CC BY-SA 4.0 | Good quality, fewer hours. |
| Google **FLEURS** `ne_np` (HF `google/fleurs`) | ~12 h | HF `datasets` | CC BY 4.0 | Cleanest; needs `pip install datasets`. |
| Mozilla **Common Voice** `ne-NP` | ~2 h, growing | HF (gated) | CC0 | Crowdsourced; accept terms on HF. |
| HF `amitpant7/nepali-speech-to-text` | ~3k clips, 949 MB | HF `datasets` | per-source | Pre-cleaned SLR43+CV blend. |

**None of these have Ninglish (Nepali-English code-switching)** — that's exactly the gap
only your correction loop fills. Use public data to fix base Nepali; use your corrections
to win Ninglish.

Prepare SLR54 into the training JSONL (download is curl-able, no ML deps):
```bash
cd worker/datasets/openslr54
curl -L -O https://www.openslr.org/resources/54/utt_spk_text.tsv
curl -L -O https://www.openslr.org/resources/54/asr_nepali_0.zip   # one ~580 MB part
unzip -q asr_nepali_0.zip
cd ../.. && python -m scripts.prepare_openslr \
    --tsv datasets/openslr54/utt_spk_text.tsv \
    --audio-dir datasets/openslr54 \
    --out datasets/openslr54/train.jsonl
```
`prepare_openslr.py` joins the TSV to whatever audio you actually extracted, so grabbing 1
part (~10k utts) or all 16 both yield a valid JSONL. Lives under the gitignored
`worker/datasets/`.

## 1. Build the dataset

Accumulate corrections (the editor's correction loop fills `corrections` with audio),
then:
```bash
cd worker && python -m scripts.export_dataset --out datasets/train.jsonl
```
Or seed from your own videos (correct the rough transcript first):
```bash
python -m scripts.seed_dataset --video clip.mp4 --bootstrap > seg.json   # then fix the text
python -m scripts.seed_dataset --video clip.mp4 --segments seg.json --out datasets/seed
```
**Hold out** a few clips into `datasets/test.jsonl` (never trained on) for honest eval.
Rule of thumb: hundreds of pairs minimum to move WER; thousands to win decisively.

## 2. Train (needs a CUDA GPU — NOT the worker/CI env)

Where to run (cheapest → most control):
- **Google Colab** (free T4 / Pro A100) — fastest start for `whisper-small`.
- **Modal** (`modal run`, A10G/A100, ~$1–3/hr, pay-per-use) — matches blueprint stack.
- **Hetzner GPU VPS** — own the box; blueprint's Phase-2+ self-host target.

```bash
pip install -r worker/training/requirements-train.txt
python worker/training/finetune_whisper.py \
    --dataset datasets/train.jsonl \
    --base openai/whisper-small \        # small first; large-v3 once data is plentiful
    --out models/whisper-ne --epochs 5 --language nepali
```
Start with `whisper-small` (cheap, fast iteration); graduate to `large-v3` when the
dataset is big enough to justify the compute.

## 3. Eval — did it actually beat the base?

```bash
python worker/training/eval_wer.py --test datasets/test.jsonl \
    --models openai/whisper-small models/whisper-ne
```
Lower WER = better. If the fine-tune doesn't beat the base, you need more/cleaner data —
don't ship it. Re-run against the same held-out clips each round to track progress.

## 4. Serve it

Add a provider to `worker/app/stt.py` (e.g. `finetuned`) that loads `models/whisper-ne`
via a transformers ASR pipeline, and set `STT_PROVIDER=finetuned`. Run this on the GPU
box (transformers+torch is too heavy for the lean FastAPI worker container) — the worker
calls it as a remote STT endpoint, same interface as Groq/Gladia. WhisperX can be layered
for millisecond word alignment (blueprint §7).

## Cadence

Re-train when you've collected a meaningful batch of new corrections (e.g. monthly, or
every N hundred pairs). Each cycle: export → train → eval vs base → promote if WER drops.
This is the flywheel: more users → more corrections → better Nepali model → fewer
corrections needed → moat widens.

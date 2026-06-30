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

### Easiest + free: the turnkey notebook
`worker/training/colab_finetune_nepali.ipynb` runs the whole thing on a **free Colab/Kaggle
T4** — it downloads OpenSLR SLR54, builds the dataset, fine-tunes `whisper-small`, and prints
WER (base vs fine-tuned). Self-contained: no repo, no keys.

1. Open https://colab.research.google.com → **File → Upload notebook** → pick the `.ipynb`.
   (Kaggle: **+ New Notebook → File → Import** the `.ipynb`.)
2. **Runtime → Change runtime type → T4 GPU** (Kaggle: Accelerator → GPU T4).
3. **Runtime → Run all.** Tune `N_TRAIN` / `PARTS` / `EPOCHS` in the config cell.
4. Last cell zips/downloads the model (or push to the free HF Hub).

A first pass (`N_TRAIN=3000`, 3 epochs) ≈ 1–2 h on a free T4 and should already beat base
Whisper on Nepali. The free tier disconnects on idle/after ~12 h — keep the tab active and
start small; scale up once you see WER drop.

### Other options (cheapest → most control)
- **Google Colab Pro** (A100) — same notebook, faster / bigger models.
- **Modal** (`modal run`, A10G/A100, ~$1–3/hr, pay-per-use) — matches blueprint stack.
- **Hetzner GPU VPS** — own the box; blueprint's Phase-2+ self-host target.

### Or the plain script (any CUDA box)

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

## 4. Serve it — WIRED

The `finetuned` provider is built (`worker/app/stt.py::finetuned_transcribe`): it loads the
model from `FINETUNE_MODEL_DIR` (default `worker/models/whisper-ne`) via a transformers ASR
pipeline with `return_timestamps="word"`, same `(words, language)` interface as Groq/Gladia.
To run it:
```bash
pip install -r worker/training/requirements-train.txt   # torch+transformers (heavy)
export FINETUNE_MODEL_DIR=worker/models/whisper-ne       # the trained model dir
export STT_PROVIDER=finetuned
# or pick per-request: POST /transcribe { "provider": "finetuned" }
```
Run this on a **GPU box** — torch/transformers is too heavy for the lean FastAPI worker
image, so the base `requirements.txt` stays torch-free and the import is lazy. The model
binary lives in the gitignored `worker/models/` (serve it from the HF Hub or object storage
in prod, not git). WhisperX can be layered for millisecond word alignment (blueprint §7).

## Cadence

Re-train when you've collected a meaningful batch of new corrections (e.g. monthly, or
every N hundred pairs). Each cycle: export → train → eval vs base → promote if WER drops.
This is the flywheel: more users → more corrections → better Nepali model → fewer
corrections needed → moat widens.

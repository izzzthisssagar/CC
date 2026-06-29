"""Measure the moat: WER of base vs fine-tuned Whisper on a held-out test set.

Test set is JSONL {"audio": "<path>", "text": "<ground truth>"} — use clips the model
did NOT train on (e.g. one of your videos held out). Reports WER per model so you can
see the fine-tune actually beat the base.

⚠️ GPU-gated (needs training deps + the models). See docs/FINETUNE.md.

Usage:
    python training/eval_wer.py --test datasets/test.jsonl \
        --models openai/whisper-small models/whisper-ne
"""

import argparse
import json
from pathlib import Path


def load_jsonl(path: str) -> list[dict]:
    return [json.loads(l) for l in Path(path).read_text(encoding="utf-8").splitlines() if l.strip()]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--test", required=True)
    p.add_argument("--models", nargs="+", required=True, help="checkpoints to compare")
    p.add_argument("--language", default="nepali")
    args = p.parse_args()

    import torch
    from jiwer import wer
    from transformers import pipeline

    rows = load_jsonl(args.test)
    refs = [r["text"] for r in rows]
    audios = [r["audio"] for r in rows]
    device = 0 if torch.cuda.is_available() else -1

    print(f"Test set: {len(rows)} clips · language={args.language}\n")
    for model in args.models:
        asr = pipeline("automatic-speech-recognition", model=model, device=device,
                       generate_kwargs={"language": args.language, "task": "transcribe"})
        hyps = [asr(a)["text"] for a in audios]
        score = wer(refs, hyps)
        print(f"  {model:40} WER = {score:.3f}")
    print("\nLower WER = better. Fine-tuned should beat the base on Nepali.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

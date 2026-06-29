"""Fine-tune Whisper on the Nepali correction dataset (blueprint Phase 4).

The moat's payoff: continue-training Whisper on YOUR (audio, correct-text) pairs so it
beats the base model on Nepali/Ninglish. Input is the JSONL produced by
scripts/export_dataset.py / seed_dataset.py: {"audio": "<path|url>", "text": "<correct>"}.

⚠️ GPU-gated. Needs `pip install -r training/requirements-train.txt` + a CUDA GPU.
Not run in CI / the worker container. See docs/FINETUNE.md for the runbook.

Usage:
    python training/finetune_whisper.py \
        --dataset datasets/train.jsonl \
        --base openai/whisper-small \
        --out models/whisper-ne \
        --epochs 5
"""

import argparse
import json
from pathlib import Path


def load_jsonl(path: str) -> list[dict]:
    return [json.loads(l) for l in Path(path).read_text(encoding="utf-8").splitlines() if l.strip()]


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dataset", required=True, help="JSONL of {audio, text}")
    p.add_argument("--base", default="openai/whisper-small", help="base checkpoint")
    p.add_argument("--out", default="models/whisper-ne")
    p.add_argument("--epochs", type=int, default=5)
    p.add_argument("--lr", type=float, default=1e-5)
    p.add_argument("--batch", type=int, default=8)
    p.add_argument("--language", default="nepali")
    args = p.parse_args()

    # Heavy imports inside main so --help works without the train deps installed.
    import torch
    from dataclasses import dataclass
    from datasets import Audio, Dataset
    from transformers import (
        WhisperProcessor,
        WhisperForConditionalGeneration,
        Seq2SeqTrainer,
        Seq2SeqTrainingArguments,
    )

    rows = load_jsonl(args.dataset)
    if len(rows) < 8:
        print(f"WARNING: only {len(rows)} examples — fine-tuning needs hundreds+ to help.")

    processor = WhisperProcessor.from_pretrained(args.base, language=args.language, task="transcribe")
    ds = Dataset.from_list(rows).cast_column("audio", Audio(sampling_rate=16000))

    def prepare(batch):
        audio = batch["audio"]
        batch["input_features"] = processor.feature_extractor(
            audio["array"], sampling_rate=16000
        ).input_features[0]
        batch["labels"] = processor.tokenizer(batch["text"]).input_ids
        return batch

    ds = ds.map(prepare, remove_columns=ds.column_names)

    @dataclass
    class Collator:
        proc: object

        def __call__(self, features):
            inp = [{"input_features": f["input_features"]} for f in features]
            batch = self.proc.feature_extractor.pad(inp, return_tensors="pt")
            labels = self.proc.tokenizer.pad(
                [{"input_ids": f["labels"]} for f in features], return_tensors="pt"
            )
            lab = labels["input_ids"].masked_fill(labels.attention_mask.ne(1), -100)
            batch["labels"] = lab
            return batch

    model = WhisperForConditionalGeneration.from_pretrained(args.base)
    model.generation_config.language = args.language
    model.generation_config.task = "transcribe"
    model.config.use_cache = False  # required alongside gradient_checkpointing below

    targs = Seq2SeqTrainingArguments(
        output_dir=args.out,
        per_device_train_batch_size=args.batch,
        learning_rate=args.lr,
        num_train_epochs=args.epochs,
        fp16=torch.cuda.is_available(),
        gradient_checkpointing=True,
        predict_with_generate=True,
        logging_steps=10,
        save_strategy="epoch",
        report_to=[],
    )
    trainer = Seq2SeqTrainer(
        model=model,
        args=targs,
        train_dataset=ds,
        data_collator=Collator(processor),
        tokenizer=processor.feature_extractor,
    )
    trainer.train()
    trainer.save_model(args.out)
    processor.save_pretrained(args.out)
    print(f"fine-tuned model saved → {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

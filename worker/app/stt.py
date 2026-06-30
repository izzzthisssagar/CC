"""Pluggable STT providers. Groq (default) + Gladia (blueprint's Ninglish fallback).

Real-Nepali testing showed base Groq Whisper is weak; this lets us swap/compare
engines by config (STT_PROVIDER env or per-request) instead of rewriting callers.
Every provider returns the same shape: (words[{word,start,end}], language).
"""

import os

NINGLISH_PROMPT = "नमस्ते, यो video मा Nepali र English mixed language प्रयोग हुनेछ।"


def _field(w, k):
    return w[k] if isinstance(w, dict) else getattr(w, k)


def groq_transcribe(audio_path: str, language: str | None = None) -> tuple[list[dict], str]:
    from groq import Groq

    client = Groq(api_key=os.environ["GROQ_API_KEY"])
    kwargs = {"language": language} if language else {}
    with open(audio_path, "rb") as f:
        res = client.audio.transcriptions.create(
            file=f,
            model="whisper-large-v3-turbo",
            response_format="verbose_json",
            timestamp_granularities=["word"],
            prompt=NINGLISH_PROMPT,
            **kwargs,
        )
    words = [
        {"word": _field(w, "word"), "start": _field(w, "start"), "end": _field(w, "end")}
        for w in (res.words or [])
    ]
    return words, getattr(res, "language", "ne")


def gladia_transcribe(audio_path: str, language: str | None = None) -> tuple[list[dict], str]:
    """Gladia v2 pre-recorded flow: upload → request → poll result.

    UNVERIFIED against the live API until GLADIA_API_KEY is provided — schema follows
    Gladia v2 docs; confirm field paths on first real run.
    """
    import time

    import httpx

    key = os.environ["GLADIA_API_KEY"]
    h = {"x-gladia-key": key}

    with open(audio_path, "rb") as f:
        up = httpx.post(
            "https://api.gladia.io/v2/upload",
            headers=h,
            files={"audio": (os.path.basename(audio_path), f, "audio/mpeg")},
            timeout=120,
        )
    up.raise_for_status()
    audio_url = up.json()["audio_url"]

    cfg = {"audio_url": audio_url}
    if language:
        cfg["language_config"] = {"languages": [language], "code_switching": False}
    else:
        cfg["language_config"] = {"code_switching": True}  # Ninglish

    req = httpx.post("https://api.gladia.io/v2/pre-recorded", headers=h, json=cfg, timeout=60)
    req.raise_for_status()
    result_url = req.json()["result_url"]

    for _ in range(120):  # poll up to ~2 min
        r = httpx.get(result_url, headers=h, timeout=30).json()
        if r.get("status") == "done":
            utt = r["result"]["transcription"].get("utterances", [])
            words: list[dict] = []
            for u in utt:
                for w in u.get("words", []):
                    words.append({"word": w["word"], "start": w["start"], "end": w["end"]})
            lang = r["result"]["transcription"].get("languages", ["ne"])
            return words, (lang[0] if lang else "ne")
        if r.get("status") == "error":
            raise RuntimeError(f"gladia error: {r.get('error')}")
        time.sleep(1)
    raise TimeoutError("gladia transcription timed out")


def finetuned_transcribe(audio_path: str, language: str | None = None) -> tuple[list[dict], str]:
    """The moat: our fine-tuned Nepali Whisper (see docs/FINETUNE.md).

    HEAVY — lazy-imports transformers+torch (NOT in the base worker reqs; install
    training/requirements-train.txt) and loads the model from FINETUNE_MODEL_DIR
    (default worker/models/whisper-ne). Run on a GPU box with STT_PROVIDER=finetuned;
    the lean FastAPI image stays torch-free.
    """
    from transformers import pipeline  # lazy: torch/transformers are training-only deps

    model_dir = os.getenv("FINETUNE_MODEL_DIR", "models/whisper-ne")
    lang = language or "nepali"
    asr = pipeline(
        "automatic-speech-recognition",
        model=model_dir,
        return_timestamps="word",  # word-level ts — HARD RULE for karaoke
        generate_kwargs={"language": lang, "task": "transcribe"},
    )
    out = asr(audio_path)
    words: list[dict] = []
    for c in out.get("chunks", []):
        ts = c.get("timestamp") or (None, None)
        if ts[0] is None or ts[1] is None:
            continue  # drop unaligned tokens rather than emit bad timing
        words.append({"word": (c.get("text") or "").strip(), "start": ts[0], "end": ts[1]})
    return words, "ne" if lang == "nepali" else lang


PROVIDERS = {
    "groq": groq_transcribe,
    "gladia": gladia_transcribe,
    "finetuned": finetuned_transcribe,
}


def transcribe(audio_path: str, provider: str | None = None, language: str | None = None):
    name = provider or os.getenv("STT_PROVIDER", "groq")
    fn = PROVIDERS.get(name)
    if fn is None:
        raise ValueError(f"unknown STT provider: {name}")
    return fn(audio_path, language=language)

# Worker — FastAPI (transcribe + burn-in)

Python service. `/transcribe` calls Groq Whisper (word-level timestamps, Ninglish-primed);
`/export` builds an `.ass` with pysubs2 and burns captions into MP4 via FFmpeg + libass.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload        # http://localhost:8000
# GET  /health
# POST /transcribe  { "video_url": "..." }
# POST /export      { "video_url": "...", "words": [...], "style": {...} }
```

No `GROQ_API_KEY` → **stub mode**: `/transcribe` returns a mock Ninglish line, `/export`
returns placeholder URLs. Set the key in env / `.env` to go live.

## Docker (FFmpeg + libass + fonts baked in)

```bash
docker build -t boldaboldai-worker -f worker/Dockerfile .   # build from repo root (needs fonts/)
docker run -p 8000:8000 -e GROQ_API_KEY=$GROQ_API_KEY boldaboldai-worker
```

## Files

| File | Role |
|------|------|
| `app/main.py` | FastAPI app + routes |
| `app/transcribe.py` | audio extract + Groq call (rule: word ts + Ninglish prompt) |
| `app/export.py` | pysubs2 `.ass` + FFmpeg burn-in (rule: Devanagari via libass) |
| `app/schemas.py` | request/response + Style model |

## Rules enforced here

- `timestamp_granularities=['word']` — never segment-only.
- Devanagari burned only through `.ass` + `subtitles` filter — never `drawtext`.
- Groq always primed with the Ninglish prompt (`transcribe.py:NINGLISH_PROMPT`).

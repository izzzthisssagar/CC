# Nepali AI Caption App

Nepali-first AI auto-captioning web app — upload a video, get karaoke-style word-level
captions with deep Devanagari / Roman Nepali / **Ninglish** support, export burned-in MP4 +
SRT/VTT. Built for Nepali creators; a Nepali-native answer to kalakar.io.

> **Status: scaffold only.** No live keys yet — services run in stub/mock mode. See
> [`CLAUDE.md`](./CLAUDE.md) for full project context and the three hard rules.

## Repo layout

| Path | What |
|------|------|
| `web/` | Next.js 14 (App Router) + Tailwind — frontend + API routes |
| `worker/` | FastAPI — `/transcribe` (Groq Whisper), `/export` (pysubs2 + FFmpeg burn-in) |
| `supabase/` | DB migrations (Postgres + pgvector) |
| `docs/` | `BLUEPRINT.md` (decisions), `ARCHITECTURE.md` (MVP data flow) |
| `fonts/` | Devanagari font drop-in — see `fonts/README.md` |

## Quick start (later, once you have keys)

```bash
cp .env.example .env        # fill GROQ_API_KEY + Supabase keys

# Worker (Python + FFmpeg)
cd worker
pip install -r requirements.txt
uvicorn app.main:app --reload      # http://localhost:8000

# Web (Next.js)
cd ../web
npm install
npm run dev                        # http://localhost:3000
```

Without keys, `/transcribe` and `/export` return mock data so the UI still runs end to end.

## Stack (MVP)

Next.js 14 · Tailwind · Groq Whisper large-v3-turbo · FastAPI + FFmpeg/libass · Supabase
(Postgres + Auth + pgvector + Storage). Full SaaS stack (Modal, Inngest, R2, Cloudinary)
is documented in `docs/BLUEPRINT.md` for the scale-up phase.

## Roadmap

- **Phase 1 (mo 1–3):** core captioning MVP — this scaffold.
- **Phase 2 (mo 3–6):** style memory + correction loop (AI training data).
- **Phase 3 (mo 6–9):** video chatbot (RAG) + first Whisper fine-tune.
- **Phase 4 (mo 9–12):** self-improving Nepali model.

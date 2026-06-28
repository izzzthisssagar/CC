# Web — Next.js 14 (App Router)

Frontend + API routes. Pages: `/` (landing), `/upload` (dropzone), `/editor/[id]`
(caption preview + style picker + export). API routes proxy to the Python worker.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
```

Needs the worker running (`WORKER_URL`, default `http://localhost:8000`) for live
transcribe/export. Without Supabase keys the app uses mock transcript data.

## Map

| Path | Role |
|------|------|
| `app/page.tsx` | landing |
| `app/upload/page.tsx` | upload (stub → editor) |
| `app/editor/[id]/page.tsx` | preview + style + export |
| `app/api/transcribe/route.ts` | proxy → worker `/transcribe` |
| `app/api/export/route.ts` | proxy → worker `/export` |
| `components/CaptionPreview.tsx` | per-word Devanagari/Latin font switch |
| `components/StylePicker.tsx` | template picker + export button |
| `lib/supabase.ts` | Supabase client (null in stub mode) |
| `lib/worker.ts` | worker fetch client |

Per-word font rule: `/[ऀ-ॿ]/.test(word)` → `font-deva` (Matangi) else Latin.

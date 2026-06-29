# Deploy — Vercel (web) + optional worker

## Architecture

- **Web (Next.js) → Vercel.** Transcribe + chat run as Vercel serverless functions
  (Groq accepts MP4 directly — no ffmpeg). Auth, upload, library, edit, karaoke,
  style, SRT all work.
- **Burn-in export → needs the FFmpeg worker** (Render/Railway/Modal). Optional;
  everything else works without it. Set `WORKER_URL` to enable.

## Web on Vercel (deploy `web/` as the project root)

One interactive step from you, then I drive the rest:
```
! npx vercel login        # pick GitHub/email; authenticates the CLI
```
Then I run (from `web/`): `vercel link --yes` → set env → `vercel --prod`.

### Environment variables (set on the Vercel project)
| Var | Value |
|-----|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://kmirfauultyowkegguqu.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the `sb_publishable_…` key |
| `SUPABASE_SERVICE_KEY` | the `sb_secret_…` key |
| `GROQ_API_KEY` | your Groq key (use a fresh one) |
| `GLADIA_API_KEY` | optional |
| `WORKER_URL` | optional — only if you deploy the worker |

### After deploy — Supabase config
1. **Auth → URL Configuration**: add your Vercel URL to Site URL + Redirect URLs.
2. **Auth → Providers → Email**: turn **Confirm email OFF** for instant signups (MVP),
   or keep it on and confirm via email.

## Worker (optional — for burned-in MP4 export)

The worker is a Docker FastAPI (`worker/Dockerfile`, ffmpeg+libass baked in). Deploy to
any container host, then set `WORKER_URL` on Vercel.

- **Render**: New → Web Service → connect repo → Root `worker`, Docker → add `GROQ_API_KEY`,
  `ALLOWED_SOURCE_HOSTS=kmirfauultyowkegguqu.supabase.co`, `STT_PROVIDER`.
- **Railway / Fly**: same Dockerfile.
- **Modal**: blueprint's choice; wrap `app.main:app` in a Modal ASGI app.

Build context = repo root: `docker build -f worker/Dockerfile -t worker .`

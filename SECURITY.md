# Security Policy

## Reporting a vulnerability

Email **izzzthisssagar@gmail.com** with details and reproduction steps. Do not open
a public issue for security reports. Expect an acknowledgement within 72 hours.

## Scope & status

This is an early scaffold. Many controls below are **planned for Phase 1** (auth) and
are intentionally not yet implemented — they are tracked here so they are not forgotten.

## Known issues / hardening backlog

| Item | Status | Where |
|------|--------|-------|
| **SSRF / local-file-read on `video_url`** | **Mitigated** | `worker/app/security.py` — `validate_source_url` blocks non-https, private/link-local IPs (incl. `169.254.169.254` metadata), and enforces `ALLOWED_SOURCE_HOSTS`. Set that env var to your Supabase Storage host in prod. |
| Worker CORS `allow_origins=["*"]` | Dev only | `worker/app/main.py` — tighten to the web origin before prod. |
| Dependency CVE scan | Active | Lockfile committed; Dependabot configured (`.github/dependabot.yml`). |
| Next.js version | **Patched** | Migrated **14.2.35 → Next 15.5.19 / React 19** (Phase 4) — clears the Next 14.x DoS advisories that gated on a Next 15 fix range. The async-request-API change touched only `editor/[id]/page.tsx` (`params`/`searchParams` now awaited). Remaining `npm audit` moderates are dev/build-time transitive deps (jest-snapshot, nested postcss), not runtime Next CVEs. |

## Controls mapped to Phase 1 (Supabase Auth)

SOC2-style controls flagged by the security scan are satisfied by the planned auth layer:

| Control | How it will be met |
|---------|--------------------|
| Access control / RBAC (CC6.1) | Supabase **Row-Level Security** policies (migration adds RLS-enabled tables already). |
| Strong auth / MFA + hashing (CC6.2) | Supabase Auth (bcrypt-equivalent hashing, OAuth, MFA). No passwords handled in app code. |
| Audit logging (CC7.1) | Structured logging of auth/access/export events; Supabase auth logs. |
| Automated scanning (CC3.1) | CI runs secret scan + Dependabot (see `.github/workflows/`). |

## Secrets

- Only `.env.example` is committed; real `.env` is git-ignored.
- Never commit `GROQ_API_KEY`, `SUPABASE_SERVICE_KEY`, or any token.
- Secret scan runs in CI on every PR.

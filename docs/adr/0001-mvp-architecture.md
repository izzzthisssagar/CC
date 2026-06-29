# ADR 0001 — MVP architecture

**Status:** Accepted · **Date:** 2026-06-29

## Context

Solo dev, pre-launch, zero traffic, micro-SaaS scale (SOM ~$116k/yr — see `MARKET.md`).
Blueprint specced a full SaaS stack (Modal, Inngest, R2, Cloudinary). Need the smallest
stack that ships a real captioning MVP with the Nepali-specific invariants intact.

## Decisions

1. **Modular monolith, not microservices.** Two deployables (Next.js `web`, FastAPI
   `worker`). Team of 1 → MonolithFirst (Newman). Coupling measured 0/100.
2. **Simplified stack:** Supabase (Postgres+Auth+Storage+pgvector) + Groq. Cut Modal,
   Inngest, R2, Cloudinary → 1 account + 1 key vs 5+ services. Documented scale-up swaps.
3. **Async job pattern, not sync.** Transcription + burn-in run seconds-to-minutes; they
   run in background (`POST → 202 → /jobs/{id}` poll), never on the request path. MVP uses
   an in-memory job store; production swaps to the `jobs` Postgres table.
4. **Stub mode by default.** Every external dep degrades to mock when its key is absent —
   the app runs + tests offline; keys flip it live.
5. **Three non-negotiable invariants** (enforced by `.claude/agents/caption-invariant-reviewer`):
   word-level timestamps; Devanagari via `.ass`+libass not `drawtext`; Groq Ninglish prompt.

## Trade-offs accepted

- In-memory jobs don't survive worker restart (fine pre-scale; table swap ready).
- Permissive storage RLS + no auth yet (Phase 1).
- Next 14.2.x (DoS advisories) over a Next 15 migration mid-MVP — deferred to pre-launch.

## Revisit when

Any module needs independent scaling, a second engineer needs independent deploy, or
traffic exceeds a single worker — then extract the worker to Modal + add Inngest + R2.

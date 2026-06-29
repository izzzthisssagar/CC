# Future-State Journey Map — captioning WITH the product

> Companion to `PERSONA.md` (current-state, "captioning TODAY"). This maps the journey
> **through the app as built** (landing → upload → refine → style → export → ask → return).
> Persona: **Sandesh**, the Ninglish/tech creator (beachhead). Goal: caption + post one
> short-form clip. Timeframe: minutes, in one sitting.
>
> ⚠️ Emotions/pains are **`[ASSUMPTION]`** until the usability study (`USABILITY-TEST-PLAN.md`)
> runs. Actions/touchpoints are **`[FACT]`** — read from the implemented flow.

## Stages

| # | Stage | Action `[FACT]` | Touchpoint | Emotion 1–5 `[ASSUMPTION]` | Pain `[ASSUMPTION]` | Opportunity |
|---|-------|-----------------|------------|:--:|---------------------|-------------|
| 1 | **Land** | Reads hero, watches the karaoke demo loop | `/` | 4 curious | "Does it *actually* do Nepali, or is this another tool that mangles it?" | Live Devanagari karaoke demo + editorial type = proof in 5s (the redesign's whole job) |
| 2 | **Sign in** | Creates account (email/pw) | `/login` | 3 friction | Yet another signup before seeing value | Let them reach the editor on a demo clip pre-auth; defer the wall |
| 3 | **Upload** | Drops an MP4/MOV | `/upload` | 4 hopeful | File size / format / "how long?" | Clear format hints + progress; the dropzone states this |
| 4 | **Transcribe** | Waits for word-level STT | (auto) | 3 anxious | **Off-the-shelf STT is weak on casual Nepali** (proven in `STT_EVAL.md`) | Engine + language toggle; set expectations ("draft — you'll fix a few") |
| 5 | **Refine** ⭐ | Fixes wrong words inline; karaoke preview spots errors | `/editor` | **1–4 — the make-or-break** | **Many errors → tedious hand-fixing — the EXACT pain from the current-state map's Fix stage** | Per-word inputs + correction loop; the fine-tune (`FINETUNE.md`) shrinks this over time → retention flywheel |
| 6 | **Style** | Picks a template; last style remembered | `/editor` (StylePicker) | 4 creative | "Will the Nepali font look good burned in?" | WYSIWYG-ish preview + style memory (`last_style`); Matangi parity note |
| 7 | **Export** | Burns in → downloads MP4 + SRT | `/api/export` | 4 satisfied | Re-encode wait; stub URLs without keys | Fast libass burn-in; deliver MP4 **and** SRT |
| 8 | **Ask** | Asks about the video / across all videos | `/editor` (ChatPanel) | 5 delighted | Didn't expect it — discoverability risk | Cross-video RAG toggle = repurposing/superpower moment; surface it |
| 9 | **Return** | Re-opens library, captions the next clip | `/library` | 4 loyal *if* step 5 felt fast | If corrections stayed high, churn | Self-improving loop: more use → better model → fewer corrections → stickier |

## The pivotal stage

**Stage 5 (Refine) is the make-or-break**, and it's the same stage the current-state map
flags as the core pain (`Fix`, emotion 1). The product's bet: move that emotion from **1 → 4**
by (a) better STT so there's less to fix, and (b) friction-free inline correction. The
redesign improves (b)'s legibility; the fine-tune is the lever on (a).

## Opportunity priorities — `freq × severity × solvability`

| Opportunity | F | S | Solv | Score | Owner |
|-------------|:-:|:-:|:----:|:-----:|-------|
| Cut correction burden at **Refine** (better Nepali STT) | 5 | 5 | 3 | **75** | fine-tune (`FINETUNE.md`) — in flight |
| Make per-word correction *feel* fast (Refine UX) | 5 | 4 | 4 | **80** | editor UX — partly shipped (inline inputs) |
| Defer the auth wall (let value precede signup) | 4 | 3 | 4 | **48** | onboarding — not built |
| Surface cross-video chat so it's discovered | 3 | 3 | 5 | **45** | editor UX — toggle shipped, needs a nudge |
| Set STT expectations before the "anxious" wait | 4 | 3 | 5 | **60** | copy/microcopy — cheap |

**Read:** the two highest scores both live at **Refine** — confirming the product thesis.
None of this is validated emotion yet → run the study before investing in 4/5/8 UX.

## What would invalidate this map
- Creators abandon at **Transcribe** because the first draft is *too* wrong to bother fixing
  (STT below a usability floor) — then the fine-tune is a prerequisite, not an enhancement.
- The auth wall (stage 2) loses them before they ever feel the value.
- Refine stays tedious even with good STT (input ergonomics) — measured by time-on-task in the study.

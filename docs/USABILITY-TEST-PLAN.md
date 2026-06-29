# Usability Test Plan — validate the redesign + core flow

> Purpose: turn the `[ASSUMPTION]` emotions in `UX-JOURNEY-FUTURE.md` and the proto-persona
> in `PERSONA.md` into evidence — and check the **Editorial Devanagari redesign** actually
> communicates "Nepali-first" and doesn't slow the core task. This is the validation the
> proto-persona doc says must run before more building.

## Research questions (testable)

| # | Vague goal | Testable question | Metric |
|---|-----------|-------------------|--------|
| RQ1 | "Does the landing land?" | Within 5s of the landing, can a creator say *what it does* and *that it's Nepali-first*? | 5-second test recall |
| RQ2 | "Is the core flow usable?" | Can a creator upload → correct → export a captioned clip **unaided in < 6 min**? | completion %, time-on-task |
| RQ3 | "Is the moat's UX fast enough?" | Correcting ~8 wrong words — does it feel *faster than CapCut hand-fixing*? | time/word, SEQ, verbatim compare |
| RQ4 | "Does it read as *made for Nepali*?" | Does the Devanagari/editorial style register as crafted-for-Nepali, not generic AI? | desirability (reaction cards), preference vs old dark UI |
| RQ5 | "Are the new features found?" | Do users discover the **style memory** and **cross-video chat** without prompting? | unprompted-discovery % |

## Method

| Track | Method | n | Length | Answers |
|-------|--------|---|--------|---------|
| A | Moderated remote, think-aloud (Zoom + screen share) | 6–8 | 45–60 min | RQ2, RQ3, RQ5 |
| B | Unmoderated 5-second test (landing screenshot) | 12–20 | 2 min | RQ1 |
| C | Desirability — reaction-card pick (new vs old screenshot) | same as B | +2 min | RQ4 |

5–8 moderated is the standard sweet spot (catches ~85% of issues at n=6). Recruit from the
**beachhead**, not "anyone".

## Recruitment screener (qualify for "Sandesh")
Include only if **all**: (1) 18–32; (2) posts short-form **weekly+** to TikTok/Insta/YT;
(3) content is **Nepali or Ninglish** (not English-only); (4) edits in CapCut/InShot/Premiere;
(5) has hand-fixed Nepali captions before. Mix Kathmandu/Pokhara + diaspora. Exclude pro
video editors (not the segment) and pure-English creators.

## Tasks — realistic scenarios, not instructions
Progression: warm-up → core → secondary → edge → free.

1. **Warm-up** — "You just landed here from a friend's link. Talk me through what you think this does and who it's for." *(RQ1 live)*
2. **Core** — "You filmed a 30-sec Ninglish reel. Get captions on it and download a version ready to post." *(RQ2 — upload → editor → export; success = they reach a downloadable MP4)*
3. **The moat** — "A few words came out wrong. Fix them so the captions match what you said." *(RQ3 — observe per-word editing; time it)*
4. **Secondary** — "Make the caption style match your channel's look." *(StylePicker — note if they notice 'remembered')*
5. **Edge / discovery** — "You want a hook for the caption of your post. Use anything here to help." *(RQ5 — do they find the chat? cross-video toggle?)*
6. **Free** — "Anything you'd do next, or that felt off?"

## Success metrics & targets

| Metric | Target | Source |
|--------|--------|--------|
| Task-2 completion (unaided) | > 80% | observation |
| Task-2 time-on-task | < 6 min | timer |
| Correction (Task-3) | feels ≤ CapCut; SEQ ≥ 5/7 | Single Ease Question |
| Error rate (wrong path/dead-end) | < 15% | observation |
| System Usability Scale (post) | > 68 (above-average) | SUS questionnaire |
| RQ1 5-second recall ("Nepali captions") | > 70% | unmoderated |
| RQ4 desirability — positive cards | > 60%; "Nepali/authentic/crafted" appear | reaction cards |

## Issue severity rubric (rate every finding)

| Sev | Definition | Action |
|----|------------|--------|
| 4 Critical | Blocks task completion | fix before launch |
| 3 Major | Significant struggle/workaround | fix before launch |
| 2 Minor | Hesitation, self-recovers | fix when possible |
| 1 Cosmetic | Noticed, not blocking | backlog |

## Moderator guide — essentials
- Think-aloud: *"Say what you're looking at and expecting — there are no wrong answers; we're testing the product, not you."*
- Non-leading only: *"What would you do next?"* / *"What did you expect there?"* — never *"Did you see the Export button?"*
- Stay silent through struggle (that's the data); offer help only after a genuine dead-end, and log it as a Sev-3+.
- Per task: capture completion (Y/N/assisted), time, errors, SEQ, verbatims.
- Post-session: SUS (10 items) + *"vs how you caption Nepali today, this is **/ same / worse** because…"* (RQ3 anchor).

## Analysis → action
Code verbatims (`[GOAL] [PAIN] [BEHAVIOR] [QUOTE]`), keep only themes recurring across **≥3
participants** (kills one-off anecdotes), rate severity, then prioritize with
`freq × severity × solvability` (same scoring as `UX-JOURNEY-FUTURE.md`). Promote a proto-
persona claim to a **validated** fact only when ≥3 independent participants corroborate it.

## Honest limits
- n=6–8 is **directional**, not statistical — no significance claims, no NPS.
- The redesign can't fix STT quality (RQ3 is partly gated on the fine-tune). If Task-3 fails
  on *too many errors* rather than *slow editing*, that's an STT finding, not a UX one — tag it so.
- Until this runs, every emotion in `PERSONA.md` / `UX-JOURNEY-FUTURE.md` stays `[ASSUMPTION]`.

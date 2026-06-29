# Proto-Persona & Journey Map — HYPOTHESIS (UNVALIDATED)

> ⚠️ **This is a proto-persona, not a research finding.** Confidence: **LOW** — built
> from market-research segmentation + blueprint assumptions, **zero user interviews**.
> Every claim below is tagged `[ASSUMPTION]` and is an input to the 15-interview
> discovery study (see `RESEARCH-PLAN` / product-research). The interviews **confirm or
> kill** these. Do not treat as validated. Promote to a real persona only after ≥3
> independent participants corroborate a theme.

## Proto-persona: "Sandesh" — the Ninglish/tech creator (beachhead segment)

(Beachhead per market-research: highest differentiability 90, where incumbents are weakest.)

- **Who** `[ASSUMPTION]` — 20–30, Kathmandu/Pokhara or diaspora, makes tech/finance/how-to
  short-form for a Nepali audience, posts ≥ weekly to TikTok/Insta/YT Shorts.
- **Tech proficiency** `[ASSUMPTION]` — high; already edits in CapCut.
- **Quote (hypothetical, to verify)** — *"My Nepali captions come out as garbage or get
  auto-translated to English. I fix every line by hand."*

### Goals `[ASSUMPTION]`
- Reach + retention (captions boost watch-time / accessibility).
- Captions that render Devanagari **and** English in the same line, correctly.
- Speed — captioning shouldn't take longer than filming.

### Hypothesized frustrations (the kill-or-confirm list)
| Frustration | Tag | Validated by |
|-------------|-----|--------------|
| Devanagari conjuncts break in existing tools | `[ASSUMPTION]` | interview Q3 (recent story) |
| Ninglish auto-translated to English / wrong words | `[ASSUMPTION]` | interview Q3/Q4 |
| Manual caption fixing eats time | `[ASSUMPTION]` | interview Q3 |
| Won't pay (NPR reality) | `[ASSUMPTION — kill signal]` | interview Q5 (current spend) |

## Journey map — captioning a video TODAY (assumed current state)

| Stage | Action `[ASSUMPTION]` | Emotion (1–5) | Pain `[ASSUMPTION]` | Validate |
|-------|----------------------|:---:|---------------------|----------|
| Record | Films in Nepali/Ninglish on phone | 4 | — | — |
| Auto-caption | Runs CapCut/competitor auto-caption | 3 | Devanagari mangled, Ninglish wrong | Q3 |
| Fix | Hand-corrects every wrong word | 1 | Slow, tedious, error-prone | Q3 |
| Style | Picks a template | 3 | Nepali fonts ugly / missing | Q4 |
| Export | Burns in + posts | 3 | Re-encode artifacts | Q4 |

**Assumed opportunity (priority = freq × severity × solvability):** the *Fix* stage —
high frequency, high pain, directly solvable by better Nepali STT + the correction loop.
This is the hypothesis the product is betting on. **Interviews must confirm the Fix-stage
pain is real and frequent before building.**

## What would invalidate this
- Creators don't caption, or don't care about Nepali rendering.
- CapCut/kalakar already "good enough" for their Nepali (market-research flagged this risk).
- The pain exists but no willingness-to-pay.

→ Next: run the 15 interviews, code observations, run `insight_synthesizer.py --min-sources 3`.
Only themes recurring across ≥3 participants become real persona facts.

**See also:** `UX-JOURNEY-FUTURE.md` (the journey *through the built product*, not the old
CapCut workflow) and `USABILITY-TEST-PLAN.md` (the study that confirms/kills the
`[ASSUMPTION]` emotions in both maps and validates the Editorial Devanagari redesign).

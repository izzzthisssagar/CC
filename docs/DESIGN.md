# Design Tokens & Caption Accessibility

Generated via ui-design-system, trimmed to what the app uses. Tokens live in
`web/app/tokens.css`; Tailwind maps `brand-*` and `caption-*` to them.

## Palette

- **Brand:** crimson (Nepali identity) — `--brand-400..700`.
- **Caption (functional, not brand):** white fill, yellow active word, black outline.

## WCAG contrast (computed)

| Pair | Ratio | Verdict |
|------|-------|---------|
| Caption white / black outline | 21.0:1 | PASS |
| Caption yellow-active / black outline | 13.7:1 | PASS |
| Black text / yellow CTA (current buttons) | 13.7:1 | PASS |
| **White text / brand-500** | **3.84:1** | **FAIL AA** — do not use |
| White text / brand-600 | 6.07:1 | PASS |
| neutral-400 muted text / app bg | 7.74:1 | PASS |

**Rule:** brand buttons use `brand-600` or darker with white text. `brand-500` and
lighter are decorative only (borders, hovers), never white-text backgrounds.

## Caption legibility = outline, not fill-contrast

A caption sits over arbitrary video, so fill-vs-background contrast is unknowable. The
**stroke/outline** is what guarantees legibility (white fill + black 3px outline reads on
any frame). The worker burns this via `.ass outline=3`; the editor preview now mirrors it
with `-webkit-text-stroke` so the preview represents real legibility (`CaptionPreview.tsx`).

## Not done (right-sized)

Full atomic component system / Storybook — overkill for a 3-page scaffold. Tokens +
the AA rule + caption-outline are the parts that affect correctness and accessibility now.

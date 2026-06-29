# Fonts — Devanagari (drop binaries here)

Font files are **not committed** (see root `.gitignore`). Download and place the `.ttf`
files in this folder; the worker Dockerfile copies them to `/fonts` and runs `fc-cache`,
and FFmpeg's `subtitles` filter reads them via `fontsdir`.

## Get the fonts

All from Google Fonts (open license):

| Font | Use | Source |
|------|-----|--------|
| **Matangi** | primary — all styles, full conjuncts | fonts.google.com/specimen/Matangi |
| Playpen Sans Deva | bubble / casual / TikTok | fonts.google.com/specimen/Playpen+Sans+Deva |
| Mukta | clean podcast / minimal | fonts.google.com/specimen/Mukta |
| Hind | small news-style | fonts.google.com/specimen/Hind |
| Yatra One | MrBeast-style display | fonts.google.com/specimen/Yatra+One |
| Baloo 2 | friendly / lifestyle | fonts.google.com/specimen/Baloo+2 |
| Inter | Latin partner (Ninglish) | fonts.google.com/specimen/Inter |

After adding, you should have e.g. `fonts/Matangi-VariableFont_wght.ttf`.
(`fonts/Matangi.ttf` — the variable font — has been added locally; it's gitignored,
so re-download with: `curl -sL "https://github.com/google/fonts/raw/main/ofl/matangi/Matangi%5Bwght%5D.ttf" -o fonts/Matangi.ttf`.)

## ⚠️ FFmpeg must have libass

Burn-in uses FFmpeg's `subtitles` filter → **libass**. Verify: `ffmpeg -filters | grep subtitles`.
- **Docker worker:** Debian's apt `ffmpeg` includes libass — works out of the box (`worker/Dockerfile`).
- **macOS local:** the regular `brew install ffmpeg` bottle ships **without** libass. For local
  burn-in install `brew install homebrew-ffmpeg/ffmpeg/ffmpeg-full`, or run the Docker worker.
- Transcription (audio extract) does NOT need libass — only burn-in/export does.

## Subset for web (mandatory before shipping to browser)

Shrinks files by keeping only Devanagari + basic Latin ranges:

```bash
pip install fonttools brotli
pyftsubset Matangi.ttf \
  --unicodes='U+0900-097F,U+0020-007F' \
  --flavor=woff2 \
  --output-file=Matangi.subset.woff2
```

`U+0900-097F` = Devanagari block, `U+0020-007F` = basic Latin (for Ninglish).

## Why Devanagari needs care

FFmpeg `drawtext` can't shape conjuncts/matras (पिता, क्ष, ज्ञ). The worker burns captions
via `.ass` + libass (HarfBuzz) instead — see `worker/app/export.py`. These font files feed
that path.

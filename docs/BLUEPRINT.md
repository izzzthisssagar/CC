# Blueprint — Key Decisions

Extracted from the two root research docs. Authoritative summary of *what* and *why*.

## STT engine

| API / Model | Nepali | Ninglish | Word ts | Decision |
|-------------|--------|----------|---------|----------|
| **Groq Whisper large-v3-turbo** | Yes | Moderate | ✅ verbose_json | ✅ **PHASE 1** |
| Gladia.io (Solaria) | Yes | Exceptional | Yes | ✅ fallback |
| Sarvam AI (Saaras v3) | Exceptional | Exceptional | ❌ chunk only | ❌ eliminated |
| AssemblyAI Universal-2 | Yes | Limited | Yes | ⚠️ backup |
| Deepgram Nova-3 | Limited | Good | Yes | ⚠️ backup |
| Google Chirp 3 | Yes | Moderate | Yes | ❌ expensive |
| Azure Speech | Yes | Moderate | Yes | ❌ expensive |
| Bhashini | Yes | Good | Varies | ⚠️ unstable |

**Why Groq:** Whisper turbo on LPUs (~200× realtime), free tier, cheapest paid
($0.0006/min), word-level timestamps, Nepali support. **Why not Sarvam** (best Ninglish):
batch API has no word-level timestamps → incompatible with karaoke. Revisit if they add it.

Groq call (reuse this exact shape):
```python
from groq import Groq
client = Groq()
transcription = client.audio.transcriptions.create(
    file=open('audio.mp3', 'rb'),
    model='whisper-large-v3-turbo',
    response_format='verbose_json',
    timestamp_granularities=['word'],
    prompt='नमस्ते, यो video मा Nepali र English mixed language प्रयोग हुनेछ।',
)
```
The `prompt` primes Whisper for Ninglish — cuts hallucination and auto-translation.

## Devanagari rendering (the critical problem)

FFmpeg `drawtext` **cannot** shape Devanagari — matras/conjuncts (पिता, क्ष, ज्ञ) separate
wrongly. Known, unfixed.

❌ `ffmpeg -i in.mp4 -vf "drawtext=text='नमस्ते':fontfile=font.ttf" out.mp4`

✅ Generate `.ass` with **pysubs2**, burn via FFmpeg `subtitles` filter → libass (HarfBuzz):
```python
import pysubs2
subs = pysubs2.SSAFile()
subs.styles['Default'].fontname = 'Matangi'
subs.styles['Default'].fontsize = 48
subs.styles['Default'].outline  = 3
for w in transcript['words']:
    e = pysubs2.SSAEvent()
    e.start = int(w['start']*1000); e.end = int(w['end']*1000); e.text = w['word']
    subs.append(e)
subs.save('subs.ass')
# ffmpeg -i in.mp4 -vf "subtitles=subs.ass:fontsdir=/fonts" -c:v libx264 -crf 23 -c:a copy out.mp4
```

## Fonts (typography = main differentiator)

| Font | Type | Best for |
|------|------|----------|
| **Matangi** | variable 100–900 | primary — all styles, full conjuncts, Nepal-made |
| Playpen Sans Deva | variable | bubble / casual / TikTok |
| Mukta | static | clean podcast / minimal |
| Hind | static | small news-style captions |
| Yatra One | display | MrBeast-style impact |
| Baloo 2 | variable | friendly / lifestyle |

Ninglish per-word font pick: `const isDeva = (w)=>/[ऀ-ॿ]/.test(w)` → Matangi else Inter.
Subset before shipping: `pyftsubset font.ttf --unicodes='U+0900-097F,U+0020-007F' --flavor=woff2`.

## Caption style templates to build

Hormozi Impact · MrBeast Pop · Bubble Nepali · Podcast Clean · Devanagari Bold · Ninglish Mix.

## Pipeline (full SaaS version)

upload→R2 (presigned) → Inngest event → Modal worker → extract 64kbps MP3 → Groq verbose_json
→ store JSONB in Supabase → browser preview → export: Inngest→worker→pysubs2 `.ass`→FFmpeg
burn-in→R2 → download MP4+SRT. **MVP cuts Inngest/Modal/R2** — see `ARCHITECTURE.md`.

## RAG / AI (phased)

1. **Style memory** (mo 4–5): `users.last_style JSONB`, auto-apply prior prefs.
2. **Video chatbot** (mo 6–8): pgvector `transcript_chunks(embedding vector(768))` + Claude/Groq LLM.
3. **Correction loop** (mo 2+): every fix stores audio clip + correct text → fine-tune dataset.

Fine-tune (not train-from-scratch) Whisper large-v3 on collected corrections; WhisperX for
ms-precise alignment. This is the long-term moat.

## 10 decisions

1. Groq Whisper (fast/cheap/word-ts/Nepali). 2. pysubs2 `.ass` (only correct Devanagari).
3. Modal (FFmpeg, no timeout) — *MVP defers, runs local worker*. 4. Matangi primary font.
5. R2+Cloudinary storage — *MVP uses Supabase Storage*. 6. pgvector in Supabase.
7. Sarvam eliminated (no word ts). 8. Fine-tune > train-from-scratch. 9. Inngest queue —
*MVP defers*. 10. Correction loop from month 2.

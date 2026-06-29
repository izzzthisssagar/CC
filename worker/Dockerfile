# FFmpeg + libass (HarfBuzz shaping) + Devanagari fonts for Nepali caption burn-in.
# BUILD FROM REPO ROOT: docker build -f worker/Dockerfile -t nepali-caption-worker .
# (context must be repo root so both worker/ and fonts/ are reachable).
FROM python:3.12-slim

# Debian's ffmpeg includes libass — handles Devanagari shaping that drawtext cannot.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Devanagari fonts. MUST live in a fontconfig search path (/usr/share/fonts) so
# libass resolves the family name "Matangi" — otherwise captions render as tofu (□).
COPY fonts/*.ttf /usr/share/fonts/truetype/matangi/
RUN fc-cache -f >/dev/null 2>&1 || true
ENV FONTS_DIR=/usr/share/fonts/truetype/matangi

COPY worker/app/ ./app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

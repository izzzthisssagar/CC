# FFmpeg + libass (HarfBuzz shaping) + Devanagari fonts for Nepali caption burn-in.
FROM python:3.12-slim

# FFmpeg (with libass) + fontconfig. libass handles Devanagari shaping that
# FFmpeg drawtext cannot.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        fontconfig \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Devanagari fonts (drop .ttf into ./fonts — see fonts/README.md). FONTS_DIR is
# passed to FFmpeg subtitles filter.
COPY fonts/ /fonts/
RUN fc-cache -f /fonts || true
ENV FONTS_DIR=/fonts

COPY app/ ./app/

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

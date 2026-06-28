"""Caption burn-in: words -> .ass (pysubs2) -> FFmpeg subtitles filter (libass).

HARD RULE: render Devanagari ONLY via .ass + libass. FFmpeg drawtext breaks
matras/conjuncts. The `subtitles` filter delegates to libass (HarfBuzz shaping).
"""

import os
import tempfile

FONTS_DIR = os.getenv("FONTS_DIR", "/fonts")


def _ass_align(position: str) -> int:
    # ASS numpad alignment: 2=bottom-center, 5=center, 8=top-center.
    return {"bottom": 2, "center": 5, "top": 8}.get(position, 2)


def build_ass(words: list[dict], style: dict, path: str) -> str:
    """Write an .ass file: one event per word (karaoke-ready)."""
    import pysubs2

    subs = pysubs2.SSAFile()
    d = subs.styles["Default"]
    d.fontname = style.get("fontname", "Matangi")
    d.fontsize = style.get("fontsize", 48)
    d.primarycolor = pysubs2.Color(255, 255, 255, 0)
    d.outline = style.get("outline", 3)
    d.alignment = _ass_align(style.get("position", "bottom"))

    for w in words:
        e = pysubs2.SSAEvent()
        e.start = int(float(w["start"]) * 1000)
        e.end = int(float(w["end"]) * 1000)
        e.text = w["word"]
        subs.append(e)

    subs.save(path)
    return path


def build_srt(words: list[dict], path: str) -> str:
    """Write a plain SRT (segment per word for now)."""
    import pysubs2

    subs = pysubs2.SSAFile()
    for w in words:
        e = pysubs2.SSAEvent()
        e.start = int(float(w["start"]) * 1000)
        e.end = int(float(w["end"]) * 1000)
        e.text = w["word"]
        subs.append(e)
    subs.save(path, format_="srt")
    return path


def burn_in(video_url: str, words: list[dict], style: dict, stub: bool = False) -> tuple[str, str]:
    """Burn captions into MP4; return (mp4_path_or_url, srt_path_or_url)."""
    if stub:
        # No FFmpeg run — return placeholder paths so the UI flow works.
        return ("stub://burned.mp4", "stub://captions.srt")

    import ffmpeg

    from .security import validate_source_url

    video_url = validate_source_url(video_url)  # SSRF / file-read guard
    ass_path = build_ass(words, style, tempfile.NamedTemporaryFile(suffix=".ass", delete=False).name)
    srt_path = build_srt(words, tempfile.NamedTemporaryFile(suffix=".srt", delete=False).name)
    out_mp4 = tempfile.NamedTemporaryFile(suffix=".mp4", delete=False).name

    (
        ffmpeg
        .input(video_url)
        .output(
            out_mp4,
            vf=f"subtitles={ass_path}:fontsdir={FONTS_DIR}",
            vcodec="libx264",
            crf=23,
            acodec="copy",
        )
        .overwrite_output()
        .run(quiet=True)
    )
    return out_mp4, srt_path

"""Per-word audio clip extraction for the correction-loop fine-tune dataset.

A correction is training-ready only with the isolated audio of the corrected word.
This extracts the [start, end] segment from the source video (SSRF-guarded) to a
16kHz mono wav — the input shape Whisper fine-tuning expects.
"""

import tempfile

from .security import validate_source_url


def extract_segment(video_url: str, start_s: float, end_s: float, out_path: str | None = None) -> str:
    """Extract audio [start_s, end_s] from video_url → 16kHz mono wav. Returns path."""
    import ffmpeg

    video_url = validate_source_url(video_url)  # SSRF / file-read guard
    out = out_path or tempfile.NamedTemporaryFile(suffix=".wav", delete=False).name
    # small pad so word edges aren't clipped
    pad = 0.05
    ss = max(0.0, float(start_s) - pad)
    dur = max(0.05, float(end_s) - float(start_s) + 2 * pad)
    (
        ffmpeg
        .input(video_url, ss=ss, t=dur)
        .output(out, format="wav", ar=16000, ac=1)
        .overwrite_output()
        .run(quiet=True)
    )
    return out

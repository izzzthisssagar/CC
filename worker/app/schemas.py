"""Pydantic models shared across worker endpoints."""

from pydantic import BaseModel, Field


class Word(BaseModel):
    word: str
    start: float  # seconds
    end: float    # seconds


class Style(BaseModel):
    """Caption style — maps to .ass Default style fields."""
    template: str = "Devanagari Bold"
    fontname: str = "Matangi"
    fontsize: int = 48
    primary_color: str = "&H00FFFFFF"   # white (ASS BGR+alpha)
    active_color: str = "&H0000FFFF"    # yellow active word
    outline: int = 3
    position: str = "bottom"            # bottom | center | top


class TranscribeRequest(BaseModel):
    video_url: str = Field(..., description="Supabase Storage URL or local path")


class TranscribeResponse(BaseModel):
    words: list[Word]
    language: str
    stub: bool = False


class ExportRequest(BaseModel):
    video_url: str
    words: list[Word]
    style: Style = Style()


class ExportResponse(BaseModel):
    mp4_url: str
    srt_url: str
    stub: bool = False


class JobAccepted(BaseModel):
    """202 response — work runs in the background, poll GET /jobs/{id}."""
    job_id: str
    status: str = "queued"


class JobState(BaseModel):
    job_id: str
    kind: str
    status: str               # queued | running | done | error
    result: dict | None = None
    error: str | None = None

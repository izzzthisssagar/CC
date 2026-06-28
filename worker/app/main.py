"""Nepali AI Caption — FastAPI worker (async, job-based).

Transcription (Groq) and burn-in (FFmpeg) are long-running, so they do NOT run
inside the request. Pattern:
  POST /transcribe -> 202 {job_id}   (work runs in background)
  POST /export     -> 202 {job_id}
  GET  /jobs/{id}  -> status + result when done

Runs in STUB mode (mock data) when GROQ_API_KEY is unset. See ../CLAUDE.md.
"""

import os

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .transcribe import transcribe_audio
from .export import burn_in
from .jobs import create_job, get_job, run_job
from .schemas import (
    TranscribeRequest,
    ExportRequest,
    JobAccepted,
    JobState,
)

app = FastAPI(title="Nepali Caption Worker", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to the web origin for prod
    allow_methods=["*"],
    allow_headers=["*"],
)

STUB_MODE = not os.getenv("GROQ_API_KEY")


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "stub_mode": STUB_MODE}


@app.post("/transcribe", response_model=JobAccepted, status_code=202)
def transcribe(req: TranscribeRequest, bg: BackgroundTasks) -> JobAccepted:
    job = create_job("transcribe")

    def work():
        words, language = transcribe_audio(req.video_url, stub=STUB_MODE)
        return {"words": words, "language": language, "stub": STUB_MODE}

    bg.add_task(run_job, job.id, work)
    return JobAccepted(job_id=job.id)


@app.post("/export", response_model=JobAccepted, status_code=202)
def export(req: ExportRequest, bg: BackgroundTasks) -> JobAccepted:
    job = create_job("export")

    def work():
        mp4_url, srt_url = burn_in(
            video_url=req.video_url,
            words=[w.model_dump() for w in req.words],
            style=req.style.model_dump(),
            stub=STUB_MODE,
        )
        return {"mp4_url": mp4_url, "srt_url": srt_url, "stub": STUB_MODE}

    bg.add_task(run_job, job.id, work)
    return JobAccepted(job_id=job.id)


@app.get("/jobs/{job_id}", response_model=JobState)
def job_status(job_id: str) -> JobState:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="job not found")
    return JobState(
        job_id=job.id,
        kind=job.kind,
        status=job.status.value,
        result=job.result,
        error=job.error,
    )

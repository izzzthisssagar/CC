"""Job store for async transcribe/export.

Transcription (Groq) and burn-in (FFmpeg) take seconds-to-minutes — far past any
sane request timeout. So endpoints submit a job and return immediately; the client
polls for status. This is the "pg-tasks-for-simple-cases" pattern (no Redis/queue).

MVP uses an in-memory dict. SWAP TO POSTGRES for production: persist to a `jobs`
table (see supabase/migrations) so jobs survive restarts and scale past one worker.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any
import uuid


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    DONE = "done"
    ERROR = "error"


@dataclass
class Job:
    id: str
    kind: str  # "transcribe" | "export"
    status: JobStatus = JobStatus.QUEUED
    result: Any = None
    error: str | None = None


# In-memory store. Replace with a Postgres-backed repository for production.
_JOBS: dict[str, Job] = {}


def create_job(kind: str) -> Job:
    job = Job(id=uuid.uuid4().hex, kind=kind)
    _JOBS[job.id] = job
    return job


def get_job(job_id: str) -> Job | None:
    return _JOBS.get(job_id)


def run_job(job_id: str, fn) -> None:
    """Execute fn() as the job body; record result or error. Called in background."""
    job = _JOBS.get(job_id)
    if job is None:
        return
    job.status = JobStatus.RUNNING
    try:
        job.result = fn()
        job.status = JobStatus.DONE
    except Exception as e:  # noqa: BLE001 - surface any failure to the client
        job.error = str(e)
        job.status = JobStatus.ERROR

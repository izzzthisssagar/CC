from app.jobs import create_job, get_job, run_job, JobStatus


def test_job_success_path():
    job = create_job("transcribe")
    assert get_job(job.id).status is JobStatus.QUEUED
    run_job(job.id, lambda: {"ok": True})
    done = get_job(job.id)
    assert done.status is JobStatus.DONE
    assert done.result == {"ok": True}
    assert done.error is None


def test_job_error_path():
    job = create_job("export")

    def boom():
        raise RuntimeError("kaboom")

    run_job(job.id, boom)
    failed = get_job(job.id)
    assert failed.status is JobStatus.ERROR
    assert "kaboom" in failed.error


def test_unknown_job_is_none():
    assert get_job("does-not-exist") is None

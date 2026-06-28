from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_stub_mode():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["stub_mode"] is True  # no GROQ_API_KEY in tests


def test_transcribe_submits_job_and_completes():
    # 202 + job_id; TestClient runs the background task, so the job finishes.
    r = client.post("/transcribe", json={"video_url": "https://example.com/v.mp4"})
    assert r.status_code == 202
    job_id = r.json()["job_id"]

    s = client.get(f"/jobs/{job_id}")
    assert s.status_code == 200
    body = s.json()
    assert body["status"] == "done"
    assert body["result"]["language"] == "ne"
    assert len(body["result"]["words"]) > 0
    assert "word" in body["result"]["words"][0]


def test_export_submits_job_and_completes():
    words = [{"word": "नमस्ते", "start": 0.0, "end": 0.4}]
    r = client.post("/export", json={"video_url": "https://example.com/v.mp4", "words": words})
    assert r.status_code == 202
    job_id = r.json()["job_id"]

    body = client.get(f"/jobs/{job_id}").json()
    assert body["status"] == "done"
    assert body["result"]["mp4_url"].startswith("stub://")


def test_unknown_job_returns_404():
    assert client.get("/jobs/nope").status_code == 404

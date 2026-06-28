from app.training_export import validate_correction, corrections_to_jsonl


def _good(**over):
    base = {
        "original_text": "video",
        "corrected_text": "भिडियो",
        "audio_clip_path": "clips/a.wav",
        "start_s": 1.0,
        "end_s": 1.6,
    }
    base.update(over)
    return base


def test_valid_correction_passes():
    assert validate_correction(_good()) is None


def test_rejects_noop_empty_missing_audio_and_short_clip():
    assert validate_correction(_good(corrected_text="video")) == "no-op correction (corrected == original)"
    assert validate_correction(_good(corrected_text="  ")) == "empty corrected_text"
    assert validate_correction(_good(audio_clip_path=None)) == "missing audio_clip_path"
    assert "shorter" in validate_correction(_good(start_s=1.0, end_s=1.05))


def test_transform_dedupes_and_emits_whisper_records():
    corrections = [
        _good(),
        _good(),                                   # exact duplicate
        _good(corrected_text="नेपाली", audio_clip_path="clips/b.wav"),
        _good(corrected_text="video"),             # no-op → rejected
    ]
    records, rejected = corrections_to_jsonl(corrections)
    assert records == [
        {"audio": "clips/a.wav", "text": "भिडियो"},
        {"audio": "clips/b.wav", "text": "नेपाली"},
    ]
    reasons = sorted(r.reason for r in rejected)
    assert reasons == ["duplicate (audio, text) pair", "no-op correction (corrected == original)"]

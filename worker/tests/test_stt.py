"""STT provider registry — stub-safe (never loads torch/transformers or a real model)."""

import pytest

from app.stt import PROVIDERS, transcribe


def test_all_providers_registered():
    assert {"groq", "gladia", "finetuned"} <= set(PROVIDERS)


def test_finetuned_is_callable():
    assert callable(PROVIDERS["finetuned"])


def test_unknown_provider_raises():
    with pytest.raises(ValueError):
        transcribe("nope.mp3", provider="does-not-exist")

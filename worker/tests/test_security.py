import pytest

from app.security import validate_source_url, UnsafeSourceError


@pytest.mark.parametrize(
    "url",
    [
        "file:///etc/passwd",                          # local file read
        "http://169.254.169.254/latest/meta-data/",    # cloud metadata (scheme)
        "http://localhost:8000/x",                     # non-https
        "https://127.0.0.1/x",                         # loopback
        "https://10.0.0.5/x",                          # private range
        "ftp://example.com/x",                         # disallowed scheme
        "https:///nohost",                             # missing host
    ],
)
def test_unsafe_sources_rejected(url):
    with pytest.raises(UnsafeSourceError):
        validate_source_url(url)


def test_public_https_allowed_when_no_allowlist():
    assert validate_source_url("https://example.com/v.mp4") == "https://example.com/v.mp4"

"""Input-source validation — block SSRF / local-file-read on user-supplied URLs.

The worker fetches `video_url` with FFmpeg. Without validation an attacker can
pass file:///etc/passwd, http://169.254.169.254/ (cloud metadata), or an internal
host. Allow only https from the configured storage host(s).
"""

import ipaddress
import os
import socket
from urllib.parse import urlparse

# Comma-separated allowlist of hostnames the worker may fetch from.
# e.g. "<project>.supabase.co". Empty → only the stub path is safe; reject all.
ALLOWED_HOSTS = {
    h.strip().lower()
    for h in os.getenv("ALLOWED_SOURCE_HOSTS", "").split(",")
    if h.strip()
}


class UnsafeSourceError(ValueError):
    """Raised when a source URL fails SSRF/scheme/host validation."""


def _resolves_to_private_ip(host: str) -> bool:
    try:
        for _, _, _, _, sockaddr in socket.getaddrinfo(host, None):
            ip = ipaddress.ip_address(sockaddr[0])
            if (
                ip.is_private
                or ip.is_loopback
                or ip.is_link_local      # 169.254.0.0/16 (metadata)
                or ip.is_reserved
            ):
                return True
    except socket.gaierror:
        return True  # unresolvable → reject
    return False


def validate_source_url(url: str) -> str:
    """Return url if safe to fetch, else raise UnsafeSourceError."""
    parsed = urlparse(url)

    if parsed.scheme != "https":
        raise UnsafeSourceError(f"scheme not allowed: {parsed.scheme!r} (https only)")

    host = (parsed.hostname or "").lower()
    if not host:
        raise UnsafeSourceError("missing host")

    if ALLOWED_HOSTS and host not in ALLOWED_HOSTS:
        raise UnsafeSourceError(f"host not in allowlist: {host}")

    if _resolves_to_private_ip(host):
        raise UnsafeSourceError(f"host resolves to private/link-local IP: {host}")

    return url

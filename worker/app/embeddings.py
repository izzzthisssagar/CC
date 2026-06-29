"""Deterministic 768-dim text embedding — hashed bag-of-words (FNV-1a).

Byte-for-byte port of web/lib/embed.ts. Same tokenizer, same FNV-1a (code points
folded low-byte then high-byte), same dim, same L2 normalization → stored (web) and
query (web) vectors are comparable, and the worker can index too if ever wired in.

WHY no transformer: the project rule is "1 key (Groq)". Groq has no embedding endpoint;
a hosted embedder or local torch model breaks the zero-key / serverless story. This
hashed-token vector is a real lexical-overlap cosine — a fine retrieval baseline for a
user searching their OWN videos. UPGRADE SLOT: replace this AND web/lib/embed.ts with
the same multilingual transformer when quality matters; schema (vector(768)) is unchanged.
"""

import math
import re

EMBED_DIM = 768

# Devanagari runs, or ASCII alphanumerics (Latin lowercased). Mirrors embed.ts.
_TOKEN_RE = re.compile(r"[ऀ-ॿ]+|[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _fnv1a(token: str) -> int:
    h = 0x811C9DC5
    for ch in token:
        cp = ord(ch)
        for byte in (cp & 0xFF, (cp >> 8) & 0xFF):
            h ^= byte
            h = (h * 0x01000193) & 0xFFFFFFFF
    return h


def embed(text: str) -> list[float]:
    """Embed one string → unit-length 768-vector. Blank → all zeros."""
    v = [0.0] * EMBED_DIM
    for tok in _tokenize(text):
        v[_fnv1a(tok) % EMBED_DIM] += 1.0
    norm = math.sqrt(sum(x * x for x in v))
    if norm == 0.0:
        return v
    return [x / norm for x in v]


def embed_all(texts: list[str]) -> list[list[float]]:
    return [embed(t) for t in texts]

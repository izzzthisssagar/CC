"""Embedding parity tests.

The fixtures here are shared with web/__tests__/embed.test.ts. The whole point of
the embedder is that Python and TypeScript produce IDENTICAL vectors, so a query
embedded in the browser (TS) retrieves chunks indexed by either side. If either
implementation changes, these buckets change and both test suites must be updated.
"""

import math

from app.embeddings import EMBED_DIM, _fnv1a, embed, embed_all


def test_unit_vector_768_dim():
    v = embed("नमस्ते video editing")
    assert len(v) == EMBED_DIM
    assert math.isclose(math.sqrt(sum(x * x for x in v)), 1.0, rel_tol=1e-6)


def test_bucket_parity_with_typescript():
    # Identical to the buckets asserted in embed.test.ts.
    expected = {
        "नमस्ते": 213,
        "video": 180,
        "editing": 641,
        "सिक्छौं": 48,
        "hello": 247,
        "नेपाली": 648,
    }
    assert {t: _fnv1a(t) % EMBED_DIM for t in expected} == expected


def test_vector_nonzero_positions():
    v = embed("नमस्ते video editing")
    nonzero = sorted(i for i, x in enumerate(v) if x != 0)
    assert nonzero == [180, 213, 641]
    assert math.isclose(v[180], 0.57735, rel_tol=1e-4)


def test_order_independent():
    assert embed("a b c") == embed("c b a")


def test_blank_is_zero_vector():
    assert all(x == 0 for x in embed("   "))


def test_embed_all():
    assert len(embed_all(["hello", "नेपाली"])) == 2

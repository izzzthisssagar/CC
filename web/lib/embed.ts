// Deterministic 768-dim text embedding — a hashed bag-of-words (FNV-1a).
//
// WHY hashed bag-of-words (not a transformer): the project's rule is "1 key (Groq)".
// Groq has no embedding endpoint, and pulling in a hosted embedding API or a local
// torch model breaks both the serverless (Vercel) path and the zero-key philosophy.
// A hashed-token vector needs no key, no deps, runs identically on Node + in Python
// (worker/app/embeddings.py is a byte-for-byte port), and gives a real lexical-overlap
// cosine — a legit retrieval baseline for a user searching across their OWN videos.
//
// UPGRADE SLOT: swap this for a multilingual transformer (e.g. multilingual-e5) when
// quality matters — replace BOTH this file and worker/app/embeddings.py with the same
// model so stored + query vectors stay comparable. The schema (vector(768)) is unchanged.

export const EMBED_DIM = 768;

// Tokens: runs of Devanagari, or ASCII alphanumerics (Latin lowercased). Everything
// else (punctuation, whitespace) is a separator. Mirrors the Python tokenizer exactly.
const TOKEN_RE = /[ऀ-ॿ]+|[a-z0-9]+/g;

function tokenize(text: string): string[] {
  return text.toLowerCase().match(TOKEN_RE) ?? [];
}

// FNV-1a over code points (folded low byte then high byte). Devanagari + ASCII are all
// BMP, so JS UTF-16 code units == Unicode code points == Python ord() — vectors match.
function fnv1a(token: string): number {
  let h = 0x811c9dc5; // 2166136261
  for (const ch of token) {
    const cp = ch.codePointAt(0)!;
    for (const byte of [cp & 0xff, (cp >> 8) & 0xff]) {
      h ^= byte;
      // 32-bit FNV prime multiply, kept unsigned via Math.imul + >>> 0.
      h = Math.imul(h, 0x01000193) >>> 0;
    }
  }
  return h >>> 0;
}

/** Embed one string → unit-length 768-vector. Empty/blank → all zeros. */
export function embed(text: string): number[] {
  const v = new Array(EMBED_DIM).fill(0);
  for (const tok of tokenize(text)) {
    v[fnv1a(tok) % EMBED_DIM] += 1;
  }
  let norm = 0;
  for (const x of v) norm += x * x;
  norm = Math.sqrt(norm);
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

/** Embed many strings. */
export function embedAll(texts: string[]): number[][] {
  return texts.map(embed);
}

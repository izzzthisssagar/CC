import { embed, embedAll, EMBED_DIM } from "@/lib/embed";
import { chunkWords } from "@/lib/rag";

// These fixtures are shared with worker/tests/test_embeddings.py — if either side
// changes the algorithm, both must change together or stored/query vectors diverge.
describe("embed (FNV-1a hashed bag-of-words)", () => {
  it("produces a 768-dim unit vector", () => {
    const v = embed("नमस्ते video editing");
    expect(v).toHaveLength(EMBED_DIM);
    const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
    expect(norm).toBeCloseTo(1, 6);
  });

  it("hashes tokens to the SAME buckets as the Python port (parity lock)", () => {
    // Buckets computed from worker/app/embeddings.py — must match byte-for-byte.
    const v = embed("नमस्ते video editing");
    const nonzero = v.map((x, i) => [i, x]).filter(([, x]) => x !== 0).map(([i]) => i);
    expect(nonzero.sort((a, b) => a - b)).toEqual([180, 213, 641]);
    expect(v[180]).toBeCloseTo(0.57735, 5);
  });

  it("is deterministic and order-independent (bag of words)", () => {
    expect(embed("a b c")).toEqual(embed("c b a"));
  });

  it("returns all-zeros for blank text", () => {
    expect(embed("   ").every((x) => x === 0)).toBe(true);
  });

  it("embedAll maps over inputs", () => {
    expect(embedAll(["hello", "नेपाली"])).toHaveLength(2);
  });
});

describe("chunkWords", () => {
  const words = Array.from({ length: 120 }, (_, i) => ({
    word: `w${i}`,
    start: i,
    end: i + 1,
  }));

  it("splits long transcripts into multiple chunks", () => {
    const chunks = chunkWords(words, 80);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
  });

  it("keeps a short transcript as a single chunk", () => {
    expect(chunkWords([{ word: "नमस्ते", start: 0, end: 1 }])).toEqual(["नमस्ते"]);
  });

  it("returns nothing for an empty transcript", () => {
    expect(chunkWords([])).toEqual([]);
  });
});

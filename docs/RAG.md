# Cross-video RAG (Phase 4)

Ask questions across **all** of a user's videos, not just the open one. The editor's
chat panel has a scope toggle: **This video** (full transcript, as before) vs
**All videos** (retrieval over everything the user has transcribed).

## Pipeline

```
transcribe → saveTranscript → indexTranscript (best-effort)
                                   │
                                   ▼
        POST /api/index → chunkWords → embed → transcript_chunks (admin/service-role)

ask "All videos":
  embed(question)  ──▶ supabase.rpc(match_user_chunks)  ──▶ top-k chunks (RLS: auth.uid())
                                                              │
                                                              ▼
                                              POST /api/chat (chunks as context) → LLaMA
```

- **Chunking** — `web/lib/rag.ts::chunkWords`, ~280 chars/chunk with a 4-word overlap.
- **Indexing** — `web/app/api/index/route.ts`, server-only, service-role write, idempotent
  (clears a video's chunks before re-inserting). Fired best-effort after every save/
  re-transcribe; failures never block the editor.
- **Retrieval** — `match_user_chunks` RPC (`supabase/migrations/0002_rag.sql`), cosine
  over the ivfflat index, scoped to the caller's own videos via `auth.uid()` (RLS-safe;
  no `user_id` is trusted from the client).

## The embedder — and why it's a hashed bag-of-words

`web/lib/embed.ts` and `worker/app/embeddings.py` are **byte-for-byte ports** of the same
algorithm: tokenize (Devanagari runs + lowercased ASCII alphanumerics) → FNV-1a hash each
token into one of 768 buckets → L2-normalize. A token hashes to the **same bucket in both
languages** (parity is locked by shared test fixtures in `embed.test.ts` /
`test_embeddings.py`).

Why not a transformer? The project rule is **1 key (Groq)**, and Groq has no embedding
endpoint. A hosted embedder adds a key; a local torch model breaks the serverless (Vercel)
path. A hashed-token vector needs neither — it's a real lexical-overlap cosine, a solid
retrieval baseline when a user searches their **own** content (high keyword overlap).

**Consistency rule:** stored chunks and the query are embedded by the *same* code path. The
query is embedded in the browser (TS), so indexing also uses TS — never mix the TS embedder
with a different one for indexing, or vectors stop being comparable.

**Upgrade slot:** when retrieval quality matters, replace **both** `embed.ts` and
`embeddings.py` with the same multilingual transformer (e.g. multilingual-e5) and re-index.
The schema (`vector(768)`) and RPCs are unchanged. `embeddings.py` already exists partly to
make a Python-side batch backfill trivial at that point.

## Deploy

Apply the migration once: `supabase/migrations/0002_rag.sql` (adds the RLS read policy +
the two match RPCs; the `transcript_chunks` table and ivfflat index already shipped in
0001). Existing videos index lazily on their next open/re-transcribe; to backfill in bulk,
re-run indexing over stored transcripts.

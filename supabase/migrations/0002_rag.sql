-- Phase 4 — cross-video RAG over transcript_chunks.
-- The table + ivfflat index already exist (0001). This adds:
--   1. RLS policies so a user only ever reads/writes chunks for THEIR videos.
--   2. match RPCs (cosine) for single-video and cross-video retrieval.
--
-- Embeddings are 768-dim, produced by a deterministic FNV-1a hashed bag-of-words
-- (identical in web/lib/embed.ts and worker/app/embeddings.py) — zero extra keys,
-- consistent across the serverless + worker deployments. Swap in a real multilingual
-- transformer later by replacing both embedders; the schema is unchanged.

-- ── RLS: chunks are owned transitively through videos.user_id ───────────────────
drop policy if exists "chunks owner read" on public.transcript_chunks;
create policy "chunks owner read" on public.transcript_chunks
    for select using (
        exists (
            select 1 from public.videos v
            where v.id = transcript_chunks.video_id and v.user_id = auth.uid()
        )
    );

-- Writes go through the service-role key (server /api/index), which bypasses RLS.
-- No insert/update/delete policy for anon — indexing is server-only.

-- ── Single-video retrieval (kept for parity; chat over one video uses full text) ─
create or replace function public.match_video_chunks(
    query_embedding vector(768),
    vid             uuid,
    match_count     int default 6
)
returns table (id uuid, video_id uuid, chunk_text text, similarity float)
language sql stable
as $$
    select c.id, c.video_id, c.chunk_text,
           1 - (c.embedding <=> query_embedding) as similarity
    from public.transcript_chunks c
    where c.video_id = vid and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

-- ── Cross-video retrieval — scoped to the caller's own videos via auth.uid() ─────
-- SECURITY INVOKER (default): the join + auth.uid() guarantee a user only ever
-- retrieves chunks from videos they own, even though the function is callable by anon.
create or replace function public.match_user_chunks(
    query_embedding vector(768),
    match_count     int default 8
)
returns table (id uuid, video_id uuid, chunk_text text, similarity float)
language sql stable
as $$
    select c.id, c.video_id, c.chunk_text,
           1 - (c.embedding <=> query_embedding) as similarity
    from public.transcript_chunks c
    join public.videos v on v.id = c.video_id
    where v.user_id = auth.uid() and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit match_count;
$$;

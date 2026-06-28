-- Nepali AI Caption — initial schema.
-- Phase 1 uses: users, videos, transcripts, corrections.
-- transcript_chunks (pgvector) is Phase 3 (video chatbot RAG) — created now so the
-- shape is stable.

-- pgvector must exist before any vector column.
create extension if not exists vector;

-- Users (Supabase Auth owns auth.users; this is the app profile).
create table if not exists public.users (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text,
    last_style  jsonb,                       -- RAG Feature 1: style memory
    created_at  timestamptz not null default now()
);

-- Uploaded videos.
create table if not exists public.videos (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references public.users (id) on delete cascade,
    storage_path text not null,              -- Supabase Storage key
    status      text not null default 'uploaded',  -- uploaded|transcribing|ready|exported
    duration_s  numeric,
    created_at  timestamptz not null default now()
);

-- Transcripts — words is the word-level timestamp array (the core asset).
-- words: [{ "word": "...", "start": 0.0, "end": 0.45 }, ...]
create table if not exists public.transcripts (
    id          uuid primary key default gen_random_uuid(),
    video_id    uuid not null references public.videos (id) on delete cascade,
    language    text,
    words       jsonb not null default '[]'::jsonb,
    created_at  timestamptz not null default now()
);

-- Correction loop — every user fix = one training-data row (audio clip + correct text).
-- This is the AI moat; populate from Phase 1 day one.
create table if not exists public.corrections (
    id            uuid primary key default gen_random_uuid(),
    transcript_id uuid not null references public.transcripts (id) on delete cascade,
    word_index    int  not null,             -- position in words[]
    original_text text not null,
    corrected_text text not null,
    audio_clip_path text,                     -- Storage key for the isolated word audio
    start_s       numeric,
    end_s         numeric,
    created_at    timestamptz not null default now()
);

-- Async jobs (transcribe / export). MVP worker uses an in-memory store; this
-- table is the production swap-in so jobs survive restarts and scale past one worker.
create table if not exists public.jobs (
    id          uuid primary key default gen_random_uuid(),
    video_id    uuid references public.videos (id) on delete cascade,
    kind        text not null,                       -- transcribe | export
    status      text not null default 'queued',      -- queued|running|done|error
    result      jsonb,
    error       text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now()
);

-- Video chatbot RAG (Phase 3). 768-dim embeddings.
create table if not exists public.transcript_chunks (
    id          uuid primary key default gen_random_uuid(),
    video_id    uuid not null references public.videos (id) on delete cascade,
    chunk_text  text not null,
    embedding   vector(768),
    created_at  timestamptz not null default now()
);

-- Indexes.
create index if not exists idx_videos_user        on public.videos (user_id);
create index if not exists idx_transcripts_video  on public.transcripts (video_id);
create index if not exists idx_corrections_tr     on public.corrections (transcript_id);
create index if not exists idx_jobs_video          on public.jobs (video_id);
create index if not exists idx_jobs_status         on public.jobs (status);
create index if not exists idx_chunks_embedding
    on public.transcript_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Row-level security (Supabase). Enable; policies are added in a later migration
-- once auth flows exist.
alter table public.users           enable row level security;
alter table public.videos          enable row level security;
alter table public.transcripts     enable row level security;
alter table public.corrections     enable row level security;
alter table public.jobs            enable row level security;
alter table public.transcript_chunks enable row level security;

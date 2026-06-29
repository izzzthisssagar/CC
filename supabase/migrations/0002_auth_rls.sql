-- Auth wiring + per-user RLS policies (Phase 1).

-- Auto-create a public.users profile row when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS policies — each user sees/writes only their own data.

-- users: own profile
drop policy if exists "users self" on public.users;
create policy "users self" on public.users
  for all using (id = auth.uid()) with check (id = auth.uid());

-- videos: owned by user_id
drop policy if exists "videos owner" on public.videos;
create policy "videos owner" on public.videos
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- transcripts: via the owning video
drop policy if exists "transcripts owner" on public.transcripts;
create policy "transcripts owner" on public.transcripts
  for all
  using (exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid()))
  with check (exists (select 1 from public.videos v where v.id = video_id and v.user_id = auth.uid()));

-- corrections: via the owning video → transcript (nullable transcript_id allowed)
drop policy if exists "corrections owner" on public.corrections;
create policy "corrections owner" on public.corrections
  for all
  using (
    transcript_id is null or exists (
      select 1 from public.transcripts t
      join public.videos v on v.id = t.video_id
      where t.id = transcript_id and v.user_id = auth.uid()
    )
  )
  with check (
    transcript_id is null or exists (
      select 1 from public.transcripts t
      join public.videos v on v.id = t.video_id
      where t.id = transcript_id and v.user_id = auth.uid()
    )
  );

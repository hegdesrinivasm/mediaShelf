create type content_type as enum ('film', 'tv', 'documentary', 'book');
create type content_status as enum ('planned', 'in_progress', 'completed', 'dropped');
create table content (
  id uuid primary key default gen_random_uuid(),
  type content_type not null,
  title text not null,
  cover_url text,
  status content_status not null default 'planned',
  rating smallint check (rating between 1 and 10),
  summary text,
  summary_source text check (summary_source in ('user','ai')),
  liked text,
  disliked text,
  takeaways text,
  date_started date,
  date_finished date,
  platform text,
  platform_url text,
  tags text[] default '{}',
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table film_details (
  content_id uuid primary key references content(id) on delete cascade,
  director text, story_writer text, genre text[], franchise text, cast text[], runtime_min int, release_date date
);
create table tv_details (
  content_id uuid primary key references content(id) on delete cascade,
  director text, story_writer text, cast text[], seasons int, episodes_per_season int[]
);
create table book_details (
  content_id uuid primary key references content(id) on delete cascade,
  author text, publisher text, isbn text, page_count int, series text
);
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  source_content_id uuid not null references content(id) on delete cascade,
  recommended_title text not null,
  recommended_type content_type not null,
  recommended_metadata jsonb not null default '{}',
  explanation text, score numeric(3,2), dismissed boolean default false, added_to_list boolean default false, created_at timestamptz not null default now()
);
create index idx_content_details on content using gin (details);
-- RLS permissive for single-user MVP
alter table content enable row level security;
create policy "allow all" on content for all using (true) with check (true);
alter table film_details enable row level security; create policy "allow all" on film_details for all using (true) with check (true);
alter table tv_details enable row level security; create policy "allow all" on tv_details for all using (true) with check (true);
alter table book_details enable row level security; create policy "allow all" on book_details for all using (true) with check (true);
alter table recommendations enable row level security; create policy "allow all" on recommendations for all using (true) with check (true);

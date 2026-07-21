# Media consumption tracker — mediaShelf

## Why this exists

A personal replacement for a Notion setup (separate databases per content type — Kdrama, Movies, Books, etc.) that became too much friction as Notion pushed toward an "everything app." Goal: a lightweight, purpose-built tracker for everything consumed across platforms (Netflix, JioHotstar, physical books, anime, etc.), with less overhead than a general-purpose workspace tool.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | **SvelteKit** | Compiles away framework runtime, small JS payloads, SSR for fast poster-grid loads |
| Backend | **Supabase** (not a separate server) | One platform for DB, storage, and edge functions; avoids running/hosting a second service |
| Database | Supabase Postgres | Relational, with the flexibility of a `details jsonb` column for per-type overflow fields |
| Storage | Supabase Storage | Cover images / posters |
| Custom server logic | Supabase Edge Functions (Deno) | Metadata fetch, LLM summary generation, and recommendation pipelines — kept out of the client, kept out of a separate server |

**Explicitly decided against:** a second NoSQL database (e.g. MongoDB) for content records. The flexible-schema benefit is real, but splitting the data layer doubles infrastructure and forfeits Supabase's auto-generated APIs. The flexibility need is instead met with a `details jsonb` column inside Postgres — same benefit, one database.

**Explicitly decided against (for now):** LangChain / LangGraph. The current workflows — auto-fill metadata, summary generation, and the recommendation pipeline — are linear sequences of API calls, not multi-step orchestration graphs. LangChain/LangGraph are Python/Node-shaped and awkward inside Deno-based Edge Functions (added bundle size, cold-start latency) for no real benefit at this scale. Revisit only if a feature genuinely demands graph-shaped state management (e.g. conversational recommendation agent, multi-source data reconciliation with conflict resolution).

## Core concepts

- **Consumption List** and **Consumption History** are not separate tables — both are views over the same `content` table, filtered by `status` (`planned` = list, `completed`/`dropped` = history). Whether `in_progress` shows in the list, the history, or its own tab is an open UI decision.
- Four content types: **Movie, TV Show, Documentary, Book** (fiction and non-fiction).
- Common fields across all types: title, cover image, status, rating (1–10), summary (user-written or AI-generated, tagged via `summary_source`), things liked, things disliked, takeaways, dates, platform watched/read on + link.
- Type-specific fields (director, cast, franchise, seasons/episodes, author, publisher, ISBN, etc.) live in per-type detail tables, auto-populated from metadata APIs once the user enters type + title.
- **Dates:** `date_started` + `date_finished`, both nullable on the shared table. TV shows and books typically use both; movies and documentaries typically only use `date_finished` ("finished watching on"). Left as a UI convention rather than a DB constraint, to stay flexible for edge cases (e.g. rewatching a movie in parts).
- **Recommendations:** Based on the current entry + full watch/read history, suggest what to watch/read next. Implemented as a single Edge Function pipeline (query history → external API for candidates → single LLM call to rank and explain) — linear, not a graph.
- **Insights / Analytics:** A dashboard showing consumption patterns over time — genre breakdowns, rating distributions, reading pace, yearly stats. Primarily SQL aggregation views rendered in the client, with an optional LLM-generated narrative summary.

## Architecture

Client (SvelteKit) → Supabase (Postgres DB, Storage, Edge Functions) → external metadata/LLM APIs, called only from Edge Functions.

## Deployment

| Layer | Host | Notes |
|---|---|---|
| Frontend (SvelteKit) | **Vercel** | Auto-deploys from git push, free tier, first-class SvelteKit support |
| Database + Storage | **Supabase** (hosted) | Free tier — 500MB DB, 1GB storage, ample for single-user |
| Edge Functions | **Supabase** (hosted) | Free tier — 500K invocations/month, cold starts ~300ms–1s |

Scaling is not a real concern for a single-user personal tool. The free tiers on both Vercel and Supabase are more than sufficient. If the app ever grows beyond personal use, Supabase Pro ($25/mo) eliminates edge function cold starts and increases limits significantly.

## Database schema

```sql
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
  platform text,        -- e.g. 'Netflix', 'JioHotstar', 'Theatre', 'Physical copy'
  platform_url text,    -- direct link to watch/read on that platform
  tags text[] default '{}',
  details jsonb not null default '{}',  -- freeform / overflow fields per type
  created_at timestamptz not null default now()
);

create table film_details (
  content_id uuid primary key references content(id) on delete cascade,
  director text,
  story_writer text,
  genre text[],
  franchise text,
  cast text[],
  runtime_min int,
  release_date date
);
-- documentary rows reuse film_details (same field shape, franchise usually null)

create table tv_details (
  content_id uuid primary key references content(id) on delete cascade,
  director text,
  story_writer text,
  cast text[],
  seasons int,
  episodes_per_season int[]
);

create table book_details (
  content_id uuid primary key references content(id) on delete cascade,
  author text,
  publisher text,
  isbn text,
  page_count int,
  series text
);

-- optional: cache for recommendation results
create table recommendations (
  id uuid primary key default gen_random_uuid(),
  source_content_id uuid not null references content(id) on delete cascade,
  recommended_title text not null,
  recommended_type content_type not null,
  recommended_metadata jsonb not null default '{}',  -- poster, genres, year, etc.
  explanation text,        -- LLM-generated reason for recommendation
  score numeric(3,2),      -- relevance score
  dismissed boolean default false,
  added_to_list boolean default false,
  created_at timestamptz not null default now()
);

-- optional: semantic similarity search via pgvector (add after enough data accumulates)
-- create extension if not exists vector;
-- create table content_embeddings (
--   content_id uuid primary key references content(id) on delete cascade,
--   embedding vector(1536),
--   generated_at timestamptz not null default now()
-- );
-- create index idx_embedding_search on content_embeddings
--   using ivfflat (embedding vector_cosine_ops) with (lists = 10);

-- optional: fast lookups inside the freeform details column
create index idx_content_details on content using gin (details);
```

## Add-entry flow

1. User enters content type + title.
2. Edge Function fetches metadata from the relevant external API:
   - Movie / Documentary / TV Show → **TMDB**
   - Book → **Open Library** or **Google Books API**
   - Anime (TV type, flagged) → consider **AniList API** later, since TMDB/cast data for anime is often sparse
   - Poster/cover URL is stored (or downloaded into Supabase Storage for permanence)
3. User chooses summary source:
   - Write it themselves, or
   - Generate via LLM — a single structured-output API call (optionally with a web search tool) that returns a JSON summary; `summary_source` is set to `ai`
4. Entry is saved to `content` + the relevant type-detail table, with `status = 'planned'` (list) or `status = 'completed'` (history) depending on entry context.
5. If the entry was saved as `completed`, optionally trigger recommendation generation for that entry (see Recommendation Engine section).

## Recommendation Engine

A single Edge Function pipeline — no orchestration framework needed:

1. Take the `content_id` of a completed entry.
2. Query Postgres for the user's watch/read history filtered by similar genre/type/rating patterns.
3. Call external APIs for candidate recommendations (TMDB `/discover` for film/TV, Google Books subject endpoint for books), excluding already-consumed titles.
4. Single LLM call: pass the candidate list + user's taste profile → LLM ranks the top 5 and generates a one-line explanation for each.
5. Return ranked recommendations with metadata. Optionally cache in the `recommendations` table.

Homepage recommendations work the same way, but use the full history as context instead of a single entry.

**Future upgrade path:** Add pgvector embeddings for semantic similarity search. When a title is completed, generate an embedding of `{title, genre, tags, liked, disliked, takeaways}` and store it. Recommendations can then find nearest neighbors via cosine similarity — smarter than keyword matching, and improves as data accumulates. This is a candidate for the `content_embeddings` table once there are enough completed entries (50+).

## Insights / Analytics

Primarily SQL aggregation views, rendered as charts in the client (Chart.js or similar Svelte charting library). Examples:

- Films / shows / books completed per year
- Genre breakdown by content type
- Average rating by type
- Rating distribution (histogram)
- Reading pace (books per month)
- Platform usage breakdown

An optional Edge Function can take the aggregated SQL results and generate a short narrative summary via a single LLM call ("You watched 47 films this year, 60% were sci-fi, and your average rating for Korean dramas was 8.2...").

## Open decisions

- Whether `in_progress` items get their own "currently watching/reading" view or fold into the List/History split.
- Whether to add AniList as a dedicated anime source now or later.
- Tags as Postgres arrays (current, lightweight) vs. a dedicated join table (only worth it if tag autocomplete/tag pages are wanted).
- pgvector embeddings: introduce from the start, or add later once enough data accumulates?
- Homepage recommendations: on-demand (recompute each visit) or cached/refreshed periodically (e.g. nightly batch, or on each new completion)?

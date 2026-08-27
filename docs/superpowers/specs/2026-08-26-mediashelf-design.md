# mediaShelf Phased Design

**Date:** 2026-08-26
**Status:** Approved
**Source:** `docs/specs.md` + scaffold at `da14e3d` (SvelteKit + Supabase)

## Overview
Personal media consumption tracker replacing Notion setup. Four content types (`film`, `tv`, `documentary`, `book`). Single-user first. All external API calls via Supabase Edge Functions (Deno). Frontend SvelteKit on Vercel (`docs/specs.md:36`), DB/Storage/Functions on Supabase hosted.

## Decisions Carried Forward
- No second NoSQL DB; `details jsonb` in Postgres `docs/specs.md:17`.
- No LangChain/LangGraph; linear pipeline `docs/specs.md:19`.
- `content` table is single source for List (status=planned) and History (completed/dropped) `docs/specs.md:23`; `in_progress` gets dedicated "Currently" tab (resolves open decision `docs/specs.md:173`).
- Tags as `text[]` `docs/specs.md:67`, GIN index `docs/specs.md:127`.
- Deferred: AniList (`docs/specs.md:172`), pgvector embeddings until 50+ completed (`docs/specs.md:176`).

## Architecture
```
SvelteKit (src/routes/*, src/lib/*) -> Supabase (Postgres, Storage, Edge Functions) -> TMDB / Open Library / Google Books / LLM
```
- Auth: single-user, RLS permissive (anon read/write) initially, documented for tightening later.
- Types: generated via `supabase gen types typescript`.

## Phases
1. **Phase 1 Done** - Scaffold (`package.json:1`, `src/lib/supabase.ts:1`, `vite.config.ts:1`)
2. **Phase 2 Foundation** - Migration + typed client
3. **Phase 3 Add-Entry + Metadata** - Edge Function fetch-metadata
4. **Phase 4 List/History/Detail CRUD** - Poster grid, filters
5. **Phase 5 AI Summaries** - Edge Function generate-summary
6. **Phase 6 Recommendations** - Pipeline + cache table
7. **Phase 7 Insights** - SQL aggregations + charts
8. **Phase 8 Polish & Deploy** - Vercel adapter, storage permanence

## Data Model (canonical `docs/specs.md:47`)
- enums `content_type`/`content_status`, table `content` (common fields), `film_details` (reused for documentary), `tv_details`, `book_details`, `recommendations`.
- Future `content_embeddings vector(1536)` deferred.

## Verification Strategy
- `npm run check` (`package.json:11`), `svelte-check`, Vitest for mappers, Playwright smoke for flows, manual Supabase SQL verification.

## Risks
- Edge cold start 300ms-1s `docs/specs.md:41` -> cache recommendations.
- TMDB/Google Books rate limits -> server-side key, debounce.

## Self-Review
- No TBD/TODO placeholders.
- Phase count matches spec sections.
- pgvector explicitly deferred, not omitted.
- File paths verified against repo at `2026-08-26`.

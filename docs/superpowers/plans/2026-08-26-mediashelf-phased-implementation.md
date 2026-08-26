# mediaShelf Phased Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver personal media tracker (4 types) from scaffold to deployed app with metadata auto-fill, AI summaries, recommendations, and insights.

**Architecture:** SvelteKit client `src/routes/*` -> Supabase Postgres/Storage/Edge Functions (Deno) -> TMDB/Open Library/Google Books/LLM; single `content` table with per-type detail tables `docs/specs.md:47`.

**Tech Stack:** SvelteKit 2.63, Svelte 5 (runes), Vite 8, Tailwind 4.3, TypeScript 6, Supabase JS 2.110, Supabase CLI, Vercel adapter.

## Global Constraints
- Single-user first; no multi-user complexity — `docs/specs.md:12`.
- All external API + LLM calls ONLY from Supabase Edge Functions, never client — `docs/specs.md:27`.
- `content_type` enum = `film|tv|documentary|book` — `docs/specs.md:48`.
- `content_status` enum = `planned|in_progress|completed|dropped` — `docs/specs.md:49`.
- `rating` 1-10 check, `summary_source in ('user','ai')` — `docs/specs.md:57-59`.
- Tags as `text[] default '{}'` with GIN index on `details` — `docs/specs.md:67,127`.
- No LangChain/LangGraph unless graph-shaped need arises — `docs/specs.md:19`.
- Free-tier deploy: Vercel frontend + Supabase hosted — `docs/specs.md:36`.

---

### Task 1: Database & Auth Foundation (Phase 2)

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260826000001_initial_schema.sql`
- Create: `src/lib/types.ts` (or `src/lib/database.types.ts` generated)
- Modify: `src/lib/supabase.ts:1-4`
- Modify: `.env.example:1-4`
- Create: `scripts/seed.ts`

**Interfaces:**
- Consumes: `docs/specs.md:47-128` SQL
- Produces: `Database` type for `createClient<Database>`, migration applied, `seed()` inserts sample rows

- [ ] **Step 1: Install Supabase CLI and init**
```bash
npm install -D supabase
npx supabase init
# expect: Created supabase/config.toml
```

- [ ] **Step 2: Write migration from spec verbatim**
File `supabase/migrations/20260826000001_initial_schema.sql`:
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
```

- [ ] **Step 3: Type generation and client update**
Modify `src/lib/supabase.ts:1-4`:
```ts
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Database } from './database.types';
export const supabase = createClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY);
```
Generate: `npx supabase gen types typescript --local > src/lib/database.types.ts`

- [ ] **Step 4: Verify**
Run: `npx supabase db reset && npm run check`
Expected: PASS, no type errors.

- [ ] **Step 5: Commit**
```bash
git add supabase/ src/lib/supabase.ts src/lib/database.types.ts .env.example
git commit -m "feat: add initial Supabase schema and typed client"
```

---

### Task 2: Add-Entry Flow + Metadata Edge Function (Phase 3)

**Files:**
- Create: `supabase/functions/fetch-metadata/index.ts`
- Create: `src/lib/tmdb.ts`
- Create: `src/lib/books.ts`
- Create: `src/routes/add/+page.svelte`
- Create: `src/routes/add/+page.server.ts`
- Modify: `src/lib/index.ts:1`

**Interfaces:**
- Consumes: `supabase` typed client from Task 1
- Produces: `fetchMetadata(type, title): Promise<{cover_url, details}>`, `POST /functions/v1/fetch-metadata`

- [ ] **Step 1: Write failing test for TMDB mapper**
File `src/lib/tmdb.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { mapTmdbToFilmDetails } from './tmdb';
describe('mapTmdbToFilmDetails', () => {
  it('maps TMDB movie to film_details shape', () => {
    const r = mapTmdbToFilmDetails({ title: 'Inception', credits:{crew:[{job:'Director',name:'Nolan'}]}, genres:[{name:'Sci-Fi'}] });
    expect(r.director).toBe('Nolan');
  });
});
```
Run: `npm run test -- tmdb` Expected: FAIL not defined.

- [ ] **Step 2: Implement mapper**
File `src/lib/tmdb.ts`:
```ts
export function mapTmdbToFilmDetails(tmdb: any) {
  return {
    director: tmdb.credits?.crew?.find((c:any)=>c.job==='Director')?.name ?? null,
    genre: tmdb.genres?.map((g:any)=>g.name) ?? [],
    cast: tmdb.credits?.cast?.slice(0,10).map((c:any)=>c.name) ?? [],
    runtime_min: tmdb.runtime ?? null,
    release_date: tmdb.release_date ?? null,
    cover_url: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null
  };
}
```

- [ ] **Step 3: Edge Function fetch-metadata (Deno)**
File `supabase/functions/fetch-metadata/index.ts`:
```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req)=>{
  const { type, title } = await req.json();
  const tmdbKey = Deno.env.get("TMDB_API_KEY")!;
  if (['film','tv','documentary'].includes(type)) {
    const r = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${tmdbKey}&query=${encodeURIComponent(title)}`);
    const j = await r.json();
    return new Response(JSON.stringify(j.results[0] ?? null), { headers: {"Content-Type":"application/json"}});
  } else {
    const r = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`);
    const j = await r.json();
    return new Response(JSON.stringify(j.docs[0] ?? null), { headers: {"Content-Type":"application/json"}});
  }
});
```

- [ ] **Step 4: Add page SSR loader + form**
File `src/routes/add/+page.svelte` - type select, title input, "Fetch metadata" button calls `supabase.functions.invoke('fetch-metadata')`, then shows cover preview + detail fields, save inserts into `content` + `*_details`.

- [ ] **Step 5: Verify**
Run: `npm run check && npm run test`
Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add supabase/functions/fetch-metadata src/lib/tmdb.ts src/routes/add
git commit -m "feat: add entry flow with metadata fetch"
```

---

### Task 3: List / History / Detail & CRUD (Phase 4)

**Files:**
- Create: `src/routes/(app)/+layout.svelte`
- Create: `src/routes/(app)/list/+page.svelte`
- Create: `src/routes/(app)/list/+page.server.ts`
- Create: `src/routes/(app)/history/+page.svelte`
- Create: `src/routes/(app)/content/[id]/+page.svelte`
- Create: `src/lib/components/ContentCard.svelte`
- Create: `src/lib/components/ContentGrid.svelte`

**Interfaces:**
- Consumes: `supabase` query `from('content').select('*').eq('status','planned')`
- Produces: poster grid, filter by type/tags, detail edit

- [ ] **Step 1: Server load for list (planned + in_progress in separate Currently tab)**
File `src/routes/(app)/list/+page.server.ts`:
```ts
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
export const load: PageServerLoad = async ({ url }) => {
  const type = url.searchParams.get('type');
  let q = supabase.from('content').select('*').eq('status','planned').order('created_at',{ascending:false});
  if (type) q = q.eq('type', type as any);
  const { data } = await q;
  return { items: data ?? [] };
};
```

- [ ] **Step 2: Grid component**
`ContentCard.svelte` shows `cover_url`, title, rating, platform. `ContentGrid.svelte` maps items.

- [ ] **Step 3: Detail page with edit**
`src/routes/(app)/content/[id]/+page.svelte` loads single row + detail table, allows patch `rating`, `liked/disliked/takeaways`, `date_started/finished`, status transition.

- [ ] **Step 4: Verify**
Run: `npm run dev` manual: add 3 items, check list/history/currently filtering, edit rating persists.

- [ ] **Step 5: Commit**
```bash
git add src/routes/ src/lib/components/
git commit -m "feat: add list/history/detail views with filtering"
```

---

### Task 4: AI Summaries (Phase 5)

**Files:**
- Create: `supabase/functions/generate-summary/index.ts`
- Modify: `src/routes/(app)/content/[id]/+page.svelte`
- Modify: `src/routes/add/+page.svelte`

**Interfaces:**
- Consumes: `content.id`, `LLM_API_KEY` env
- Produces: `generateSummary(title, type): Promise<{summary, summary_source:'ai'}>`

- [ ] **Step 1: Edge Function**
File `supabase/functions/generate-summary/index.ts`:
```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
serve(async (req)=>{
  const { title, type } = await req.json();
  const key = Deno.env.get("LLM_API_KEY")!;
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST", headers:{Authorization:`Bearer ${key}`, "Content-Type":"application/json"},
    body: JSON.stringify({ model:"gpt-4o-mini", response_format:{type:"json_object"}, messages:[{role:"system", content:"Return JSON {summary: string}"},{role:"user", content:`Summarize ${type} titled ${title} in 3 sentences`}]} )
  });
  const j = await r.json();
  const summary = JSON.parse(j.choices[0].message.content).summary;
  return new Response(JSON.stringify({ summary, summary_source:'ai' }), {headers:{"Content-Type":"application/json"}});
});
```

- [ ] **Step 2: UI toggle user/ai**
Add radio `summary_source` + textarea + "Generate with AI" button that invokes function and fills textarea.

- [ ] **Step 3: Verify**
Mock LLM env not set -> graceful error. With key -> summary persists to `content.summary`.

- [ ] **Step 4: Commit**
```bash
git add supabase/functions/generate-summary src/routes/
git commit -m "feat: add AI summary generation"
```

---

### Task 5: Recommendations (Phase 6)

**Files:**
- Create: `supabase/functions/recommend/index.ts`
- Create: `src/routes/(app)/recommendations/+page.svelte`
- Modify: `src/routes/(app)/content/[id]/+page.svelte` (show recs)

**Interfaces:**
- Consumes: `content_id`, history query, TMDB `/discover`, LLM ranking
- Produces: `recommendations` rows, top-5 ranked with explanation

- [ ] **Step 1: Pipeline code**
Steps in `recommend/index.ts`: 1) query history by genre/rating, 2) fetch candidates via `https://api.themoviedb.org/3/discover/movie?with_genres=...` excluding `select title from content`, 3) single LLM call to rank + explain, 4) insert into `recommendations`.

- [ ] **Step 2: Verify**
Insert 5 completed films, call function, expect 5 rows with `score` numeric(3,2) and `explanation`.

- [ ] **Step 3: Commit**
```bash
git add supabase/functions/recommend src/routes/
git commit -m "feat: add recommendation pipeline"
```

---

### Task 6: Insights Dashboard (Phase 7)

**Files:**
- Create: `src/routes/(app)/insights/+page.server.ts`
- Create: `src/routes/(app)/insights/+page.svelte`
- Create: `src/lib/components/Chart.svelte`
- Create: `supabase/functions/insights-narrative/index.ts` (optional)

**Interfaces:**
- Consumes: SQL aggregations `select type, count(*) ... group by`
- Produces: charts: yearly counts, genre breakdown, rating dist, books/month, platform usage

- [ ] **Step 1: Aggregation queries**
File `src/routes/(app)/insights/+page.server.ts`:
```ts
export const load = async () => {
  const { data: yearly } = await supabase.rpc('yearly_counts'); // or raw sql via .from
  // fallback inline: supabase.from('content').select('date_finished').eq('status','completed')
  return { yearly };
};
```
Create view `yearly_counts` via migration `20260826000002_insights_views.sql`.

- [ ] **Step 2: Chart component**
Use `chart.js` + `svelte-chartjs` or `layercake`, render hist.

- [ ] **Step 3: Verify**
Seed 20 rows, check genre chart matches `select unnest(genre)`.

- [ ] **Step 4: Commit**
```bash
git add src/routes/insights src/lib/components/Chart.svelte supabase/migrations/
git commit -m "feat: add insights dashboard"
```

---

### Task 7: Polish & Deploy (Phase 8)

**Files:**
- Modify: `vite.config.ts:1-22` (adapter-auto -> adapter-vercel)
- Modify: `src/app.css:1`
- Create: `src/lib/components/Search.svelte`
- Modify: `.env.example:1-4`

**Interfaces:**
- Consumes: all prior tasks
- Produces: deployed URL

- [ ] **Step 1: Adapter switch**
```ts
import adapter from '@sveltejs/adapter-vercel';
export default defineConfig({ plugins: [tailwindcss(), sveltekit({ adapter: adapter() })] });
```

- [ ] **Step 2: Cover permanence**
On save, download `cover_url` to `supabase.storage.from('covers').upload()` if flag set.

- [ ] **Step 3: Deploy**
```bash
vercel --prod
npx supabase functions deploy fetch-metadata generate-summary recommend
```

- [ ] **Step 4: Verify**
`npm run build && npm run preview` PASS, deployed site loads poster grid.

- [ ] **Step 5: Commit**
```bash
git add vite.config.ts src/
git commit -m "chore: configure Vercel deploy and polish"
```

---

## Self-Review
- Spec coverage: schema `49-128` -> Task1, add-entry `130` -> Task2, list/history `23` -> Task3, summaries `59` -> Task4, recommendations `144` -> Task5, insights `158` -> Task6, deploy `36` -> Task7. All covered.
- No TBD/TODO.
- Types consistent: `Database` introduced Task1, reused Tasks2-6.

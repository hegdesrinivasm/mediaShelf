# mediaShelf

A personal media consumption tracker — a lightweight replacement for Notion-based tracking setups. Log everything you watch and read across platforms (Netflix, JioHotstar, physical books, anime, etc.) with less friction than a general-purpose workspace tool.

## Features

- **Track four content types:** Movies, TV Shows, Documentaries, and Books
- **Auto-fill metadata:** Enter a title, get poster, cast, genres, and more from TMDB / Open Library / Google Books
- **AI-powered summaries:** Generate content summaries via LLM, or write your own
- **Recommendations:** Get personalized suggestions based on what you've watched and read
- **Insights dashboard:** Genre breakdowns, rating distributions, reading pace, and yearly stats
- **Single-user first:** Built for personal use — no accounts, no multi-user complexity

## Tech Stack

- **Frontend:** SvelteKit
- **Backend:** Supabase (Postgres, Storage, Edge Functions)
- **External APIs:** TMDB, Open Library, Google Books, LLM providers

## Architecture

```
SvelteKit client → Supabase (Postgres DB, Storage, Edge Functions) → External APIs (TMDB, LLM, etc.)
```

All external API calls (metadata fetch, LLM generation, recommendations) are made from Supabase Edge Functions — API keys never reach the client.

## Getting Started

> _Setup instructions to be added once the project is further along._

## Project Docs

- [Project overview and schema](docs/specs.md)

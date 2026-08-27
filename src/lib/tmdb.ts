export function mapTmdbToFilmDetails(tmdb: any) {
  return {
    director: tmdb.credits?.crew?.find((c: any) => c.job === 'Director')?.name ?? null,
    genre: tmdb.genres?.map((g: any) => g.name) ?? [],
    cast: tmdb.credits?.cast?.slice(0, 10).map((c: any) => c.name) ?? [],
    runtime_min: tmdb.runtime ?? null,
    release_date: tmdb.release_date ?? null,
    cover_url: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null
  };
}

export function mapTmdbToTvDetails(tmdb: any) {
  return {
    director: tmdb.created_by?.[0]?.name ?? tmdb.credits?.crew?.find((c: any) => c.job === 'Director')?.name ?? null,
    story_writer: null,
    cast: tmdb.credits?.cast?.slice(0, 10).map((c: any) => c.name) ?? [],
    seasons: tmdb.number_of_seasons ?? null,
    episodes_per_season: tmdb.seasons?.map((s: any) => s.episode_count) ?? null,
    cover_url: tmdb.poster_path ? `https://image.tmdb.org/t/p/w500${tmdb.poster_path}` : null
  };
}

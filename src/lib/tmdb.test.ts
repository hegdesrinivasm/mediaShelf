import { describe, it, expect } from 'vitest';
import { mapTmdbToFilmDetails } from './tmdb';
describe('mapTmdbToFilmDetails', () => {
  it('maps TMDB movie to film_details shape', () => {
    const r = mapTmdbToFilmDetails({ title: 'Inception', credits:{crew:[{job:'Director',name:'Nolan'}]}, genres:[{name:'Sci-Fi'}] });
    expect(r.director).toBe('Nolan');
  });
});

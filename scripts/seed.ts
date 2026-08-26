import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/lib/database.types';

const url = process.env.PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const key =
	process.env.SUPABASE_SERVICE_ROLE_KEY ??
	process.env.PUBLIC_SUPABASE_ANON_KEY ??
	process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
	console.error('Missing Supabase URL or key. Set PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or PUBLIC_SUPABASE_ANON_KEY).');
	process.exit(1);
}

const supabase = createClient<Database>(url, key);

export async function seed() {
	// Clean existing sample data (optional, keeps seed idempotent for these titles)
	const sampleTitles = ['Inception', 'Breaking Bad', 'Planet Earth', 'Dune'];

	// Insert content rows
	const { data: existing } = await supabase.from('content').select('id, title').in('title', sampleTitles);
	const existingTitles = new Set((existing ?? []).map((r) => r.title));
	const toInsert = [
		{
			type: 'film' as const,
			title: 'Inception',
			cover_url: 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
			status: 'completed' as const,
			rating: 9,
			summary: 'A thief who steals corporate secrets through dream-sharing technology.',
			summary_source: 'user' as const,
			liked: 'Mind-bending plot, score',
			disliked: 'Complex timeline',
			takeaways: 'Dreams within dreams',
			date_finished: '2024-12-01',
			platform: 'Netflix',
			tags: ['sci-fi', 'thriller'],
			details: {}
		},
		{
			type: 'tv' as const,
			title: 'Breaking Bad',
			cover_url: 'https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
			status: 'completed' as const,
			rating: 10,
			summary: 'A chemistry teacher turned meth producer.',
			summary_source: 'ai' as const,
			liked: 'Character arc',
			disliked: null,
			takeaways: 'Consequences of choices',
			date_started: '2024-01-01',
			date_finished: '2024-03-15',
			platform: 'Netflix',
			tags: ['drama', 'crime'],
			details: {}
		},
		{
			type: 'documentary' as const,
			title: 'Planet Earth',
			cover_url: null,
			status: 'planned' as const,
			rating: null,
			summary: null,
			summary_source: null,
			liked: null,
			disliked: null,
			takeaways: null,
			platform: 'JioHotstar',
			tags: ['nature'],
			details: {}
		},
		{
			type: 'book' as const,
			title: 'Dune',
			cover_url: null,
			status: 'in_progress' as const,
			rating: null,
			summary: 'Epic sci-fi novel set on desert planet Arrakis.',
			summary_source: 'user' as const,
			liked: 'World-building',
			disliked: null,
			takeaways: null,
			date_started: '2025-01-10',
			platform: 'Physical copy',
			tags: ['sci-fi', 'classic'],
			details: {}
		}
	].filter((r) => !existingTitles.has(r.title));

	let insertedContent: { id: string; title: string; type: string }[] = [];
	if (toInsert.length > 0) {
		const { data, error } = await supabase.from('content').insert(toInsert).select('id, title, type');
		if (error) throw error;
		insertedContent = data ?? [];
		console.log(`Inserted ${insertedContent.length} content rows`);
	} else {
		console.log('Sample content already exists, skipping content insert');
		insertedContent = (existing ?? []).map((r) => ({ id: r.id, title: r.title, type: '' }));
	}

	// Map title -> id for detail inserts
	const titleToId = new Map<string, string>();
	for (const row of [...(existing ?? []), ...insertedContent]) {
		titleToId.set(row.title, row.id);
	}

	// Insert per-type details (ignore if already present)
	const filmId = titleToId.get('Inception');
	if (filmId) {
		const { error } = await supabase.from('film_details').upsert(
			{
				content_id: filmId,
				director: 'Christopher Nolan',
				story_writer: 'Christopher Nolan',
				genre: ['Sci-Fi', 'Thriller'],
				franchise: null,
				cast: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'],
				runtime_min: 148,
				release_date: '2010-07-16'
			},
			{ onConflict: 'content_id' }
		);
		if (error) throw error;
	}

	const tvId = titleToId.get('Breaking Bad');
	if (tvId) {
		const { error } = await supabase.from('tv_details').upsert(
			{
				content_id: tvId,
				director: 'Vince Gilligan',
				story_writer: 'Vince Gilligan',
				cast: ['Bryan Cranston', 'Aaron Paul'],
				seasons: 5,
				episodes_per_season: [7, 13, 13, 13, 16]
			},
			{ onConflict: 'content_id' }
		);
		if (error) throw error;
	}

	// Documentary reuses film_details
	const docId = titleToId.get('Planet Earth');
	if (docId) {
		const { error } = await supabase.from('film_details').upsert(
			{
				content_id: docId,
				director: 'Alastair Fothergill',
				story_writer: null,
				genre: ['Documentary', 'Nature'],
				franchise: null,
				cast: null,
				runtime_min: 550,
				release_date: '2006-03-05'
			},
			{ onConflict: 'content_id' }
		);
		if (error) throw error;
	}

	const bookId = titleToId.get('Dune');
	if (bookId) {
		const { error } = await supabase.from('book_details').upsert(
			{
				content_id: bookId,
				author: 'Frank Herbert',
				publisher: 'Chilton Books',
				isbn: '9780441013593',
				page_count: 412,
				series: 'Dune'
			},
			{ onConflict: 'content_id' }
		);
		if (error) throw error;
	}

	// Sample recommendation (if Inception exists)
	if (filmId) {
		const { data: recs } = await supabase
			.from('recommendations')
			.select('id')
			.eq('source_content_id', filmId)
			.limit(1);
		if (!recs || recs.length === 0) {
			const { error } = await supabase.from('recommendations').insert({
				source_content_id: filmId,
				recommended_title: 'Interstellar',
				recommended_type: 'film',
				recommended_metadata: { year: 2014, poster: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg' },
				explanation: 'Same director and similar sci-fi depth',
				score: 0.92
			});
			if (error) throw error;
			console.log('Inserted sample recommendation');
		}
	}

	console.log('Seed completed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
	seed().catch((e) => {
		console.error('Seed failed:', e);
		process.exit(1);
	});
}

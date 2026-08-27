import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
	if (req.method === 'OPTIONS') {
		return new Response('ok', { headers: corsHeaders });
	}

	try {
		const { type, title } = await req.json();

		if (!type || !title) {
			return new Response(JSON.stringify({ error: 'type and title required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}

		if (['film', 'tv', 'documentary'].includes(type)) {
			const tmdbKey = Deno.env.get('TMDB_API_KEY');
			if (!tmdbKey) {
				return new Response(JSON.stringify({ error: 'TMDB_API_KEY not configured' }), {
					status: 500,
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
			const endpoint = type === 'tv' ? 'search/tv' : 'search/movie';
			const r = await fetch(
				`https://api.themoviedb.org/3/${endpoint}?api_key=${tmdbKey}&query=${encodeURIComponent(title)}`
			);
			const j = await r.json();
			const result = j.results?.[0] ?? null;
			return new Response(JSON.stringify(result), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		} else if (type === 'book') {
			const r = await fetch(
				`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`
			);
			const j = await r.json();
			if (j.docs?.[0]) {
				return new Response(JSON.stringify(j.docs[0]), {
					headers: { ...corsHeaders, 'Content-Type': 'application/json' }
				});
			}
			// Fallback to Google Books
			const gb = await fetch(
				`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&maxResults=1`
			);
			const gj = await gb.json();
			const item = gj.items?.[0] ?? null;
			return new Response(JSON.stringify(item), {
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		} else {
			return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});

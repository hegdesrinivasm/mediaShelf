import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
	'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
	try {
		const { content_id, limit = 5 } = await req.json();
		const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
		const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
		const supabase = createClient(supabaseUrl, supabaseKey);

		// 1. History for context
		const { data: history } = await supabase
			.from('content')
			.select('title, type, rating, tags, details')
			.eq('status', 'completed')
			.limit(50);

		let seed: any = null;
		if (content_id) {
			const { data } = await supabase.from('content').select('*').eq('id', content_id).single();
			seed = data;
		}

		const consumedTitles = new Set((history ?? []).map((h: any) => h.title.toLowerCase()));
		if (seed) consumedTitles.delete(seed.title.toLowerCase());

		// 2. Candidates from TMDB discover (use genres from seed or history)
		const tmdbKey = Deno.env.get('TMDB_API_KEY');
		let candidates: any[] = [];
		if (tmdbKey) {
			const discoverUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${tmdbKey}&sort_by=popularity.desc&page=1`;
			const r = await fetch(discoverUrl);
			const j = await r.json();
			candidates = (j.results ?? [])
				.filter((c: any) => !consumedTitles.has((c.title ?? c.name ?? '').toLowerCase()))
				.slice(0, 20)
				.map((c: any) => ({
					title: c.title ?? c.name,
					type: 'film',
					metadata: {
						poster: c.poster_path ? `https://image.tmdb.org/t/p/w500${c.poster_path}` : null,
						year: c.release_date?.slice(0, 4),
						overview: c.overview
					}
				}));
		}

		// 3. LLM rank + explain (single call)
		const llmKey = Deno.env.get('LLM_API_KEY');
		let ranked: any[] = candidates.slice(0, limit).map((c, i) => ({ ...c, explanation: 'Popular pick', score: 0.8 - i * 0.05 }));
		if (llmKey && candidates.length) {
			const profile = (history ?? []).slice(0, 5).map((h: any) => `${h.title} (${h.type})`).join(', ');
			const prompt = `User history: ${profile}. Seed: ${seed?.title ?? 'general'}. Candidates: ${candidates.map((c) => c.title).join(', ')}. Rank top ${limit} with one-line explanation and score 0-1. Return JSON {recommendations: [{title, explanation, score}]}`;
			const lr = await fetch('https://api.openai.com/v1/chat/completions', {
				method: 'POST',
				headers: { Authorization: `Bearer ${llmKey}`, 'Content-Type': 'application/json' },
				body: JSON.stringify({
					model: 'gpt-4o-mini',
					response_format: { type: 'json_object' },
					messages: [
						{ role: 'system', content: 'Return JSON {recommendations: [{title, explanation, score}]}' },
						{ role: 'user', content: prompt }
					]
				})
			});
			if (lr.ok) {
				const lj = await lr.json();
				try {
					const parsed = JSON.parse(lj.choices[0].message.content);
					const recs = parsed.recommendations ?? [];
					ranked = recs.slice(0, limit).map((r: any) => {
						const cand = candidates.find((c) => c.title.toLowerCase() === r.title.toLowerCase()) ?? candidates[0];
						return { ...cand, title: r.title, explanation: r.explanation, score: Number(r.score) || 0.7 };
					});
				} catch {
					// keep fallback
				}
			}
		}

		// 4. Cache optionally
		if (content_id && ranked.length) {
			const rows = ranked.map((r) => ({
				source_content_id: content_id,
				recommended_title: r.title,
				recommended_type: r.type,
				recommended_metadata: r.metadata,
				explanation: r.explanation,
				score: r.score
			}));
			await supabase.from('recommendations').insert(rows as any);
		}

		return new Response(JSON.stringify({ recommendations: ranked }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});

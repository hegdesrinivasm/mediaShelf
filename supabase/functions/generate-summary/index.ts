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
		const { title, type } = await req.json();
		if (!title) {
			return new Response(JSON.stringify({ error: 'title required' }), {
				status: 400,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
		const key = Deno.env.get('LLM_API_KEY');
		if (!key) {
			return new Response(JSON.stringify({ error: 'LLM_API_KEY not configured' }), {
				status: 500,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
		const r = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				model: 'gpt-4o-mini',
				response_format: { type: 'json_object' },
				messages: [
					{ role: 'system', content: 'Return JSON {summary: string} with a concise 3-sentence summary.' },
					{ role: 'user', content: `Summarize ${type ?? 'content'} titled "${title}" in 3 sentences` }
				]
			})
		});
		if (!r.ok) {
			const t = await r.text();
			return new Response(JSON.stringify({ error: t }), {
				status: 502,
				headers: { ...corsHeaders, 'Content-Type': 'application/json' }
			});
		}
		const j = await r.json();
		let summary: string;
		try {
			summary = JSON.parse(j.choices[0].message.content).summary;
		} catch {
			summary = j.choices[0].message.content;
		}
		return new Response(JSON.stringify({ summary, summary_source: 'ai' }), {
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	} catch (e) {
		return new Response(JSON.stringify({ error: String(e) }), {
			status: 500,
			headers: { ...corsHeaders, 'Content-Type': 'application/json' }
		});
	}
});

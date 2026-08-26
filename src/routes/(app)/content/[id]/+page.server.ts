import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const { data, error: err } = await supabase.from('content').select('*').eq('id', params.id).single();
	if (err || !data) throw error(404, 'Not found');

	let details: Record<string, unknown> | null = null;
	if (data.type === 'book') {
		const { data: d } = await supabase.from('book_details').select('*').eq('content_id', params.id).single();
		details = d as any;
	} else if (data.type === 'tv') {
		const { data: d } = await supabase.from('tv_details').select('*').eq('content_id', params.id).single();
		details = d as any;
	} else {
		const { data: d } = await supabase.from('film_details').select('*').eq('content_id', params.id).single();
		details = d as any;
	}

	return { item: data, details };
};

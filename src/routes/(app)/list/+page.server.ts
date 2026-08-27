import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const type = url.searchParams.get('type');
	const tag = url.searchParams.get('tag');
	let query = supabase.from('content').select('*').eq('status', 'planned').order('created_at', { ascending: false });
	if (type) query = query.eq('type', type as any);
	if (tag) query = query.contains('tags', [tag]);
	const { data, error } = await query;
	if (error) console.error('list load error', error);
	return { items: data ?? [] };
};

import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async ({ url }) => {
	const type = url.searchParams.get('type');
	let query = supabase
		.from('content')
		.select('*')
		.in('status', ['completed', 'dropped'] as any)
		.order('date_finished', { ascending: false, nullsFirst: false })
		.order('created_at', { ascending: false });
	if (type) query = query.eq('type', type as any);
	const { data, error } = await query;
	if (error) console.error('history load error', error);
	return { items: data ?? [] };
};

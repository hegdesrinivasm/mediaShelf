import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabase';

export const load: PageServerLoad = async () => {
	const { data: completed } = await supabase.from('content').select('type, rating, platform, date_finished, created_at, tags').eq('status', 'completed');
	const { data: all } = await supabase.from('content').select('type, rating, platform, status').limit(1000);
	const { data: filmDetails } = await supabase.from('film_details').select('genre');

	const yearlyMap = new Map<string, number>();
	for (const row of completed ?? []) {
		if (row.date_finished) {
			const y = new Date(row.date_finished).getFullYear().toString();
			yearlyMap.set(y, (yearlyMap.get(y) ?? 0) + 1);
		}
	}
	const yearly = [...yearlyMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.label.localeCompare(a.label));

	const byType = new Map<string, number>();
	for (const row of all ?? []) byType.set(row.type, (byType.get(row.type) ?? 0) + 1);
	const byTypeArr = [...byType.entries()].map(([label, value]) => ({ label, value }));

	const genreMap = new Map<string, number>();
	for (const fd of filmDetails ?? []) for (const g of (fd as any).genre ?? []) genreMap.set(g, (genreMap.get(g) ?? 0) + 1);
	const genres = [...genreMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);

	const ratingMap = new Map<string, number>();
	for (const row of completed ?? []) if (row.rating) ratingMap.set(String(row.rating), (ratingMap.get(String(row.rating)) ?? 0) + 1);
	const ratings = [...ratingMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => Number(a.label) - Number(b.label));

	const platformMap = new Map<string, number>();
	for (const row of all ?? []) if (row.platform) platformMap.set(row.platform, (platformMap.get(row.platform) ?? 0) + 1);
	const platforms = [...platformMap.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10);

	return { yearly, byType: byTypeArr, genres, ratings, platforms, total: all?.length ?? 0, completedCount: completed?.length ?? 0 };
};

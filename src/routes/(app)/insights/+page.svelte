<script lang="ts">
	import Chart from '$lib/components/Chart.svelte';
	import type { PageProps } from './$types';
	import { supabase } from '$lib/supabase';

	let { data }: PageProps = $props();
	let narrative = $state<string | null>(null);
	let narrLoading = $state(false);

	async function generateNarrative() {
		narrLoading = true;
		try {
			const { data: res, error } = await supabase.functions.invoke('insights-narrative', { body: data });
			if (error) throw new Error(error.message);
			narrative = (res as any)?.narrative ?? 'No narrative.';
		} catch (e) {
			narrative = e instanceof Error ? e.message : String(e);
		} finally {
			narrLoading = false;
		}
	}
</script>

<div class="p-6 space-y-6">
	<h1 class="text-2xl font-bold">Insights</h1>
	<p class="text-sm text-gray-500">Total: {data.total} • Completed: {data.completedCount}</p>

	<div class="grid md:grid-cols-2 gap-4">
		<Chart title="Completed per year" data={data.yearly} />
		<Chart title="By type" data={data.byType} />
		<Chart title="Genre breakdown (film/doc)" data={data.genres} />
		<Chart title="Rating distribution" data={data.ratings} />
		<Chart title="Platform usage" data={data.platforms} />
	</div>

	<div class="border rounded p-4 bg-gray-50">
		<h3 class="font-semibold text-sm mb-2">AI Narrative (optional)</h3>
		<button onclick={generateNarrative} disabled={narrLoading} class="px-3 py-1 bg-purple-600 text-white rounded text-sm disabled:opacity-50" data-testid="narrative-btn">
			{narrLoading ? 'Generating…' : 'Generate summary'}
		</button>
		{#if narrative}<p class="text-sm mt-2 whitespace-pre-wrap" data-testid="narrative">{narrative}</p>{/if}
	</div>
</div>

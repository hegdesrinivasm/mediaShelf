<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { onMount } from 'svelte';

	let recommendations: Array<{ title: string; type: string; metadata: any; explanation: string; score: number }> = $state([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	async function load() {
		loading = true;
		error = null;
		try {
			const { data, error: fnErr } = await supabase.functions.invoke('recommend', { body: {} });
			if (fnErr) throw new Error(fnErr.message);
			recommendations = (data as any)?.recommendations ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	onMount(load);
</script>

<div class="p-6 space-y-4">
	<h1 class="text-2xl font-bold">Recommendations</h1>
	<p class="text-sm text-gray-500">Based on your watch/read history — pipeline: history → TMDB candidates → LLM rank → cache.</p>

	<button onclick={load} class="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50" disabled={loading} data-testid="refresh-btn">
		{loading ? 'Loading…' : 'Refresh'}
	</button>

	{#if error}<p class="text-red-600 text-sm" data-testid="error">{error}</p>{/if}

	{#if recommendations.length === 0 && !loading}
		<p class="text-gray-500" data-testid="empty">No recommendations yet — add some completed entries.</p>
	{:else}
		<div class="grid gap-4" data-testid="rec-grid">
			{#each recommendations as rec (rec.title)}
				<div class="border rounded p-4 flex gap-4">
					{#if rec.metadata?.poster}
						<img src={rec.metadata.poster} alt={rec.title} class="w-20 h-auto rounded" />
					{/if}
					<div>
						<h3 class="font-semibold">{rec.title}</h3>
						<p class="text-xs text-gray-500">{rec.type} • score {rec.score}</p>
						<p class="text-sm mt-1">{rec.explanation}</p>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

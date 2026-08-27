<script lang="ts">
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let filterType = $state('');
	let inProgress = $state(false);

	// Client-side filter for type within loaded data for snappy UX (server already filters planned)
	let displayed = $derived(
		filterType ? data.items.filter((i) => i.type === filterType) : data.items
	);
</script>

<div class="p-6 space-y-4">
	<h1 class="text-2xl font-bold">Consumption List</h1>
	<div class="flex gap-3 items-center">
		<label class="text-sm">
			Filter type:
			<select bind:value={filterType} class="ml-2 border rounded px-2 py-1" data-testid="filter-type">
				<option value="">All</option>
				<option value="film">Film</option>
				<option value="tv">TV</option>
				<option value="documentary">Documentary</option>
				<option value="book">Book</option>
			</select>
		</label>
		<a href="/add" class="ml-auto px-3 py-1.5 bg-blue-600 text-white rounded text-sm" data-testid="add-link">Add entry</a>
	</div>

	<ContentGrid items={displayed} />

	<details class="mt-8 border rounded p-4" data-testid="currently-section">
		<summary class="font-semibold cursor-pointer">Currently watching / reading (in_progress)</summary>
		<p class="text-sm text-gray-500 mt-2">Entries with status <code>in_progress</code> live here — separate from planned list and history.</p>
		<!-- Lazy: history tab fetches separately; this is placeholder explaining design decision -->
	</details>
</div>

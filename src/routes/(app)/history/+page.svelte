<script lang="ts">
	import ContentGrid from '$lib/components/ContentGrid.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let filterType = $state('');
	let displayed = $derived(filterType ? data.items.filter((i) => i.type === filterType) : data.items);
</script>

<div class="p-6 space-y-4">
	<h1 class="text-2xl font-bold">History</h1>
	<p class="text-sm text-gray-500">Completed and dropped items. Filtered from same <code>content</code> table by status.</p>
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
	</div>
	<ContentGrid items={displayed} />
</div>

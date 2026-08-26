<script lang="ts">
	import ContentCard from './ContentCard.svelte';

	let { items } = $props<{
		items: Array<{
			id: string;
			title: string;
			cover_url: string | null;
			type: string;
			status: string;
			rating: number | null;
			platform: string | null;
			tags: string[] | null;
		}>;
	}>();
</script>

{#if items.length === 0}
	<p class="text-gray-500 py-8 text-center" data-testid="empty-grid">No items found.</p>
{:else}
	<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4" data-testid="content-grid">
		{#each items as item (item.id)}
			<ContentCard {item} />
		{/each}
	</div>
{/if}

<script lang="ts">
	let { item } = $props<{
		item: {
			id: string;
			title: string;
			cover_url: string | null;
			type: string;
			status: string;
			rating: number | null;
			platform: string | null;
			tags: string[] | null;
		};
	}>();
</script>

<a
	href="/content/{item.id}"
	class="block border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white"
	data-testid="content-card-{item.id}"
>
	{#if item.cover_url}
		<img src={item.cover_url} alt={item.title} class="w-full h-64 object-cover" />
	{:else}
		<div class="w-full h-64 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">
			No cover
		</div>
	{/if}
	<div class="p-3 space-y-1">
		<h3 class="font-semibold truncate" title={item.title}>{item.title}</h3>
		<p class="text-xs text-gray-500 capitalize">{item.type} • {item.status}</p>
		{#if item.rating}
			<p class="text-sm">★ {item.rating}/10</p>
		{/if}
		{#if item.platform}
			<p class="text-xs text-gray-600">{item.platform}</p>
		{/if}
		{#if item.tags?.length}
			<div class="flex flex-wrap gap-1">
				{#each item.tags as tag}
					<span class="text-xs bg-gray-100 px-1.5 py-0.5 rounded">{tag}</span>
				{/each}
			</div>
		{/if}
	</div>
</a>

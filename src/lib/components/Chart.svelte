<script lang="ts">
	let { title, data } = $props<{
		title: string;
		data: Array<{ label: string; value: number }>;
	}>();

	let max = $derived(Math.max(1, ...data.map((d: { value: number }) => d.value)));
</script>

<div class="border rounded p-4 bg-white" data-testid="chart-{title}">
	<h3 class="font-semibold text-sm mb-3">{title}</h3>
	{#if data.length === 0}
		<p class="text-xs text-gray-500">No data yet.</p>
	{:else}
		<div class="space-y-2">
			{#each data as row}
				<div class="flex items-center gap-2 text-xs">
					<span class="w-24 truncate text-right">{row.label}</span>
					<div class="flex-1 bg-gray-100 rounded h-4 overflow-hidden">
						<div class="bg-blue-600 h-4" style="width: {(row.value / max) * 100}%"></div>
					</div>
					<span class="w-8 text-right">{row.value}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>

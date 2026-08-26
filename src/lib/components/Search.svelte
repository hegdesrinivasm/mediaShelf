<script lang="ts">
	let { value = $bindable('') } = $props<{ value?: string }>();
</script>

<input
	bind:value
	placeholder="Search title, tags…"
	class="w-full border rounded px-3 py-2 text-sm"
	data-testid="search-input"
/>

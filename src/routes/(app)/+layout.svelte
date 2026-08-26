<script lang="ts">
	let { children } = $props();
</script>

<nav class="border-b bg-white sticky top-0 z-10">
	<div class="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
		<a href="/" class="font-bold text-lg">mediaShelf</a>
		<div class="flex gap-4 text-sm">
			<a href="/list" class="hover:underline" data-testid="nav-list">List</a>
			<a href="/history" class="hover:underline" data-testid="nav-history">History</a>
			<a href="/add" class="hover:underline" data-testid="nav-add">Add</a>
			<a href="/insights" class="hover:underline" data-testid="nav-insights">Insights</a>
		</div>
	</div>
</nav>
<main class="max-w-6xl mx-auto">
	{@render children()}
</main>

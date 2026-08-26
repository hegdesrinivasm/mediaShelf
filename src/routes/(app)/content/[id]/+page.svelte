<script lang="ts">
	import { supabase } from '$lib/supabase';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	// svelte-ignore state_referenced_locally
	let item = $state(data.item);
	// svelte-ignore state_referenced_locally
	let details = $state(data.details);

	let rating = $state(item.rating ?? null);
	let liked = $state(item.liked ?? '');
	let disliked = $state(item.disliked ?? '');
	let takeaways = $state(item.takeaways ?? '');
	let summary = $state(item.summary ?? '');
	let summary_source = $state(item.summary_source ?? 'user');
	let status = $state(item.status);
	let date_started = $state(item.date_started ?? '');
	let date_finished = $state(item.date_finished ?? '');
	let platform = $state(item.platform ?? '');
	let platform_url = $state(item.platform_url ?? '');
	let saving = $state(false);
	let summaryLoading = $state(false);
	let msg = $state<string | null>(null);
	let err = $state<string | null>(null);

	async function generateSummary() {
		summaryLoading = true;
		err = null;
		try {
			const { data: res, error: fnErr } = await supabase.functions.invoke('generate-summary', {
				body: { title: item.title, type: item.type }
			});
			if (fnErr) throw new Error(fnErr.message);
			summary = (res as any)?.summary ?? '';
			summary_source = 'ai';
			msg = 'Summary generated — save to persist';
		} catch (e) {
			err = e instanceof Error ? e.message : String(e);
		} finally {
			summaryLoading = false;
		}
	}

	async function save() {
		saving = true;
		err = null;
		msg = null;
		const { error } = await supabase
			.from('content')
			.update({
				rating,
				liked: liked || null,
				disliked: disliked || null,
				takeaways: takeaways || null,
				summary: summary || null,
				summary_source: summary ? summary_source : null,
				status: status as any,
				date_started: date_started || null,
				date_finished: date_finished || null,
				platform: platform || null,
				platform_url: platform_url || null
			} as any)
			.eq('id', item.id);
		if (error) err = error.message;
		else msg = 'Saved';
		saving = false;
	}

	async function remove() {
		if (!confirm('Delete this entry?')) return;
		const { error } = await supabase.from('content').delete().eq('id', item.id);
		if (error) err = error.message;
		else window.location.href = '/list';
	}
</script>

<div class="max-w-3xl mx-auto p-6 space-y-6">
	<a href="/list" class="text-sm text-blue-600 hover:underline">← Back to list</a>

	<div class="flex gap-6">
		{#if item.cover_url}
			<img src={item.cover_url} alt={item.title} class="w-48 h-auto rounded border" />
		{/if}
		<div>
			<h1 class="text-2xl font-bold">{item.title}</h1>
			<p class="text-sm text-gray-600 capitalize">{item.type} • {item.status}</p>
			{#if details}
				<pre class="mt-2 bg-gray-50 p-2 rounded text-xs overflow-auto" data-testid="details">{JSON.stringify(
						details,
						null,
						2
					)}</pre>
			{/if}
		</div>
	</div>

	<div class="space-y-4 border-t pt-4" data-testid="edit-form">
		<label class="block text-sm">Status
			<select bind:value={status} class="mt-1 w-full border rounded px-3 py-2" data-testid="status-select">
				<option value="planned">planned</option>
				<option value="in_progress">in_progress</option>
				<option value="completed">completed</option>
				<option value="dropped">dropped</option>
			</select>
		</label>

		<label class="block text-sm">Rating (1-10)
			<input type="number" min="1" max="10" bind:value={rating} class="w-full border rounded px-3 py-2 mt-1" data-testid="rating-input" />
		</label>

		<label class="block text-sm">Summary
			<textarea bind:value={summary} rows="3" class="w-full border rounded px-3 py-2 mt-1" data-testid="summary-input"></textarea>
			<div class="mt-1 flex gap-2 items-center">
				<select bind:value={summary_source} class="border rounded px-2 py-1 text-xs" data-testid="summary-source">
					<option value="user">user</option>
					<option value="ai">ai</option>
				</select>
				<button onclick={generateSummary} disabled={summaryLoading || saving} class="px-3 py-1 text-xs bg-purple-600 text-white rounded disabled:opacity-50" data-testid="generate-summary-btn">
					{summaryLoading ? 'Generating…' : 'Generate with AI'}
				</button>
			</div>
		</label>

		<label class="block text-sm">Liked
			<textarea bind:value={liked} rows="2" class="w-full border rounded px-3 py-2 mt-1" data-testid="liked-input"></textarea>
		</label>
		<label class="block text-sm">Disliked
			<textarea bind:value={disliked} rows="2" class="w-full border rounded px-3 py-2 mt-1" data-testid="disliked-input"></textarea>
		</label>
		<label class="block text-sm">Takeaways
			<textarea bind:value={takeaways} rows="2" class="w-full border rounded px-3 py-2 mt-1" data-testid="takeaways-input"></textarea>
		</label>

		<div class="grid grid-cols-2 gap-4">
			<label class="block text-sm">Date started
				<input type="date" bind:value={date_started} class="w-full border rounded px-3 py-2 mt-1" data-testid="date-started" />
			</label>
			<label class="block text-sm">Date finished
				<input type="date" bind:value={date_finished} class="w-full border rounded px-3 py-2 mt-1" data-testid="date-finished" />
			</label>
		</div>

		<label class="block text-sm">Platform
			<input bind:value={platform} class="w-full border rounded px-3 py-2 mt-1" data-testid="platform-input" />
		</label>
		<label class="block text-sm">Platform URL
			<input bind:value={platform_url} class="w-full border rounded px-3 py-2 mt-1" data-testid="platform-url" />
		</label>

		<div class="flex gap-3">
			<button onclick={save} disabled={saving} class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" data-testid="save-button">
				{saving ? 'Saving…' : 'Save'}
			</button>
			<button onclick={remove} class="px-4 py-2 bg-red-600 text-white rounded" data-testid="delete-button">Delete</button>
		</div>

		{#if msg}<p class="text-green-600 text-sm" data-testid="msg">{msg}</p>{/if}
		{#if err}<p class="text-red-600 text-sm" data-testid="error">{err}</p>{/if}
	</div>
</div>

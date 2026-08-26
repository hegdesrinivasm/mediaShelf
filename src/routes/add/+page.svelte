<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { mapTmdbToFilmDetails, mapTmdbToTvDetails } from '$lib/tmdb';
	import { mapOpenLibraryToBookDetails, mapGoogleBooksToBookDetails } from '$lib/books';

	let type: 'film' | 'tv' | 'documentary' | 'book' = $state('film');
	let title = $state('');
	let status: 'planned' | 'in_progress' | 'completed' | 'dropped' = $state('planned');
	let loading = $state(false);
	let error = $state<string | null>(null);
	let success = $state<string | null>(null);
	let coverPreview: string | null = $state(null);
	let fetchedDetails: Record<string, unknown> | null = $state(null);
	let rating: number | null = $state(null);
	let platform = $state('');
	let tags = $state('');

	async function fetchMetadata() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		loading = true;
		error = null;
		success = null;
		try {
			const { data, error: fnError } = await supabase.functions.invoke('fetch-metadata', {
				body: { type, title }
			});
			if (fnError) throw new Error(fnError.message);
			if (!data) {
				error = 'No results found';
				return;
			}
			if (type === 'book') {
				const mapped = data.title
					? mapOpenLibraryToBookDetails(data)
					: data.volumeInfo
						? mapGoogleBooksToBookDetails(data)
						: mapOpenLibraryToBookDetails(data);
				fetchedDetails = mapped as Record<string, unknown>;
				coverPreview = (mapped.cover_url as string) ?? null;
			} else if (type === 'tv') {
				const mapped = mapTmdbToTvDetails(data);
				fetchedDetails = mapped as Record<string, unknown>;
				coverPreview = (mapped.cover_url as string) ?? null;
			} else {
				const mapped = mapTmdbToFilmDetails(data);
				fetchedDetails = mapped as Record<string, unknown>;
				coverPreview = (mapped.cover_url as string) ?? null;
			}
			success = 'Metadata fetched — review and save.';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	async function save() {
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		loading = true;
		error = null;
		try {
			const { data: content, error: insertError } = await supabase
				.from('content')
				.insert({
					type,
					title: title.trim(),
					cover_url: coverPreview,
					status,
					rating,
					platform: platform || null,
					tags: tags
						.split(',')
						.map((t) => t.trim())
						.filter(Boolean),
					details: (fetchedDetails as any) ?? {}
				})
				.select()
				.single();

			if (insertError) throw new Error(insertError.message);
			if (!content) throw new Error('Insert returned no data');

			if (fetchedDetails && type !== 'book') {
				if (type === 'tv') {
					const d = fetchedDetails as any;
					await supabase.from('tv_details').insert({
						content_id: content.id,
						director: d.director,
						story_writer: d.story_writer ?? null,
						cast: d.cast ?? [],
						seasons: d.seasons ?? null,
						episodes_per_season: d.episodes_per_season ?? null
					});
				} else {
					const d = fetchedDetails as any;
					await supabase.from('film_details').insert({
						content_id: content.id,
						director: d.director ?? null,
						story_writer: (d.story_writer as string) ?? null,
						genre: (d.genre as string[]) ?? [],
						franchise: (d.franchise as string) ?? null,
						cast: (d.cast as string[]) ?? [],
						runtime_min: (d.runtime_min as number) ?? null,
						release_date: (d.release_date as string) ?? null
					});
				}
			} else if (fetchedDetails && type === 'book') {
				const d = fetchedDetails as any;
				await supabase.from('book_details').insert({
					content_id: content.id,
					author: d.author ?? null,
					publisher: d.publisher ?? null,
					isbn: d.isbn ?? null,
					page_count: d.page_count ?? null,
					series: d.series ?? null
				});
			}

			success = `Saved "${title}" as ${status}.`;
			title = '';
			coverPreview = null;
			fetchedDetails = null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="max-w-2xl mx-auto p-6 space-y-6">
	<h1 class="text-2xl font-bold">Add Entry</h1>

	<div class="space-y-4" data-testid="add-form">
		<label class="block">
			<span class="text-sm font-medium">Type</span>
			<select bind:value={type} class="mt-1 w-full border rounded px-3 py-2" data-testid="type-select">
				<option value="film">Film</option>
				<option value="tv">TV Show</option>
				<option value="documentary">Documentary</option>
				<option value="book">Book</option>
			</select>
		</label>

		<label class="block">
			<span class="text-sm font-medium">Title</span>
			<input
				bind:value={title}
				placeholder="Enter title"
				class="mt-1 w-full border rounded px-3 py-2"
				data-testid="title-input"
			/>
		</label>

		<div class="flex gap-3">
			<button
				onclick={fetchMetadata}
				disabled={loading}
				class="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
				data-testid="fetch-button"
			>
				{loading ? 'Fetching…' : 'Fetch metadata'}
			</button>
			<button
				onclick={save}
				disabled={loading}
				class="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
				data-testid="save-button"
			>
				Save
			</button>
		</div>

		{#if coverPreview}
			<div class="border rounded p-3" data-testid="cover-preview">
				<img src={coverPreview} alt="Cover preview" class="max-h-64 rounded" />
			</div>
		{/if}

		{#if fetchedDetails}
			<pre class="bg-gray-50 p-3 rounded text-xs overflow-auto" data-testid="details-preview">{JSON.stringify(
					fetchedDetails,
					null,
					2
				)}</pre>
		{/if}

		<label class="block">
			<span class="text-sm font-medium">Status</span>
			<select bind:value={status} class="mt-1 w-full border rounded px-3 py-2" data-testid="status-select">
				<option value="planned">Planned</option>
				<option value="in_progress">In Progress</option>
				<option value="completed">Completed</option>
				<option value="dropped">Dropped</option>
			</select>
		</label>

		<label class="block">
			<span class="text-sm font-medium">Rating (1-10)</span>
			<input type="number" min="1" max="10" bind:value={rating} class="mt-1 w-full border rounded px-3 py-2" data-testid="rating-input" />
		</label>

		<label class="block">
			<span class="text-sm font-medium">Platform</span>
			<input bind:value={platform} placeholder="Netflix, Theatre, Physical copy…" class="mt-1 w-full border rounded px-3 py-2" data-testid="platform-input" />
		</label>

		<label class="block">
			<span class="text-sm font-medium">Tags (comma-separated)</span>
			<input bind:value={tags} placeholder="sci-fi, kdrama" class="mt-1 w-full border rounded px-3 py-2" data-testid="tags-input" />
		</label>
	</div>

	{#if error}
		<p class="text-red-600" data-testid="error-msg">{error}</p>
	{/if}
	{#if success}
		<p class="text-green-600" data-testid="success-msg">{success}</p>
	{/if}
</div>

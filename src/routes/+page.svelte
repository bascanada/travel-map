<script lang="ts">
	import { onMount } from 'svelte';
	import { getImageUrl } from '$lib/imageUtils';
	import type { TravelIndex, TravelIndexEntry } from '$lib/types/travel-index';

	let travels: TravelIndexEntry[] = [];
	let isLoading = true;
	let error: string | null = null;

	onMount(async () => {
		try {
			const response = await fetch(__APP_CONFIG__.travelIndex);
			if (!response.ok) {
				throw new Error(`Failed to load travel index: ${response.statusText}`);
			}

			const data: TravelIndex = await response.json();
			travels = data.travels || [];
			isLoading = false;
		} catch (err) {
			console.error('Error loading travel index:', err);
			error = err instanceof Error ? err.message : 'Failed to load travel data';
			isLoading = false;
		}
	});
</script>

<div class="container mx-auto p-4">
	<header class="text-center my-8">
		<h1 class="h1">{__APP_CONFIG__.title}</h1>
		<p>{__APP_CONFIG__.description}</p>
	</header>

	<main>
		{#if isLoading}
			<div class="text-center p-4">Loading travel data...</div>
		{:else if error}
			<div class="alert variant-filled-error">{error}</div>
		{:else if travels.length === 0}
			<div class="text-center p-4">No travel data available</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each travels as travel}
					<a href={`/travel/${travel.id}`} class="card preset-filled-surface-100-900 border-[1px] border-surface-200-800 card-hover divide-surface-200-800 block max-w-md divide-y overflow-hidden">
						<header>
							{#if travel.coverPhotoUrl}
								<img
									src={getImageUrl(travel.coverPhotoUrl, 'medium')}
									alt={travel.name}
									crossorigin="anonymous"
									class="h-48 w-full object-cover"
								/>
							{:else}
								<div class="h-48 w-full bg-surface-500 flex items-center justify-center">
									<span class="material-icons text-6xl">public</span>
								</div>
							{/if}
						</header>
						<div class="p-4">
							<h2 class="h2">{travel.name || 'Untitled Travel'}</h2>
							<div class="flex items-center text-sm text-surface-500 mb-2">
								<span class="material-icons text-base mr-2">calendar_today</span>
								<span>
									{new Date(travel.startDate).toLocaleDateString()}
									{travel.endDate ? ` - ${new Date(travel.endDate).toLocaleDateString()}` : ''}
								</span>
							</div>
							{#if travel.description}
								<p class="text-sm text-surface-600-300-token overflow-hidden line-clamp-2">
									{travel.description}
								</p>
							{/if}
						</div>
						<footer class="p-4 text-right">
							<span class="btn variant-soft-primary">View Travel &rarr;</span>
						</footer>
					</a>
				{/each}
			</div>
		{/if}
	</main>
</div>

<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';
	import { getLogoUrl, getHomeUrl } from '$lib';

	$: isHomePage = $page.url.pathname === getHomeUrl();
</script>

<AppBar background="bg-surface-100-800-token">
	<svelte:fragment slot="lead">
		<a href={getHomeUrl()} class="flex items-center space-x-2">
			<img src={getLogoUrl()} alt="logo" class="w-8 h-8" />
			<strong class="text-xl">
				{__APP_CONFIG__.title}
			</strong>
		</a>
	</svelte:fragment>
	<svelte:fragment slot="trail">
		<nav class="flex space-x-4">
			<a
				href={getHomeUrl()}
				class="btn {isHomePage ? 'variant-soft-primary' : 'variant-ghost-surface'}"
			>
				Home
			</a>
		</nav>
	</svelte:fragment>
</AppBar>

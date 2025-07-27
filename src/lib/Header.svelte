<script lang="ts">
    import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';

	$: isHomePage = $page.url.pathname === '/';
</script>

<AppBar background="bg-surface-100-800-token">
	<svelte:fragment slot="lead">
		<a href="/" class="flex items-center space-x-2">
			<img src={__APP_CONFIG__.logo} alt="logo" class="w-8 h-8" />
			<strong class="text-xl">
				{__APP_CONFIG__.title}
			</strong>
		</a>
	</svelte:fragment>
	<svelte:fragment slot="trail">
		<nav class="flex space-x-4">
			<a
				href="/"
				class="btn {isHomePage ? 'variant-soft-primary' : 'variant-ghost-surface'}"
			>
				Home
			</a>
		</nav>
	</svelte:fragment>
</AppBar>

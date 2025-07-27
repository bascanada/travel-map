<script lang="ts">
	import '../app.css';
	import Header from '$lib/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
	<title>{__APP_CONFIG__.title}</title>
	<link rel="icon" href={__APP_CONFIG__.favicon} />
</svelte:head>

<div class="flex min-h-screen flex-col bg-surface-100-800-token">
	<Header />
	<main class="flex-grow">
		{@render children()}
	</main>
</div>

<script lang="ts">
	import '../app.css';
	import Header from '$lib/Header.svelte';

	let { children } = $props();
</script>

<svelte:head>
	<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
	<title>Travel Explorer</title>
</svelte:head>

<div class="app-container">
	<Header />
	<main>
		{@render children()}
	</main>
</div>

<style>
	.app-container {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	
	main {
		flex: 1;
	}
</style>

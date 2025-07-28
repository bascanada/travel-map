<script lang="ts">
	import { getImageUrl, getImageSrcSet } from './imageUtils';

	export let src: string;
	export let size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium';
	export let alt: string = '';
	export let responsive: boolean = true;
	export let loading: 'lazy' | 'eager' = 'lazy';
	
	let className: string = '';
	export { className as class };

	$: imageUrl = getImageUrl(src, size);
	$: srcSet = responsive ? getImageSrcSet(src) : '';
	$: sizes = responsive ? '(max-width: 640px) 400px, (max-width: 1024px) 800px, 1200px' : '';
</script>

{#if responsive}
	<img
		src={imageUrl}
		srcset={srcSet}
		{sizes}
		{alt}
		{loading}
		crossorigin="anonymous"
		class={className}
		{...$$restProps}
	/>
{:else}
	<img
		src={imageUrl}
		{alt}
		{loading}
		crossorigin="anonymous"
		class={className}
		{...$$restProps}
	/>
{/if}

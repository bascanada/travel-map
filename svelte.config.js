import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import config from './travel-site.config.js';

/** @type {import('@sveltejs/kit').Config} */

const svelteConfig = {
       preprocess: vitePreprocess(),
       kit: {
	       adapter: adapter({
		       pages: '.output',
		       assets: '.output',
		       fallback: null
	       }),
	       paths: {
		       base: config.basePath
	       }
       }
};

export default svelteConfig;
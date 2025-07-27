import config from '../travel-site.config.js';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	return await resolve(event, {
		transformPageChunk: ({ html }) => {
			return html.replace('<html lang="en">', `<html lang="en" data-theme="${config.skeletonTheme}">`);
		}
	});
};

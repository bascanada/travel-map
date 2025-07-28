/**
 * Path utilities for handling base paths and URL construction
 */

/**
 * Get the full path with base path applied
 * @param path - The relative path to make absolute
 * @returns The full path with base path prefix
 */
export function getFullPath(path: string): string {
	// Remove leading slash if present, then add base path
	const cleanPath = path.startsWith('/') ? path.slice(1) : path;
	return __APP_CONFIG__.basePath ? `${__APP_CONFIG__.basePath}/${cleanPath}` : `/${cleanPath}`;
}

/**
 * Get the travel index URL with proper base path
 * @returns The full URL to the travel index
 */
export function getTravelIndexUrl(): string {
	return getFullPath(__APP_CONFIG__.travelIndex);
}

/**
 * Get the logo URL with proper base path
 * @returns The full URL to the logo
 */
export function getLogoUrl(): string {
	return getFullPath(__APP_CONFIG__.logo);
}

/**
 * Get the favicon URL with proper base path
 * @returns The full URL to the favicon
 */
export function getFaviconUrl(): string {
	return getFullPath(__APP_CONFIG__.favicon);
}

/**
 * Get a travel URL with proper base path
 * @param travelId - The travel ID
 * @returns The full URL to the travel page
 */
export function getTravelUrl(travelId: string): string {
	return getFullPath(`travel/${travelId}`);
}

/**
 * Get the home URL with proper base path
 * @returns The full URL to the home page
 */
export function getHomeUrl(): string {
	return __APP_CONFIG__.basePath || '/';
}

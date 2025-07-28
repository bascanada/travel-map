/**
 * Image URL utility for handling local and Cloudinary images
 */

/**
 * Generate an image URL based on the current image provider configuration
 * @param {string} imagePath - The image path (local path or Cloudinary public ID)
 * @param {'thumbnail' | 'medium' | 'large' | 'original'} [size='medium'] - The desired image size
 * @returns {string} The complete image URL
 */
export function getImageUrl(imagePath: string, size: 'thumbnail' | 'medium' | 'large' | 'original' = 'medium'): string {
	if (!imagePath) return '';

	// Get config from global __APP_CONFIG__
	const config = (globalThis as any).__APP_CONFIG__;
	if (!config) {
		console.warn('__APP_CONFIG__ not available, falling back to original path');
		return imagePath;
	}

	// If provider is local, return the path as-is
	if (config.images.provider === 'local') {
		return imagePath;
	}

	// If provider is cloudinary, generate the Cloudinary URL
	if (config.images.provider === 'cloudinary' && config.images.cloudinary) {
		const { baseUrl, transformations } = config.images.cloudinary;
		const transformation = transformations?.[size] || transformations?.medium || '';
		
		// Remove any leading slash from imagePath for Cloudinary
		let cleanPath = imagePath.replace(/^\/+/, '');
		
		// Fix duplicated paths that might have occurred during upload
		// Pattern: travel_id/itinerary/travel_id/itinerary/filename -> travel_id/itinerary/filename
		const pathParts = cleanPath.split('/');
		if (pathParts.length >= 4) {
			// Check if we have a pattern like: usa_2025/alabama/usa_2025/alabama/filename
			if (pathParts[0] === pathParts[2] && pathParts[1] === pathParts[3]) {
				cleanPath = pathParts.slice(2).join('/'); // Remove the first two duplicated parts
			}
		}
		
		// If it's already a full Cloudinary URL, return as-is
		if (imagePath.startsWith('https://res.cloudinary.com/')) {
			return imagePath;
		}
		
		// Build the Cloudinary URL
		if (transformation) {
			return `${baseUrl}/${transformation}/${cleanPath}`;
		} else {
			return `${baseUrl}/${cleanPath}`;
		}
	}

	// Fallback to original path
	return imagePath;
}

/**
 * Get multiple image sizes for responsive images
 * @param {string} imagePath - The image path
 * @returns {{thumbnail: string, medium: string, large: string, original: string}} Object with different image sizes
 */
export function getResponsiveImageUrls(imagePath: string): { thumbnail: string, medium: string, large: string, original: string } {
	return {
		thumbnail: getImageUrl(imagePath, 'thumbnail'),
		medium: getImageUrl(imagePath, 'medium'),
		large: getImageUrl(imagePath, 'large'),
		original: getImageUrl(imagePath, 'original')
	};
}

/**
 * Generate srcset for responsive images
 * @param {string} imagePath - The image path
 * @returns {string} srcset string for img element
 */
export function getImageSrcSet(imagePath: string): string {
	const urls = getResponsiveImageUrls(imagePath);
	
	return [
		`${urls.thumbnail} 400w`,
		`${urls.medium} 800w`,
		`${urls.large} 1200w`
	].join(', ');
}

/**
 * Check if an image path is a Cloudinary URL
 * @param {string} imagePath - The image path to check
 * @returns {boolean} True if it's a Cloudinary URL
 */
export function isCloudinaryUrl(imagePath: string): boolean {
	return imagePath?.startsWith('https://res.cloudinary.com/');
}

/**
 * Convert local image path to Cloudinary public ID
 * @param {string} localPath - Local file path (e.g., "/data/usa_2025/alabama/photo.jpg")
 * @returns {string} Cloudinary public ID (e.g., "usa_2025/alabama/photo")
 */
export function localPathToCloudinaryId(localPath: string): string {
	// Remove leading slash and file extension
	return localPath
		.replace(/^\/+/, '')
		.replace(/^data\//, '')
		.replace(/\.[^/.]+$/, '');
}

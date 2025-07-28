import config from '../../travel-site.config.js';

/**
 * Image URL utility for handling local and Cloudinary images
 */

/**
 * Generate an image URL based on the current image provider configuration
 * @param {string} imagePath - The image path (local path or Cloudinary public ID)
 * @param {'thumbnail' | 'medium' | 'large' | 'original'} [size='medium'] - The desired image size
 * @returns {string} The complete image URL
 */
export function getImageUrl(imagePath, size = 'medium') {
	if (!imagePath) return '';

	// If provider is local, return the path as-is
	if (config.images.provider === 'local') {
		return imagePath;
	}

	// If provider is cloudinary, generate the Cloudinary URL
	if (config.images.provider === 'cloudinary' && config.images.cloudinary) {
		const { baseUrl, transformations } = config.images.cloudinary;
		const transformation = transformations?.[size] || transformations?.medium || '';
		
		// Remove any leading slash from imagePath for Cloudinary
		const cleanPath = imagePath.replace(/^\/+/, '');
		
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
export function getResponsiveImageUrls(imagePath) {
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
export function getImageSrcSet(imagePath) {
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
export function isCloudinaryUrl(imagePath) {
	return imagePath?.startsWith('https://res.cloudinary.com/');
}

/**
 * Convert local image path to Cloudinary public ID
 * @param {string} localPath - Local file path (e.g., "/data/usa_2025/alabama/photo.jpg")
 * @returns {string} Cloudinary public ID (e.g., "usa_2025/alabama/photo")
 */
export function localPathToCloudinaryId(localPath) {
	// Remove leading slash and file extension
	return localPath
		.replace(/^\/+/, '')
		.replace(/^data\//, '')
		.replace(/\.[^/.]+$/, '');
}

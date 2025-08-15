#!/usr/bin/env node

/**
 * Clean Itinerary Photos
 *
 * This script removes photo entries from an itinerary JSON file if they
 * do not have a 'cloudinary' block. This is useful for cleaning up
 * data after a partial or failed Cloudinary upload process.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Cleans photos from a single itinerary file.
 * @param {string} filePath - The absolute path to the itinerary JSON file.
 */
function cleanItineraryFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        return;
    }

    try {
        const itineraryData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        let photosRemoved = 0;

        // Clean photoClusters
        if (itineraryData.photoClusters && Array.isArray(itineraryData.photoClusters)) {
            itineraryData.photoClusters.forEach(cluster => {
                if (cluster.photos && Array.isArray(cluster.photos)) {
                    const originalCount = cluster.photos.length;
                    cluster.photos = cluster.photos.filter(photo => photo.cloudinary);
                    const removedCount = originalCount - cluster.photos.length;
                    if (removedCount > 0) {
                        photosRemoved += removedCount;
                        console.log(`    - Removed ${removedCount} photo(s) from cluster: ${cluster.interestPointName}`);
                    }
                }
            });
            // Remove empty clusters
            itineraryData.photoClusters = itineraryData.photoClusters.filter(cluster => cluster.photos && cluster.photos.length > 0);
        }

        // Clean independentPhotos
        if (itineraryData.independentPhotos && Array.isArray(itineraryData.independentPhotos)) {
            const originalCount = itineraryData.independentPhotos.length;
            itineraryData.independentPhotos = itineraryData.independentPhotos.filter(photo => photo.cloudinary);
            const removedCount = originalCount - itineraryData.independentPhotos.length;
            if (removedCount > 0) {
                photosRemoved += removedCount;
                console.log(`    - Removed ${removedCount} independent photo(s)`);
            }
        }

        if (photosRemoved > 0) {
            fs.writeFileSync(filePath, JSON.stringify(itineraryData, null, 2));
            console.log(`✨ Cleaned ${photosRemoved} photo(s) from ${path.basename(filePath)}`);
        } else {
            console.log(`✅ No photos to clean in ${path.basename(filePath)}`);
        }

    } catch (error) {
        console.error(`❌ Error processing file ${filePath}:`, error.message);
    }
}

// Main execution
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Usage: node clean-itinerary-photos.js <path_to_itinerary.json>');
    process.exit(1);
}

const filePath = path.resolve(args[0]);

console.log(`🚀 Starting cleanup for: ${filePath}`);
cleanItineraryFile(filePath);
console.log('✅ Cleanup process completed!');

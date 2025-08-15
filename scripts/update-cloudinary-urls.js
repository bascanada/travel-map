#!/usr/bin/env node

/**
 * Update travel data with Cloudinary URLs
 * 
 * This script reads the cloudinary-upload-results.json files and updates
 * the corresponding travel data files to use Cloudinary URLs instead of local paths.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Process a single itinerary's Cloudinary upload results
 * @param {string} itineraryPath - Path to the itinerary directory
 */
function updateItineraryWithCloudinaryUrls(itineraryPath) {
    console.log(`Processing itinerary: ${itineraryPath}`);
    
    // Look for cloudinary-upload-results.json
    const cloudinaryResultsPath = path.join(itineraryPath, 'cloudinary-upload-results.json');
    if (!fs.existsSync(cloudinaryResultsPath)) {
        console.log(`  ⚠️  No cloudinary-upload-results.json found in ${itineraryPath}`);
        return;
    }
    
    // Look for the itinerary JSON file
    const itineraryName = path.basename(itineraryPath);
    const itineraryJsonPath = path.join(itineraryPath, `${itineraryName}.json`);
    if (!fs.existsSync(itineraryJsonPath)) {
        console.log(`  ⚠️  No ${itineraryName}.json found in ${itineraryPath}`);
        return;
    }
    
    try {
        // Read the files
        const cloudinaryResults = JSON.parse(fs.readFileSync(cloudinaryResultsPath, 'utf-8'));
        const itineraryData = JSON.parse(fs.readFileSync(itineraryJsonPath, 'utf-8'));
        
        console.log(`  📸 Found ${cloudinaryResults.length} Cloudinary uploads`);
        
        // Create a map of filename to Cloudinary URLs
        const cloudinaryMap = new Map();
        cloudinaryResults.forEach(result => {
            cloudinaryMap.set(result.original_filename, {
                secure_url: result.secure_url,
                optimized_url: result.optimized_url,
                thumbnail_url: result.thumbnail_url,
                public_id: result.public_id
            });
        });
        
        let updatedPhotos = 0;
        
        // Update photo URLs in clusters
        if (itineraryData.photoClusters) {
            itineraryData.photoClusters.forEach(cluster => {
                if (cluster.photos) {
                    cluster.photos.forEach(photo => {
                        const filename = photo.id;
                        const cloudinaryData = cloudinaryMap.get(filename);
                        
                        if (cloudinaryData) {
                            // Store all Cloudinary URLs for flexible usage
                            photo.cloudinary = {
                                secure_url: cloudinaryData.secure_url,
                                optimized_url: cloudinaryData.optimized_url,
                                thumbnail_url: cloudinaryData.thumbnail_url,
                                public_id: cloudinaryData.public_id
                            };
                            
                            // Update the main url to use the public_id (for imageUtils to process)
                            photo.url = cloudinaryData.public_id;
                            updatedPhotos++;
                            
                            console.log(`    ✅ Updated ${filename} -> ${cloudinaryData.public_id}`);
                        } else {
                            console.log(`    ⚠️  No Cloudinary data found for ${filename}`);
                        }
                    });
                }
            });
        }
        
        // Update independent photos if they exist
        if (itineraryData.independentPhotos) {
            itineraryData.independentPhotos.forEach(photo => {
                const filename = photo.id;
                const cloudinaryData = cloudinaryMap.get(filename);
                
                if (cloudinaryData) {
                    photo.cloudinary = {
                        secure_url: cloudinaryData.secure_url,
                        optimized_url: cloudinaryData.optimized_url,
                        thumbnail_url: cloudinaryData.thumbnail_url,
                        public_id: cloudinaryData.public_id
                    };
                    photo.url = cloudinaryData.public_id;
                    updatedPhotos++;
                    
                    console.log(`    ✅ Updated independent photo ${filename} -> ${cloudinaryData.public_id}`);
                }
            });
        }
        
        // Write the updated data back
        if (updatedPhotos > 0) {
            fs.writeFileSync(itineraryJsonPath, JSON.stringify(itineraryData, null, 2));
            console.log(`  ✨ Updated ${updatedPhotos} photos in ${itineraryName}.json`);
        } else {
            console.log(`  ℹ️  No photos updated in ${itineraryName}.json`);
        }
        
    } catch (error) {
        console.error(`  ❌ Error processing ${itineraryPath}:`, error.message);
    }
}

/**
 * Process all travel data directories
 * @param {string} travelId - Optional: specific travel ID to process
 */
function updateAllTravelData(travelId = null) {
    const staticDataPath = path.join(__dirname, '..', 'static', 'data');
    
    if (!fs.existsSync(staticDataPath)) {
        console.error('❌ Static data directory not found:', staticDataPath);
        process.exit(1);
    }
    
    // Get all travel directories
    const travelDirs = fs.readdirSync(staticDataPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
    
    console.log(`🔍 Found travel directories: ${travelDirs.join(', ')}`);
    
    travelDirs.forEach(travelDir => {
        if (travelId && travelDir !== travelId) {
            return; // Skip if we're only processing a specific travel
        }
        
        console.log(`
📂 Processing travel: ${travelDir}`);
        const travelPath = path.join(staticDataPath, travelDir);
        
        // Get all itinerary directories within this travel
        const itineraryDirs = fs.readdirSync(travelPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
        
        if (itineraryDirs.length === 0) {
            console.log(`  ℹ️  No itinerary directories found in ${travelDir}`);
            return;
        }
        
        console.log(`  📁 Found itineraries: ${itineraryDirs.join(', ')}`);
        
        itineraryDirs.forEach(itineraryDir => {
            const itineraryPath = path.join(travelPath, itineraryDir);
            updateItineraryWithCloudinaryUrls(itineraryPath);
        });
    });
}

// Main execution
console.log('🚀 Starting Cloudinary URL update process...\n');

// Get command line arguments
const args = process.argv.slice(2);
const travelId = args[0] || null;

if (travelId) {
    console.log(`🎯 Processing specific travel: ${travelId}`);
} else {
    console.log('🌍 Processing all travel data');
}

updateAllTravelData(travelId);

console.log('\n✅ Cloudinary URL update process completed!');

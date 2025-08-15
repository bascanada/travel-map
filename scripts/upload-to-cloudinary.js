#!/usr/bin/env node

/**
 * Upload script for Cloudinary
 * This script uploads your travel images to Cloudinary and generates the URLs
 */

import fs from 'fs';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.dev file
dotenv.config({ path: path.join(__dirname, '.env.dev') });

// Configure Cloudinary (set these environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload images from a directory to Cloudinary
 * @param {string} sourceDir - Local directory containing images
 * @param {string} cloudinaryFolder - Folder name in Cloudinary
 */
async function uploadDirectory(sourceDir, cloudinaryFolder) {
  const files = fs.readdirSync(sourceDir);
  const imageFiles = files.filter(file => 
    file.toLowerCase().match(/\.(jpg|jpeg|png|webp)$/i)
  );

  console.log(`📤 Uploading ${imageFiles.length} images to Cloudinary folder: ${cloudinaryFolder}`);

  const results = [];
  const maxFileSize = 10 * 1024 * 1024; // 10MB limit for free tier

  for (const file of imageFiles) {
    const filePath = path.join(sourceDir, file);
    const publicId = `${cloudinaryFolder}/${path.parse(file).name}`;
    const fileSize = fs.statSync(filePath).size;

    try {
      console.log(`⬆️  Uploading: ${file} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`);
      
      let uploadOptions = {
        public_id: publicId,
        folder: cloudinaryFolder,
        resource_type: 'image',
        // Optimization settings
        quality: 'auto:good',
        fetch_format: 'auto',
        // Keep original for high quality when needed
        eager: [
          { width: 800, height: 600, crop: 'limit', quality: 'auto:good' },
          { width: 400, height: 300, crop: 'limit', quality: 'auto:eco' }
        ]
      };

      // If file is too large, add aggressive compression
      if (fileSize > maxFileSize) {
        console.log(`⚠️  File too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), applying aggressive compression...`);
        uploadOptions = {
          ...uploadOptions,
          // More aggressive compression for large files
          quality: 'auto:low',
          // Reduce dimensions if needed
          transformation: [
            { width: 2000, height: 1500, crop: 'limit' },
            { quality: 'auto:low' }
          ],
          eager: [
            { width: 800, height: 600, crop: 'limit', quality: 'auto:eco' },
            { width: 400, height: 300, crop: 'limit', quality: 'auto:eco' }
          ]
        };
      }

      const result = await cloudinary.uploader.upload(filePath, uploadOptions);

      results.push({
        original_filename: file,
        original_size_mb: (fileSize / 1024 / 1024).toFixed(2),
        public_id: result.public_id,
        secure_url: result.secure_url,
        optimized_url: result.eager[0]?.secure_url || result.secure_url,
        thumbnail_url: result.eager[1]?.secure_url || result.secure_url,
        cloudinary_size_kb: Math.round(result.bytes / 1024)
      });

      console.log(`✅ Uploaded: ${file} -> ${result.public_id} (Cloudinary: ${Math.round(result.bytes / 1024)}KB)`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
      
      // If it's still too large, try with even more aggressive compression
      if (error.message.includes('File size too large')) {
        console.log(`🔄 Retrying with maximum compression...`);
        try {
          const maxCompressionOptions = {
            public_id: publicId,
            folder: cloudinaryFolder,
            resource_type: 'image',
            quality: '30',
            transformation: [
              { width: 1500, height: 1200, crop: 'limit' },
              { quality: '30' }
            ]
          };
          
          const result = await cloudinary.uploader.upload(filePath, maxCompressionOptions);
          
          results.push({
            original_filename: file,
            original_size_mb: (fileSize / 1024 / 1024).toFixed(2),
            public_id: result.public_id,
            secure_url: result.secure_url,
            optimized_url: result.secure_url,
            thumbnail_url: result.secure_url,
            cloudinary_size_kb: Math.round(result.bytes / 1024),
            note: 'Maximum compression applied'
          });
          
          console.log(`✅ Uploaded with max compression: ${file} -> ${result.public_id}`);
        } catch (retryError) {
          console.error(`❌ Failed even with max compression: ${file}:`, retryError.message);
        }
      }
    }
  }

  return results;
}

/**
 * Update your travel JSON files with Cloudinary URLs
 */
async function updateTravelData(uploadResults, travelJsonPath) {
  if (!fs.existsSync(travelJsonPath)) {
    console.log(`⚠️  Travel JSON not found: ${travelJsonPath}`);
    return;
  }

  const travelData = JSON.parse(fs.readFileSync(travelJsonPath, 'utf8'));
  
  // Update image URLs in the travel data
  if (travelData.images) {
    travelData.images = travelData.images.map(image => {
      const uploadResult = uploadResults.find(result => 
        result.original_filename === path.basename(image.url || image.filename || image)
      );
      
      if (uploadResult) {
        return {
          ...image,
          url: uploadResult.secure_url,
          optimized_url: uploadResult.optimized_url,
          thumbnail_url: uploadResult.thumbnail_url,
          cloudinary_public_id: uploadResult.public_id
        };
      }
      return image;
    });
  }

  // Write updated travel data
  fs.writeFileSync(travelJsonPath, JSON.stringify(travelData, null, 2));
  console.log(`✅ Updated travel data: ${travelJsonPath}`);
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node upload-to-cloudinary.js <source-directory> <cloudinary-folder>');
    console.log('Example: node upload-to-cloudinary.js ../my-travel-site/data/usa_2025/alabama usa_2025/alabama');
    process.exit(1);
  }

  const [sourceDir, cloudinaryFolder] = args;

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`);
    process.exit(1);
  }

  try {
    const results = await uploadDirectory(sourceDir, cloudinaryFolder);
    
    // Save results for reference
    const resultsFile = path.join(sourceDir, 'cloudinary-upload-results.json');
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
    
    // Try to update travel JSON if it exists
    const travelJsonPath = path.join(sourceDir, `${path.basename(sourceDir)}.json`);
    await updateTravelData(results, travelJsonPath);
    
    console.log(`
🎉 Upload complete! ${results.length} images uploaded to Cloudinary.`);
    console.log(`📄 Results saved to: ${resultsFile}`);
    
  } catch (error) {
    console.error('❌ Upload failed:', error.message);
    process.exit(1);
  }
}

// Run main function if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { uploadDirectory, updateTravelData };

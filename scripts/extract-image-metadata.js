// scripts/extract-image-metadata.js
import fs from 'fs-extra';
import path from 'path';
import ExifReader from 'exifreader';
import { fileURLToPath } from 'url';

// Debug mode - set to true for verbose logging
const DEBUG = true;

function debug(message, data) {
  if (DEBUG) {
    if (data) {
      console.log(`DEBUG: ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`DEBUG: ${message}`);
    }
  }
}

/**
 * Get the GPS coordinates from EXIF data
 * Using a simpler approach that works for most camera formats
 * Ensures that longitude is negative for western hemisphere (US, including Alabama)
 */
function getGpsCoordinates(tags) {
  if (!tags.GPSLatitude || !tags.GPSLongitude) {
    return null;
  }
  
  try {
    // Get the decimal degrees directly from the description if available
    if (tags.GPSLatitude.description && tags.GPSLongitude.description) {
      const lat = parseFloat(tags.GPSLatitude.description);
      let lng = parseFloat(tags.GPSLongitude.description);
      
      // Apply cardinal direction adjustments
      if (tags.GPSLongitudeRef && tags.GPSLongitudeRef.value && 
          tags.GPSLongitudeRef.value.includes('W') && lng > 0) {
        // For Western hemisphere (W), longitude should be negative
        lng = -lng;
      }
      
      // Apply Southern hemisphere adjustments if needed
      if (tags.GPSLatitudeRef && tags.GPSLatitudeRef.value && 
          tags.GPSLatitudeRef.value.includes('S') && lat > 0) {
        // For Southern hemisphere (S), latitude should be negative
        lat = -lat;
      }
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    console.warn('GPS data found but could not be parsed from description');
    console.log('GPS Latitude:', JSON.stringify(tags.GPSLatitude));
    console.log('GPS Longitude:', JSON.stringify(tags.GPSLongitude));
    console.log('GPS Latitude Ref:', JSON.stringify(tags.GPSLatitudeRef || 'N/A'));
    
    return null;
  } catch (error) {
    console.error('Error extracting GPS coordinates:', error);
    return null;
  }
}

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');



/**
 * Process a directory to extract image metadata
 */
async function processDirectory(directoryPath) {
  try {
    const items = await fs.readdir(directoryPath);
    const result = {};
    
    // Get subdirectories
    const subdirectories = [];
    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        subdirectories.push(itemPath);
      } else if (stats.isFile()) {
        // Process only image files (jpg, jpeg, png)
        const ext = path.extname(itemPath).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
          try {
            const imageData = await fs.readFile(itemPath);
            const tags = ExifReader.load(imageData);
            
            const fileMetadata = {
              filename: item,
              coordinates: null,
              dateTime: null,
            };
            
            // Extract GPS coordinates if they exist
            const coordinates = getGpsCoordinates(tags);
            if (coordinates) {
              fileMetadata.coordinates = coordinates;
              console.log(`Successfully extracted coordinates for ${item}: ${coordinates.lat}, ${coordinates.lng}`);
            }
            
            // Extract date/time if it exists
            if (tags.DateTimeOriginal) {
              fileMetadata.dateTime = tags.DateTimeOriginal.description;
            } else if (tags.DateTime) {
              fileMetadata.dateTime = tags.DateTime.description;
            }
            
            result[item] = fileMetadata;
          } catch (error) {
            console.error(`Error processing file ${item}:`, error.message);
          }
        }
      }
    }
    
    // Generate metadata JSON file for this directory
    const directoryName = path.basename(directoryPath);
    const outputFilePath = path.join(directoryPath, `${directoryName}-metadata.json`);
    
    await fs.writeJson(outputFilePath, result, { spaces: 2 });
    console.log(`Created metadata file: ${outputFilePath}`);
    
    // Process subdirectories recursively
    for (const subdir of subdirectories) {
      await processDirectory(subdir);
    }
    
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
  }
}

/**
 * Main function
 */
async function main() {
  const testDataDir = path.join(projectRoot, 'static', 'test-data');
  console.log(`Starting metadata extraction for ${testDataDir}`);
  
  try {
    await processDirectory(testDataDir);
    console.log('Metadata extraction completed successfully');
  } catch (error) {
    console.error('Error during metadata extraction:', error);
  }
}

// Run the main function
main();

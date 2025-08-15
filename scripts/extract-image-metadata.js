// scripts/extract-image-metadata.js
import fs from 'fs-extra';
import path from 'path';
import ExifReader from 'exifreader';

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
      let lat = parseFloat(tags.GPSLatitude.description);
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
    return null;
  } catch (error) {
    console.error('Error extracting GPS coordinates:', error);
    return null;
  }
}

/**
 * Process a directory to extract image metadata
 * This function handles both travel directories and itinerary directories
 */
async function processDirectory(directoryPath) {
  try {
    const items = await fs.readdir(directoryPath);
    const result = {};
    
    const directoryName = path.basename(directoryPath);
    
    // Get subdirectories
    const subdirectories = [];
    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        subdirectories.push(itemPath);
      } else if (stats.isFile()) {
        // Process only image/video files (jpg, jpeg, png, mp4)
        const ext = path.extname(itemPath).toLowerCase();
        if (['.jpg', '.jpeg', '.png', '.mp4'].includes(ext)) {
          try {
            // Skip extracting metadata for video files, but still add them to the result
            if (ext === '.mp4') {
              result[item] = {
                filename: item,
                coordinates: null,
                dateTime: null,
                type: 'video'
              };
              continue;
            }
            
            const imageData = await fs.readFile(itemPath);
            const tags = ExifReader.load(imageData);
            
            const fileMetadata = {
              filename: item,
              coordinates: null,
              dateTime: null,
              type: 'image'
            };
            
            // Extract GPS coordinates if they exist
            const coordinates = getGpsCoordinates(tags);
            if (coordinates) {
              fileMetadata.coordinates = coordinates;
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
    
    // Generate metadata JSON file for this directory if there are images
    if (Object.keys(result).length > 0) {
        const metadataFileName = `${directoryName}-metadata.json`;
        const outputFilePath = path.join(directoryPath, metadataFileName);
        
        await fs.writeJson(outputFilePath, result, { spaces: 2 });
        console.log(`Created metadata file: ${outputFilePath}`);
    }
    
    // Process subdirectories recursively
    for (const subdir of subdirectories) {
      await processDirectory(subdir);
    }
    
  } catch (error) {
    console.error(`Error processing directory ${directoryPath}:`, error);
    throw error;
  }
}

/**
 * Main function to run metadata extraction
 */
export async function extractAllMetadata(dataDir) {
  try {
    await processDirectory(dataDir);
  } catch (error) {
    console.error('Error during metadata extraction:', error);
    throw error;
  }
}
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
 * This function handles both travel directories and itinerary directories
 */
async function processDirectory(directoryPath) {
  try {
    const items = await fs.readdir(directoryPath);
    const result = {};
    
    const directoryName = path.basename(directoryPath);
    const parentDirName = path.basename(path.dirname(directoryPath));
    
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
    const metadataFileName = `${directoryName}-metadata.json`;
    const outputFilePath = path.join(directoryPath, metadataFileName);
    
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
 * Generate travel index file
 * Contains a list of all travel folders in test-data
 */
async function generateTravelIndex(testDataDir) {
  try {
    const items = await fs.readdir(testDataDir);
    const travels = [];
    
    for (const item of items) {
      const itemPath = path.join(testDataDir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        // Check if this directory has a travel.json file, indicating it's a travel directory
        const travelJsonPath = path.join(itemPath, 'travel.json');
        if (fs.existsSync(travelJsonPath)) {
          try {
            const travelData = await fs.readJson(travelJsonPath);
            
            // Find a cover photo from the first itinerary if available
            let coverPhotoUrl = null;
            if (travelData.itineraries && travelData.itineraries.length > 0) {
              const firstItineraryDir = path.join(itemPath, travelData.itineraries[0]);
              if (fs.existsSync(firstItineraryDir)) {
                const itineraryFiles = await fs.readdir(firstItineraryDir);
                const photoFile = itineraryFiles.find(file => 
                  ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())
                );
                if (photoFile) {
                  coverPhotoUrl = `test-data/${item}/${travelData.itineraries[0]}/${photoFile}`;
                }
              }
            }
            
            travels.push({
              id: travelData.id,
              name: travelData.name || item.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
              startDate: travelData.startDate,
              endDate: travelData.endDate,
              description: travelData.description || `Travel to ${travelData.name || item}`,
              file: `test-data/${item}/travel.json`,
              coverPhotoUrl
            });
          } catch (error) {
            console.error(`Error reading travel.json for ${item}:`, error.message);
          }
        }
      }
    }
    
    // Create the travel index file
    const indexFile = {
      travels: travels
    };
    
    const indexPath = path.join(testDataDir, 'index.json');
    await fs.writeJson(indexPath, indexFile, { spaces: 2 });
    console.log(`Created travel index file: ${indexPath}`);
    
  } catch (error) {
    console.error('Error generating travel index:', error);
  }
}

/**
 * Main function
 */
async function main() {
  const testDataDir = path.join(projectRoot, 'static', 'test-data');
  console.log(`Starting metadata extraction for ${testDataDir}`);
  
  try {
    // Process all directories recursively to extract metadata from images
    await processDirectory(testDataDir);
    
    // Generate travel index file after metadata has been extracted
    await generateTravelIndex(testDataDir);
    
    console.log('Metadata extraction and travel index generation completed successfully');
  } catch (error) {
    console.error('Error during metadata extraction:', error);
  }
}

// Run the main function
main();

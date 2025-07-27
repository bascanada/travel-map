// scripts/generate-travel-draft.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

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
 * Parse date time string from EXIF format to ISO 8601
 * @param {string} dateTimeStr - Date time string in EXIF format (YYYY:MM:DD HH:MM:SS)
 * @returns {string} - ISO 8601 formatted date string
 */
function parseExifDateTime(dateTimeStr) {
  if (!dateTimeStr) return null;
  
  // Convert from "YYYY:MM:DD HH:MM:SS" to "YYYY-MM-DDTHH:MM:SS"
  try {
    const [date, time] = dateTimeStr.split(' ');
    if (!date || !time) return null;
    
    const formattedDate = date.replace(/:/g, '-');
    return `${formattedDate}T${time}Z`;
  } catch (error) {
    console.error('Error parsing date time:', error);
    return null;
  }
}

/**
 * Identify clusters of photos based on proximity (time and location)
 * @param {Object} photosMetadata - Metadata of photos
 * @returns {Array} - Clustered photos
 */
function identifyPhotoClusters(photosMetadata) {
  const photos = Object.values(photosMetadata)
    .filter(photo => photo.coordinates && photo.dateTime) // Filter out photos without coordinates or datetime
    .map(photo => ({
      id: photo.filename,
      url: photo.filename, // Relative URL to the image
      position: {
        latitude: photo.coordinates.lat,
        longitude: photo.coordinates.lng
      },
      date: parseExifDateTime(photo.dateTime),
      description: ''
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
  
  if (photos.length === 0) {
    return { clusters: [], independentPhotos: [] };
  }
  
  // Simple clustering algorithm based on proximity
  const MAX_DISTANCE = 0.005; // ~500m in degrees
  const clusters = [];
  let currentCluster = {
    id: `cluster-1`,
    photos: [photos[0]],
    position: {
      latitude: photos[0].position.latitude,
      longitude: photos[0].position.longitude
    }
  };
  
  for (let i = 1; i < photos.length; i++) {
    const photo = photos[i];
    const lastPhoto = currentCluster.photos[currentCluster.photos.length - 1];
    
    // Calculate distance
    const distance = Math.sqrt(
      Math.pow(photo.position.latitude - lastPhoto.position.latitude, 2) +
      Math.pow(photo.position.longitude - lastPhoto.position.longitude, 2)
    );
    
    if (distance <= MAX_DISTANCE) {
      // Add to current cluster
      currentCluster.photos.push(photo);
      
      // Update cluster position (average)
      currentCluster.position = {
        latitude: currentCluster.photos.reduce((sum, p) => sum + p.position.latitude, 0) / currentCluster.photos.length,
        longitude: currentCluster.photos.reduce((sum, p) => sum + p.position.longitude, 0) / currentCluster.photos.length
      };
    } else {
      // Start a new cluster
      clusters.push(currentCluster);
      currentCluster = {
        id: `cluster-${clusters.length + 1}`,
        photos: [photo],
        position: {
          latitude: photo.position.latitude,
          longitude: photo.position.longitude
        }
      };
    }
  }
  
  // Add the last cluster
  clusters.push(currentCluster);
  
  // For now, let's say we don't have independent photos (all are clustered)
  // In a more advanced implementation, you might want to identify outliers
  return { clusters, independentPhotos: [] };
}

/**
 * Generate route path from photo clusters
 * @param {Array} clusters - Photo clusters
 * @returns {Array} - Path of coordinates with dates
 */
function generateRoutePath(clusters) {
  const routePath = [];
  
  clusters.forEach(cluster => {
    if (cluster.photos.length > 0) {
      // Add the position of the first photo in each cluster
      const firstPhoto = cluster.photos[0];
      routePath.push({
        latitude: firstPhoto.position.latitude,
        longitude: firstPhoto.position.longitude,
        date: firstPhoto.date
      });
    }
  });
  
  return routePath;
}

/**
 * Generate a travel draft from metadata
 * @param {string} directoryPath - Path to the directory containing metadata
 */
async function generateTravelDraft(directoryPath) {
  try {
    const directoryName = path.basename(directoryPath);
    const metadataFilePath = path.join(directoryPath, `${directoryName}-metadata.json`);
    
    if (!fs.existsSync(metadataFilePath)) {
      console.error(`Metadata file not found: ${metadataFilePath}`);
      return;
    }
    
    console.log(`Generating travel draft from ${metadataFilePath}`);
    const metadata = await fs.readJson(metadataFilePath);
    
    // Get all photos with valid metadata
    const validPhotos = Object.values(metadata).filter(photo => 
      photo.coordinates && photo.dateTime
    );
    
    if (validPhotos.length === 0) {
      console.error('No valid photos with coordinates and date found.');
      return;
    }
    
    // Sort photos by date
    validPhotos.sort((a, b) => {
      const dateA = new Date(a.dateTime.replace(/:/g, '-').replace(' ', 'T'));
      const dateB = new Date(b.dateTime.replace(/:/g, '-').replace(' ', 'T'));
      return dateA - dateB;
    });
    
    const startDate = parseExifDateTime(validPhotos[0].dateTime);
    const endDate = parseExifDateTime(validPhotos[validPhotos.length - 1].dateTime);
    
    // Identify clusters and generate path
    const { clusters: photoClusters, independentPhotos } = identifyPhotoClusters(metadata);
    
    // Generate path from clusters
    let routePath = [];
    if (photoClusters.length > 0) {
      routePath = generateRoutePath(photoClusters);
    }
    
    // Create the itinerary
    const itinerary = {
      id: `itinerary-${directoryName}`,
      name: `${directoryName} Itinerary`,
      route: {
        start: {
          latitude: validPhotos[0].coordinates.lat,
          longitude: validPhotos[0].coordinates.lng
        },
        end: {
          latitude: validPhotos[validPhotos.length - 1].coordinates.lat,
          longitude: validPhotos[validPhotos.length - 1].coordinates.lng
        },
        path: routePath
      },
      startDate,
      endDate,
      photoClusters: photoClusters.map(cluster => ({
        ...cluster,
        photos: cluster.photos.map(photo => ({
          ...photo,
          url: `test-data/${directoryName}/${photo.id}` // Update URL to include path
        }))
      })),
      independentPhotos: independentPhotos.map(photo => ({
        ...photo,
        url: `test-data/${directoryName}/${photo.id}` // Update URL to include path
      })),
      description: `Auto-generated itinerary for ${directoryName}`
    };
    
    // Create the travel document
    const travel = {
      id: directoryName,
      name: directoryName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      startDate,
      endDate,
      itineraries: [itinerary],
      description: `Auto-generated travel document for ${directoryName}`
    };
    
    // Write the travel file
    const travelFilePath = path.join(directoryPath, `${directoryName}.json`);
    await fs.writeJson(travelFilePath, travel, { spaces: 2 });
    console.log(`Created travel draft: ${travelFilePath}`);
    
    // Create or update travel index
    await updateTravelIndex(directoryName, travel, travelFilePath);
    
  } catch (error) {
    console.error(`Error generating travel draft for ${directoryPath}:`, error);
  }
}

/**
 * Update the travel index with the new travel
 * @param {string} directoryName - Name of the travel directory
 * @param {Object} travel - Travel data
 * @param {string} travelFilePath - Path to the travel file
 */
async function updateTravelIndex(directoryName, travel, travelFilePath) {
  const indexPath = path.join(projectRoot, 'static', 'travel-index.json');
  let index = { travels: [] };
  
  // Try to read existing index
  if (fs.existsSync(indexPath)) {
    try {
      index = await fs.readJson(indexPath);
    } catch (error) {
      console.warn('Could not read existing index, creating new one');
    }
  }
  
  // Find if this travel already exists in the index
  const existingEntryIndex = index.travels.findIndex(t => t.id === travel.id);
  
  // Get a cover photo URL if available
  let coverPhotoUrl = null;
  if (travel.itineraries[0].photoClusters.length > 0 && 
      travel.itineraries[0].photoClusters[0].photos.length > 0) {
    coverPhotoUrl = travel.itineraries[0].photoClusters[0].photos[0].url;
  } else if (travel.itineraries[0].independentPhotos.length > 0) {
    coverPhotoUrl = travel.itineraries[0].independentPhotos[0].url;
  }
  
  const travelEntry = {
    id: travel.id,
    name: travel.name,
    startDate: travel.startDate,
    endDate: travel.endDate,
    description: travel.description,
    file: path.relative(path.join(projectRoot, 'static'), travelFilePath),
    coverPhotoUrl
  };
  
  if (existingEntryIndex >= 0) {
    // Update existing entry
    index.travels[existingEntryIndex] = travelEntry;
  } else {
    // Add new entry
    index.travels.push(travelEntry);
  }
  
  // Write updated index
  await fs.writeJson(indexPath, index, { spaces: 2 });
  console.log(`Updated travel index: ${indexPath}`);
}

/**
 * Process all directories in the test-data folder
 */
async function processAllDirectories() {
  const testDataDir = path.join(projectRoot, 'static', 'test-data');
  console.log(`Starting travel draft generation for ${testDataDir}`);
  
  try {
    const items = await fs.readdir(testDataDir);
    
    for (const item of items) {
      const itemPath = path.join(testDataDir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        await generateTravelDraft(itemPath);
      }
    }
    
    console.log('Travel draft generation completed successfully');
  } catch (error) {
    console.error('Error during travel draft generation:', error);
  }
}

/**
 * Process a specific directory
 * @param {string} directoryName - Name of directory to process
 */
async function processDirectory(directoryName) {
  const testDataDir = path.join(projectRoot, 'static', 'test-data');
  const directoryPath = path.join(testDataDir, directoryName);
  
  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory not found: ${directoryPath}`);
    return;
  }
  
  console.log(`Processing directory: ${directoryPath}`);
  await generateTravelDraft(directoryPath);
}

/**
 * Main function
 */
async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Process specific directory
    await processDirectory(args[0]);
  } else {
    // Process all directories
    await processAllDirectories();
  }
}

// Run the main function
main();

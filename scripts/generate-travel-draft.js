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
 * Generate an itinerary draft from metadata
 * @param {string} directoryPath - Path to the directory containing metadata (should be an itinerary folder)
 * @param {string} travelId - ID of the parent travel
 * @returns {Object} - Generated itinerary object
 */
async function generateItineraryDraft(directoryPath, travelId, urlRoot) {
  try {
    const directoryName = path.basename(directoryPath);
    const metadataFilePath = path.join(directoryPath, `${directoryName}-metadata.json`);
    
    if (!fs.existsSync(metadataFilePath)) {
      console.error(`Metadata file not found: ${metadataFilePath}`);
      return null;
    }
    
    console.log(`Generating itinerary draft from ${metadataFilePath}`);
    const metadata = await fs.readJson(metadataFilePath);
    
    // Get all photos with valid metadata
    const validPhotos = Object.values(metadata).filter(photo => 
      photo.coordinates && photo.dateTime
    );
    
    if (validPhotos.length === 0) {
      console.error(`No valid photos with coordinates and date found in ${directoryPath}.`);
      return null;
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
    
    const travelDirName = path.basename(path.dirname(directoryPath));
    
    // Create the itinerary
    const itinerary = {
      id: directoryName,
      name: directoryName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
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
          url: `${urlRoot}/${travelDirName}/${directoryName}/${photo.id}`
        }))
      })),
      independentPhotos: independentPhotos.map(photo => ({
        ...photo,
        url: `${urlRoot}/${travelDirName}/${directoryName}/${photo.id}`
      })),
      description: `Auto-generated itinerary for ${directoryName}`
    };
    
    // Write the itinerary file
    const itineraryFilePath = path.join(directoryPath, `${directoryName}.json`);
    await fs.writeJson(itineraryFilePath, itinerary, { spaces: 2 });
    console.log(`Created itinerary draft: ${itineraryFilePath}`);
    
    return itinerary;
    
  } catch (error) {
    console.error(`Error generating itinerary draft for ${directoryPath}:`, error);
    return null;
  }
}

/**
 * Generate a travel draft by processing all itinerary subdirectories
 * @param {string} directoryPath - Path to the travel directory
 */
async function generateTravelDraft(directoryPath, urlRoot) {
  try {
    const directoryName = path.basename(directoryPath);
    console.log(`Generating travel draft for ${directoryName}`);
    
    // Get all subdirectories (potential itineraries)
    const items = await fs.readdir(directoryPath);
    const subdirectories = [];
    
    for (const item of items) {
      const itemPath = path.join(directoryPath, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        subdirectories.push({
          name: item,
          path: itemPath
        });
      }
    }
    
    if (subdirectories.length === 0) {
      console.error(`No subdirectories (itineraries) found in ${directoryPath}`);
      return;
    }
    
    // Process each itinerary subdirectory
    const itineraryNames = [];
    let firstItineraryWithDates = null;
    let lastItineraryWithDates = null;
    
    for (const subdir of subdirectories) {
      const itinerary = await generateItineraryDraft(subdir.path, directoryName, urlRoot);
      
      if (itinerary) {
        itineraryNames.push(subdir.name);
        
        // Track the earliest start date and latest end date
        if (!firstItineraryWithDates || new Date(itinerary.startDate) < new Date(firstItineraryWithDates.startDate)) {
          firstItineraryWithDates = itinerary;
        }
        
        if (!lastItineraryWithDates || 
           (itinerary.endDate && new Date(itinerary.endDate) > new Date(lastItineraryWithDates.endDate || lastItineraryWithDates.startDate))) {
          lastItineraryWithDates = itinerary;
        }
      }
    }
    
    if (itineraryNames.length === 0) {
      console.error(`No valid itineraries generated for ${directoryPath}`);
      return;
    }
    
    // Create the travel document with references to the itineraries
    const travel = {
      id: directoryName,
      name: directoryName.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
      startDate: firstItineraryWithDates ? firstItineraryWithDates.startDate : null,
      endDate: lastItineraryWithDates ? lastItineraryWithDates.endDate || lastItineraryWithDates.startDate : null,
      itineraries: itineraryNames,
      description: `Auto-generated travel document for ${directoryName}`
    };
    
    // Write the travel file
    const travelFilePath = path.join(directoryPath, `travel.json`);
    await fs.writeJson(travelFilePath, travel, { spaces: 2 });
    console.log(`Created travel draft: ${travelFilePath}`);
    
  } catch (error) {
    console.error(`Error generating travel draft for ${directoryPath}:`, error);
  }
}/**
 * Process all travel directories in the test-data folder
 */

async function processAllDirectories(rootDir, urlRoot) {
  console.log(`Starting travel draft generation for ${rootDir}`);

  try {
    const items = await fs.readdir(rootDir);

    for (const item of items) {
      const itemPath = path.join(rootDir, item);
      const stats = await fs.stat(itemPath);

      if (stats.isDirectory()) {
        await generateTravelDraft(itemPath, urlRoot);
      }
    }

    console.log('Travel draft generation completed successfully');
  } catch (error) {
    console.error('Error during travel draft generation:', error);
  }
}

/**
 * Process a specific travel directory
 * @param {string} directoryName - Name of travel directory to process
 */

async function processDirectory(rootDir, directoryName, urlRoot) {
  const directoryPath = path.join(rootDir, directoryName);

  if (!fs.existsSync(directoryPath)) {
    console.error(`Directory not found: ${directoryPath}`);
    return;
  }

  console.log(`Processing travel directory: ${directoryPath}`);
  await generateTravelDraft(directoryPath, urlRoot);
}

/**
 * Main function
 */

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  if (args.length === 0) {
    throw new Error('You must provide a root data directory as the first argument. Example: node generate-travel-draft.js /app/data');
  }
  const rootDir = path.isAbsolute(args[0]) ? args[0] : path.resolve(process.cwd(), args[0]);
  const urlRoot = path.basename(rootDir);

  if (args.length > 1) {
    // Process specific travel directory
    await processDirectory(rootDir, args[1], urlRoot);
  } else {
    // Process all travel directories
    await processAllDirectories(rootDir, urlRoot);
  }
}

// Run the main function
main();

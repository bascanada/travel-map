// scripts/update-travel-index.js
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

/**
 * Generate travel index file from existing travel.json files
 * @param {string} testDataDir - Path to the test-data directory
 */
async function updateTravelIndex(testDataDir) {
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
              id: travelData.id || item,
              name: travelData.name || item.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
              startDate: travelData.startDate,
              endDate: travelData.endDate,
              description: travelData.description || `Travel to ${travelData.name || item}`,
              file: `test-data/${item}/travel.json`,
              coverPhotoUrl
            });
            
            console.log(`Found travel: ${travelData.name || item}`);
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
    console.log(`Updated travel index file: ${indexPath}`);
    console.log(`Total travels found: ${travels.length}`);
    
  } catch (error) {
    console.error('Error updating travel index:', error);
  }
}

/**
 * Main function
 */
async function main() {
  const testDataDir = path.join(projectRoot, 'static', 'test-data');
  console.log(`Updating travel index for ${testDataDir}`);
  
  try {
    await updateTravelIndex(testDataDir);
    console.log('Travel index update completed successfully');
  } catch (error) {
    console.error('Error during travel index update:', error);
  }
}

// Run the main function
main();

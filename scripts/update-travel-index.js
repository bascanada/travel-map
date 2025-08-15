// scripts/update-travel-index.js
import fs from 'fs-extra';
import path from 'path';

/**
 * Generate travel index file from existing travel.json files
 * @param {string} dataDir - Path to the data directory
 */
export async function updateTravelIndex(dataDir) {
  const urlRoot = path.basename(dataDir);
  try {
    const items = await fs.readdir(dataDir);
    const travels = [];
    
    for (const item of items) {
      const itemPath = path.join(dataDir, item);
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        const travelJsonPath = path.join(itemPath, 'travel.json');
        if (fs.existsSync(travelJsonPath)) {
          try {
            const travelData = await fs.readJson(travelJsonPath);
            
            let coverPhotoUrl = null;
            if (travelData.itineraries && travelData.itineraries.length > 0) {
              const firstItineraryDir = path.join(itemPath, travelData.itineraries[0]);
              if (fs.existsSync(firstItineraryDir)) {
                const itineraryFiles = await fs.readdir(firstItineraryDir);
                const photoFile = itineraryFiles.find(file => 
                  ['.jpg', '.jpeg', '.png'].includes(path.extname(file).toLowerCase())
                );
                if (photoFile) {
                  coverPhotoUrl = `${urlRoot}/${item}/${travelData.itineraries[0]}/${photoFile}`;
                }
              }
            }
            
            travels.push({
              id: travelData.id || item,
              name: travelData.name || item.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase()),
              startDate: travelData.startDate,
              endDate: travelData.endDate,
              description: travelData.description || `Travel to ${travelData.name || item}`,
              file: `${urlRoot}/${item}/travel.json`,
              coverPhotoUrl
            });
            
          } catch (error) {
            console.error(`Error reading travel.json for ${item}:`, error.message);
          }
        }
      }
    }
    
    const indexFile = {
      travels: travels
    };
    
    const indexPath = path.join(dataDir, 'index.json');
    await fs.writeJson(indexPath, indexFile, { spaces: 2 });
    console.log(`Updated travel index file: ${indexPath}`);
    console.log(`Total travels found: ${travels.length}`);
    
  } catch (error) {
    console.error('Error updating travel index:', error);
    throw error;
  }
}
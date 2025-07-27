// test-gps-structure.js
import fs from 'fs-extra';
import path from 'path';
import ExifReader from 'exifreader';
import { fileURLToPath } from 'url';

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

async function testSingleImage() {
  // Path to one test image
  const imagePath = path.join(projectRoot, 'static', 'test-data', 'alabama_2025', '20250103_132706.jpg');
  
  try {
    console.log(`Reading image: ${imagePath}`);
    const imageData = await fs.readFile(imagePath);
    const tags = ExifReader.load(imageData);
    
    // Log the entire tags object
    console.log('All available EXIF tags:');
    console.log(Object.keys(tags));
    
    // Check for GPS data
    if (tags.GPSLatitude) {
      console.log('\nGPS Latitude details:');
      console.log(JSON.stringify(tags.GPSLatitude, null, 2));
    } else {
      console.log('\nNo GPS Latitude found');
    }
    
    if (tags.GPSLongitude) {
      console.log('\nGPS Longitude details:');
      console.log(JSON.stringify(tags.GPSLongitude, null, 2));
    } else {
      console.log('\nNo GPS Longitude found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testSingleImage();

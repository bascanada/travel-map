// scripts/process-all-travel-data.js
import path from 'path';
import { extractAllMetadata } from './extract-image-metadata.js';
import { generateAllTravelDrafts } from './generate-travel-draft.js';
import { updateTravelIndex } from './update-travel-index.js';

async function main() {
  try {
    console.log('=== Starting Travel Data Processing ===');

    const rootPath = process.argv[2];
    if (!rootPath) {
        throw new Error('You must provide a root data directory as the first argument. Example: node process-all-travel-data.js /app/data');
    }
    const dataDir = path.isAbsolute(rootPath) ? rootPath : path.resolve(process.cwd(), rootPath);


    console.log('\n=== Step 1: Extracting Image Metadata ===');
    await extractAllMetadata(dataDir);

    console.log('\n=== Step 2: Generating Travel Drafts ===');
    await generateAllTravelDrafts(dataDir);

    console.log('\n=== Step 3: Updating Travel Index ===');
    await updateTravelIndex(dataDir);

    console.log('\n=== Travel Data Processing Complete ===');
  } catch (error) {
    console.error('Error in processing:', error);
    process.exit(1);
  }
}

main();
// scripts/process-all-travel-data.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// Get the directory name
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Run a script file with Node.js
 * @param {string} scriptPath - Path to the script
 * @param {Array} args - Command line arguments for the script
 */
async function runScript(scriptPath, args = []) {
  const command = `node ${scriptPath} ${args.join(' ')}`;
  console.log(`Running: ${command}`);
  
  try {
    const { stdout, stderr } = await execAsync(command);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  } catch (error) {
    console.error(`Error running ${scriptPath}:`, error);
  }
}

/**
 * Main function - runs all scripts in sequence
 */
async function main() {
  try {
    console.log('=== Starting Travel Data Processing ===');
    
    // Step 1: Extract image metadata
    console.log('\n=== Step 1: Extracting Image Metadata ===');
    await runScript(path.join(__dirname, 'extract-image-metadata.js'));
    
    // Step 2: Generate travel drafts
    console.log('\n=== Step 2: Generating Travel Drafts ===');
    await runScript(path.join(__dirname, 'generate-travel-draft.js'));
    
    // Step 3: Update travel index
    console.log('\n=== Step 3: Updating Travel Index ===');
    await runScript(path.join(__dirname, 'update-travel-index.js'));
    
    console.log('\n=== Travel Data Processing Complete ===');
  } catch (error) {
    console.error('Error in processing:', error);
  }
}

// Run the main function
main();

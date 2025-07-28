import fs from 'node:fs';
import path from 'node:path';

/** @type {import('./$types').EntryGenerator} */
export function entries() {
	// Vite replaces `__APP_CONFIG__` with the actual config object at build time.
	// We can then use it to construct the path to our travel index.
	const travelIndexPath = path.join(process.cwd(), 'static', __APP_CONFIG__.travelIndex);
	const travelIndexFile = fs.readFileSync(travelIndexPath, 'utf-8');
	const travelIndex = JSON.parse(travelIndexFile);

	return travelIndex.travels.map((travel: { id: string }) => ({ travelId: travel.id }));
}

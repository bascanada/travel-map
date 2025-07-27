// This file is for the index of available travels

export interface TravelIndexEntry {
  id: string;                // Unique identifier, matches file name or key in a map
  name?: string;
  startDate: string;         // ISO 8601
  endDate?: string;
  description?: string;
  file: string;              // The filename or URL to the travel file (e.g., 'travel-paris-2024.json')
  coverPhotoUrl?: string;    // Optional: preview photo for the travel
}

export interface TravelIndex {
  travels: TravelIndexEntry[];
}
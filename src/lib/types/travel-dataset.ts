// This file is for a single travel's detailed dataset
// 
// AI/Copilot Guidelines:
// - Always use these types for travel-related components
// - Extend interfaces rather than creating new ones when possible
// - Keep type definitions here centralized and well-documented

export interface Photo {
  id: string;
  url: string;
  position: {
    latitude: number;
    longitude: number;
  };
  date: string;
  description?: string;
  cloudinary?: {
    secure_url: string;
    optimized_url: string;
    thumbnail_url: string;
    public_id: string;
  };
  [key: string]: any;
}

export interface PhotoCluster {
  id: string;
  interestPointName?: string;
  photos: Photo[];
  position?: {
    latitude: number;
    longitude: number;
  };
  description?: string;
}

export interface Itinerary {
  id: string;
  name?: string;
  route: {
    start: {
      latitude: number;
      longitude: number;
    };
    end: {
      latitude: number;
      longitude: number;
    };
    path?: Array<{ latitude: number; longitude: number; date: string }>;
  };
  startDate: string; // ISO 8601, when this itinerary started
  endDate?: string;  // ISO 8601, when this itinerary ended
  photoClusters: PhotoCluster[];
  independentPhotos: Photo[];
  description?: string;
}

export interface Travel {
  id: string;
  name?: string;
  startDate: string;
  endDate?: string;
  itineraries: Itinerary[];
  description?: string;
}
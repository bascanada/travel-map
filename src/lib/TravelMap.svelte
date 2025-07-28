<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  import type { Travel, Itinerary, PhotoCluster } from './types/travel-dataset';

  // Define types
  type Coordinate = [number, number];
  
  interface RouteFeature {
    type: string;
    properties: {
      name: string;
      itineraryId?: string;
      color?: string;
    };
    geometry: {
      type: string;
      coordinates: Coordinate[];
    };
  }
  
  // Props for the component
  export let zoom: number = 5;
  export let travel: Travel | null = null;
  export let selectedPhotos: string[] = []; // IDs of photos to highlight
  export let onPhotoClusterClick: ((cluster: PhotoCluster, itinerary: Itinerary) => void) | null = null;
  
  // Array of colors for multiple itineraries
  const routeColors = [
    '#3887be', // Default blue
    '#e55e5e', // Red
    '#3bb2d0', // Light blue
    '#8a2be2', // Purple
    '#ff8c00', // Orange
    '#006400', // Dark green
    '#ff1493', // Pink
    '#4b0082'  // Indigo
  ];
  
  // Function to convert travel data to GeoJSON routes (one per itinerary)
  function createRoutesFromTravel(travel: Travel): RouteFeature[] {
    if (!travel || !travel.itineraries || travel.itineraries.length === 0) {
      return [defaultRoute];
    }
    
    return travel.itineraries.map((itinerary, index) => {
      // Handle case where itinerary might not have route or path properties
      if (!itinerary.route || (!itinerary.route.path && (!itinerary.route.start || !itinerary.route.end))) {
        // If no route data is available, return a placeholder point
        return {
          type: 'Feature',
          properties: {
            name: itinerary.name || `Itinerary ${itinerary.id}`,
            itineraryId: itinerary.id,
            color: routeColors[index % routeColors.length]
          },
          geometry: {
            type: 'LineString',
            coordinates: [[-74.0060, 40.7128], [-74.0060, 40.7128]] // Default NYC coordinates
          }
        };
      }
      
      // Extract the path coordinates from the itinerary
      const coordinates: Coordinate[] = itinerary.route.path
        ? itinerary.route.path.map(point => [point.longitude, point.latitude])
        : [
            [itinerary.route.start.longitude, itinerary.route.start.latitude],
            [itinerary.route.end.longitude, itinerary.route.end.latitude]
          ];
      
      return {
        type: 'Feature',
        properties: {
          name: itinerary.name || `Itinerary ${itinerary.id}`,
          itineraryId: itinerary.id,
          color: routeColors[index % routeColors.length]
        },
        geometry: {
          type: 'LineString',
          coordinates
        }
      };
    });
  }
  
  // Default route if no travel data is provided
  const defaultRoute: RouteFeature = {
    type: 'Feature',
    properties: {
      name: 'Default Route',
      color: '#3887be'
    },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-79.3832, 43.6532], // Toronto
        [-73.5674, 45.5017], // Montreal
        [-68.5300, 48.4487], // Rimouski
        [-64.4830, 48.8333]  // Gaspé
      ]
    }
  };

  // Create variables for the map instance and the container reference
  let map: maplibregl.Map;
  let mapContainer: HTMLDivElement;
  let markers: maplibregl.Marker[] = [];
  
  // Reactive declaration to get all routes
  $: routeFeatures = travel ? createRoutesFromTravel(travel) : [defaultRoute];
  
  // Function to add photo cluster markers to the map for all itineraries
  function addPhotoClusterMarkers(map: maplibregl.Map, travel: Travel) {
    // Clear any existing markers
    markers.forEach((marker: maplibregl.Marker) => marker.remove());
    markers.length = 0;
    
    // Add markers for each photo cluster across all itineraries
    if (travel && travel.itineraries) {
      travel.itineraries.forEach(itinerary => {
        // Skip if the itinerary has no photo clusters
        if (!itinerary.photoClusters) return;
        
        itinerary.photoClusters.forEach((cluster: PhotoCluster) => {
          if (cluster.position) {
            const markerElement = document.createElement('div');
            markerElement.className = 'photo-marker';
            
            // Check if any photos in this cluster are selected
            const hasSelectedPhotos = cluster.photos.some(photo => selectedPhotos.includes(photo.id));
            const markerClass = hasSelectedPhotos ? 'photo-marker-selected' : 'photo-marker-inner';
            
            markerElement.innerHTML = `
              <div class="${markerClass}">
                <span>${cluster.photos.length}</span>
              </div>
            `;
            
            // Create and add the marker
            const marker = new maplibregl.Marker(markerElement)
              .setLngLat([cluster.position.longitude, cluster.position.latitude])
              .addTo(map);
            
            // Add click handler if callback is provided
            if (onPhotoClusterClick) {
              markerElement.addEventListener('click', () => {
                onPhotoClusterClick?.(cluster, itinerary);
              });
            }
            
            // Add popup with information about the photo cluster
            const clusterName = cluster.interestPointName || `Photo Cluster (${cluster.photos.length} photos)`;
            
            // Handle case where photos might be empty
            let firstPhotoDate = 'Unknown';
            if (cluster.photos && cluster.photos.length > 0 && cluster.photos[0].date) {
              firstPhotoDate = new Date(cluster.photos[0].date).toLocaleDateString();
            }
            
            const itineraryName = itinerary.name || `Itinerary ${itinerary.id}`;
            
            const popup = new maplibregl.Popup({ offset: 25 })
              .setHTML(`
                <h3>${clusterName}</h3>
                <p><strong>Itinerary:</strong> ${itineraryName}</p>
                <p><strong>Date:</strong> ${firstPhotoDate}</p>
                <p>${cluster.photos.length} photo${cluster.photos.length > 1 ? 's' : ''}</p>
              `);
            
            marker.setPopup(popup);
            
            // Store the marker reference
            markers = [...markers, marker];
          }
        });
      });
    }
  }

  onMount(() => {
    // Initialize the map
    map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
              'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19
          }
        ]
      },
      center: [-73.5674, 45.5017] as [number, number], // Default center
      zoom: zoom
    });

    // Wait for map to load
    map.on('load', () => {
      // Add all routes from the travel data
      routeFeatures.forEach((route, index) => {
        const sourceId = `route-${index}`;
        
        // Add the GeoJSON route data source
        map.addSource(sourceId, {
          type: 'geojson',
          data: route as unknown as GeoJSON.Feature<GeoJSON.Geometry>
        });

        // Add a layer to display the route
        map.addLayer({
          id: `route-line-${index}`,
          type: 'line',
          source: sourceId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': route.properties.color || '#3887be',
            'line-width': 5
          }
        });
      });

      // Add markers if we have travel data
      if (travel) {
        addPhotoClusterMarkers(map, travel);
      }

      // Fit the map to all routes
      const bounds = new maplibregl.LngLatBounds();
      routeFeatures.forEach(route => {
        route.geometry.coordinates.forEach((coord: Coordinate) => {
          bounds.extend(coord as maplibregl.LngLatLike);
        });
      });
      
      map.fitBounds(bounds, {
        padding: 50
      });
    });
  });
  
  // Update the map when travel or selectedPhotos change
  $: if (map && map.loaded() && routeFeatures) {
    // Remove previous sources and layers
    for (let i = 0; i < 20; i++) { // Assuming no more than 20 routes
      if (map.getLayer(`route-line-${i}`)) {
        map.removeLayer(`route-line-${i}`);
      }
      if (map.getSource(`route-${i}`)) {
        map.removeSource(`route-${i}`);
      }
    }
    
    // Add all routes from the travel data
    routeFeatures.forEach((route, index) => {
      const sourceId = `route-${index}`;
      
      // Add the GeoJSON route data source
      map.addSource(sourceId, {
        type: 'geojson',
        data: route as unknown as GeoJSON.Feature<GeoJSON.Geometry>
      });

      // Add a layer to display the route
      map.addLayer({
        id: `route-line-${index}`,
        type: 'line',
        source: sourceId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': route.properties.color || '#3887be',
          'line-width': 5
        }
      });
    });
    
    // Update bounds to fit all routes
    const bounds = new maplibregl.LngLatBounds();
    routeFeatures.forEach(route => {
      route.geometry.coordinates.forEach((coord: Coordinate) => {
        bounds.extend(coord as maplibregl.LngLatLike);
      });
    });
    
    map.fitBounds(bounds, { padding: 50 });
    
    // Update markers
    if (travel) {
      addPhotoClusterMarkers(map, travel);
    }
  }

  onDestroy(() => {
    // Clean up the map instance when the component is destroyed
    if (map) map.remove();
  });
</script>

<div 
  bind:this={mapContainer} 
  class="relative w-full h-full min-h-full rounded overflow-hidden shadow-md"
>
  <!-- Map will be injected here -->
</div>

<style>
  /* MapLibre GL specific styles that can't be replaced with Tailwind */
  :global(.photo-marker) {
    cursor: pointer;
  }
  
  :global(.photo-marker-inner) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background-color: rgba(56, 135, 190, 0.8);
    border-radius: 50%;
    border: 2px solid white;
    color: white;
    font-weight: bold;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
  }
  
  :global(.photo-marker-inner:hover) {
    background-color: rgb(56, 135, 190);
    transform: scale(1.1);
  }
  
  :global(.photo-marker-selected) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    background-color: rgba(255, 140, 0, 0.9);
    border-radius: 50%;
    border: 3px solid #ff8c00;
    color: white;
    font-weight: bold;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
    transform: scale(1.1);
  }
</style>

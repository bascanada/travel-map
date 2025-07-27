<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';

  // Define types
  type Coordinate = [number, number];
  
  interface RouteFeature {
    type: string;
    properties: {
      name: string;
    };
    geometry: {
      type: string;
      coordinates: Coordinate[];
    };
  }
  
  // Props for the component
  export let zoom: number = 5;
  
  // Define coordinates for our route
  // Format: [longitude, latitude]
  const route: RouteFeature = {
    type: 'Feature',
    properties: {
      name: 'Eastern Canada Route'
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
      center: [-73.5674, 45.5017] as [number, number], // Center on Montreal
      zoom: zoom
    });

    // Wait for map to load
    map.on('load', () => {
      // Add the GeoJSON route data
      map.addSource('route', {
        type: 'geojson',
        data: route as unknown as GeoJSON.Feature<GeoJSON.Geometry>
      });

      // Add a layer to display the route
      map.addLayer({
        id: 'route',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3887be',
          'line-width': 5
        }
      });

      // Fit the map to the route
      const bounds = new maplibregl.LngLatBounds();
      route.geometry.coordinates.forEach((coord) => {
        bounds.extend(coord as maplibregl.LngLatLike);
      });
      
      map.fitBounds(bounds, {
        padding: 50
      });
    });
  });

  onDestroy(() => {
    // Clean up the map instance when the component is destroyed
    if (map) map.remove();
  });
</script>

<div 
  bind:this={mapContainer} 
  class="map-container"
>
  <!-- Map will be injected here -->
</div>

<style>
  .map-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 100%;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>

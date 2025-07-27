<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import Map from '$lib/Map.svelte';
  import type { Travel } from '$lib/types/travel-dataset';
  
  let travelId = '';
  let travel: Travel | null = null;
  let isLoading = true;
  let error: string | null = null;

  // Helper function to fetch travel data
  async function fetchTravelData(id: string) {
    try {
      // First, fetch the index to get the travel file location
      const indexResponse = await fetch('/test-data/index.json');
      if (!indexResponse.ok) {
        throw new Error(`Failed to load travel index: ${indexResponse.statusText}`);
      }
      
      const index = await indexResponse.json();
      const travelEntry = index.travels.find((t: any) => t.id === id);
      
      if (!travelEntry) {
        throw new Error(`Travel with ID "${id}" not found`);
      }
      
      // Now fetch the specific travel file
      const travelResponse = await fetch(`/${travelEntry.file}`);
      if (!travelResponse.ok) {
        throw new Error(`Failed to load travel data: ${travelResponse.statusText}`);
      }
      
      // Get the travel JSON
      const travelData = await travelResponse.json();
      
      // If travel has itineraries as an array of strings, fetch each itinerary
      if (travelData.itineraries && Array.isArray(travelData.itineraries) && 
          typeof travelData.itineraries[0] === 'string') {
        
        // This is the new format - need to fetch each itinerary
        const filePath = travelEntry.file;
        const basePath = filePath.substring(0, filePath.lastIndexOf('/') + 1);
        
        // Fetch all itineraries in parallel
        const itineraryPromises = travelData.itineraries.map(async (itineraryId: string) => {
          const itineraryPath = `/${basePath}${itineraryId}/${itineraryId}.json`;
          const response = await fetch(itineraryPath);
          if (!response.ok) {
            console.warn(`Could not load itinerary: ${itineraryId}`);
            return null;
          }
          return await response.json();
        });
        
        const itineraries = await Promise.all(itineraryPromises);
        // Replace the itinerary IDs with the full itinerary objects, filtering out any that failed to load
        travelData.itineraries = itineraries.filter(Boolean);
      }
      
      return travelData;
    } catch (err) {
      console.error('Error fetching travel data:', err);
      throw err;
    }
  }

  onMount(async () => {
    // Get the travelId from the URL
    travelId = $page.params.travelId;
    
    try {
      travel = await fetchTravelData(travelId);
      isLoading = false;
    } catch (err) {
      console.error('Error loading travel data:', err);
      error = err instanceof Error ? err.message : 'Failed to load travel data';
      isLoading = false;
    }
  });
</script>

<div class="travel-map-page">
  <h1>Travel Map: {travelId}</h1>
  
  {#if isLoading}
    <div class="loading">Loading travel data...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if travel}
    <div class="travel-info">
      <h2>{travel.name || 'Travel'}</h2>
      <p>
        {new Date(travel.startDate).toLocaleDateString()} 
        {travel.endDate ? `- ${new Date(travel.endDate).toLocaleDateString()}` : ''}
      </p>
      {#if travel.description}
        <p class="description">{travel.description}</p>
      {/if}
    </div>
    
    <div class="map-container">
      <Map {travel} />
    </div>
    
    <div class="itinerary-list">
      <h3>Itineraries</h3>
      <ul>
        {#each travel.itineraries as itinerary, index}
          {@const colors = [
            '#3887be', // Default blue
            '#e55e5e', // Red
            '#3bb2d0', // Light blue
            '#8a2be2', // Purple
            '#ff8c00', // Orange
            '#006400', // Dark green
            '#ff1493', // Pink
            '#4b0082'  // Indigo
          ]}
          {@const routeColor = colors[index % colors.length]}
          <li>
            <div class="color-indicator" style="background-color: {routeColor};"></div>
            <div class="itinerary-info">
              <h4>{itinerary.name || `Itinerary ${itinerary.id}`}</h4>
              <p>
                {new Date(itinerary.startDate).toLocaleDateString()}
                {itinerary.endDate ? ` - ${new Date(itinerary.endDate).toLocaleDateString()}` : ''}
              </p>
              <p class="photo-count">
                {#if itinerary.photoClusters}
                  {itinerary.photoClusters.reduce((total, cluster) => total + cluster.photos.length, 0)} photos
                {:else}
                  No photos
                {/if}
              </p>
            </div>
          </li>
        {/each}
      </ul>
    </div>
  {:else}
    <div class="no-data">No travel data available</div>
  {/if}
</div>

<style>
  .travel-map-page {
    padding: 1rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  h1 {
    margin-bottom: 1rem;
  }
  
  .loading, .error, .no-data {
    padding: 2rem;
    text-align: center;
  }
  
  .error {
    color: #d32f2f;
  }
  
  .map-container {
    height: 500px;
    margin: 1rem 0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .travel-info {
    margin-bottom: 1rem;
  }
  
  .description {
    font-style: italic;
  }
  
  .itinerary-list ul {
    list-style-type: none;
    padding: 0;
  }
  
  .itinerary-list li {
    margin-bottom: 0.5rem;
    padding: 0.5rem;
    border: 1px solid #eee;
    border-radius: 4px;
    display: flex;
    align-items: center;
  }
  
  .color-indicator {
    width: 12px;
    height: 40px;
    border-radius: 3px;
    margin-right: 10px;
  }
  
  .itinerary-info {
    flex: 1;
  }
  
  .itinerary-list h4 {
    margin: 0 0 0.5rem 0;
  }
  
  .itinerary-list p {
    margin: 0;
    font-size: 0.9rem;
    color: #666;
  }
  
  .photo-count {
    font-size: 0.8rem;
    color: #888;
    margin-top: 0.25rem !important;
  }
</style>

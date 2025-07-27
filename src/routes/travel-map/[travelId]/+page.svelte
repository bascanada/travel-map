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
      const indexResponse = await fetch(__APP_CONFIG__.travelIndex);
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

<div class="container mx-auto p-4">
  <h1 class="h1">Travel Map: {travelId}</h1>
  
  {#if isLoading}
    <div class="text-center p-4">Loading travel data...</div>
  {:else if error}
    <div class="alert variant-filled-error">{error}</div>
  {:else if travel}
    <div class="mb-4">
      <h2 class="h2">{travel.name || 'Travel'}</h2>
      <p class="text-surface-500">
        {new Date(travel.startDate).toLocaleDateString()} 
        {travel.endDate ? `- ${new Date(travel.endDate).toLocaleDateString()}` : ''}
      </p>
      {#if travel.description}
        <p class="italic">{travel.description}</p>
      {/if}
    </div>
    
    <div class="h-[500px] my-4 rounded-md overflow-hidden">
      <Map {travel} />
    </div>
    
    <div>
      <h3 class="h3">Itineraries</h3>
      <ul class="list-none p-0">
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
          <li class="mb-2 p-2 border border-surface-300 rounded-md flex items-center">
            <div class="w-3 h-10 rounded-sm mr-3" style="background-color: {routeColor};"></div>
            <div class="flex-1">
              <h4 class="h4">{itinerary.name || `Itinerary ${itinerary.id}`}</h4>
              <p class="text-sm text-surface-500">
                {new Date(itinerary.startDate).toLocaleDateString()}
                {itinerary.endDate ? ` - ${new Date(itinerary.endDate).toLocaleDateString()}` : ''}
              </p>
              <p class="text-xs text-surface-400 mt-1">
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
    <div class="text-center p-4">No travel data available</div>
  {/if}
</div>

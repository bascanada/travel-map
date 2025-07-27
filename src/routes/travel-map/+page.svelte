<script lang="ts">
  import { onMount } from 'svelte';
  import Map from '$lib/Map.svelte';
  import type { Travel } from '$lib/types/travel-dataset';
  
  let travel: Travel | null = null;
  let isLoading = true;
  let error: string | null = null;

  onMount(async () => {
    try {
      const response = await fetch('/test-data/alabama_2025/alabama_2025.json');
      if (!response.ok) {
        throw new Error(`Failed to load travel data: ${response.statusText}`);
      }
      travel = await response.json();
      isLoading = false;
    } catch (err) {
      console.error('Error loading travel data:', err);
      error = err instanceof Error ? err.message : 'Failed to load travel data';
      isLoading = false;
    }
  });
</script>

<div class="travel-map-page">
  <h1>Travel Map</h1>
  
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
              <p class="photo-count">{itinerary.photoClusters.reduce((total, cluster) => total + cluster.photos.length, 0)} photos</p>
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

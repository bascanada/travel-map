<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import TravelMap from '$lib/TravelMap.svelte';
  import TimelineSection from '$lib/TimelineSection.svelte';
  import PhotoSidePanel from '$lib/PhotoSidePanel.svelte';
  import type { Travel, Photo, PhotoCluster, Itinerary } from '$lib/types/travel-dataset';
  
  let travelId = '';
  let travel: Travel | null = null;
  let isLoading = true;
  let error: string | null = null;
  
  // State for component interactions
  let selectedPhotos: string[] = [];
  let selectedItinerary: string | null = null;
  let selectedDate: string | null = null;

  // State for photo viewer
  let selectedPhoto: Photo | null = null;
  let selectedCluster: PhotoCluster | null = null;
  let selectedPhotoItinerary: Itinerary | null = null;
  let currentPhotoIndex: number = 0;
  let allPhotosForNavigation: Array<{ photo: Photo, cluster: PhotoCluster, itinerary: Itinerary }> = [];

  // Get all photos from all itineraries for navigation
  $: allPhotosForNavigation = travel?.itineraries.flatMap(itinerary => 
    itinerary.photoClusters.flatMap(cluster => 
      cluster.photos.map(photo => ({
        photo,
        cluster,
        itinerary
      }))
    )
  ) || [];

  // Navigation helpers
  $: canNavigate = {
    previous: currentPhotoIndex > 0,
    next: currentPhotoIndex < allPhotosForNavigation.length - 1
  };

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
  
  // Event handlers for component interactions
  function handlePhotoClusterClick(cluster: PhotoCluster, itinerary: Itinerary) {
    // Select all photos in the clicked cluster
    const clusterPhotoIds = cluster.photos.map(photo => photo.id);
    selectedPhotos = clusterPhotoIds;
  }
  
  function handlePhotoClick(photo: Photo, cluster: PhotoCluster, itinerary: Itinerary) {
    console.log('Photo clicked:', photo.id, 'from', cluster.interestPointName);
    
    // Find the index of this photo in the global photo list
    const photoIndex = allPhotosForNavigation.findIndex(
      item => item.photo.id === photo.id
    );
    
    if (photoIndex !== -1) {
      currentPhotoIndex = photoIndex;
      selectedPhoto = photo;
      selectedCluster = cluster;
      selectedPhotoItinerary = itinerary;
    }
  }
  
  function handlePhotoSelect(photoIds: string[]) {
    selectedPhotos = photoIds;
  }
  
  function handleItinerarySelect(itineraryId: string) {
    selectedItinerary = itineraryId || null;
  }
  
  function handleDayClick(date: string, itinerary: Itinerary) {
    selectedDate = date;
    console.log('Day clicked:', date, 'for itinerary:', itinerary.name);
    // Could filter photos by date or scroll to that date in the photo section
  }

  // Photo viewer handlers
  function closePhotoViewer() {
    selectedPhoto = null;
    selectedCluster = null;
    selectedPhotoItinerary = null;
    currentPhotoIndex = 0;
  }

  function showPreviousPhoto() {
    if (canNavigate.previous) {
      currentPhotoIndex--;
      const photoData = allPhotosForNavigation[currentPhotoIndex];
      selectedPhoto = photoData.photo;
      selectedCluster = photoData.cluster;
      selectedPhotoItinerary = photoData.itinerary;
    }
  }

  function showNextPhoto() {
    if (canNavigate.next) {
      currentPhotoIndex++;
      const photoData = allPhotosForNavigation[currentPhotoIndex];
      selectedPhoto = photoData.photo;
      selectedCluster = photoData.cluster;
      selectedPhotoItinerary = photoData.itinerary;
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
  <h1 class="h1">Travel: {travelId}</h1>
  
  {#if isLoading}
    <div class="text-center p-4">Loading travel data...</div>
  {:else if error}
    <div class="alert variant-filled-error">{error}</div>
  {:else if travel}
    <div class="mb-6">
      <h2 class="h2">{travel.name || 'Travel'}</h2>
      <p class="text-surface-500">
        {new Date(travel.startDate).toLocaleDateString()} 
        {travel.endDate ? `- ${new Date(travel.endDate).toLocaleDateString()}` : ''}
      </p>
      {#if travel.description}
        <p class="italic mt-2">{travel.description}</p>
      {/if}
    </div>
    
    <!-- Map and Photo Viewer Layout -->
    <div class="card overflow-hidden mb-8" style="height: 600px;">
      <div class="h-full flex">
        <!-- Map Section - takes remaining space or full width when no photo selected -->
        <div class="flex-1 relative">
          <div class="absolute inset-0">
            <TravelMap 
              {travel} 
              {selectedPhotos}
              {selectedPhoto}
              onPhotoClusterClick={handlePhotoClusterClick}
            />
          </div>
        </div>
        
        <!-- Photo Side Panel - only visible when photo is selected -->
        {#if selectedPhoto}
          <div class="w-96 flex-shrink-0">
            <PhotoSidePanel 
              {selectedPhoto}
              cluster={selectedCluster}
              itinerary={selectedPhotoItinerary}
              {canNavigate}
              onClose={closePhotoViewer}
              onPrevious={showPreviousPhoto}
              onNext={showNextPhoto}
            />
          </div>
        {/if}
      </div>
    </div>
    
    <!-- Layout for Timeline (now includes photos) -->
    <div class="card p-6">
      <TimelineSection 
        {travel}
        {selectedItinerary}
        {selectedPhotos}
        onItinerarySelect={handleItinerarySelect}
        onDayClick={handleDayClick}
        onPhotoClick={handlePhotoClick}
        onPhotoSelect={handlePhotoSelect}
      />
    </div>
  {:else}
    <div class="text-center p-4">No travel data available</div>
  {/if}
</div>

<!-- No custom styles needed - using Skeleton + Tailwind -->

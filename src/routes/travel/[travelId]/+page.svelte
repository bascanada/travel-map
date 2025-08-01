<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { getFullPath, getTravelIndexUrl } from '$lib';
  import TravelMap from '$lib/TravelMap.svelte';
  import TimelineSection from '$lib/TimelineSection.svelte';
  import PhotoSidePanel from '$lib/PhotoSidePanel.svelte';
  import type { Travel, Photo, PhotoCluster, Itinerary } from '$lib/types/travel-dataset';

  let isSidebarOpen = false;

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

  // Debug: Log when selectedPhoto changes
  $: if (selectedPhoto) {
    console.log('selectedPhoto changed to:', selectedPhoto.id);
  } else {
    console.log('selectedPhoto cleared');
  }

  // Navigation helpers
  $: canNavigate = {
    previous: currentPhotoIndex > 0,
    next: currentPhotoIndex < allPhotosForNavigation.length - 1
  };

  // Helper function to fetch travel data
  async function fetchTravelData(id: string) {
    try {
      // First, fetch the index to get the travel file location
      const indexResponse = await fetch(getTravelIndexUrl());
      if (!indexResponse.ok) {
        throw new Error(`Failed to load travel index: ${indexResponse.statusText}`);
      }
      
      const index = await indexResponse.json();
      const travelEntry = index.travels.find((t: any) => t.id === id);
      
      if (!travelEntry) {
        throw new Error(`Travel with ID "${id}" not found`);
      }
      
      // Now fetch the specific travel file
      const travelResponse = await fetch(getFullPath(travelEntry.file));
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
          const itineraryPath = `${basePath}${itineraryId}/${itineraryId}.json`;
          const response = await fetch(getFullPath(itineraryPath));
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
    console.log('handlePhotoClick called:', photo.id, 'from', cluster.interestPointName);
    console.log('Current allPhotosForNavigation length:', allPhotosForNavigation.length);
    
    // Close sidebar when photo is selected to prevent collision
    isSidebarOpen = false;
    
    // Find the index of this photo in the global photo list
    const photoIndex = allPhotosForNavigation.findIndex(
      item => item.photo.id === photo.id
    );
    
    console.log('Photo index found:', photoIndex);
    
    if (photoIndex !== -1) {
      currentPhotoIndex = photoIndex;
      selectedPhoto = photo;
      selectedCluster = cluster;
      selectedPhotoItinerary = itinerary;
      console.log('Photo viewer should now be open with:', selectedPhoto.id);
    } else {
      console.error('Photo not found in navigation array');
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

{#if isLoading}
  <div class="text-center p-4">Loading travel data...</div>
{:else if error}
  <div class="alert variant-filled-error">{error}</div>
{:else if travel}
  <div class="relative h-screen w-screen overflow-hidden flex">
    <!-- Backdrop (for mobile) -->
    {#if isSidebarOpen}
      <div
        class="fixed inset-0 z-10 bg-black/50 xl:hidden"
        on:click={() => (isSidebarOpen = false)}
        role="presentation"
      ></div>
    {/if}

    <!-- Sidebar -->
    <aside
      class="sidebar-bg scrollbar-none absolute z-20 h-full transform {isSidebarOpen
        ? 'translate-x-0'
        : '-translate-x-full'} transition-transform duration-300 ease-in-out xl:relative xl:translate-x-0 w-full sm:w-[45%] md:w-[40%] lg:w-[35%] xl:w-[30%] min-w-[360px] max-w-[600px] border-surface-200-700-token"
    >
      <div class="p-4 h-full overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h2 class="h2 text-on-surface-token">Timeline</h2>
          <button class="xl:hidden btn btn-sm" on:click={() => (isSidebarOpen = false)}>
            <!-- Close Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <TimelineSection
          {travel}
          {selectedItinerary}
          selectedPhoto={selectedPhoto}
          onItinerarySelect={handleItinerarySelect}
          onDayClick={handleDayClick}
          onPhotoClick={handlePhotoClick}
        />
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col h-screen">
      <!-- Header -->
      <header class="card p-2 rounded-none flex items-center justify-between">
        <div class="flex items-center">
          <button class="xl:hidden btn btn-sm mr-4" on:click={() => (isSidebarOpen = true)}>
            <!-- Menu Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>
          <h1 class="h1 text-lg text-on-surface-token">{travel.name || 'Travel'}</h1>
        </div>
        <div class="text-sm text-surface-600-300-token">
          {new Date(travel.startDate).toLocaleDateString()}
          {travel.endDate ? `- ${new Date(travel.endDate).toLocaleDateString()}` : ''}
        </div>
      </header>

      <!-- Map and Photo Panel Container -->
      <div class="flex-1 flex overflow-hidden relative">
        <!-- Map Section -->
        <div class="flex-1 relative">
          <div class="absolute inset-0">
            <TravelMap
              {travel}
              {selectedPhotos}
              {selectedPhoto}
              onPhotoClusterClick={handlePhotoClusterClick}
              onPhotoClick={handlePhotoClick}
            />
          </div>
        </div>

        <!-- Photo Side Panel -->
        {#if selectedPhoto}
          <!-- Mobile: Overlay on top of map, but below sidebar -->
          <div class="absolute inset-0 z-10 bg-surface-50-900-token md:hidden">
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
          
          <!-- Desktop: Side panel taking more space -->
          <div class="hidden md:block w-[60%] lg:w-[55%] xl:w-[50%] min-w-[400px] max-w-[800px] flex-shrink-0 bg-surface-100-800-token overflow-y-auto">
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
    </main>
  </div>
{:else}
  <div class="text-center p-4 text-on-surface-token">No travel data available</div>
{/if}

<style>
  .sidebar-bg {
    background-color: var(--color-surface-100-900)
  }
</style>

<script lang="ts">
  import type { Travel, Itinerary, PhotoCluster, Photo } from './types/travel-dataset';
  import { getImageUrl } from './imageUtils';
  
  export let travel: Travel | null = null;
  export let selectedItinerary: string | null = null;
  export let selectedPhotos: string[] = [];
  export let onItinerarySelect: ((itineraryId: string) => void) | null = null;
  export let onDayClick: ((date: string, itinerary: Itinerary) => void) | null = null;
  export let onPhotoClick: ((photo: Photo, cluster: PhotoCluster, itinerary: Itinerary) => void) | null = null;
  export let onPhotoSelect: ((photoIds: string[]) => void) | null = null;
  
  // Array of colors for multiple itineraries (same as in TravelMap)
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
  
  // Process itineraries to create timeline data
  $: timelineData = travel?.itineraries.map((itinerary, index) => {
    // Create days from start to end date
    const startDate = new Date(itinerary.startDate);
    const endDate = itinerary.endDate ? new Date(itinerary.endDate) : startDate;
    
    const days: Array<{
      date: Date;
      dateString: string;
      photoClusters: PhotoCluster[];
      photoCount: number;
    }> = [];
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0];
      
      // Find photo clusters for this day
      const dayPhotoClusters = itinerary.photoClusters?.filter(cluster => {
        if (!cluster.photos.length) return false;
        const photoDate = new Date(cluster.photos[0].date).toISOString().split('T')[0];
        return photoDate === dateString;
      }) || [];
      
      const photoCount = dayPhotoClusters.reduce((sum, cluster) => sum + cluster.photos.length, 0);
      
      days.push({
        date: new Date(currentDate),
        dateString,
        photoClusters: dayPhotoClusters,
        photoCount
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return {
      itinerary,
      color: routeColors[index % routeColors.length],
      days,
      totalPhotos: itinerary.photoClusters?.reduce((sum, cluster) => sum + cluster.photos.length, 0) || 0
    };
  }) || [];

  // Get total photo count across all itineraries
  $: totalPhotos = timelineData.reduce((sum, data) => sum + data.totalPhotos, 0);
  
  function handleItineraryToggle(itineraryId: string) {
    const newSelection = selectedItinerary === itineraryId ? null : itineraryId;
    onItinerarySelect?.(newSelection || '');
  }
  
  function handleDayClick(dateString: string, itinerary: Itinerary) {
    onDayClick?.(dateString, itinerary);
  }
  
  function handlePhotoClick(photo: Photo, cluster: PhotoCluster, itinerary: Itinerary) {
    onPhotoClick?.(photo, cluster, itinerary);
  }
  
  function togglePhotoSelection(photoId: string) {
    if (!onPhotoSelect) return;
    
    const newSelection = selectedPhotos.includes(photoId)
      ? selectedPhotos.filter(id => id !== photoId)
      : [...selectedPhotos, photoId];
    
    onPhotoSelect(newSelection);
  }
  
  function formatDateShort(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  }
  
  function formatDateLong(date: Date): string {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="h3">Timeline & Photos</h3>
    <div class="flex items-center gap-2">
      {#if timelineData.length > 0}
        <span class="text-sm text-surface-500">
          {timelineData.length} itinerary{timelineData.length !== 1 ? 'ies' : ''}
          {#if totalPhotos > 0}
            • {totalPhotos} photos
            {#if selectedPhotos.length > 0}
              • {selectedPhotos.length} selected
            {/if}
          {/if}
        </span>
      {/if}
    </div>
  </div>
  
  {#if timelineData.length === 0}
    <div class="card p-8">
      <p class="text-center text-surface-500">No itinerary data available for this travel.</p>
    </div>
  {:else}
    <div class="space-y-4">
      {#each timelineData as { itinerary, color, days, totalPhotos }, index}
        {@const isExpanded = selectedItinerary === itinerary.id}
        
        <div class="card">
          <button 
            class="w-full p-4 hover:bg-surface-100-800-token transition-colors flex items-center justify-between"
            on:click={() => handleItineraryToggle(itinerary.id)}
          >
            <div class="flex items-center gap-4 text-left">
              <div class="w-4 h-16 rounded-sm flex-shrink-0" style="background-color: {color};"></div>
              <div class="flex flex-col gap-1">
                <h4 class="h4">{itinerary.name || `Itinerary ${itinerary.id}`}</h4>
                <p class="text-sm text-surface-600">
                  {formatDateLong(new Date(itinerary.startDate))}
                  {#if itinerary.endDate && itinerary.endDate !== itinerary.startDate}
                    → {formatDateLong(new Date(itinerary.endDate))}
                  {/if}
                </p>
                <p class="text-xs text-surface-500">
                  {days.length} day{days.length !== 1 ? 's' : ''} • {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div class="transition-transform duration-200 {isExpanded ? 'rotate-180' : ''}">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </div>
          </button>
          
          {#if isExpanded}
            <div class="px-4 pb-4 relative">
              <div class="absolute left-8 top-0 bottom-4 w-0.5 border-l-2" style="border-color: {color};"></div>
              
              <div class="ml-12 space-y-4">
                {#each days as day}
                  <div class="space-y-3">
                    <!-- Day header -->
                    <button 
                      class="card w-full p-3 hover:variant-soft-primary transition-colors flex items-center gap-4 text-left {day.photoCount > 0 ? 'variant-ghost-primary' : ''} {day.photoCount === 0 ? 'opacity-60' : ''}"
                      on:click={() => handleDayClick(day.dateString, itinerary)}
                      disabled={day.photoCount === 0}
                    >
                      <div class="flex flex-col items-center min-w-[3rem]">
                        <div class="text-2xl font-bold leading-none">{day.date.getDate()}</div>
                        <div class="text-xs text-surface-500 uppercase">{formatDateShort(day.date).split(' ')[0]}</div>
                      </div>
                      
                      <div class="flex-1 space-y-1">
                        <div class="font-medium">{formatDateShort(day.date)}</div>
                        
                        {#if day.photoCount > 0}
                          <div class="text-sm text-primary-600 font-medium">
                            {day.photoCount} photo{day.photoCount !== 1 ? 's' : ''}
                          </div>
                          
                          {#if day.photoClusters.length > 0}
                            <div class="flex flex-wrap gap-1">
                              {#each day.photoClusters as cluster}
                                <span class="badge variant-soft-surface text-xs">
                                  {cluster.interestPointName || 'Unknown location'}
                                </span>
                              {/each}
                            </div>
                          {/if}
                        {:else}
                          <div class="text-sm text-surface-400 italic">No photos</div>
                        {/if}
                      </div>
                    </button>

                    <!-- Photos for this day -->
                    {#if day.photoCount > 0}
                      <div class="ml-16 space-y-3">
                        {#each day.photoClusters as cluster}
                          {#if cluster.photos.length > 0}
                            <div class="space-y-2">
                              <div class="text-sm font-medium text-surface-600">
                                📍 {cluster.interestPointName || 'Unknown location'}
                              </div>
                              
                              <div class="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-6 xl:grid-cols-8 gap-2">
                                {#each cluster.photos as photo}
                                  {@const isSelected = selectedPhotos.includes(photo.id)}
                                  
                                  <div 
                                    class="relative group cursor-pointer overflow-hidden rounded-md border-2 transition-all duration-200 {isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent hover:border-surface-300'}"
                                    role="button"
                                    tabindex="0"
                                    on:click={() => handlePhotoClick(photo, cluster, itinerary)}
                                    on:keydown={(e) => e.key === 'Enter' && handlePhotoClick(photo, cluster, itinerary)}
                                  >
                                    <div class="aspect-square relative">
                                      <img 
                                        src={photo.cloudinary?.thumbnail_url || getImageUrl(photo.url, 'thumbnail')} 
                                        alt={photo.description || `Photo from ${cluster.interestPointName || 'travel'}`}
                                        loading="lazy"
                                        crossorigin="anonymous"
                                        class="w-full h-full object-cover"
                                      />
                                      
                                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex flex-col justify-between p-1">
                                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                          <p class="text-white text-xs font-medium truncate leading-tight">
                                            {new Date(photo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </p>
                                        </div>
                                        
                                        {#if onPhotoSelect}
                                          <button 
                                            class="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                            on:click|stopPropagation={() => togglePhotoSelection(photo.id)}
                                            aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                                          >
                                            <div class="w-3 h-3 rounded-full border border-white {isSelected ? 'bg-primary-500 border-primary-500' : 'bg-black/20'} flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
                                              {#if isSelected}
                                                <span class="text-[8px]">✓</span>
                                              {/if}
                                            </div>
                                          </button>
                                        {/if}
                                      </div>
                                    </div>
                                  </div>
                                {/each}
                              </div>
                            </div>
                          {/if}
                        {/each}
                      </div>
                    {/if}
                  </div>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<!-- No custom styles needed - using Skeleton + Tailwind -->

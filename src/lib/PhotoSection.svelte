<script lang="ts">
  import type { Travel, Photo, PhotoCluster, Itinerary } from './types/travel-dataset';
  import { getImageUrl } from './imageUtils';
  
  export let travel: Travel | null = null;
  export let selectedPhotos: string[] = [];
  export let onPhotoClick: ((photo: Photo, cluster: PhotoCluster, itinerary: Itinerary) => void) | null = null;
  export let onPhotoSelect: ((photoIds: string[]) => void) | null = null;
  
  // Get all photos from all itineraries with their cluster and itinerary context
  $: allPhotos = travel?.itineraries.flatMap(itinerary => 
    itinerary.photoClusters.flatMap(cluster => 
      cluster.photos.map(photo => ({
        photo,
        cluster,
        itinerary
      }))
    )
  ) || [];
  
  // Group photos by date for better organization
  $: photosByDate = allPhotos.reduce((acc, { photo, cluster, itinerary }) => {
    const date = new Date(photo.date).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push({ photo, cluster, itinerary });
    return acc;
  }, {} as Record<string, Array<{ photo: Photo, cluster: PhotoCluster, itinerary: Itinerary }>>);
  
  $: sortedDates = Object.keys(photosByDate).sort((a, b) => 
    new Date(a).getTime() - new Date(b).getTime()
  );
  
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
  
  function selectAllPhotosForDate(date: string) {
    if (!onPhotoSelect) return;
    
    const datePhotos = photosByDate[date];
    const datePhotoIds = datePhotos.map(({ photo }) => photo.id);
    const allSelected = datePhotoIds.every(id => selectedPhotos.includes(id));
    
    let newSelection: string[];
    if (allSelected) {
      // Deselect all photos from this date
      newSelection = selectedPhotos.filter(id => !datePhotoIds.includes(id));
    } else {
      // Select all photos from this date
      newSelection = [...new Set([...selectedPhotos, ...datePhotoIds])];
    }
    
    onPhotoSelect(newSelection);
  }
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <h3 class="h3">Photos</h3>
    <div class="flex items-center gap-2">
      {#if allPhotos.length > 0}
        <span class="text-sm text-surface-500">
          {allPhotos.length} photos total
          {#if selectedPhotos.length > 0}
            • {selectedPhotos.length} selected
          {/if}
        </span>
      {/if}
    </div>
  </div>
  
  {#if allPhotos.length === 0}
    <div class="card p-8">
      <p class="text-center text-surface-500">No photos available for this travel.</p>
    </div>
  {:else}
    <div class="space-y-6">
      {#each sortedDates as date}
        {@const datePhotos = photosByDate[date]}
        {@const datePhotoIds = datePhotos.map(({ photo }) => photo.id)}
        {@const allSelectedForDate = datePhotoIds.every(id => selectedPhotos.includes(id))}
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h4 class="h4">{new Date(date).toLocaleDateString()}</h4>
            <div class="flex items-center gap-3">
              <span class="text-xs text-surface-400">{datePhotos.length} photos</span>
              {#if onPhotoSelect}
                <button 
                  class="btn btn-sm variant-ghost-primary"
                  on:click={() => selectAllPhotosForDate(date)}
                >
                  {allSelectedForDate ? 'Deselect All' : 'Select All'}
                </button>
              {/if}
            </div>
          </div>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {#each datePhotos as { photo, cluster, itinerary }}
              {@const isSelected = selectedPhotos.includes(photo.id)}
              
              <div 
                class="card card-hover overflow-hidden cursor-pointer transition-all duration-200 border-2 {isSelected ? 'border-primary-500 shadow-lg' : 'border-transparent'}"
                role="button"
                tabindex="0"
                on:click={() => handlePhotoClick(photo, cluster, itinerary)}
                on:keydown={(e) => e.key === 'Enter' && handlePhotoClick(photo, cluster, itinerary)}
              >
                <div class="aspect-square relative group">
                  <img 
                    src={photo.cloudinary?.thumbnail_url || getImageUrl(photo.url, 'thumbnail')} 
                    alt={photo.description || `Photo from ${cluster.interestPointName || 'travel'}`}
                    loading="lazy"
                    crossorigin="anonymous"
                    class="w-full h-full object-cover"
                  />
                  
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-200 flex flex-col justify-between p-3">
                    <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p class="text-white text-sm font-medium mb-1">
                        {cluster.interestPointName || 'Unknown location'}
                      </p>
                      <p class="text-white text-xs opacity-80">
                        {itinerary.name || `Itinerary ${itinerary.id}`}
                      </p>
                    </div>
                    
                    {#if onPhotoSelect}
                      <button 
                        class="self-end opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        on:click|stopPropagation={() => togglePhotoSelection(photo.id)}
                        aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                      >
                        <div class="w-6 h-6 rounded-full border-2 border-white {isSelected ? 'bg-primary-500 border-primary-500' : 'bg-black/20'} flex items-center justify-center text-white text-xs font-bold transition-all duration-200">
                          {#if isSelected}
                            ✓
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
      {/each}
    </div>
  {/if}
</div>

<!-- No custom styles needed - using Skeleton + Tailwind -->

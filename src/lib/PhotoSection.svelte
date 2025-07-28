<script lang="ts">
  import type { Travel, Photo, PhotoCluster, Itinerary } from './types/travel-dataset';
  
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

<div class="photo-section">
  <div class="photo-section-header">
    <h3 class="h3">Photos</h3>
    <div class="photo-stats">
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
    <div class="empty-state">
      <p class="text-center text-surface-500">No photos available for this travel.</p>
    </div>
  {:else}
    <div class="photos-by-date">
      {#each sortedDates as date}
        {@const datePhotos = photosByDate[date]}
        {@const datePhotoIds = datePhotos.map(({ photo }) => photo.id)}
        {@const allSelectedForDate = datePhotoIds.every(id => selectedPhotos.includes(id))}
        
        <div class="date-section">
          <div class="date-header">
            <h4 class="h4">{new Date(date).toLocaleDateString()}</h4>
            <div class="date-actions">
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
          
          <div class="photo-grid">
            {#each datePhotos as { photo, cluster, itinerary }}
              {@const isSelected = selectedPhotos.includes(photo.id)}
              
              <div 
                class="photo-thumbnail {isSelected ? 'selected' : ''}"
                role="button"
                tabindex="0"
                on:click={() => handlePhotoClick(photo, cluster, itinerary)}
                on:keydown={(e) => e.key === 'Enter' && handlePhotoClick(photo, cluster, itinerary)}
              >
                <img 
                  src={photo.url} 
                  alt={photo.description || `Photo from ${cluster.interestPointName || 'travel'}`}
                  loading="lazy"
                />
                
                <div class="photo-overlay">
                  <div class="photo-info">
                    <p class="photo-location">
                      {cluster.interestPointName || 'Unknown location'}
                    </p>
                    <p class="photo-itinerary">
                      {itinerary.name || `Itinerary ${itinerary.id}`}
                    </p>
                  </div>
                  
                  {#if onPhotoSelect}
                    <button 
                      class="photo-select-btn"
                      on:click|stopPropagation={() => togglePhotoSelection(photo.id)}
                      aria-label={isSelected ? 'Deselect photo' : 'Select photo'}
                    >
                      <div class="select-indicator {isSelected ? 'selected' : ''}">
                        {#if isSelected}
                          ✓
                        {/if}
                      </div>
                    </button>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .photo-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .photo-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .photo-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .empty-state {
    padding: 2rem;
    border: 1px solid rgb(var(--color-surface-300));
    border-radius: 0.5rem;
  }
  
  .photos-by-date {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .date-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .date-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .date-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .photo-thumbnail {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.5rem;
    overflow: hidden;
    cursor: pointer;
    background-color: rgb(var(--color-surface-200));
    transition: all 0.2s ease;
    border: 2px solid transparent;
  }
  
  .photo-thumbnail:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  }
  
  .photo-thumbnail.selected {
    border-color: rgb(var(--color-primary-500));
    box-shadow: 0 0 0 1px rgb(var(--color-primary-500));
  }
  
  .photo-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .photo-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0);
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 0.75rem;
  }
  
  .photo-thumbnail:hover .photo-overlay {
    background-color: rgba(0, 0, 0, 0.6);
  }
  
  .photo-info {
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .photo-thumbnail:hover .photo-info {
    opacity: 1;
  }
  
  .photo-location {
    color: white;
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.25rem;
  }
  
  .photo-itinerary {
    color: white;
    font-size: 0.75rem;
    opacity: 0.8;
  }
  
  .photo-select-btn {
    align-self: flex-end;
    opacity: 0;
    transition: opacity 0.2s ease;
  }
  
  .photo-thumbnail:hover .photo-select-btn,
  .photo-thumbnail.selected .photo-select-btn {
    opacity: 1;
  }
  
  .select-indicator {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    border: 2px solid white;
    background-color: rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 0.75rem;
    font-weight: bold;
    transition: all 0.2s ease;
  }
  
  .select-indicator.selected {
    background-color: rgb(var(--color-primary-500));
    border-color: rgb(var(--color-primary-500));
  }
</style>

<script lang="ts">
  import { fly } from 'svelte/transition';
  import type { Photo, PhotoCluster, Itinerary } from './types/travel-dataset';
  import { getImageUrl } from './imageUtils';

  export let selectedPhoto: Photo | null = null;
  export let cluster: PhotoCluster | null = null;
  export let itinerary: Itinerary | null = null;
  export let onClose: (() => void) | null = null;
  export let onPrevious: (() => void) | null = null;
  export let onNext: (() => void) | null = null;
  export let canNavigate: { previous: boolean; next: boolean } = { previous: false, next: false };

  $: isOpen = selectedPhoto !== null;
</script>

{#if isOpen && selectedPhoto}
  <div 
    class="h-full flex flex-col bg-surface-50 dark:bg-surface-900 border-l border-surface-200 dark:border-surface-700"
    transition:fly={{ x: 300, duration: 300 }}
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700 flex-shrink-0">
      <div class="flex-1 min-w-0">
        <h3 class="h5 truncate text-on-surface-token">{cluster?.interestPointName || 'Photo'}</h3>
        <p class="text-sm text-surface-600-300-token truncate">
          {itinerary?.name || `Itinerary ${itinerary?.id}`}
        </p>
      </div>
      <button 
        class="btn btn-sm variant-ghost-surface ml-2 flex-shrink-0"
        on:click={() => onClose?.()}
        aria-label="Close photo viewer"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    </div>

    <!-- Image with navigation -->
    <div class="relative flex-1 min-h-0 bg-black">
      <div class="w-full h-full flex items-center justify-center p-4">
        <img 
          src={selectedPhoto.cloudinary?.optimized_url || getImageUrl(selectedPhoto.url, 'large')} 
          alt={selectedPhoto.description || `Photo from ${cluster?.interestPointName || 'travel'}`}
          class="max-w-full max-h-full object-contain"
          loading="lazy"
          crossorigin="anonymous"
        />
      </div>

      <!-- Navigation buttons -->
      {#if canNavigate.previous}
        <button 
          class="absolute left-2 top-1/2 -translate-y-1/2 btn btn-sm variant-filled-surface/80 hover:variant-filled-surface"
          on:click={() => onPrevious?.()}
          aria-label="Previous photo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
      {/if}

      {#if canNavigate.next}
        <button 
          class="absolute right-2 top-1/2 -translate-y-1/2 btn btn-sm variant-filled-surface/80 hover:variant-filled-surface"
          on:click={() => onNext?.()}
          aria-label="Next photo"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      {/if}
    </div>

    <!-- Photo details -->
    <div class="p-4 border-t border-surface-200 dark:border-surface-700 flex-shrink-0">
      <div class="space-y-2">
        <div class="text-sm text-surface-600-300-token">
          📅 {new Date(selectedPhoto.date).toLocaleDateString()}
        </div>
        
        {#if selectedPhoto.description}
          <p class="text-sm text-on-surface-token">{selectedPhoto.description}</p>
        {/if}
        
        <div class="text-xs text-surface-500-400-token">
          📍 {selectedPhoto.position.latitude.toFixed(4)}, {selectedPhoto.position.longitude.toFixed(4)}
        </div>
      </div>
    </div>
  </div>
{/if}

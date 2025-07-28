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
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    transition:fly={{ x: 300, duration: 300 }}
  >
    <div class="bg-surface-50 dark:bg-surface-900 rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full overflow-hidden">
      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <div class="flex-1">
          <h3 class="h4">{cluster?.interestPointName || 'Photo'}</h3>
          <p class="text-sm text-surface-500">
            {itinerary?.name || `Itinerary ${itinerary?.id}`} • 
            {new Date(selectedPhoto.date).toLocaleDateString()}
          </p>
        </div>
        <button 
          class="btn btn-sm variant-ghost-surface"
          on:click={() => onClose?.()}
          aria-label="Close photo viewer"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>

      <!-- Image and navigation -->
      <div class="relative">
        <div class="flex items-center justify-center bg-black min-h-[400px] max-h-[60vh]">
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
      <div class="p-4 space-y-2">
        {#if selectedPhoto.description}
          <p class="text-surface-700 dark:text-surface-300">{selectedPhoto.description}</p>
        {/if}
        
        <div class="flex items-center gap-4 text-sm text-surface-500">
          <span>📍 {selectedPhoto.position.latitude.toFixed(4)}, {selectedPhoto.position.longitude.toFixed(4)}</span>
          <span>📅 {new Date(selectedPhoto.date).toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>
{/if}

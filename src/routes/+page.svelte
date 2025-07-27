<script lang="ts">
  import { onMount } from 'svelte';
  import type { TravelIndex, TravelIndexEntry } from '$lib/types/travel-index';
  
  let travels: TravelIndexEntry[] = [];
  let isLoading = true;
  let error: string | null = null;
  
  onMount(async () => {
    try {
      const response = await fetch('/test-data/index.json');
      if (!response.ok) {
        throw new Error(`Failed to load travel index: ${response.statusText}`);
      }
      
      const data: TravelIndex = await response.json();
      travels = data.travels || [];
      isLoading = false;
    } catch (err) {
      console.error('Error loading travel index:', err);
      error = err instanceof Error ? err.message : 'Failed to load travel data';
      isLoading = false;
    }
  });
</script>

<div class="home-page">
  <header>
    <h1>Travel Explorer</h1>
    <p>Explore your travel adventures</p>
  </header>
  
  <main>
    {#if isLoading}
      <div class="loading">Loading travel data...</div>
    {:else if error}
      <div class="error">{error}</div>
    {:else if travels.length === 0}
      <div class="no-data">No travel data available</div>
    {:else}
      <div class="travel-grid">
        {#each travels as travel}
          <a href={`/travel-map/${travel.id}`} class="travel-card">
            <div class="card-image">
              {#if travel.coverPhotoUrl}
                <img src={travel.coverPhotoUrl} alt={travel.name} />
              {:else}
                <div class="placeholder-image">
                  <span class="material-icons">public</span>
                </div>
              {/if}
            </div>
            <div class="card-content">
              <h2>{travel.name || 'Untitled Travel'}</h2>
              <div class="travel-dates">
                <span class="material-icons">calendar_today</span>
                <span>
                  {new Date(travel.startDate).toLocaleDateString()}
                  {travel.endDate ? ` - ${new Date(travel.endDate).toLocaleDateString()}` : ''}
                </span>
              </div>
              {#if travel.description}
                <p class="description">{travel.description}</p>
              {/if}
              <div class="view-travel">View Travel &rarr;</div>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </main>
</div>

<style>
  .home-page {
    padding: 2rem;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
  }
  
  .loading, .error, .no-data {
    padding: 2rem;
    text-align: center;
  }
  
  .error {
    color: #d32f2f;
  }
  
  .travel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .travel-card {
    display: block;
    text-decoration: none;
    color: inherit;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    background: white;
  }
  
  .travel-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
  }
  
  .card-image {
    height: 200px;
    overflow: hidden;
    position: relative;
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  
  .placeholder-image {
    width: 100%;
    height: 100%;
    background-color: #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .placeholder-image .material-icons {
    font-size: 48px;
    color: #757575;
  }
  
  .card-content {
    padding: 1.25rem;
  }
  
  .card-content h2 {
    margin: 0 0 0.75rem 0;
    font-size: 1.25rem;
  }
  
  .travel-dates {
    display: flex;
    align-items: center;
    margin-bottom: 0.75rem;
    font-size: 0.9rem;
    color: #666;
  }
  
  .travel-dates .material-icons {
    font-size: 16px;
    margin-right: 6px;
  }
  
  .description {
    margin: 0.5rem 0;
    font-size: 0.9rem;
    color: #666;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  
  .view-travel {
    margin-top: 1rem;
    font-weight: 500;
    color: #1976d2;
    transition: color 0.2s ease;
  }
  
  .travel-card:hover .view-travel {
    color: #0d47a1;
  }
</style>

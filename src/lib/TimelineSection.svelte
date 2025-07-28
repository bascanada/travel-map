<script lang="ts">
  import type { Travel, Itinerary, PhotoCluster } from './types/travel-dataset';
  
  export let travel: Travel | null = null;
  export let selectedItinerary: string | null = null;
  export let onItinerarySelect: ((itineraryId: string) => void) | null = null;
  export let onDayClick: ((date: string, itinerary: Itinerary) => void) | null = null;
  
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
  
  function handleItineraryToggle(itineraryId: string) {
    const newSelection = selectedItinerary === itineraryId ? null : itineraryId;
    onItinerarySelect?.(newSelection || '');
  }
  
  function handleDayClick(dateString: string, itinerary: Itinerary) {
    onDayClick?.(dateString, itinerary);
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

<div class="timeline-section">
  <div class="timeline-header">
    <h3 class="h3">Timeline</h3>
    <div class="timeline-stats">
      {#if timelineData.length > 0}
        <span class="text-sm text-surface-500">
          {timelineData.length} itinerary{timelineData.length !== 1 ? 'ies' : ''}
        </span>
      {/if}
    </div>
  </div>
  
  {#if timelineData.length === 0}
    <div class="empty-state">
      <p class="text-center text-surface-500">No itinerary data available for this travel.</p>
    </div>
  {:else}
    <div class="itineraries">
      {#each timelineData as { itinerary, color, days, totalPhotos }, index}
        {@const isExpanded = selectedItinerary === itinerary.id}
        
        <div class="itinerary-card">
          <button 
            class="itinerary-header"
            on:click={() => handleItineraryToggle(itinerary.id)}
          >
            <div class="itinerary-info">
              <div class="itinerary-color" style="background-color: {color};"></div>
              <div class="itinerary-details">
                <h4 class="h4">{itinerary.name || `Itinerary ${itinerary.id}`}</h4>
                <p class="itinerary-dates">
                  {formatDateLong(new Date(itinerary.startDate))}
                  {#if itinerary.endDate && itinerary.endDate !== itinerary.startDate}
                    → {formatDateLong(new Date(itinerary.endDate))}
                  {/if}
                </p>
                <p class="itinerary-summary">
                  {days.length} day{days.length !== 1 ? 's' : ''} • {totalPhotos} photo{totalPhotos !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            <div class="expand-icon {isExpanded ? 'expanded' : ''}">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg>
            </div>
          </button>
          
          {#if isExpanded}
            <div class="itinerary-timeline">
              <div class="timeline-line" style="border-color: {color};"></div>
              
              <div class="days-grid">
                {#each days as day}
                  <button 
                    class="day-card {day.photoCount > 0 ? 'has-photos' : ''}"
                    on:click={() => handleDayClick(day.dateString, itinerary)}
                    disabled={day.photoCount === 0}
                  >
                    <div class="day-date">
                      <div class="day-number">{day.date.getDate()}</div>
                      <div class="day-month">{formatDateShort(day.date).split(' ')[0]}</div>
                    </div>
                    
                    <div class="day-content">
                      <div class="day-title">{formatDateShort(day.date)}</div>
                      
                      {#if day.photoCount > 0}
                        <div class="day-photos">
                          {day.photoCount} photo{day.photoCount !== 1 ? 's' : ''}
                        </div>
                        
                        {#if day.photoClusters.length > 0}
                          <div class="day-clusters">
                            {#each day.photoClusters as cluster}
                              <div class="cluster-tag">
                                {cluster.interestPointName || 'Unknown location'}
                              </div>
                            {/each}
                          </div>
                        {/if}
                      {:else}
                        <div class="day-empty">No photos</div>
                      {/if}
                    </div>
                  </button>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .timeline-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .timeline-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .timeline-stats {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .empty-state {
    padding: 2rem;
    border: 1px solid rgb(var(--color-surface-300));
    border-radius: 0.5rem;
  }
  
  .itineraries {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .itinerary-card {
    border: 1px solid rgb(var(--color-surface-300));
    border-radius: 0.5rem;
    overflow: hidden;
  }
  
  .itinerary-header {
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background-color 0.2s ease;
  }
  
  .itinerary-header:hover {
    background-color: rgb(var(--color-surface-100));
  }
  
  .itinerary-info {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;
  }
  
  .itinerary-color {
    width: 1rem;
    height: 4rem;
    border-radius: 0.25rem;
    flex-shrink: 0;
  }
  
  .itinerary-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .itinerary-dates {
    font-size: 0.875rem;
    color: rgb(var(--color-surface-600));
  }
  
  .itinerary-summary {
    font-size: 0.75rem;
    color: rgb(var(--color-surface-500));
  }
  
  .expand-icon {
    transition: transform 0.2s ease;
  }
  
  .expand-icon.expanded {
    transform: rotate(180deg);
  }
  
  .itinerary-timeline {
    position: relative;
    padding: 0 1rem 1rem;
  }
  
  .timeline-line {
    position: absolute;
    left: 2rem;
    top: 0;
    bottom: 1rem;
    width: 2px;
    border-left: 2px solid rgb(var(--color-surface-300));
  }
  
  .days-grid {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-left: 3rem;
  }
  
  .day-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 1px solid rgb(var(--color-surface-200));
    border-radius: 0.375rem;
    background: white;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
  }
  
  .day-card:hover:not(:disabled) {
    border-color: rgb(var(--color-primary-300));
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .day-card.has-photos {
    border-color: rgb(var(--color-primary-200));
    background-color: rgb(var(--color-primary-50));
  }
  
  .day-card:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .day-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 3rem;
  }
  
  .day-number {
    font-size: 1.5rem;
    font-weight: bold;
    line-height: 1;
  }
  
  .day-month {
    font-size: 0.75rem;
    text-transform: uppercase;
    color: rgb(var(--color-surface-500));
  }
  
  .day-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .day-title {
    font-weight: 500;
  }
  
  .day-photos {
    font-size: 0.875rem;
    color: rgb(var(--color-primary-600));
    font-weight: 500;
  }
  
  .day-empty {
    font-size: 0.875rem;
    color: rgb(var(--color-surface-400));
    font-style: italic;
  }
  
  .day-clusters {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.25rem;
  }
  
  .cluster-tag {
    background-color: rgb(var(--color-surface-100));
    color: rgb(var(--color-surface-700));
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
  }
</style>

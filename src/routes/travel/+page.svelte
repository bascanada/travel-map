<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Redirect to home page
    goto('/');
  });
</script>

<div class="redirecting">
  <p>Redirecting to travel list...</p>
</div>

<style>
  .redirecting {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    font-size: 1.2rem;
    color: #666;
  }
</style>

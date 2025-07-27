<script lang="ts">
  import { page } from '$app/stores';
  
  $: isHomePage = $page.url.pathname === '/';
</script>

<header class="site-header">
  <div class="header-content">
    <a href="/" class="logo">
      <span class="material-icons">explore</span>
      Travel Explorer
    </a>
    
    <nav>
      <ul>
        <li class:active={isHomePage}>
          <a href="/">Home</a>
        </li>
      </ul>
    </nav>
  </div>
</header>

<style>
  .site-header {
    background-color: #ffffff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem 2rem;
  }
  
  .logo {
    display: flex;
    align-items: center;
    font-size: 1.5rem;
    font-weight: 700;
    color: #1976d2;
    text-decoration: none;
    transition: color 0.2s ease;
  }
  
  .logo:hover {
    color: #0d47a1;
  }
  
  .logo .material-icons {
    margin-right: 0.5rem;
  }
  
  nav ul {
    display: flex;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  
  nav li {
    margin-left: 1.5rem;
    position: relative;
  }
  
  nav a {
    color: #444;
    text-decoration: none;
    font-weight: 500;
    transition: color 0.2s ease;
    padding: 0.5rem 0;
    display: block;
  }
  
  nav a:hover {
    color: #1976d2;
  }
  
  .active a {
    color: #1976d2;
  }
  
  .active::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 0;
    width: 100%;
    height: 3px;
    background-color: #1976d2;
    border-radius: 2px;
  }
</style>

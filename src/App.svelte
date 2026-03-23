<script lang="ts">
  import GlobeViewer from './lib/GlobeViewer.svelte';
  import { globeStore } from './stores/globeStore';
  
  // Convert radians to degrees for display
  function toDegrees(radians: number): string {
    return (radians * 180 / Math.PI).toFixed(4);
  }
  
  function toMeters(height: number): string {
    return Math.round(height).toLocaleString();
  }
</script>

<main>
  <header class="app-header">
    <h1>🌍 Interactive Earth Globe</h1>
    <p>Zoom and rotate to explore the world</p>
  </header>
  
  <div class="globe-wrapper">
    <GlobeViewer />
    
    <!-- Camera position display -->
    {#if $globeStore.viewer && !$globeStore.isLoading}
      <div class="info-panel">
        <h3>Camera Position</h3>
        <div class="position-info">
          <div>
            <strong>Longitude:</strong> 
            {toDegrees($globeStore.cameraPosition.longitude)}°
          </div>
          <div>
            <strong>Latitude:</strong> 
            {toDegrees($globeStore.cameraPosition.latitude)}°
          </div>
          <div>
            <strong>Height:</strong> 
            {toMeters($globeStore.cameraPosition.height)} m
          </div>
        </div>
      </div>
    {/if}
  </div>
</main>

<style>
  .app-header {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 100;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }
  
  .app-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
  }
  
  .app-header p {
    margin: 0;
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .globe-wrapper {
    position: relative;
    width: 100%;
    height: 100vh;
  }
  
  .info-panel {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 1rem;
    border-radius: 8px;
    backdrop-filter: blur(10px);
    font-family: 'Courier New', monospace;
    min-width: 200px;
  }
  
  .info-panel h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1rem;
    color: #3498db;
  }
  
  .position-info div {
    margin: 0.25rem 0;
    font-size: 0.8rem;
  }
  
  .position-info strong {
    color: #ecf0f1;
  }
</style>
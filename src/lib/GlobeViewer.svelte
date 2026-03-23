<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'cesium/Build/Cesium/Widgets/widgets.css';
  import { globeStore, setViewer, setLoading, setError, updateCameraPosition } from '$stores/globeStore';
  
  // Dynamic import of Cesium to avoid build issues
  let containerElement: HTMLDivElement;
  let viewer: any = null;
  let Cesium: any;
  
  onMount(async () => {
    try {
      setLoading(true);
      
      // Dynamically import Cesium
      Cesium = await import('cesium');
      
      // Set Cesium Ion access token
      Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0ZTI5YzBkNi05YjQzLTRhMWMtOWFjNC03ZDM2MjNhOWY5NzciLCJpZCI6NDA3OTk0LCJpYXQiOjE3NzQyODcyNTF9.VMU2uar6IJu-bZeXgVVbnJtdiF44coUjS4s0YMDXRsc';
      
      // Create the Cesium viewer
      viewer = new Cesium.Viewer(containerElement, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        shouldAnimate: true,
        homeButton: true,
        sceneModePicker: true,
        baseLayerPicker: true,
        navigationHelpButton: true,
        animation: false,
        timeline: false,
        fullscreenButton: true,
        vrButton: false,
      });
      
      // Enable lighting based on sun/moon positions
      viewer.scene.globe.enableLighting = true;
      
      // Set the initial camera position to show Earth from space
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883, 1000000),
      });
      
      // Listen for camera movement
      viewer.camera.changed.addEventListener(() => {
        if (viewer) {
          const position = viewer.camera.positionCartographic;
          updateCameraPosition(
            position.longitude,
            position.latitude,
            position.height
          );
        }
      });
      
      // Update the store with the viewer instance
      setViewer(viewer);
      
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to initialize globe viewer: ${errorMessage}`);
    }
  });
  
  onDestroy(() => {
    if (viewer && !viewer.isDestroyed()) {
      viewer.destroy();
    }
    setViewer(null);
  });
</script>

<div 
  bind:this={containerElement} 
  class="globe-container"
  aria-label="Interactive 3D Earth Globe"
>
  {#if $globeStore.isLoading}
    <div class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading globe...</p>
    </div>
  {/if}
  
  {#if $globeStore.error}
    <div class="error-overlay">
      <p class="error-message">{$globeStore.error}</p>
      <p class="error-hint">Please check your Cesium Ion access token.</p>
    </div>
  {/if}
</div>

<style>
  .globe-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
  
  .loading-overlay,
  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    z-index: 1000;
  }
  
  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error-message {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    color: #ff6b6b;
  }
  
  .error-hint {
    font-size: 0.9rem;
    color: #ccc;
  }
</style>
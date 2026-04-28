<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'cesium/Build/Cesium/Widgets/widgets.css';
  import { globeStore, setViewer, setLoading, setError, updateCameraPosition } from '$stores/globeStore';
  
  // Dynamic import of Cesium to avoid build issues
  let containerElement: HTMLDivElement;
  let viewer: any = null;
  let Cesium: any;
  let isDraggingShip = false;
  let dragEntity: any = null;
  
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
      
      // Create ship icon as SVG data URL (40x40 pixels)
      const shipIconSvg = `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="shipGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4a90e2;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2c5aa0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <!-- Ship hull -->
        <path d="M6 28 Q6 32 10 32 L30 32 Q34 32 34 28 L32 24 L8 24 Z" fill="url(#shipGradient)" stroke="#1a365d" stroke-width="1"/>
        <!-- Ship deck -->
        <rect x="8" y="16" width="24" height="8" fill="#e2e8f0" stroke="#94a3b8" stroke-width="0.6"/>
        <!-- Main mast -->
        <rect x="19" y="6" width="2" height="18" fill="#8b4513"/>
        <!-- Front mast -->
        <rect x="13" y="8" width="1.6" height="12" fill="#8b4513"/>
        <!-- Rear mast -->
        <rect x="25.4" y="10" width="1.6" height="10" fill="#8b4513"/>
        <!-- Main sail -->
        <path d="M14 6 Q20 4 20 8 L20 14 Q14 16 14 12 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.6"/>
        <!-- Front sail -->
        <path d="M8 8 Q13 7 13 10 L13 14 Q8 15 8 12 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.6"/>
        <!-- Rear sail -->
        <path d="M27 10 Q32 9 32 12 L32 16 Q27 17 27 14 Z" fill="#f8fafc" stroke="#e2e8f0" stroke-width="0.6"/>
        <!-- Flag -->
        <path d="M21 6 L28 7 L28 10 L21 9 Z" fill="#ef4444"/>
      </svg>`;
      
      const shipIconDataUrl = `data:image/svg+xml;base64,${btoa(shipIconSvg)}`;
      
      // Add ship icon at origin point (0°, 0°)
      const shipEntity = viewer.entities.add({
        id: 'ship-at-origin',
        name: 'Ship at Origin',
        position: Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883, 0), // Longitude: 0°, Latitude: 0°, Height: 0m
        billboard: {
          image: shipIconDataUrl,
          width: 40,
          height: 40,
          pixelOffset: new Cesium.Cartesian2(0, -20), // Offset to center the icon
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          scaleByDistance: new Cesium.NearFarScalar(1.0e3, 1.0, 1.0e7, 0.3), // Scale with distance
          disableDepthTestDistance: Number.POSITIVE_INFINITY // Always visible
        },
        label: {
          text: 'Draggable Ship',
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -50),
          show: false // Initially hidden, will show on select
        }
      });

      // Mouse event handlers for ship dragging
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      
      // Left mouse button down
      handler.setInputAction((event: any) => {
        const pickedObject = viewer.scene.pick(event.position);
        
        if (Cesium.defined(pickedObject) && 
            pickedObject.id && 
            pickedObject.id.id === 'ship-at-origin') {
          // Clicked on ship - start dragging
          isDraggingShip = true;
          dragEntity = pickedObject.id;
          viewer.scene.screenSpaceCameraController.enableRotate = false;
          viewer.scene.screenSpaceCameraController.enableTranslate = false;
          viewer.scene.screenSpaceCameraController.enableZoom = false;
          viewer.scene.screenSpaceCameraController.enableTilt = false;
          viewer.scene.screenSpaceCameraController.enableLook = false;
          
          // Show label while dragging
          dragEntity.label.show = true;
          
          // Change cursor to indicate dragging
          viewer.canvas.style.cursor = 'move';
        } else {
          // Clicked elsewhere - hide ship label if it's showing
          const shipEntity = viewer.entities.getById('ship-at-origin');
          if (shipEntity && shipEntity.label) {
            shipEntity.label.show = false;
          }
        }
        // If not clicked on ship, preserve default behavior (camera controls remain enabled)
      }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
      
      // Right mouse button down - hide label when clicked elsewhere
      handler.setInputAction((event: any) => {
        const pickedObject = viewer.scene.pick(event.position);
        
        if (!Cesium.defined(pickedObject) || 
            !pickedObject.id || 
            pickedObject.id.id !== 'ship-at-origin') {
          // Clicked elsewhere - hide ship label if it's showing
          const shipEntity = viewer.entities.getById('ship-at-origin');
          if (shipEntity && shipEntity.label) {
            shipEntity.label.show = false;
          }
        }
      }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);
      
      // Middle mouse button down - hide label when clicked elsewhere
      handler.setInputAction((event: any) => {
        const pickedObject = viewer.scene.pick(event.position);
        
        if (!Cesium.defined(pickedObject) || 
            !pickedObject.id || 
            pickedObject.id.id !== 'ship-at-origin') {
          // Clicked elsewhere - hide ship label if it's showing
          const shipEntity = viewer.entities.getById('ship-at-origin');
          if (shipEntity && shipEntity.label) {
            shipEntity.label.show = false;
          }
        }
      }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
      
      // Mouse move - handle dragging
      handler.setInputAction((event: any) => {
        if (isDraggingShip && dragEntity) {
          const ray = viewer.camera.getPickRay(event.endPosition);
          const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
          
          if (cartesian) {
            // Convert to cartographic coordinates
            const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            
            // Update ship position
            dragEntity.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
            
            // Update label text with coordinates
            dragEntity.label.text = `Ship (${longitude.toFixed(2)}°, ${latitude.toFixed(2)}°)`;
          }
        }
      }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
      
      // Left mouse button up - stop dragging
      handler.setInputAction((event: any) => {
        if (isDraggingShip) {
          isDraggingShip = false;
          dragEntity = null;
          
          // Re-enable camera controls
          viewer.scene.screenSpaceCameraController.enableRotate = true;
          viewer.scene.screenSpaceCameraController.enableTranslate = true;
          viewer.scene.screenSpaceCameraController.enableZoom = true;
          viewer.scene.screenSpaceCameraController.enableTilt = true;
          viewer.scene.screenSpaceCameraController.enableLook = true;
          
          // Reset cursor
          viewer.canvas.style.cursor = 'default';
          
          // Get final position and update label
          const shipEntity = viewer.entities.getById('ship-at-origin');
          if (shipEntity && shipEntity.position) {
            const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
              shipEntity.position.getValue(viewer.clock.currentTime)
            );
            const longitude = Cesium.Math.toDegrees(cartographic.longitude);
            const latitude = Cesium.Math.toDegrees(cartographic.latitude);
            shipEntity.label.text = `Ship (${longitude.toFixed(2)}°, ${latitude.toFixed(2)}°)`;
          }
        }
      }, Cesium.ScreenSpaceEventType.LEFT_UP);

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
      
      // Add click handler to show/hide ship label (when not dragging)
      viewer.selectedEntityChanged.addEventListener((selectedEntity: any) => {
        if (!isDraggingShip) {
          if (selectedEntity && selectedEntity.id === 'ship-at-origin') {
            selectedEntity.label.show = true;
          } else {
            // Hide label when something else is selected or nothing is selected
            const shipEntity = viewer.entities.getById('ship-at-origin');
            if (shipEntity && shipEntity.label) {
              shipEntity.label.show = false;
            }
          }
        }
      });
      
      // Update the store with the viewer instance
      setViewer(viewer);
      setLoading(false);
      
    } catch (error) {
      console.error('Error initializing Cesium viewer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to initialize globe viewer: ${errorMessage}`);
    }
  });
  
  onDestroy(() => {
    if (viewer && !viewer.isDestroyed()) {
      // Clean up event handlers
      const canvas = viewer.scene.canvas;
      if (canvas) {
        canvas.style.cursor = 'default';
      }
      
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
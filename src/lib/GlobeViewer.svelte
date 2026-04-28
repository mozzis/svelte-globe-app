<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import 'cesium/Build/Cesium/Widgets/widgets.css';
  import { globeStore, setViewer, setLoading, setError, updateCameraPosition } from '$stores/globeStore';
  
  // Dynamic import of Cesium to avoid build issues
  let containerElement: HTMLDivElement | undefined;
  let viewer: any = null;
  let Cesium: any;
  let isDraggingShip = false;
  let dragEntity: any = null;
  
  // Configuration for initial ship position
  let initialShipPosition = {
    longitude: -75.59777,
    latitude: 40.03883,
    height: 0
  };

  // Function to save ship position to params.json
  const saveShipPosition = async (longitude: number, latitude: number, height: number) => {
    try {
      const updatedConfig = {
        initialShipPosition: {
          longitude,
          latitude,
          height
        }
      };
      
      // Save to localStorage as primary storage
      localStorage.setItem('shipPosition', JSON.stringify(updatedConfig.initialShipPosition));
      
      // Also update our runtime configuration
      initialShipPosition = updatedConfig.initialShipPosition;
      
      console.log('Ship position saved to localStorage:', { longitude, latitude, height });
      
      // Note: Writing to static files from browser is not possible in standard web environment
      // This would require a backend API endpoint to actually update params.json
      
    } catch (error) {
      console.error('Error saving ship position:', error);
    }
  };
  
  onMount(async () => {
    try {
      setLoading(true);
      
      // Load configuration from params.json and localStorage
      try {
        const configResponse = await fetch('/params.json');
        if (configResponse.ok) {
          const config = await configResponse.json();
          if (config.initialShipPosition) {
            initialShipPosition = config.initialShipPosition;
          }
        }
        
        // Check localStorage for saved ship position (takes precedence)
        const savedPosition = localStorage.getItem('shipPosition');
        if (savedPosition) {
          try {
            const parsedPosition = JSON.parse(savedPosition);
            initialShipPosition = parsedPosition;
            console.log('Loaded ship position from localStorage:', parsedPosition);
          } catch (parseError) {
            console.warn('Invalid saved position in localStorage, using config file defaults');
          }
        }
      } catch (configError) {
        console.warn('Could not load params.json, using default ship position:', configError);
      }
      
      // Ensure container element is available
      if (!containerElement) {
        setError('Failed to initialize: Container element not available');
        return;
      }
      
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
      
      // Set the initial camera position to show the ship location
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(
          initialShipPosition.longitude, 
          initialShipPosition.latitude, 
          1000000
        ),
      });
      
      // Create ship icon as SVG data URL (80x80 pixels) - Arleigh Burke-class destroyer style
      const shipIconSvg = `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hullGradient" x1="0%" y1="0%" x2="100" y2="100%">
            <stop offset="0%" style="stop-color:#8E9AAF;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#6C7B95;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="superstructureGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#A8B2C8;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#8E9AAF;stop-opacity:1" />
          </linearGradient>
        </defs>
        <!-- Main hull -->
        <path d="M8 55 L15 50 L65 50 L72 55 L70 65 L68 68 L12 68 L10 65 Z" fill="url(#hullGradient)" stroke="#5A6B7D" stroke-width="1"/>
        <!-- Bow section -->
        <path d="M65 50 L75 52 L72 55 L65 50" fill="#6C7B95" stroke="#5A6B7D" stroke-width="0.8"/>
        <!-- Stern section -->
        <path d="M15 50 L5 52 L8 55 L15 50" fill="#6C7B95" stroke="#5A6B7D" stroke-width="0.8"/>
        <!-- Main superstructure -->
        <rect x="20" y="30" width="40" height="20" fill="url(#superstructureGradient)" stroke="#7A8BA0" stroke-width="1"/>
        <!-- Forward superstructure -->
        <rect x="45" y="25" width="20" height="25" fill="url(#superstructureGradient)" stroke="#7A8BA0" stroke-width="1"/>
        <!-- Bridge structure -->
        <rect x="50" y="18" width="12" height="12" fill="url(#superstructureGradient)" stroke="#7A8BA0" stroke-width="0.8"/>
        <!-- Radar arrays (phased array panels) -->
        <rect x="25" y="32" width="8" height="6" fill="#4A5D73" stroke="#3E4F61" stroke-width="0.5"/>
        <rect x="47" y="32" width="8" height="6" fill="#4A5D73" stroke="#3E4F61" stroke-width="0.5"/>
        <rect x="52" y="20" width="6" height="6" fill="#4A5D73" stroke="#3E4F61" stroke-width="0.5"/>
        <!-- Main gun turret -->
        <circle cx="58" cy="45" r="4" fill="#5A6B7D" stroke="#4A5D73" stroke-width="0.8"/>
        <rect x="54" y="43" width="8" height="3" fill="#4A5D73" stroke="#3E4F61" stroke-width="0.5"/>
        <!-- VLS (Vertical Launch System) cells -->
        <rect x="22" y="45" width="12" height="4" fill="#3E4F61" stroke="#2C3A47" stroke-width="0.5"/>
        <rect x="36" y="45" width="8" height="4" fill="#3E4F61" stroke="#2C3A47" stroke-width="0.5"/>
        <!-- Main mast -->
        <rect x="39" y="8" width="2" height="22" fill="#7A8BA0"/>
        <!-- Sensors and equipment on mast -->
        <rect x="37" y="10" width="6" height="2" fill="#4A5D73"/>
        <rect x="38" y="14" width="4" height="2" fill="#4A5D73"/>
        <circle cx="40" cy="18" r="1.5" fill="#4A5D73"/>
        <!-- Navigation lights -->
        <circle cx="72" cy="53" r="1" fill="#00FF00"/>
        <circle cx="8" cy="53" r="1" fill="#FF0000"/>
        <!-- Wake/water -->
        <path d="M5 52 Q10 54 15 52 Q20 50 25 52" stroke="#4A87C7" stroke-width="1" fill="none" opacity="0.6"/>
        <!-- Flag -->
        <rect x="41" y="8" width="6" height="4" fill="#FF0000"/>
        <rect x="41" y="10" width="6" height="1" fill="#FFFFFF"/>
      </svg>`;
      
      const shipIconDataUrl = `data:image/svg+xml;base64,${btoa(shipIconSvg)}`;
      
      // Add ship icon at initial camera location for visibility
      const shipEntity = viewer.entities.add({
        id: 'ship-at-origin',
        name: 'Draggable Ship',
        position: Cesium.Cartesian3.fromDegrees(
          initialShipPosition.longitude, 
          initialShipPosition.latitude, 
          initialShipPosition.height
        ),
        billboard: {
          image: shipIconDataUrl,
          width: 80,
          height: 80,
          verticalOrigin: Cesium.VerticalOrigin.CENTER,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
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
            const height = 0; // Keep height at 0 for surface positioning
            
            shipEntity.label.text = `Ship (${longitude.toFixed(2)}°, ${latitude.toFixed(2)}°)`;
            
            // Save the updated position to storage
            saveShipPosition(longitude, latitude, height);
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
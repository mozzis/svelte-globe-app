# Svelte Globe App 🌍

An interactive 3D Earth globe application built with Svelte, TypeScript, Vite, and Cesium.

## Features

- 🌎 Interactive 3D Earth globe with zoom and rotation
- 🔄 Real-time camera position tracking
- 🌅 Dynamic lighting based on sun/moon positions
- 🎨 Responsive design with information panels
- 🔧 Built with TypeScript for type safety
- 💾 Svelte stores for state management

## Prerequisites

Before running this application, you'll need:

1. **Node.js** (version 18 or higher)
2. **A Cesium Ion Access Token**:
   - Sign up at [Cesium Ion](https://ion.cesium.com/)
   - Create a new access token
   - Replace `'your-cesium-ion-access-token-here'` in `src/lib/GlobeViewer.svelte` with your actual token

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure Cesium Ion Token:**
   - Open `src/lib/GlobeViewer.svelte`
   - Replace the placeholder token with your actual Cesium Ion access token:
     ```typescript
     Ion.defaultAccessToken = 'your-actual-token-here';
     ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   - Navigate to `http://localhost:5173`
   - You should see the interactive 3D globe!

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run check` - Run Svelte type checking

## Project Structure

```
src/
├── lib/
│   └── GlobeViewer.svelte      # Main Cesium globe component
├── stores/
│   └── globeStore.ts           # Svelte store for globe state
├── App.svelte                  # Main application component
├── main.ts                     # Application entry point
└── app.css                     # Global styles
```

## Technologies Used

- **[Svelte](https://svelte.dev/)** - Reactive UI framework
- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Cesium](https://cesium.com/)** - 3D globe and maps engine
- **[Svelte Stores](https://svelte.dev/docs/svelte-store)** - State management

## Usage

### Interacting with the Globe

- **Rotate:** Click and drag to rotate the globe
- **Zoom:** Use mouse wheel or pinch gestures to zoom in/out
- **Pan:** Hold Shift + click and drag to pan
- **Tilt:** Hold Ctrl + click and drag to tilt the camera

### Monitoring Camera Position

The application displays real-time camera position information including:
- Longitude and latitude coordinates
- Camera height above sea level

### State Management

The app uses Svelte stores to manage:
- Globe viewer instance
- Loading states
- Error handling
- Camera position tracking

## Customization

You can extend the application by:

1. **Adding data layers** - Import GeoJSON, KML, or other data formats
2. **Custom styling** - Modify terrain, imagery, or lighting
3. **Interactive features** - Add markers, popups, or drawing tools
4. **Additional stores** - Create new stores for specific features

## Troubleshooting

### Globe not loading
- Ensure your Cesium Ion access token is valid and properly configured
- Check browser console for error messages
- Verify internet connection for loading Cesium assets

### Performance issues
- Reduce terrain detail level in viewer options
- Disable lighting for better performance on older devices
- Consider using imagery with lower resolution

## License

This project is open source and available under the [MIT License](LICENSE).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
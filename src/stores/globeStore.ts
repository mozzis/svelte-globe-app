import { writable } from 'svelte/store';

export interface GlobeState {
  viewer: any | null;
  isLoading: boolean;
  error: string | null;
  cameraPosition: {
    longitude: number;
    latitude: number;
    height: number;
  };
}

const initialState: GlobeState = {
  viewer: null,
  isLoading: true,
  error: null,
  cameraPosition: {
    longitude: -75.59777,
    latitude: 40.03883,
    height: 1000000
  }
};

export const globeStore = writable<GlobeState>(initialState);

// Helper functions to update specific parts of the state
export const setViewer = (viewer: any) => {
  globeStore.update(state => ({ ...state, viewer, isLoading: false }));
};

export const setLoading = (isLoading: boolean) => {
  globeStore.update(state => ({ ...state, isLoading }));
};

export const setError = (error: string | null) => {
  globeStore.update(state => ({ ...state, error, isLoading: false }));
};

export const updateCameraPosition = (longitude: number, latitude: number, height: number) => {
  globeStore.update(state => ({
    ...state,
    cameraPosition: { longitude, latitude, height }
  }));
};
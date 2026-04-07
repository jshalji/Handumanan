'use client';

import { calculateDistance } from './location-utils';

/**
 * Service to interact with OpenRouteService API for generating driving routes.
 * Note: Users should replace the placeholder API key with a free one from https://openrouteservice.org/
 */

const ORS_API_KEY = '5b3ce3597851110001cf6248383c2738a956426786851610443e06a3'; // Placeholder for user to replace

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
  steps: RouteStep[];
}

/**
 * Fetches a driving car route between two points using OpenRouteService.
 * Returns detailed step-by-step instructions and geometry.
 * Includes a robust fallback to straight-line navigation if the API call fails.
 */
export async function getRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }): Promise<RouteData | null> {
  // Validate coordinates
  if (!start || !end || isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
    console.error('Invalid coordinates provided to getRoute');
    return null;
  }

  // Pre-calculate fallback data in case of failure
  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * 10, // Heuristic: ~6 mins per km in city traffic
    steps: [{ 
      instruction: `Head towards destination (${directDistance.toFixed(2)} km)`, 
      distance: directDistance * 1000, 
      duration: directDistance * 10 
    }]
  };

  // Check if API key is provided and not the default placeholder
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_FREE_ORS_API_KEY_HERE') {
    return fallbackData;
  }

  try {
    const query = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    // Set a timeout for the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(query, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Routing API returned ${response.status}: ${response.statusText}. Using fallback.`);
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      const segment = feature.properties.segments[0];
      
      const steps: RouteStep[] = segment.steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration
      }));

      return {
        coordinates: coords,
        distance: segment.distance / 1000, // convert to km
        duration: segment.duration / 60, // convert to mins
        steps: steps
      };
    }
    
    return fallbackData;
  } catch (error) {
    // Gracefully handle any network errors or timeouts by returning the fallback
    console.warn('Routing service failed to fetch, falling back to straight line:', error);
    return fallbackData;
  }
}

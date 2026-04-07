'use client';

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
 */
export async function getRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }): Promise<RouteData | null> {
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_FREE_ORS_API_KEY_HERE') {
    console.warn('OpenRouteService API key missing. Using straight line fallback.');
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: 0,
      duration: 0,
      steps: [{ instruction: 'Direct path to destination', distance: 0, duration: 0 }]
    };
  }

  try {
    const query = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    const response = await fetch(query);
    
    if (!response.ok) {
      throw new Error(`Routing API error: ${response.statusText}`);
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
    return null;
  } catch (error) {
    console.error('Routing service failed:', error);
    return null;
  }
}

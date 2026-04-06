'use client';

/**
 * Service to interact with OpenRouteService API for generating driving routes.
 * Note: Users should replace the placeholder API key with a free one from https://openrouteservice.org/
 */

const ORS_API_KEY = 'YOUR_FREE_ORS_API_KEY_HERE'; // Replace with your key

export interface RouteData {
  coordinates: [number, number][];
  distance: number;
  duration: number;
}

/**
 * Fetches a driving car route between two points using OpenRouteService.
 * If no API key is present, it returns a straight line fallback for visualization.
 */
export async function getRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }): Promise<RouteData | null> {
  // If no API key is provided, we fall back to a simple direct line (straight polyline)
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_FREE_ORS_API_KEY_HERE') {
    console.warn('OpenRouteService API key missing. Using straight line fallback.');
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: 0,
      duration: 0
    };
  }

  try {
    // OpenRouteService expects coordinates as [longitude, latitude]
    const query = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    const response = await fetch(query);
    
    if (!response.ok) {
      throw new Error(`Routing API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // ORS returns [lng, lat], Leaflet needs [lat, lng]
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      return {
        coordinates: coords,
        distance: feature.properties.segments[0].distance / 1000, // convert to km
        duration: feature.properties.segments[0].duration / 60, // convert to mins
      };
    }
    return null;
  } catch (error) {
    console.error('Routing service failed:', error);
    // Return null to trigger UI-side fallback (straight line)
    return null;
  }
}

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

export async function getRoute(start: { lat: number; lng: number }, end: { lat: number; lng: number }): Promise<RouteData | null> {
  // If no API key is provided, we fall back to a simple direct line (straight polyline) for demonstration
  if (!ORS_API_KEY || ORS_API_KEY === 'YOUR_FREE_ORS_API_KEY_HERE') {
    console.warn('OpenRouteService API key missing. Using straight line fallback.');
    return {
      coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
      distance: 0,
      duration: 0
    };
  }

  try {
    const query = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    const response = await fetch(query);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // ORS returns [lng, lat], Leaflet needs [lat, lng]
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      return {
        coordinates: coords,
        distance: feature.properties.segments[0].distance / 1000, // km
        duration: feature.properties.segments[0].duration / 60, // mins
      };
    }
    return null;
  } catch (error) {
    console.error('Routing error:', error);
    return null;
  }
}

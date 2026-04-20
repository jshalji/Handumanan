
'use client';

import { calculateDistance } from './location-utils';

/**
 * Service to interact with OpenRouteService API for generating routing data.
 */

const ORS_API_KEY = '5b3ce3597851110001cf6248383c2738a956426786851610443e06a3'; 

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
 * Fetches a route between two points using OpenRouteService.
 * Supports multiple profiles like driving and walking.
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  // Validate coordinates
  if (!start || !end || isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
    return null;
  }

  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  
  // Standard fallback data to return on failure (Straight Line)
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * (profile === 'driving-car' ? 8 : 15), 
    steps: [{ 
      instruction: `Head straight to destination`, 
      distance: directDistance * 1000, 
      duration: directDistance * 10 
    }]
  };

  try {
    // OpenRouteService expects coordinates in [longitude, latitude] for the query string
    const query = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout for better UX

    const response = await fetch(query, { 
      signal: controller.signal,
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    }).catch(() => null);
    
    clearTimeout(timeoutId);
    
    if (!response || !response.ok) {
      console.warn("Routing API failed, using straight-line fallback.");
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // ORS returns [longitude, latitude]. Leaflet expects [latitude, longitude].
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      const segment = feature.properties.segments[0];
      
      const steps: RouteStep[] = segment.steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration
      }));

      return {
        coordinates: coords,
        distance: segment.distance / 1000, // meters to km
        duration: segment.duration / 60, // seconds to mins
        steps: steps
      };
    }
    
    return fallbackData;
  } catch (error) {
    console.error("Routing error:", error);
    return fallbackData;
  }
}

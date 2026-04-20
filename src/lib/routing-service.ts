'use client';

import { calculateDistance } from './location-utils';

/**
 * Service to interact with OpenRouteService API for generating routing data.
 * Optimized for road-accurate navigation in Metro Cebu.
 */

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
 * Fetches an accurate road-based route using OpenRouteService.
 * Returns GeoJSON coordinates for street-level precision.
 * @param start - Starting {lat, lng}
 * @param end - Destination {lat, lng}
 * @param apiKey - OpenRouteService API Key
 * @param profile - 'driving-car' or 'foot-walking'
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  apiKey: string,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end || !apiKey) return null;

  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  
  // Fallback data: Straight line (used if API fails or key is invalid)
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * (profile === 'driving-car' ? 2.5 : 12),
    steps: [{ 
      instruction: `Follow the main road towards the heritage site (Network Fallback)`, 
      distance: directDistance, 
      duration: directDistance * 10 
    }]
  };

  try {
    // OpenRouteService V2 Directions API (GET)
    // Format: lng,lat
    const url = `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/geo+json'
      }
    });

    if (!response.ok) {
      console.warn(`OpenRouteService returned ${response.status}. Ensure your API key is valid.`);
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // ORS returns [lng, lat], Leaflet needs [lat, lng]
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      const properties = feature.properties;
      const segment = properties.segments[0];
      
      const steps: RouteStep[] = segment.steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance / 1000, // meters to km
        duration: step.duration / 60 // seconds to minutes
      }));

      return {
        coordinates: coords,
        distance: segment.distance / 1000,
        duration: segment.duration / 60,
        steps: steps
      };
    }
    
    return fallbackData;
  } catch (error) {
    console.error("Critical routing fetch error:", error);
    return fallbackData;
  }
}


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
 * Fetches an accurate road-based route using GET request for maximum CORS stability.
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end) return null;

  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  
  // Straight-line fallback for cases where routing fails or limit is reached
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * (profile === 'driving-car' ? 2 : 12),
    steps: [{ 
      instruction: `Head towards your destination`, 
      distance: directDistance, 
      duration: directDistance * 10 
    }]
  };

  try {
    // Using GET with geojson format for road accuracy and simpler preflight checks
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson?api_key=${ORS_API_KEY}&start=${start.lng},${start.lat}&end=${end.lng},${end.lat}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, application/geo+json'
      }
    });

    if (!response.ok) {
      console.warn(`Routing API error (${response.status}). Using fallback.`);
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // ORS returns [lng, lat] - we flip to [lat, lng] for Leaflet map polylines
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      const properties = feature.properties;
      const segment = properties.segments[0];
      
      const steps: RouteStep[] = segment.steps.map((step: any) => ({
        instruction: step.instruction,
        distance: step.distance,
        duration: step.duration
      }));

      return {
        coordinates: coords,
        distance: segment.distance, 
        duration: segment.duration / 60, // seconds to minutes
        steps: steps
      };
    }
    
    return fallbackData;
  } catch (error) {
    console.error("Routing error:", error);
    return fallbackData;
  }
}

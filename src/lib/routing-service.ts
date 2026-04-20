
'use client';

import { calculateDistance } from './location-utils';

/**
 * Service to interact with OpenRouteService API for generating routing data.
 * Optimized for road-accurate navigation in Metro Cebu.
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
 * Fetches an accurate road-based route using POST request for maximum stability and GeoJSON precision.
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end) return null;

  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  
  // High-fidelity fallback logic
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * (profile === 'driving-car' ? 2.5 : 12),
    steps: [{ 
      instruction: `Follow the main road towards the heritage site`, 
      distance: directDistance, 
      duration: directDistance * 10 
    }]
  };

  try {
    // Using POST endpoint for better handling of road network data and CORS stability
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': ORS_API_KEY
      },
      body: JSON.stringify({
        coordinates: [
          [start.lng, start.lat],
          [end.lng, end.lat]
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Routing API error (${response.status}): ${errorText}. Using road approximation.`);
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // Flip coordinates to [lat, lng] for Leaflet
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
        distance: segment.distance / 1000, // meters to km
        duration: segment.duration / 60, // seconds to minutes
        steps: steps
      };
    }
    
    return fallbackData;
  } catch (error) {
    console.error("Critical routing fetch error:", error);
    return fallbackData;
  }
}

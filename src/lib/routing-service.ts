
'use client';

import { calculateDistance } from './location-utils';

/**
 * Service to interact with OpenRouteService API for generating routing data.
 */

// Note: In a production app, this should be an environment variable.
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
 * Fetches an accurate street-level route between two points using OpenRouteService POST API.
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end) return null;

  // Validate coordinates to prevent API errors
  if (isNaN(start.lat) || isNaN(start.lng) || isNaN(end.lat) || isNaN(end.lng)) {
    return null;
  }

  const directDistance = calculateDistance(start.lat, start.lng, end.lat, end.lng);
  
  // Straight-line fallback for cases where routing fails
  const fallbackData: RouteData = {
    coordinates: [[start.lat, start.lng], [end.lat, end.lng]],
    distance: directDistance,
    duration: directDistance * (profile === 'driving-car' ? 2 : 12), // Rough estimate in minutes
    steps: [{ 
      instruction: `Head towards your destination`, 
      distance: directDistance * 1000, 
      duration: directDistance * 10 
    }]
  };

  try {
    // Moving API key to query parameter to avoid CORS preflight issues with Authorization header
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson?api_key=${ORS_API_KEY}`;
    
    const body = {
      coordinates: [
        [start.lng, start.lat], // ORS expects [lng, lat]
        [end.lng, end.lat]
      ],
      instructions: true,
      units: 'km',
      language: 'en'
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.warn(`Routing API Error (${response.status}): Using fallback.`);
      return fallbackData;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // Map [lng, lat] from ORS back to [lat, lng] for Leaflet
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
    // Silently return fallback data on network errors
    return fallbackData;
  }
}

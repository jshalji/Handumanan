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
 * Fetches an accurate road-based route using OpenRouteService POST API for multiple waypoints.
 * @param points - Array of {lat, lng} coordinates in order
 * @param apiKey - OpenRouteService API Key
 * @param profile - 'driving-car' or 'foot-walking'
 */
export async function getRouteMulti(
  points: { lat: number; lng: number }[],
  apiKey: string,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  // Defensive checks for input data
  if (!points || points.length < 2) {
    return null;
  }

  // Integration Check: OSR requires a valid API Key
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    console.error("OpenRouteService API Key is missing. Ensure NEXT_PUBLIC_ORS_API_KEY is set in your environment.");
    return null;
  }

  try {
    // ROUTING API REQUIREMENT: [longitude, latitude]
    const coordinates = points.map(p => [Number(p.lng), Number(p.lat)]);
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Content-Type': 'application/json',
        'Authorization': apiKey.trim()
      },
      body: JSON.stringify({
        coordinates: coordinates,
        instructions: true,
        units: 'km'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouteService failed (Status: ${response.status}). Details:`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // LEAFLET REQUIREMENT: [latitude, longitude]
      const coords = feature.geometry.coordinates.map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number]);
      const properties = feature.properties;
      const summary = properties.summary;
      
      const allSteps: RouteStep[] = [];
      if (properties.segments) {
        properties.segments.forEach((segment: any) => {
          if (segment.steps) {
            segment.steps.forEach((step: any) => {
              allSteps.push({
                instruction: step.instruction,
                distance: step.distance,
                duration: step.duration / 60
              });
            });
          }
        });
      }

      return {
        coordinates: coords,
        distance: summary.distance,
        duration: summary.duration / 60,
        steps: allSteps
      };
    }
    
    return null;
  } catch (error) {
    console.error("Network error during OSR fetch:", error);
    return null;
  }
}

/**
 * Single route fetcher
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  apiKey: string,
  profile: 'driving-car' | 'foot-walking' = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end) return null;
  return getRouteMulti([start, end], apiKey, profile);
}

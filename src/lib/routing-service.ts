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
  if (points.length < 2 || !apiKey) return null;

  try {
    const coordinates = points.map(p => [p.lng, p.lat]);
    
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json',
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        coordinates: coordinates,
        instructions: true,
        units: 'km'
      })
    });

    if (!response.ok) {
      console.warn(`OpenRouteService returned ${response.status}. Falling back to direct calculation.`);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const coords = feature.geometry.coordinates.map((c: number[]) => [c[1], c[0]] as [number, number]);
      const properties = feature.properties;
      const summary = properties.summary;
      
      const allSteps: RouteStep[] = [];
      properties.segments.forEach((segment: any) => {
        segment.steps.forEach((step: any) => {
          allSteps.push({
            instruction: step.instruction,
            distance: step.distance,
            duration: step.duration / 60
          });
        });
      });

      return {
        coordinates: coords,
        distance: summary.distance,
        duration: summary.duration / 60,
        steps: allSteps
      };
    }
    
    return null;
  } catch (error) {
    console.error("Critical routing fetch error:", error);
    return null;
  }
}

/**
 * Legacy single route fetcher (now uses the multi-point logic internally for consistency)
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

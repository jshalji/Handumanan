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
 * IMPORTANT: Routing API expects [longitude, latitude] format.
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

  // FALLBACK: If no API key is provided, return a direct line (Great Circle path)
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
    const directCoords = points.map(p => [Number(p.lat), Number(p.lng)] as [number, number]);
    let totalDist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      totalDist += calculateDistance(points[i].lat, points[i].lng, points[i+1].lat, points[i+1].lng);
    }
    
    return {
      coordinates: directCoords,
      distance: totalDist,
      duration: (totalDist / 30) * 60, // Estimate 30km/h average speed
      steps: [
        { 
          instruction: "Follow the direct path to your destination.", 
          distance: totalDist, 
          duration: (totalDist / 30) * 60 
        }
      ]
    };
  }

  try {
    // ROUTING API REQUIREMENT: [longitude, latitude]
    const coordinates = points.map(p => [Number(p.lng), Number(p.lat)]);
    const url = `https://api.openrouteservice.org/v2/directions/${profile}/geojson`;
    
    // Robust fetch with internal error handling
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
    }).catch(err => {
      console.warn("Network error during OSR fetch:", err);
      return null;
    });

    if (!response || !response.ok) {
      console.warn(`OpenRouteService failed (Status: ${response?.status}). Falling back to direct path.`);
      return getRouteMulti(points, ''); // Trigger direct line fallback
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // LEAFLET REQUIREMENT: [latitude, longitude]
      const coords = feature.geometry.coordinates.map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number]);
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
    
    return getRouteMulti(points, ''); 
  } catch (error) {
    console.error("Critical routing service error. Falling back to direct path.", error);
    return getRouteMulti(points, '');
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

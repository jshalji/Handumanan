'use client';

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
 * Fetches an accurate road-based route using OpenRouteService POST API.
 */
export async function getRouteMulti(
  points: { lat: number; lng: number }[],
  apiKey: string,
  profile: string = 'driving-car'
): Promise<RouteData | null> {
  if (!points || points.length < 2) return null;
  
  // Validate coordinates to avoid NaN or invalid data issues
  const validPoints = points.filter(p => 
    p && 
    typeof p.lat === 'number' && !isNaN(p.lat) && 
    typeof p.lng === 'number' && !isNaN(p.lng)
  );
  
  if (validPoints.length < 2) {
    console.warn("Insufficient valid coordinates for routing calculation.");
    return null;
  }

  if (!apiKey || apiKey.trim() === '') {
    console.warn("OpenRouteService API Key is missing. Routing will not be active.");
    return null;
  }

  try {
    // OSR format: [longitude, latitude]
    const coordinates = validPoints.map(p => [Number(p.lng), Number(p.lat)]);
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
      console.error(`OSR API Error (${response.status}):`, errorText);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      // Leaflet format: [latitude, longitude]
      const coords = feature.geometry.coordinates.map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number]);
      const { distance, duration } = feature.properties.summary;
      
      const allSteps: RouteStep[] = [];
      if (feature.properties.segments) {
        feature.properties.segments.forEach((segment: any) => {
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
        distance,
        duration: duration / 60,
        steps: allSteps
      };
    }
    
    return null;
  } catch (error: any) {
    // Log specific network errors for easier debugging
    if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
      console.error("OSR Network Error: The request was blocked or the API is unreachable. Check your connection and API key permissions.");
    } else {
      console.error("OSR Routing Error:", error);
    }
    return null;
  }
}

/**
 * Single route fetcher for two points.
 */
export async function getRoute(
  start: { lat: number; lng: number } | null, 
  end: { lat: number; lng: number } | null,
  apiKey: string,
  profile: string = 'driving-car'
): Promise<RouteData | null> {
  if (!start || !end) return null;
  return getRouteMulti([start, end], apiKey, profile);
}

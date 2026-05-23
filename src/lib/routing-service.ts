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
  provider?: 'google-routes' | 'openrouteservice' | 'osrm';
  alternativesConsidered?: number;
}

async function getGoogleRouteMulti(
  points: { lat: number; lng: number }[],
  profile: string = 'DRIVE'
): Promise<RouteData | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  if (!apiKey || apiKey.trim() === '' || points.length < 2) return null;

  const origin = points[0];
  const destination = points[points.length - 1];
  const intermediates = points.slice(1, -1);
  const isWalking = profile === 'WALK';
  const canAskForAlternatives = !isWalking && intermediates.length === 0;

  try {
    const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey.trim(),
        'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration',
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        intermediates: intermediates.map(point => ({ location: { latLng: point } })),
        travelMode: isWalking ? 'WALK' : 'DRIVE',
        routingPreference: isWalking ? undefined : 'TRAFFIC_AWARE',
        departureTime: isWalking ? undefined : new Date().toISOString(),
        computeAlternativeRoutes: canAskForAlternatives,
        polylineQuality: 'HIGH_QUALITY',
      }),
    }).catch(() => null);

    if (!response || !response.ok) return null;

    const data = await response.json();
    const routes = Array.isArray(data?.routes) ? data.routes : [];
    const route = routes
      .filter(Boolean)
      .sort((first: any, second: any) => {
        const durationDifference = parseGoogleDuration(first.duration) - parseGoogleDuration(second.duration);
        if (durationDifference !== 0) return durationDifference;
        return Number(first.distanceMeters || 0) - Number(second.distanceMeters || 0);
      })[0];
    if (!route) return null;

    return {
      coordinates: decodeGooglePolyline(route.polyline?.encodedPolyline || ''),
      distance: Number(route.distanceMeters || 0) / 1000,
      duration: parseGoogleDuration(route.duration),
      steps: (route.legs || []).flatMap((leg: any) => (
        (leg.steps || []).map((step: any) => ({
          instruction: step.navigationInstruction?.instructions || 'Continue',
          distance: Number(step.distanceMeters || 0) / 1000,
          duration: parseGoogleDuration(step.staticDuration),
        }))
      )),
      provider: 'google-routes',
      alternativesConsidered: routes.length || 1,
    };
  } catch {
    return null;
  }
}

function parseGoogleDuration(value: string | undefined): number {
  if (!value) return 0;
  const seconds = Number(String(value).replace('s', ''));
  return Number.isFinite(seconds) ? seconds / 60 : 0;
}

function decodeGooglePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

/**
 * Fetches an accurate road-based route using OpenRouteService or OSRM (fallback).
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
  
  if (validPoints.length < 2) return null;

  const googleRoute = await getGoogleRouteMulti(validPoints);
  if (googleRoute) return googleRoute;

  // If no API key, use OSRM Public Demo Server
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    try {
      const coordsString = validPoints.map(p => `${p.lng},${p.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=full&geometries=geojson&steps=true`;

      const response = await fetch(url).catch(() => null);
      if (!response || !response.ok) return null;

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // Leaflet format: [latitude, longitude]
        const coords = route.geometry.coordinates.map((c: number[]) => [Number(c[1]), Number(c[0])] as [number, number]);

        const allSteps: RouteStep[] = [];
        route.legs.forEach((leg: any) => {
          if (leg.steps) {
            leg.steps.forEach((step: any) => {
              allSteps.push({
                instruction: step.maneuver.instruction || 'Continue',
                distance: step.distance / 1000, // OSRM gives meters
                duration: step.duration / 60
              });
            });
          }
        });

        return {
          coordinates: coords,
          distance: route.distance / 1000, // OSRM gives meters
          duration: route.duration / 60,
          steps: allSteps,
          provider: 'osrm'
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  try {
    // ORS format: [longitude, latitude]
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
    }).catch(() => null);

    if (!response || !response.ok) return null;

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
        steps: allSteps,
        provider: 'openrouteservice'
      };
    }
    
    return null;
  } catch (error) {
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

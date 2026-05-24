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
  requestedMode?: TravelMode;
  resolvedMode?: TravelMode;
  fallbackReason?: string;
  alternativesConsidered?: number;
  alternatives?: Array<{
    coordinates: [number, number][];
    distance: number;
    duration: number;
  }>;
}

export type TravelMode = 'DRIVE' | 'TWO_WHEELER' | 'TRANSIT' | 'WALK';

type GoogleRouteResult = {
  route: RouteData | null;
  error?: string;
};

function getGoogleTravelMode(profile: string): TravelMode {
  const normalizedProfile = profile.toUpperCase().replace(/[-_\s]/g, '');
  if (normalizedProfile.includes('WALK') || normalizedProfile.includes('FOOT')) return 'WALK';
  if (normalizedProfile.includes('TRANSIT')) return 'TRANSIT';
  if (normalizedProfile.includes('TWO') || normalizedProfile.includes('MOTORCYCLE') || normalizedProfile.includes('SCOOTER')) return 'TWO_WHEELER';
  return 'DRIVE';
}

function getFallbackProfile(profile: string) {
  const travelMode = getGoogleTravelMode(profile);
  if (travelMode === 'WALK') return 'foot-walking';
  if (travelMode === 'TWO_WHEELER') return 'cycling-regular';
  return 'driving-car';
}

function estimateDurationFromDistance(distanceKm: number, mode: TravelMode, providerDurationMinutes: number) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return providerDurationMinutes || 0;
  if (mode === 'WALK') return (distanceKm / 4.5) * 60;
  if (mode === 'TWO_WHEELER') return (distanceKm / 24) * 60;
  if (mode === 'TRANSIT') return providerDurationMinutes || 0;
  return providerDurationMinutes || (distanceKm / 18) * 60;
}

async function getGoogleRouteMulti(
  points: { lat: number; lng: number }[],
  profile: string = 'DRIVE'
): Promise<GoogleRouteResult> {
  if (points.length < 2) return { route: null, error: 'Not enough route points.' };

  const origin = points[0];
  const destination = points[points.length - 1];
  const intermediates = points.slice(1, -1);
  const travelMode = getGoogleTravelMode(profile);
  const isTrafficAwareMode = travelMode === 'DRIVE' || travelMode === 'TWO_WHEELER';
  const canAskForAlternatives = intermediates.length === 0 && travelMode !== 'TRANSIT';

  try {
    const response = await fetch('/api/google-routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: { location: { latLng: origin } },
        destination: { location: { latLng: destination } },
        intermediates: intermediates.map(point => ({ location: { latLng: point } })),
        travelMode,
        routingPreference: isTrafficAwareMode ? 'TRAFFIC_AWARE' : undefined,
        departureTime: travelMode === 'WALK' ? undefined : new Date().toISOString(),
        computeAlternativeRoutes: canAskForAlternatives,
        polylineQuality: 'HIGH_QUALITY',
      }),
    }).catch(() => null);

    if (!response) return { route: null, error: 'Network request failed.' };

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const googleMessage = data?.error?.message || data?.error || `Request failed with status ${response.status}.`;
      return { route: null, error: googleMessage };
    }

    const routes = Array.isArray(data?.routes) ? data.routes : [];
    const route = routes
      .filter(Boolean)
      .sort((first: any, second: any) => {
        const durationDifference = parseGoogleDuration(first.duration) - parseGoogleDuration(second.duration);
        if (durationDifference !== 0) return durationDifference;
        return Number(first.distanceMeters || 0) - Number(second.distanceMeters || 0);
      })[0];
    if (!route) return { route: null, error: 'Google returned no usable route.' };

    const alternatives = routes
      .filter((candidate: any) => candidate && candidate !== route && candidate.polyline?.encodedPolyline)
      .map((candidate: any) => ({
        coordinates: decodeGooglePolyline(candidate.polyline.encodedPolyline),
        distance: Number(candidate.distanceMeters || 0) / 1000,
        duration: parseGoogleDuration(candidate.duration),
      }));

    return {
      route: {
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
        requestedMode: travelMode,
        resolvedMode: travelMode,
        alternativesConsidered: routes.length || 1,
        alternatives,
      },
    };
  } catch {
    return { route: null, error: 'Google route parsing failed.' };
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

  const googleResult = await getGoogleRouteMulti(validPoints, profile);
  if (googleResult.route) return googleResult.route;

  const requestedMode = getGoogleTravelMode(profile);
  if (requestedMode === 'TRANSIT') return null;

  const fallbackProfile = getFallbackProfile(profile);
  const fallbackResolvedMode: TravelMode = fallbackProfile === 'foot-walking'
    ? 'WALK'
    : fallbackProfile === 'cycling-regular'
      ? 'TWO_WHEELER'
      : 'DRIVE';
  const fallbackReason = requestedMode === fallbackResolvedMode
    ? `Google Routes unavailable${googleResult.error ? `: ${googleResult.error}` : ''}; using fallback routing provider.`
    : `${requestedMode.replace('_', ' ')} routing unavailable${googleResult.error ? `: ${googleResult.error}` : ''}; using ${fallbackResolvedMode.replace('_', ' ').toLowerCase()} fallback.`;

  // If no API key, use OSRM Public Demo Server
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('YOUR_')) {
    try {
      const coordsString = validPoints.map(p => `${p.lng},${p.lat}`).join(';');
      const osrmProfile = fallbackProfile === 'foot-walking' ? 'foot' : fallbackProfile === 'cycling-regular' ? 'bike' : 'driving';
      const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordsString}?overview=full&geometries=geojson&steps=true`;

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

        const distanceKm = route.distance / 1000;
        const durationMinutes = estimateDurationFromDistance(distanceKm, fallbackResolvedMode, route.duration / 60);

        return {
          coordinates: coords,
          distance: distanceKm,
          duration: durationMinutes,
          steps: allSteps,
          provider: 'osrm',
          requestedMode,
          resolvedMode: fallbackResolvedMode,
          fallbackReason
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
    const url = `https://api.openrouteservice.org/v2/directions/${fallbackProfile}/geojson`;
    
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
      const durationMinutes = estimateDurationFromDistance(distance, fallbackResolvedMode, duration / 60);
      
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
        duration: durationMinutes,
        steps: allSteps,
        provider: 'openrouteservice',
        requestedMode,
        resolvedMode: fallbackResolvedMode,
        fallbackReason
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

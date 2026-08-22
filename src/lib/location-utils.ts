/**
 * Calculates the distance between two points on the Earth's surface using the Haversine formula.
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
}

export type LocationConfidence = 'HIGH' | 'MEDIUM' | 'LOW';

export interface EvaluatedLocation {
  lat: number;
  lng: number;
  accuracy: number;
  confidence: LocationConfidence;
  isTrusted: boolean;
}

export const MAX_TRUSTED_ACCURACY_METERS = 10000; // 10 km threshold

/**
 * Evaluates raw browser geolocation coordinates against accuracy thresholds.
 */
export function evaluateLocationAccuracy(coords: { latitude: number; longitude: number; accuracy?: number }): EvaluatedLocation {
  const accuracy = typeof coords.accuracy === 'number' && Number.isFinite(coords.accuracy) ? coords.accuracy : 999999;
  const isTrusted = accuracy <= MAX_TRUSTED_ACCURACY_METERS;
  const confidence: LocationConfidence = accuracy <= 1000 ? 'HIGH' : accuracy <= 10000 ? 'MEDIUM' : 'LOW';

  console.log('[GPS] Browser location:', {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy: accuracy,
  });

  console.log('[GPS] Location confidence:', {
    accuracy: accuracy,
    trusted: isTrusted,
    confidence: confidence,
  });

  return {
    lat: coords.latitude,
    lng: coords.longitude,
    accuracy,
    confidence,
    isTrusted,
  };
}

/**
 * Gets the user's current geolocation with accuracy evaluation.
 */
export function getCurrentLocation(options?: PositionOptions): Promise<EvaluatedLocation> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const evaluated = evaluateLocationAccuracy(position.coords);
        resolve(evaluated);
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
        ...options,
      }
    );
  });
}

export type LocationPoint = {
  lat: number;
  lng: number;
  accuracy?: number;
};

export type LocationWatchHandlers = {
  onUpdate: (location: EvaluatedLocation) => void;
  onError?: (error: GeolocationPositionError) => void;
};

export function watchCurrentLocation({ onUpdate, onError }: LocationWatchHandlers): () => void {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return () => {};
  }

  const watchId = navigator.geolocation.watchPosition(
    (position) => {
      const evaluated = evaluateLocationAccuracy(position.coords);
      onUpdate(evaluated);
    },
    (error) => {
      onError?.(error);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 3000,
      timeout: 15000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}

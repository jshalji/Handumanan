'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Plus, Check, Navigation, AlertCircle, Clock, MapPin, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageSources } from '@/lib/site-images';
import { getSiteAvailability } from '@/lib/site-availability';
import { getDailyVisitingTime, WEEKLY_VISITING_DAYS } from '@/lib/visiting-hours';

const CATEGORY_MARKER_CONFIG: Record<string, { label: string; color: string; svg: string }> = {
  'Churches & Religious Heritage Sites': {
    label: 'Church',
    color: '#16a34a',
    svg: '<path d="M12 3v18"/><path d="M8 7h8"/><path d="M6 21v-7a6 6 0 0 1 12 0v7"/><path d="M9 21v-5h6v5"/>',
  },
  'Ancestral Houses & Heritage Residences': {
    label: 'House',
    color: '#8b5cf6',
    svg: '<path d="M3 11 12 4l9 7"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/>',
  },
  'Museums & Cultural Institutions': {
    label: 'Museum',
    color: '#2563eb',
    svg: '<path d="m3 10 9-6 9 6"/><path d="M5 10h14"/><path d="M6 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M18 10v8"/><path d="M4 18h16"/><path d="M3 21h18"/>',
  },
  'Historical Landmarks & Monuments': {
    label: 'Marker',
    color: '#f59e0b',
    svg: '<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  },
  'Plazas, Parks & Public Spaces': {
    label: 'Park',
    color: '#059669',
    svg: '<path d="M12 3v18"/><path d="M6 8c3 0 6-2 6-5 0 3 3 5 6 5"/><path d="M5 14c3 0 7-2 7-6 0 4 4 6 7 6"/><path d="M9 21h6"/>',
  },
  'Government & Historic Buildings': {
    label: 'Civic',
    color: '#475569',
    svg: '<path d="M4 21h16"/><path d="M5 10h14"/><path d="M6 10v11"/><path d="M10 10v11"/><path d="M14 10v11"/><path d="M18 10v11"/><path d="m3 10 9-7 9 7"/>',
  },
  'Cultural & Religious (Non-Catholic Sites)': {
    label: 'Culture',
    color: '#dc2626',
    svg: '<circle cx="12" cy="12" r="8"/><path d="M12 4a4 4 0 0 1 0 8 4 4 0 0 0 0 8"/><circle cx="12" cy="8" r="1"/><circle cx="12" cy="16" r="1"/>',
  },
};

const HERITAGE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.government', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.medical', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.place_of_worship', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.school', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.sports_complex', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative.land_parcel', stylers: [{ visibility: 'off' }] },
];

const MAP_UNAVAILABLE_MESSAGE = 'Map service is temporarily unavailable. Please check your map configuration.';
const GOOGLE_MAPS_ERROR_PATTERN = /google maps javascript api error|referernotallowedmaperror|apiauthenticationerror|invalidkeymaperror|missingkeymaperror|google maps.*failed/i;

interface HeritageMapProps {
  userLocation: { lat: number; lng: number } | null;
  sites: any[];
  itinerary: any[];
  routeCoords?: [number, number][];
  routeAlternatives?: Array<{ coordinates: [number, number][] }>;
  totalTime?: number;
  totalDist?: number;
  onAddSite: (id: string) => void;
  onSelectSite?: (site: any) => void;
  selectedSiteId?: string | null;
  focusedLocation?: { lat: number; lng: number } | null;
  isNavigating?: boolean;
  recenterKey?: number;
  fitSitesKey?: number;
}

const isValidCoordinate = (lat: any, lng: any) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);
  return (
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    latitude !== 0 && longitude !== 0
  );
};

const getSiteCoordinates = (site: any) => ({
  lat: site.coordinates?.lat ?? site.latitude,
  lng: site.coordinates?.lng ?? site.longitude,
});

const formatTravelTime = (minutes: number) => {
  const roundedMinutes = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(roundedMinutes / 60);
  const mins = roundedMinutes % 60;

  if (hours <= 0) return `${roundedMinutes} MIN`;
  if (mins === 0) return `${hours} HR`;
  return `${hours} HR ${mins} MIN`;
};

function MapUnavailableFallback() {
  return (
    <div className="flex h-full min-h-[320px] w-full flex-col items-center justify-center bg-slate-50 p-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 shadow-inner">
        <AlertCircle size={28} />
      </div>
      <h3 className="mb-1 font-headline text-base font-bold text-slate-900 md:text-lg">
        Map Service Temporarily Unavailable
      </h3>
      <p className="max-w-xs text-xs font-medium leading-relaxed text-slate-500 md:max-w-md">
        {MAP_UNAVAILABLE_MESSAGE}
      </p>
    </div>
  );
}

class HeritageMapErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    this.props.onError();
  }

  render() {
    if (this.state.hasError) return <MapUnavailableFallback />;
    return this.props.children;
  }
}

function getErrorText(error: unknown) {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return `${error.name} ${error.message}`;
  if (error && typeof error === 'object') {
    const maybeMessage = 'message' in error ? (error as { message?: unknown }).message : undefined;
    return typeof maybeMessage === 'string' ? maybeMessage : String(error);
  }
  return '';
}

function CategoryMarkerIcon({
  category,
  state,
}: {
  category: string;
  state: 'default' | 'itinerary' | 'destination';
}) {
  const config = CATEGORY_MARKER_CONFIG[category] || {
    label: 'Site',
    color: '#0ea5e9',
    svg: '<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  };
  const color = state === 'destination' ? '#16a34a' : state === 'itinerary' ? '#facc15' : config.color;
  const textColor = state === 'itinerary' ? '#1f2937' : '#ffffff';
  const ringColor = state === 'destination' ? '#bbf7d0' : state === 'itinerary' ? '#fef3c7' : '#ffffff';

  return (
    <div aria-label={config.label} className="drop-shadow-[0_8px_10px_rgba(15,23,42,0.28)]" style={{ width: 34, height: 42 }}>
      <div
        className="flex h-[34px] w-[34px] items-center justify-center border-[3px]"
        style={{
          borderColor: ringColor,
          background: color,
          borderRadius: '17px 17px 17px 4px',
          transform: 'rotate(-45deg)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke={textColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          style={{ transform: 'rotate(45deg)' }}
          dangerouslySetInnerHTML={{ __html: config.svg }}
        />
      </div>
    </div>
  );
}

function RoutePolyline({
  routeCoords,
  routeAlternatives = [],
}: {
  routeCoords?: [number, number][];
  routeAlternatives?: Array<{ coordinates: [number, number][] }>;
}) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const polylineRefs = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!map || !maps) return;

    polylineRefs.current.forEach(polyline => polyline.setMap(null));
    polylineRefs.current = [];

    const path = (routeCoords || [])
      .filter(([lat, lng]) => isValidCoordinate(lat, lng))
      .map(([lat, lng]) => ({ lat, lng }));

    if (path.length < 2) return;

    routeAlternatives.forEach((alternative) => {
      const alternativePath = (alternative.coordinates || [])
        .filter(([lat, lng]) => isValidCoordinate(lat, lng))
        .map(([lat, lng]) => ({ lat, lng }));

      if (alternativePath.length < 2) return;

      const alternativePolyline = new maps.Polyline({
        path: alternativePath,
        geodesic: true,
        strokeColor: '#93c5fd',
        strokeOpacity: 0.75,
        strokeWeight: 5,
      });
      alternativePolyline.setMap(map);
      polylineRefs.current.push(alternativePolyline);
    });

    const polyline = new maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#1d4ed8',
      strokeOpacity: 0.95,
      strokeWeight: 7,
    });

    polyline.setMap(map);
    polylineRefs.current.push(polyline);

    return () => {
      polylineRefs.current.forEach(item => item.setMap(null));
      polylineRefs.current = [];
    };
  }, [map, maps, routeAlternatives, routeCoords]);

  return null;
}

function MapController({
  routeCoords,
  sites,
  focusedLocation,
  isNavigating,
  userLocation,
  recenterKey,
  fitSitesKey,
}: {
  routeCoords?: [number, number][];
  sites: any[];
  focusedLocation?: { lat: number; lng: number } | null;
  isNavigating?: boolean;
  userLocation: { lat: number; lng: number } | null;
recenterKey?: number;
  fitSitesKey?: number;
}) {
  const map = useMap();
  const maps = useMapsLibrary('maps');
  const centeredKeyRef = useRef<string | null>(null);
  const lastRecenterKeyRef = useRef<number | undefined>(recenterKey);

  useEffect(() => {
    if (!map) return;

    // 1. Explicit single site focus has top priority
    if (focusedLocation && isValidCoordinate(focusedLocation.lat, focusedLocation.lng) && !isNavigating) {
      map.setCenter(focusedLocation);
      map.setZoom(16);
      return;
    }

    // 2. Live navigation mode follows user GPS
    if (isNavigating && userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      map.panTo(userLocation);
      if ((map.getZoom() || 0) < 16) map.setZoom(17);
      return;
    }

    // 3. User location initial centering or explicit locate-me button click
    if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      const locKey = `${userLocation.lat.toFixed(5)},${userLocation.lng.toFixed(5)}`;
      const isNewLoc = centeredKeyRef.current !== locKey;
      const isManualRecenter = recenterKey !== undefined && recenterKey > 0 && recenterKey !== lastRecenterKeyRef.current;

      if (isNewLoc || isManualRecenter) {
        centeredKeyRef.current = locKey;
        lastRecenterKeyRef.current = recenterKey;
        console.log('[Map] Centering camera on userLocation:', userLocation);
        map.setCenter(userLocation);
        map.setZoom(16);
        return;
      }
    }

    // 4. Neutral fallback center when user GPS is not available yet (Metro Cebu center, NEVER Manila/Wack-Wack)
    if (!userLocation && !focusedLocation && !centeredKeyRef.current) {
      centeredKeyRef.current = 'cebu-fallback';
      map.setCenter({ lat: 10.3157, lng: 123.8854 });
      map.setZoom(13);
    }
  }, [map, userLocation, focusedLocation, isNavigating, recenterKey]);

  return null;
}

export default function HeritageMap({
  userLocation,
  sites,
  itinerary,
  routeCoords,
  routeAlternatives,
  totalTime,
  totalDist,
  onAddSite,
  onSelectSite,
  selectedSiteId,
  focusedLocation,
  isNavigating,
  recenterKey,
  fitSitesKey,
}: HeritageMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const [hasMapError, setHasMapError] = useState(false);
  const { user } = useUser();
  const db = useFirestore();

  const handleMapFailure = useCallback(() => {
    setHasMapError(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prevAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      handleMapFailure();
      if (typeof prevAuthFailure === 'function') {
        try { prevAuthFailure(); } catch {}
      }
    };

    const handleWindowError = (event: ErrorEvent) => {
      const message = `${event.message || ''} ${getErrorText(event.error)}`;
      if (GOOGLE_MAPS_ERROR_PATTERN.test(message)) {
        handleMapFailure();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (GOOGLE_MAPS_ERROR_PATTERN.test(getErrorText(event.reason))) {
        handleMapFailure();
      }
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      (window as any).gm_authFailure = prevAuthFailure;
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleMapFailure]);

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  const defaultCenter = useMemo(() => {
    if (userLocation && isValidCoordinate(userLocation.lat, userLocation.lng)) {
      return userLocation;
    }
    return { lat: 10.3157, lng: 123.8854 };
  }, [userLocation]);

  if (!apiKey || hasMapError) {
    return <MapUnavailableFallback />;
  }

  return (
    <div className="relative z-0 h-full min-h-[320px] w-full overflow-hidden">
      <HeritageMapErrorBoundary onError={handleMapFailure}>
      <APIProvider
        apiKey={apiKey}
        libraries={['marker']}
        onError={handleMapFailure}
      >
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={13}
          mapId="DEMO_MAP_ID"
          disableDefaultUI
          clickableIcons={false}
          gestureHandling="greedy"
          styles={HERITAGE_MAP_STYLES}
          className="h-full w-full"
        >
          <MapController
            routeCoords={routeCoords}
            sites={sites}
            focusedLocation={focusedLocation}
            isNavigating={isNavigating}
            userLocation={userLocation}
            recenterKey={recenterKey}
            fitSitesKey={fitSitesKey}
          />
          <RoutePolyline routeCoords={routeCoords} routeAlternatives={routeAlternatives} />

          {userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && (
            <AdvancedMarker position={userLocation} title="Your Location">
              <div className="user-location-pulse" />
            </AdvancedMarker>
          )}

          {sites.map((site) => {
            const { lat, lng } = getSiteCoordinates(site);
            if (!isValidCoordinate(lat, lng)) return null;

            const isInItinerary = itinerary.some(i => i.id === site.id);
            const isLastInItinerary = itinerary.length > 0 && itinerary[itinerary.length - 1].id === site.id;
            const isDestination = selectedSiteId === site.id || isLastInItinerary;
            const markerState = isDestination ? 'destination' : isInItinerary ? 'itinerary' : 'default';

            return (
              <AdvancedMarker
                key={site.id}
                position={{ lat: Number(lat), lng: Number(lng) }}
                title={site.name}
                onClick={() => {
                  onSelectSite?.(site);
                }}
              >
                <CategoryMarkerIcon category={site.category} state={markerState} />
              </AdvancedMarker>
            );
          })}
        </Map>
      </APIProvider>
      </HeritageMapErrorBoundary>

      {routeCoords && routeCoords.length > 1 && totalTime && totalDist && (
        <div className="pointer-events-none absolute left-1/2 top-20 z-10 -translate-x-1/2 rounded-2xl bg-white/95 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-xl ring-1 ring-black/5">
          <span className="inline-flex items-center gap-2">
            <Navigation size={12} className="text-primary" />
            EST. {formatTravelTime(totalTime)} - {totalDist.toFixed(1)} KM
          </span>
        </div>
      )}
    </div>
  );
}


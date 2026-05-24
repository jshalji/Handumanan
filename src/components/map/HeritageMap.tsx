'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Button } from '@/components/ui/button';
import { Plus, Check, Navigation, AlertCircle, Clock, MapPin, Star } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageFallback } from '@/lib/site-images';
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
  const lastFitSitesKey = useRef(fitSitesKey);

  useEffect(() => {
    if (!map || !isNavigating || !userLocation) return;
    map.panTo(userLocation);
    if ((map.getZoom() || 0) < 16) map.setZoom(17);
  }, [isNavigating, map, userLocation?.lat, userLocation?.lng, userLocation]);

  useEffect(() => {
    if (!map || !recenterKey || recenterKey <= 0 || !userLocation) return;
    map.setCenter(userLocation);
    map.setZoom(17);
  }, [map, recenterKey, userLocation]);

  useEffect(() => {
    if (!map || !maps || !fitSitesKey || lastFitSitesKey.current === fitSitesKey || isNavigating || focusedLocation) {
      return;
    }

    lastFitSitesKey.current = fitSitesKey;

    const sitePoints = sites
      .map((site) => getSiteCoordinates(site))
      .filter(({ lat, lng }) => isValidCoordinate(lat, lng))
      .map(({ lat, lng }) => ({ lat: Number(lat), lng: Number(lng) }));

    if (sitePoints.length === 0) return;

    if (sitePoints.length === 1) {
      map.setCenter(sitePoints[0]);
      map.setZoom(16);
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    sitePoints.forEach(point => bounds.extend(point));
    map.fitBounds(bounds, 80);
  }, [fitSitesKey, focusedLocation, isNavigating, map, maps, sites]);

  useEffect(() => {
    if (!map || !focusedLocation || isNavigating || !isValidCoordinate(focusedLocation.lat, focusedLocation.lng)) return;
    map.setCenter(focusedLocation);
    map.setZoom(16);
  }, [focusedLocation, isNavigating, map]);

  useEffect(() => {
    if (!map || !maps || isNavigating || focusedLocation || !routeCoords || routeCoords.length < 2) return;

    const routePoints = routeCoords
      .filter(([lat, lng]) => isValidCoordinate(lat, lng))
      .map(([lat, lng]) => ({ lat, lng }));
    if (routePoints.length < 2) return;

    const bounds = new google.maps.LatLngBounds();
    routePoints.forEach(point => bounds.extend(point));
    sites.forEach((site) => {
      const { lat, lng } = getSiteCoordinates(site);
      if (isValidCoordinate(lat, lng)) {
        bounds.extend({ lat: Number(lat), lng: Number(lng) });
      }
    });
    map.fitBounds(bounds, 80);
  }, [focusedLocation, isNavigating, map, maps, routeCoords, sites]);

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
  const [selectedPopupSite, setSelectedPopupSite] = useState<any | null>(null);
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';

  const defaultCenter = useMemo(() => ({ lat: 10.3157, lng: 123.8854 }), []);

  if (!apiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 p-6 text-center">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-slate-500">Google Maps API key missing</p>
          <p className="mt-2 text-sm text-slate-400">Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to load the map.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-0 h-full w-full">
      <APIProvider apiKey={apiKey} libraries={['marker']}>
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
                  setSelectedPopupSite(site);
                  onSelectSite?.(site);
                }}
              >
                <CategoryMarkerIcon category={site.category} state={markerState} />
              </AdvancedMarker>
            );
          })}

          {selectedPopupSite && (() => {
            const { lat, lng } = getSiteCoordinates(selectedPopupSite);
            const isInItinerary = itinerary.some(i => i.id === selectedPopupSite.id);
            const availability = getSiteAvailability(selectedPopupSite);
            if (!isValidCoordinate(lat, lng)) return null;

            return (
              <InfoWindow
                position={{ lat: Number(lat), lng: Number(lng) }}
                onCloseClick={() => setSelectedPopupSite(null)}
              >
                <div className="w-[20rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)] ring-1 ring-slate-200">
                  {selectedPopupSite.imageUrl && (
                    <div className="relative m-2 mb-0 h-36 overflow-hidden rounded-[1.35rem] bg-slate-100">
                      <SafeImage
                        src={selectedPopupSite.imageUrl}
                        alt={selectedPopupSite.name}
                        fallbackSrc={getSiteImageFallback(selectedPopupSite)}
                        fallbackClassName="object-cover"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/25 to-transparent p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary shadow-lg shadow-slate-950/10">
                            {selectedPopupSite.city}
                          </span>
                          <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[8px] font-black text-white ring-1 ring-white/25 backdrop-blur-md">
                            <Star size={10} fill="currentColor" /> {Number(selectedPopupSite.rating || 0).toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="space-y-3.5 p-4 pt-3">
                    <div className="space-y-2">
                      <p className="w-fit rounded-full bg-primary/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.18em] text-primary">{selectedPopupSite.category.split(' & ')[0]}</p>
                      <h3 className="text-[17px] font-black leading-[1.1] text-slate-950">{selectedPopupSite.name}</h3>
                      <div className="flex items-start gap-2 rounded-2xl bg-slate-50 px-3 py-2 text-[10px] font-bold leading-snug text-slate-500">
                        <MapPin size={13} className="mt-0.5 shrink-0 text-primary" />
                        <span className="line-clamp-2">{selectedPopupSite.location || selectedPopupSite.city}</span>
                      </div>
                    </div>

                    <p className="line-clamp-3 rounded-2xl border border-slate-100 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 shadow-sm">{selectedPopupSite.description}</p>

                    <div
                      className={`flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 text-[9px] font-black uppercase tracking-widest ring-1 ${
                        availability.isOpen
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
                          : 'bg-red-50 text-red-700 ring-red-100'
                      }`}
                    >
                      <span>{availability.isOpen ? 'Open / Available' : 'Closed / Unavailable'}</span>
                      <span className={`h-2.5 w-2.5 rounded-full shadow-sm ${availability.isOpen ? 'bg-emerald-500 shadow-emerald-500/40' : 'bg-red-500 shadow-red-500/40'}`} />
                    </div>

                    <div className="rounded-2xl bg-slate-100/70 p-2.5">
                      <div className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-widest text-slate-500">
                        <Clock size={12} className="text-primary" />
                        Visiting Hours
                      </div>
                      <div className="grid max-h-28 gap-1 overflow-y-auto pr-1">
                        {WEEKLY_VISITING_DAYS.map(({ abbr, day }) => (
                          <div key={day} className="grid grid-cols-[1.5rem_1fr] items-center gap-2 rounded-xl bg-white/80 px-2 py-1.5">
                            <span className="text-[8px] font-black uppercase tracking-widest text-primary">{abbr}</span>
                            <span className="truncate text-[9px] font-bold text-slate-600">{day}: {getDailyVisitingTime(selectedPopupSite.visitingHours)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {isAdmin && selectedPopupSite.needsVerification && (
                      <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-[8px] font-black uppercase tracking-widest text-amber-700 ring-1 ring-amber-100">
                        <AlertCircle size={10} /> Needs Verification
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-1.5">
                      <Button asChild size="sm" variant="outline" className="h-10 rounded-xl border-white bg-white text-[9px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50">
                        <Link href={`/site/${selectedPopupSite.id}`}>Details</Link>
                      </Button>
                      <Button
                        size="sm"
                        variant={isInItinerary ? 'secondary' : 'default'}
                        className="h-10 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/15"
                        onClick={() => onAddSite(selectedPopupSite.id)}
                      >
                        {isInItinerary ? <Check size={12} /> : <Plus size={12} />} Route
                      </Button>
                    </div>
                  </div>
                </div>
              </InfoWindow>
            );
          })()}
        </Map>
      </APIProvider>

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


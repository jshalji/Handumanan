'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Plus, Check, Navigation, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { SafeImage } from '@/components/ui/safe-image';

const CATEGORY_ICON_CONFIG: Record<string, { label: string; color: string; svg: string }> = {
  'Churches & Religious Heritage Sites': {
    label: 'Church',
    color: '#16a34a',
    svg: '<path d="M12 3v18"/><path d="M8 7h8"/><path d="M6 21v-7a6 6 0 0 1 12 0v7"/><path d="M9 21v-5h6v5"/>'
  },
  'Ancestral Houses & Heritage Residences': {
    label: 'House',
    color: '#8b5cf6',
    svg: '<path d="M3 11 12 4l9 7"/><path d="M5 10v11h14V10"/><path d="M9 21v-6h6v6"/>'
  },
  'Museums & Cultural Institutions': {
    label: 'Museum',
    color: '#2563eb',
    svg: '<path d="m3 10 9-6 9 6"/><path d="M5 10h14"/><path d="M6 10v8"/><path d="M10 10v8"/><path d="M14 10v8"/><path d="M18 10v8"/><path d="M4 18h16"/><path d="M3 21h18"/>'
  },
  'Historical Landmarks & Monuments': {
    label: 'Marker',
    color: '#f59e0b',
    svg: '<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>'
  },
  'Plazas, Parks & Public Spaces': {
    label: 'Park',
    color: '#059669',
    svg: '<path d="M12 3v18"/><path d="M6 8c3 0 6-2 6-5 0 3 3 5 6 5"/><path d="M5 14c3 0 7-2 7-6 0 4 4 6 7 6"/><path d="M9 21h6"/>'
  },
  'Government & Historic Buildings': {
    label: 'Civic',
    color: '#475569',
    svg: '<path d="M4 21h16"/><path d="M5 10h14"/><path d="M6 10v11"/><path d="M10 10v11"/><path d="M14 10v11"/><path d="M18 10v11"/><path d="m3 10 9-7 9 7"/>'
  },
  'Cultural & Religious (Non-Catholic Sites)': {
    label: 'Culture',
    color: '#dc2626',
    svg: '<circle cx="12" cy="12" r="8"/><path d="M12 4a4 4 0 0 1 0 8 4 4 0 0 0 0 8"/><circle cx="12" cy="8" r="1"/><circle cx="12" cy="16" r="1"/>'
  },
};

const createCategoryIcon = (category: string, state: 'default' | 'itinerary' | 'destination' = 'default') => {
  const config = CATEGORY_ICON_CONFIG[category] || {
    label: 'Site',
    color: '#0ea5e9',
    svg: '<path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>'
  };
  const color = state === 'destination' ? '#16a34a' : state === 'itinerary' ? '#facc15' : config.color;
  const textColor = state === 'itinerary' ? '#1f2937' : '#ffffff';
  const ringColor = state === 'destination' ? '#bbf7d0' : state === 'itinerary' ? '#fef3c7' : '#ffffff';

  return L.divIcon({
    className: 'heritage-category-marker',
    html: `
      <div style="
        width: 34px;
        height: 42px;
        position: relative;
        filter: drop-shadow(0 8px 10px rgba(15, 23, 42, 0.28));
      ">
        <div style="
          width: 34px;
          height: 34px;
          border-radius: 17px 17px 17px 4px;
          transform: rotate(-45deg);
          background: ${color};
          border: 3px solid ${ringColor};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="${textColor}"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-label="${config.label}"
            style="
            transform: rotate(45deg);
            width: 20px;
            height: 20px;
          ">${config.svg}</svg>
        </div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -38],
  });
};

const createUserPulseIcon = () => L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-location-pulse"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

L.Marker.prototype.options.icon = createCategoryIcon('');

interface HeritageMapProps {
  userLocation: { lat: number; lng: number } | null;
  sites: any[];
  itinerary: any[];
  routeCoords?: [number, number][];
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

function MapController({ 
  routeCoords,
  sites,
  focusedLocation,
  isNavigating,
  userLocation,
  recenterKey,
  fitSitesKey
}: { 
  routeCoords?: [number, number][],
  sites: any[],
  focusedLocation?: { lat: number; lng: number } | null,
  isNavigating?: boolean,
  userLocation: { lat: number; lng: number } | null,
  recenterKey?: number,
  fitSitesKey?: number
}) {
  const map = useMap();
  const lastFitSitesKey = useRef(fitSitesKey);

  useEffect(() => {
    if (isNavigating && userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 1 });
      if (map.getZoom() < 16) map.setZoom(17);
    }
  }, [isNavigating, userLocation?.lat, userLocation?.lng, map, userLocation]);

  useEffect(() => {
    if (recenterKey && recenterKey > 0 && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    }
  }, [recenterKey, userLocation, map]);

  useEffect(() => {
    if (!fitSitesKey || lastFitSitesKey.current === fitSitesKey || isNavigating || focusedLocation) {
      return;
    }

    lastFitSitesKey.current = fitSitesKey;

    const sitePoints = sites
      .map((site) => getSiteCoordinates(site))
      .filter(({ lat, lng }) => isValidCoordinate(lat, lng))
      .map(({ lat, lng }) => [Number(lat), Number(lng)] as [number, number]);

    if (sitePoints.length === 0) {
      return;
    }

    if (sitePoints.length === 1) {
      map.setView(sitePoints[0], 16, { animate: true });
      return;
    }

    const bounds = L.latLngBounds(sitePoints);
    map.fitBounds(bounds, { padding: [100, 100], animate: true });
  }, [fitSitesKey, sites, isNavigating, focusedLocation, map]);

  useEffect(() => {
    if (focusedLocation && !isNavigating && isValidCoordinate(focusedLocation.lat, focusedLocation.lng)) {
      map.setView([focusedLocation.lat, focusedLocation.lng], 16, { animate: true });
    }
  }, [focusedLocation, isNavigating, map]);

  useEffect(() => {
    if (!isNavigating && !focusedLocation && routeCoords && routeCoords.length > 1) {
      const routePoints = routeCoords.filter(([lat, lng]) => isValidCoordinate(lat, lng));
      if (routePoints.length < 2) return;

      const bounds = L.latLngBounds(routePoints);
      sites.forEach((site) => {
        const { lat, lng } = getSiteCoordinates(site);
        if (isValidCoordinate(lat, lng)) {
          bounds.extend([Number(lat), Number(lng)]);
        }
      });

      map.fitBounds(bounds, { padding: [100, 100], animate: true });
    }
  }, [routeCoords, sites, isNavigating, focusedLocation, map]);

  return null;
}

export default function HeritageMap({ 
  userLocation, 
  sites, 
  itinerary, 
  routeCoords,
  totalTime,
  totalDist,
  onAddSite,
  onSelectSite,
  selectedSiteId,
  focusedLocation,
  isNavigating,
  recenterKey,
  fitSitesKey
}: HeritageMapProps) {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    setMounted(true);
  }, []);

  const userPulse = useMemo(() => createUserPulseIcon(), []);

  if (!mounted) return <div className="h-full w-full bg-slate-50" />;

  const defaultCenter: [number, number] = [10.3157, 123.8854]; 

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={13} 
        zoomControl={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          routeCoords={routeCoords} 
          sites={sites}
          focusedLocation={focusedLocation} 
          isNavigating={isNavigating}
          userLocation={userLocation}
          recenterKey={recenterKey}
          fitSitesKey={fitSitesKey}
        />

        {userLocation && isValidCoordinate(userLocation.lat, userLocation.lng) && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPulse}>
            <Popup>Your Location</Popup>
          </Marker>
        )}

        {sites.map((site) => {
          const { lat, lng } = getSiteCoordinates(site);

          if (!isValidCoordinate(lat, lng)) {
            return null;
          }

          const isInItinerary = itinerary.some(i => i.id === site.id);
          const isLastInItinerary = itinerary.length > 0 && itinerary[itinerary.length - 1].id === site.id;
          
          const markerIcon = createCategoryIcon(
            site.category,
            selectedSiteId === site.id || isLastInItinerary ? 'destination' : isInItinerary ? 'itinerary' : 'default'
          );

          return (
            <Marker 
              key={site.id} 
              position={[Number(lat), Number(lng)]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelectSite?.(site),
              }}
            >
              <Popup className="compact-popup">
                <div className="w-64 max-w-[calc(100vw-3rem)] overflow-hidden rounded-2xl bg-white shadow-xl">
                  {site.imageUrl && (
                    <div className="relative h-32 w-full">
                      <SafeImage src={site.imageUrl} alt={site.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 leading-tight mb-0.5">{site.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{site.city} • {site.category.split(' & ')[0]}</p>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{site.description}</p>
                    
                    {isAdmin && (site.needsVerification) && (
                      <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg text-amber-700 text-[8px] font-black uppercase">
                        <AlertCircle size={10} /> Needs Verification
                      </div>
                    )}

                    <div className="flex gap-2 pt-2 border-t">
                      <Button asChild size="sm" variant="outline" className="flex-1 h-8 text-[9px] font-black uppercase rounded-lg">
                        <Link href={`/site/${site.id}`}>Details</Link>
                      </Button>
                      <Button 
                        size="sm" 
                        variant={isInItinerary ? "secondary" : "default"}
                        className="flex-1 h-8 text-[9px] font-black uppercase rounded-lg"
                        onClick={() => onAddSite(site.id)}
                      >
                        {isInItinerary ? <Check size={12} /> : <Plus size={12} />} Route
                      </Button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routeCoords && routeCoords.length > 1 && (
          <Polyline 
            positions={routeCoords} 
            color="#10b981" 
            weight={8} 
            opacity={0.9}
            lineCap="round"
            lineJoin="round"
          >
            {totalTime && totalDist && (
              <Tooltip sticky direction="top" className="route-tooltip">
                <div className="flex items-center gap-2 p-1">
                  <Navigation size={12} className="text-primary" />
                  <span className="text-[10px] font-black">{Math.round(totalTime)} MIN • {totalDist.toFixed(1)} KM</span>
                </div>
              </Tooltip>
            )}
          </Polyline>
        )}
      </MapContainer>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Plus, Check, MapPin, Navigation, Info } from 'lucide-react';
import Image from 'next/image';

// Fix for default marker icons in NextJS
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const itineraryIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const createUserPulseIcon = () => L.divIcon({
  className: 'user-location-marker',
  html: `<div class="user-location-pulse"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HeritageMapProps {
  userLocation: { lat: number; lng: number } | null;
  sites: any[];
  itinerary: any[];
  routeCoordinates?: [number, number][];
  totalTime?: number;
  totalDist?: number;
  onAddSite: (id: string) => void;
  focusedLocation?: { lat: number; lng: number } | null;
  isNavigating?: boolean;
  cityTarget?: { lat: number; lng: number; zoom: number; timestamp: number } | null;
  recenterKey?: number;
}

function MapController({ 
  routeCoordinates,
  focusedLocation,
  isNavigating,
  userLocation,
  cityTarget,
  recenterKey
}: { 
  routeCoordinates?: [number, number][],
  focusedLocation?: { lat: number; lng: number } | null,
  isNavigating?: boolean,
  userLocation: { lat: number; lng: number } | null,
  cityTarget?: { lat: number; lng: number; zoom: number; timestamp: number } | null,
  recenterKey?: number
}) {
  const map = useMap();

  // 1. City Selection Centering (Triggered only when cityTarget.timestamp changes)
  useEffect(() => {
    if (cityTarget) {
      map.setView([cityTarget.lat, cityTarget.lng], cityTarget.zoom, { animate: true, duration: 1.5 });
    }
  }, [cityTarget?.timestamp, map]);

  // 2. Active Navigation Tracking
  useEffect(() => {
    if (isNavigating && userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 1 });
      if (map.getZoom() < 16) {
        map.setZoom(17, { animate: true });
      }
    }
  }, [isNavigating, userLocation?.lat, userLocation?.lng, map]);

  // 3. Recenter Manual Request
  useEffect(() => {
    if (recenterKey && recenterKey > 0 && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    }
  }, [recenterKey, userLocation, map]);

  // 4. Manually Focused Site
  useEffect(() => {
    if (focusedLocation) {
      map.setView([focusedLocation.lat, focusedLocation.lng], 16, { animate: true, duration: 1 });
    }
  }, [focusedLocation, map]);

  // 5. Initial Route View (Fit Bounds)
  useEffect(() => {
    if (!isNavigating && !focusedLocation && routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.polyline(routeCoordinates).getBounds();
      map.fitBounds(bounds, { 
        padding: [120, 120], 
        animate: true,
        duration: 1.5
      });
    }
  }, [routeCoordinates, isNavigating, focusedLocation, map]);

  return null;
}

export default function HeritageMap({ 
  userLocation, 
  sites, 
  itinerary, 
  routeCoordinates,
  totalTime,
  totalDist,
  onAddSite,
  focusedLocation,
  isNavigating,
  cityTarget,
  recenterKey
}: HeritageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userPulse = useMemo(() => createUserPulseIcon(), []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Mapping Heritage...</div>;

  const defaultCenter: [number, number] = [10.2936, 123.9019]; 
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={center} 
        zoom={14} 
        zoomControl={false} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController 
          routeCoordinates={routeCoordinates} 
          focusedLocation={focusedLocation} 
          isNavigating={isNavigating}
          userLocation={userLocation}
          cityTarget={cityTarget}
          recenterKey={recenterKey}
        />

        {userLocation && (
          <>
            <Circle 
              center={[userLocation.lat, userLocation.lng]} 
              radius={400} 
              pathOptions={{ fillColor: '#10b981', fillOpacity: 0.15, color: '#10b981', weight: 1, dashArray: '5, 5' }} 
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userPulse}>
              <Popup className="compact-popup">Your Location</Popup>
            </Marker>
          </>
        )}

        {sites.map((site) => {
          const isInItinerary = itinerary.some(i => i.id === site.id);
          const isLastInItinerary = itinerary.length > 0 && itinerary[itinerary.length - 1].id === site.id;
          
          let markerIcon = DefaultIcon;
          if (isLastInItinerary) markerIcon = destIcon;
          else if (isInItinerary) markerIcon = itineraryIcon;

          return (
            <Marker 
              key={site.id} 
              position={[site.coordinates?.lat || 0, site.coordinates?.lng || 0]}
              icon={markerIcon}
              opacity={isInItinerary ? 1 : 0.8}
            >
              <Popup className="modern-popup">
                <div className="w-72 overflow-hidden rounded-[1.5rem] bg-white p-0 shadow-2xl">
                  <div className="relative h-36 w-full overflow-hidden">
                    <img src={site.imageUrl} alt={site.name} className="h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-[8px] font-black uppercase tracking-widest mb-1 opacity-80">{site.city}</p>
                      <h3 className="font-black text-sm leading-tight line-clamp-1">{site.name}</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <p className="text-[11px] text-slate-500 line-clamp-2 font-medium leading-relaxed">{site.description}</p>
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                       <div className="flex flex-col">
                          <span className="text-[9px] font-black text-primary uppercase tracking-tighter flex items-center gap-1">
                            <Navigation size={10} /> Active Stop
                          </span>
                       </div>
                      <Button 
                        size="sm" 
                        variant={isInItinerary ? "secondary" : "default"}
                        className="h-9 rounded-2xl text-[10px] font-black uppercase tracking-widest px-5 shadow-lg shadow-primary/10"
                        onClick={() => onAddSite(site.id)}
                      >
                        {isInItinerary ? <><Check size={14} className="mr-1" /> Added</> : <><Plus size={14} className="mr-1" /> Add to Route</>}
                      </Button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {routeCoordinates && routeCoordinates.length > 1 && (
          <>
            <Polyline 
              positions={routeCoordinates} 
              color="#10b981" 
              weight={14} 
              opacity={0.15} 
              lineCap="round"
              lineJoin="round"
            />
            <Polyline 
              positions={routeCoordinates} 
              color="#10b981" 
              weight={7} 
              opacity={1} 
              lineCap="round"
              lineJoin="round"
              smoothFactor={1.2}
            >
              {totalTime && totalDist && (
                <Tooltip direction="top" offset={[0, -25]} permanent className="route-info-tooltip">
                  <div className="flex items-center gap-3">
                    <div className="p-1 bg-primary/10 rounded-lg text-primary">
                        <Navigation size={12} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-black text-sm">{Math.round(totalTime)} MIN</span>
                      <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">{totalDist.toFixed(1)} KM PATH</span>
                    </div>
                  </div>
                </Tooltip>
              )}
            </Polyline>
          </>
        )}
      </MapContainer>
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Plus, Check, MapPin } from 'lucide-react';

// Fix for default marker icons in NextJS
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
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
}

function MapController({ 
  center, 
  routeCoordinates,
  focusedLocation
}: { 
  center: [number, number], 
  routeCoordinates?: [number, number][],
  focusedLocation?: { lat: number; lng: number } | null
}) {
  const map = useMap();

  useEffect(() => {
    if (focusedLocation) {
      map.setView([focusedLocation.lat, focusedLocation.lng], 16, { animate: true, duration: 1 });
    } else if (routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.polyline(routeCoordinates).getBounds();
      map.fitBounds(bounds, { 
        padding: [100, 100], 
        animate: true,
        duration: 1.5
      });
    } else if (center) {
      map.setView(center, 14, { animate: true, duration: 1 });
    }
  }, [center, routeCoordinates, focusedLocation, map]);

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
  focusedLocation
}: HeritageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userPulse = useMemo(() => createUserPulseIcon(), []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">Initializing Mapping Engine...</div>;

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
        
        <MapController center={center} routeCoordinates={routeCoordinates} focusedLocation={focusedLocation} />

        {userLocation && (
          <>
            <Circle 
              center={[userLocation.lat, userLocation.lng]} 
              radius={300} 
              pathOptions={{ fillColor: '#10b981', fillOpacity: 0.15, color: '#10b981', weight: 1, dashArray: '5, 5' }} 
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userPulse}>
              <Popup>Current Location</Popup>
            </Marker>
          </>
        )}

        {sites.map((site) => {
          const isInItinerary = itinerary.some(i => i.id === site.id);
          const isDestination = itinerary.length > 0 && itinerary[itinerary.length - 1].id === site.id;
          
          let markerIcon = DefaultIcon;
          if (isDestination) markerIcon = destIcon;
          else if (isInItinerary) markerIcon = selectedIcon;

          return (
            <Marker 
              key={site.id} 
              position={[site.coordinates?.lat || 0, site.coordinates?.lng || 0]}
              icon={markerIcon}
              opacity={isInItinerary ? 1 : 0.7}
            >
              <Popup className="custom-map-popup">
                <div className="w-64 overflow-hidden rounded-2xl bg-white p-0">
                  <div className="relative h-32 w-full overflow-hidden">
                    <img src={site.imageUrl} alt={site.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-black text-sm leading-tight line-clamp-1">{site.name}</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <p className="text-[11px] text-slate-500 line-clamp-2 font-medium leading-relaxed">{site.description}</p>
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-50">
                       <span className="text-[10px] font-black text-primary uppercase tracking-tighter flex items-center gap-1">
                        <MapPin size={10} /> {site.city}
                      </span>
                      <Button 
                        size="sm" 
                        variant={isInItinerary ? "secondary" : "default"}
                        className="h-8 rounded-full text-[10px] font-black uppercase tracking-widest px-4"
                        onClick={() => onAddSite(site.id)}
                      >
                        {isInItinerary ? <><Check size={12} className="mr-1" /> Added</> : <><Plus size={12} className="mr-1" /> Add to Route</>}
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
              weight={12} 
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
              smoothFactor={1}
            >
              {totalTime && totalDist && (
                <Tooltip direction="top" offset={[0, -20]} permanent className="route-info-tooltip">
                  <div className="flex flex-col items-center">
                    <span className="text-primary font-black text-[9px] uppercase tracking-widest mb-0.5">Route Path</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-900 font-black">{Math.round(totalTime)} MIN</span>
                      <span className="text-slate-400 text-[10px] font-bold">({totalDist.toFixed(1)} KM)</span>
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

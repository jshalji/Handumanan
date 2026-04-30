'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Plus, Check, Navigation, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

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

  useEffect(() => {
    if (cityTarget) {
      map.setView([cityTarget.lat, cityTarget.lng], cityTarget.zoom, { animate: true, duration: 1.5 });
    }
  }, [cityTarget?.timestamp, map]);

  useEffect(() => {
    if (isNavigating && userLocation) {
      map.panTo([userLocation.lat, userLocation.lng], { animate: true, duration: 1 });
      if (map.getZoom() < 16) map.setZoom(17);
    }
  }, [isNavigating, userLocation?.lat, userLocation?.lng, map]);

  useEffect(() => {
    if (recenterKey && recenterKey > 0 && userLocation) {
      map.setView([userLocation.lat, userLocation.lng], 17, { animate: true });
    }
  }, [recenterKey, userLocation, map]);

  useEffect(() => {
    if (focusedLocation) {
      map.setView([focusedLocation.lat, focusedLocation.lng], 16, { animate: true });
    }
  }, [focusedLocation, map]);

  useEffect(() => {
    if (!isNavigating && !focusedLocation && routeCoordinates && routeCoordinates.length > 1) {
      const bounds = L.polyline(routeCoordinates).getBounds();
      map.fitBounds(bounds, { padding: [100, 100], animate: true });
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
          routeCoordinates={routeCoordinates} 
          focusedLocation={focusedLocation} 
          isNavigating={isNavigating}
          userLocation={userLocation}
          cityTarget={cityTarget}
          recenterKey={recenterKey}
        />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userPulse}>
            <Popup>Your Location</Popup>
          </Marker>
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
              position={[site.coordinates.lat, site.coordinates.lng]}
              icon={markerIcon}
            >
              <Popup className="compact-popup">
                <div className="w-64 overflow-hidden rounded-2xl bg-white shadow-xl">
                  {site.imageUrl && (
                    <div className="relative h-32 w-full">
                      <img src={site.imageUrl} alt={site.name} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-black text-sm text-slate-900 leading-tight mb-0.5">{site.name}</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{site.city} • {site.category.split(' & ')[0]}</p>
                    </div>
                    
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{site.description}</p>
                    
                    {isAdmin && site.needsVerification && (
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

        {routeCoordinates && routeCoordinates.length > 1 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#10b981" 
            weight={6} 
            opacity={0.8}
            lineCap="round"
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

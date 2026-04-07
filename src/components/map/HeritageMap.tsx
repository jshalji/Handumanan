'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, Circle, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Modern User Location Marker (Blue Dot)
const createUserDotIcon = () => L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative flex h-5 w-5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-lg"></span>
        </div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Destination Icon
const destIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HeritageMapProps {
  userLocation: { lat: number; lng: number } | null;
  sites: any[];
  itinerary: any[];
  routeCoordinates?: [number, number][];
  totalTime?: number;
  totalDist?: number;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom(), { animate: true });
  }, [center, zoom, map]);
  return null;
}

export default function HeritageMap({ 
  userLocation, 
  sites, 
  itinerary, 
  routeCoordinates,
  totalTime,
  totalDist
}: HeritageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const userDot = useMemo(() => createUserDotIcon(), []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Initializing Map...</div>;

  const defaultCenter: [number, number] = [10.2936, 123.9019]; 
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={center} zoom={14} zoomControl={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} />

        {userLocation && (
          <>
            <Circle 
              center={[userLocation.lat, userLocation.lng]} 
              radius={100} 
              pathOptions={{ fillColor: '#3b82f6', fillOpacity: 0.1, color: '#3b82f6', weight: 1 }} 
            />
            <Marker position={[userLocation.lat, userLocation.lng]} icon={userDot}>
              <Popup>Your current location</Popup>
            </Marker>
          </>
        )}

        {sites.map((site) => (
          <Marker 
            key={site.id} 
            position={[site.coordinates?.lat || 0, site.coordinates?.lng || 0]}
            icon={itinerary.some(i => i.id === site.id) ? destIcon : DefaultIcon}
          >
            <Popup className="custom-map-popup">
              <div className="w-48 overflow-hidden rounded-xl">
                <img src={site.imageUrl} alt={site.name} className="w-full h-28 object-cover" />
                <div className="p-3">
                  <h3 className="font-bold text-sm mb-1 leading-tight">{site.name}</h3>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{site.description}</p>
                  <div className="flex justify-between items-center mt-3 pt-2 border-t">
                    <span className="text-[10px] font-bold text-primary">{site.distance?.toFixed(1)} km</span>
                    <a href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">View Site</a>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Modern Route Visualization */}
        {routeCoordinates && routeCoordinates.length > 1 && (
          <>
            {/* Alternative Route Shadow */}
            <Polyline 
              positions={routeCoordinates} 
              color="#3b82f6" 
              weight={12} 
              opacity={0.15} 
              lineCap="round"
              lineJoin="round"
            />
            {/* Main Active Route */}
            <Polyline 
              positions={routeCoordinates} 
              color="#4f46e5" 
              weight={7} 
              opacity={0.9} 
              lineCap="round"
              lineJoin="round"
            >
              {totalTime && totalDist && (
                <Tooltip direction="top" offset={[0, -10]} permanent className="route-info-tooltip">
                  <div className="flex items-center gap-2 px-1">
                    <span className="font-bold text-slate-900">{Math.round(totalTime)} min</span>
                    <span className="text-slate-500">({totalDist.toFixed(1)} km)</span>
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

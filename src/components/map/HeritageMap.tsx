
'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { HeritageSite } from '@/lib/heritage-data';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const UserIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface HeritageMapProps {
  userLocation: { lat: number; lng: number } | null;
  sites: (HeritageSite & { distance: number })[];
  itinerary: HeritageSite[];
}

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function HeritageMap({ userLocation, sites, itinerary }: HeritageMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-slate-400">Loading Map...</div>;

  const defaultCenter: [number, number] = [10.2936, 123.9019]; // Cebu City Hall
  const center: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  // Polyline for itinerary route
  const routePositions: [number, number][] = userLocation 
    ? [[userLocation.lat, userLocation.lng], ...itinerary.map(s => [s.coordinates.lat, s.coordinates.lng] as [number, number])]
    : itinerary.map(s => [s.coordinates.lat, s.coordinates.lng] as [number, number]);

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ChangeView center={center} />

        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
            <Popup>
              <div className="font-bold p-1">You are here</div>
            </Popup>
          </Marker>
        )}

        {sites.map((site) => (
          <Marker key={site.id} position={[site.coordinates.lat, site.coordinates.lng]}>
            <Popup>
              <div className="w-48 p-3">
                <img src={site.imageUrl} alt={site.name} className="w-full h-24 object-cover rounded-md mb-2" />
                <h3 className="font-bold text-sm mb-1">{site.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-1">{site.description}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-[10px] font-bold text-primary uppercase">{site.distance.toFixed(1)} km away</span>
                  <a href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 hover:underline">Details</a>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {itinerary.length > 0 && (
          <Polyline positions={routePositions} color="blue" weight={3} opacity={0.5} dashArray="10, 10" />
        )}
      </MapContainer>
    </div>
  );
}

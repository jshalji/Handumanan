
'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES, type HeritageSite } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Loader2, Sparkles, Clock, ArrowRight, Info, Plus, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Dynamic import for Map to avoid SSR issues with Leaflet
const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center">Loading Map Interface...</div>
});

interface SiteWithDistance extends HeritageSite {
  distance: number;
}

export default function DiscoverPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);

  // Default to Cebu City Hall if location isn't detected
  const defaultLocation = { lat: 10.2936, lng: 123.9019 };

  const detectLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
    } catch (err: any) {
      setError("Could not detect location. Using Cebu City Center as default.");
      setUserLocation(defaultLocation);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distances for all sites based on current location
  const sortedSites = useMemo(() => {
    const loc = userLocation || defaultLocation;
    return HERITAGE_SITES.map(site => ({
      ...site,
      distance: calculateDistance(loc.lat, loc.lng, site.coordinates.lat, site.coordinates.lng)
    })).sort((a, b) => a.distance - b.distance);
  }, [userLocation]);

  const nearbySites = sortedSites.slice(0, 10);

  // Manual itinerary management
  const toggleItinerary = (id: string) => {
    setItineraryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const manualItinerary = useMemo(() => {
    return sortedSites.filter(site => itineraryIds.includes(site.id));
  }, [itineraryIds, sortedSites]);

  // Smart optimized itinerary (Nearest Neighbor)
  const smartItinerary = useMemo(() => {
    const itinerary: SiteWithDistance[] = [];
    const pool = [...sortedSites];
    let currentPoint = userLocation || defaultLocation;

    // Pick 5 stops using a greedy approach
    for (let i = 0; i < 5; i++) {
      if (pool.length === 0) break;
      
      pool.sort((a, b) => {
        const distA = calculateDistance(currentPoint.lat, currentPoint.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(currentPoint.lat, currentPoint.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });

      const nextSite = pool.shift()!;
      itinerary.push(nextSite);
      currentPoint = nextSite.coordinates;
    }
    return itinerary;
  }, [userLocation, sortedSites]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Side: Sidebar for list and itinerary */}
        <div className="w-full md:w-1/3 border-r bg-white flex flex-col z-10 shadow-lg">
          <div className="p-6 border-b bg-primary/5">
            <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
              <Navigation size={24} /> Discover Nearby
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Explore Metro Cebu heritage from your position.</p>
            
            <div className="mt-4 space-y-3">
              <Button 
                onClick={detectLocation} 
                disabled={loading} 
                className="w-full rounded-full shadow-md"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                {userLocation ? 'Update My Location' : 'Detect My Location'}
              </Button>
              {error && <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 rounded border border-amber-100">{error}</p>}
            </div>
          </div>

          <Tabs defaultValue="nearby" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-10">
              <TabsTrigger value="nearby">Nearby Sites</TabsTrigger>
              <TabsTrigger value="itinerary">Itinerary ({itineraryIds.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  {nearbySites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                          <div className="absolute top-1 left-1">
                            <Badge className="bg-white/90 text-primary text-[10px] px-1.5 h-4">{site.distance.toFixed(1)} km</Badge>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{site.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                              Details <ArrowRight size={10} />
                            </Link>
                            <Button 
                              size="sm" 
                              variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                              className="h-6 px-2 text-[10px] rounded-full"
                              onClick={() => toggleItinerary(site.id)}
                            >
                              {itineraryIds.includes(site.id) ? <Check size={10} className="mr-1" /> : <Plus size={10} className="mr-1" />}
                              {itineraryIds.includes(site.id) ? "Added" : "Add to Trip"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="itinerary" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                {itineraryIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                    <Sparkles size={48} className="mb-4 text-slate-300" />
                    <p className="text-sm font-medium">Your itinerary is empty.</p>
                    <p className="text-xs text-muted-foreground mt-1">Add sites from the list or map.</p>
                    <Button 
                      variant="link" 
                      className="mt-4 text-primary text-xs" 
                      onClick={() => setItineraryIds(smartItinerary.map(s => s.id))}
                    >
                      Generate Auto Route
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 relative">
                    <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-100" />
                    {manualItinerary.map((site, idx) => (
                      <div key={site.id} className="flex gap-4 relative">
                        <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold z-10 shadow-sm">
                          {idx + 1}
                        </div>
                        <Card className="flex-1 border-none shadow-sm p-4 hover:bg-slate-50 transition-colors">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm">{site.name}</h4>
                            <button onClick={() => toggleItinerary(site.id)} className="text-slate-400 hover:text-red-500">
                              <Info size={14} />
                            </button>
                          </div>
                          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={10} /> 45m visit</span>
                            <span className="flex items-center gap-1"><Navigation size={10} /> {site.distance.toFixed(1)} km away</span>
                          </div>
                        </Card>
                      </div>
                    ))}
                    <div className="pt-4 border-t">
                      <div className="flex justify-between items-center text-sm font-bold">
                        <span>Total Distance</span>
                        <span className="text-primary">{manualItinerary.reduce((acc, curr) => acc + curr.distance, 0).toFixed(1)} km</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 italic">Est. travel time: ~{Math.round(manualItinerary.reduce((acc, curr) => acc + curr.distance, 0) * 4)} minutes driving</p>
                    </div>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Side: Real-time Map */}
        <div className="flex-1 h-full relative">
          <HeritageMap 
            userLocation={userLocation} 
            sites={nearbySites} 
            itinerary={manualItinerary} 
          />
          
          {/* Map Overlay Controls */}
          <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
            <Button size="icon" className="bg-white text-slate-800 hover:bg-slate-100 shadow-xl border" onClick={detectLocation}>
              <Navigation size={20} />
            </Button>
          </div>
          
          {!userLocation && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl flex items-center gap-2 animate-bounce">
              <Info size={14} /> Click "Detect My Location" to start tracking
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

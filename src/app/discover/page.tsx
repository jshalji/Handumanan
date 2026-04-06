'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRoute } from '@/lib/routing-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Loader2, Sparkles, Clock, ArrowRight, Info, Plus, Check, Route, Map as MapIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

// Dynamic import for Map to avoid SSR issues with Leaflet
const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center">Loading Interactive Map...</div>
});

export default function ExploreRoutePage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);

  const db = useFirestore();
  const sitesRef = useMemoFirebase(() => collection(db, 'heritageSites'), [db]);
  const { data: dbSites } = useCollection(sitesRef);

  // Fallback to static data if Firestore is empty during prototype
  const allSites = useMemo(() => {
    if (dbSites && dbSites.length > 0) {
      return dbSites.map(s => ({
        ...s,
        coordinates: s.latitude && s.longitude ? { lat: s.latitude, lng: s.longitude } : (HERITAGE_SITES.find(hs => hs.id === s.id)?.coordinates || { lat: 0, lng: 0 })
      }));
    }
    return HERITAGE_SITES;
  }, [dbSites]);

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

  // Detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const sortedSites = useMemo(() => {
    const loc = userLocation || defaultLocation;
    return allSites.map(site => ({
      ...site,
      distance: calculateDistance(loc.lat, loc.lng, site.coordinates.lat, site.coordinates.lng)
    })).sort((a, b) => a.distance - b.distance);
  }, [userLocation, allSites]);

  const nearbySites = sortedSites.slice(0, 10);

  const toggleItinerary = (id: string) => {
    setItineraryIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const manualItinerary = useMemo(() => {
    // Keep the order the user added them, or sort by distance if auto-planned
    return itineraryIds.map(id => sortedSites.find(site => site.id === id)).filter(Boolean) as any[];
  }, [itineraryIds, sortedSites]);

  // Auto Planner Logic: Select 3-5 nearest sites and order by proximity
  const generateSmartItinerary = () => {
    const itinerary = [];
    const pool = [...sortedSites];
    let currentPoint = userLocation || defaultLocation;

    // Pick top 5 nearest sequentially (Greedy Nearest Neighbor)
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
    setItineraryIds(itinerary.map(s => s.id));
    setRouteCoords([]); // Reset route when itinerary changes
  };

  // Real-time Street Route Generation
  const handleGenerateRoute = async () => {
    if (manualItinerary.length === 0 || !userLocation) return;
    
    setIsPlanningRoute(true);
    let fullRoute: [number, number][] = [];
    let start = userLocation;

    // Build the sequential route: User -> Site 1 -> Site 2 -> ...
    for (const site of manualItinerary) {
      const routeData = await getRoute(start, site.coordinates);
      if (routeData) {
        fullRoute = [...fullRoute, ...routeData.coordinates];
        start = site.coordinates; // Next leg starts from current site
      } else {
        // Fallback to straight line if API fails
        fullRoute.push([start.lat, start.lng], [site.coordinates.lat, site.coordinates.lng]);
        start = site.coordinates;
      }
    }
    
    setRouteCoords(fullRoute);
    setIsPlanningRoute(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Discovery & Itinerary */}
        <div className="w-full md:w-1/3 border-r bg-white flex flex-col z-10 shadow-lg">
          <div className="p-6 border-b bg-primary/5">
            <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
              <MapIcon size={24} /> Explore & Route
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Discover nearby heritage and plan your path.</p>
            
            <div className="mt-4 flex gap-2">
              <Button 
                onClick={detectLocation} 
                disabled={loading} 
                variant="outline"
                className="flex-1 rounded-full text-xs h-9"
              >
                {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <MapPin className="mr-2 h-3 w-3" />}
                Relocate
              </Button>
              <Button 
                onClick={generateSmartItinerary}
                className="flex-1 rounded-full text-xs h-9 shadow-sm"
              >
                <Sparkles className="mr-2 h-3 w-3" /> Auto-Plan
              </Button>
            </div>
          </div>

          <Tabs defaultValue="nearby" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-10">
              <TabsTrigger value="nearby">Discovery</TabsTrigger>
              <TabsTrigger value="itinerary">Your Route ({itineraryIds.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="nearby" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Heritage Sites Near You</h3>
                  {nearbySites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image 
                            src={site.imageUrl} 
                            alt={site.name} 
                            fill 
                            className="object-cover"
                            sizes="96px"
                          />
                          <div className="absolute top-1 left-1">
                            <Badge className="bg-white/90 text-primary text-[10px] px-1.5 h-4 border-none shadow-sm">
                              {site.distance.toFixed(1)} km
                            </Badge>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{site.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-0.5">
                              View <ArrowRight size={10} />
                            </Link>
                            <Button 
                              size="sm" 
                              variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                              className="h-6 px-2 text-[10px] rounded-full"
                              onClick={() => toggleItinerary(site.id)}
                            >
                              {itineraryIds.includes(site.id) ? "In Route" : "+ Add"}
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
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <Sparkles size={48} className="mb-4 text-slate-300" />
                      <p className="text-sm font-medium">No sites added to your route yet.</p>
                      <p className="text-xs text-muted-foreground mt-2">Add sites from the Discovery tab or use Auto-Plan.</p>
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
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm">{site.name}</h4>
                              <button onClick={() => toggleItinerary(site.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                <Plus size={14} className="rotate-45" />
                              </button>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-1">
                              <span className="flex items-center gap-1"><Clock size={10} /> ~45m visit</span>
                              <span className="flex items-center gap-1"><MapPin size={10} /> {site.distance.toFixed(1)} km from you</span>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                {itineraryIds.length > 0 && (
                  <div className="p-6 border-t bg-slate-50">
                    <Button 
                      className="w-full rounded-full shadow-lg h-12 gap-2 text-sm font-bold" 
                      onClick={handleGenerateRoute}
                      disabled={isPlanningRoute}
                    >
                      {isPlanningRoute ? (
                        <>
                          <Loader2 className="animate-spin" size={18} />
                          Mapping Street Route...
                        </>
                      ) : (
                        <>
                          <Route size={18} />
                          Generate Route Navigation
                        </>
                      )}
                    </Button>
                    <div className="mt-4 flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      <span>Total Stops: {itineraryIds.length}</span>
                      <span>Estimated Tour: {itineraryIds.length * 50} mins</span>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Interactive Map */}
        <div className="flex-1 h-full relative">
          <HeritageMap 
            userLocation={userLocation} 
            sites={nearbySites} 
            itinerary={manualItinerary}
            routeCoordinates={routeCoords}
          />
          
          <div className="absolute top-6 right-6 z-[1000] flex flex-col gap-2">
            <Button 
              size="icon" 
              className="bg-white text-slate-800 hover:bg-slate-100 shadow-xl border h-10 w-10" 
              onClick={detectLocation}
              title="Recenter Map"
            >
              <Navigation size={20} />
            </Button>
          </div>

          {error && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-red-50 text-red-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-red-100">
              {error}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

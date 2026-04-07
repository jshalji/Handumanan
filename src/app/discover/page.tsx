'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRoute, type RouteData, type RouteStep } from '@/lib/routing-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, Navigation, Loader2, Sparkles, Clock, ArrowRight, Route as RouteIcon, Map as MapIcon, ChevronRight, ListOrdered } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

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
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);

  const db = useFirestore();
  const sitesRef = useMemoFirebase(() => collection(db, 'heritageSites'), [db]);
  const { data: dbSites } = useCollection(sitesRef);

  const allSites = useMemo(() => {
    if (dbSites && dbSites.length > 0) {
      return dbSites.map(s => ({
        ...s,
        coordinates: s.latitude && s.longitude ? { lat: s.latitude, lng: s.longitude } : (HERITAGE_SITES.find(hs => hs.id === s.id)?.coordinates || { lat: 0, lng: 0 })
      }));
    }
    return HERITAGE_SITES;
  }, [dbSites]);

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
    setItineraryIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      // Reset routing state when selection changes
      setRouteCoords([]);
      setRouteSteps([]);
      return newIds;
    });
  };

  const manualItinerary = useMemo(() => {
    return itineraryIds.map(id => sortedSites.find(site => site.id === id)).filter(Boolean) as any[];
  }, [itineraryIds, sortedSites]);

  const handleGenerateRoute = async () => {
    if (manualItinerary.length === 0 || !userLocation) return;
    
    setIsPlanningRoute(true);
    let fullRoute: [number, number][] = [];
    let allSteps: RouteStep[] = [];
    let cumulativeDist = 0;
    let cumulativeTime = 0;
    let start = userLocation;

    for (const site of manualItinerary) {
      const routeData = await getRoute(start, site.coordinates);
      if (routeData) {
        fullRoute = [...fullRoute, ...routeData.coordinates];
        allSteps = [...allSteps, { instruction: `Arriving at ${site.name}`, distance: 0, duration: 0 } as any, ...routeData.steps];
        cumulativeDist += routeData.distance;
        cumulativeTime += routeData.duration;
        start = site.coordinates;
      } else {
        fullRoute.push([start.lat, start.lng], [site.coordinates.lat, site.coordinates.lng]);
        start = site.coordinates;
      }
    }
    
    setRouteCoords(fullRoute);
    setRouteSteps(allSteps);
    setTotalDist(cumulativeDist);
    setTotalTime(cumulativeTime);
    setIsPlanningRoute(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left Panel: Discovery & Navigation */}
        <div className="w-full md:w-1/3 border-r bg-white flex flex-col z-10 shadow-lg">
          <div className="p-6 border-b bg-primary/5">
            <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-2">
              <Navigation size={24} /> In-App Navigation
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Real-time routing within Metro Cebu.</p>
            
            <div className="mt-4 flex gap-2">
              <Button onClick={detectLocation} disabled={loading} variant="outline" className="flex-1 rounded-full text-xs h-9">
                {loading ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <MapPin className="mr-2 h-3 w-3" />}
                Recenter
              </Button>
              <Button onClick={() => { setItineraryIds(sortedSites.slice(0, 4).map(s => s.id)); setRouteCoords([]); }} className="flex-1 rounded-full text-xs h-9 shadow-sm">
                <Sparkles className="mr-2 h-3 w-3" /> Auto-Select
              </Button>
            </div>
          </div>

          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-10">
              <TabsTrigger value="discovery">Sites</TabsTrigger>
              <TabsTrigger value="navigation">Navigation {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  {nearbySites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="96px" />
                          <Badge className="absolute top-1 left-1 bg-white/90 text-primary text-[10px] px-1.5 h-4 border-none">{site.distance.toFixed(1)} km</Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">{site.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 flex items-center gap-0.5">Details <ArrowRight size={10} /></Link>
                            <Button size="sm" variant={itineraryIds.includes(site.id) ? "default" : "outline"} className="h-6 px-2 text-[10px] rounded-full" onClick={() => toggleItinerary(site.id)}>
                              {itineraryIds.includes(site.id) ? "Selected" : "Add"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="navigation" className="flex-1 overflow-hidden p-0 m-0">
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                      <MapIcon size={48} className="mb-4 text-slate-300" />
                      <p className="text-sm font-medium">No sites selected for your route.</p>
                      <p className="text-xs text-muted-foreground mt-2">Select sites from the Sites tab to begin navigation.</p>
                    </div>
                  ) : routeSteps.length > 0 ? (
                    <div className="space-y-4">
                      <div className="bg-primary/5 p-4 rounded-xl mb-6">
                        <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-primary mb-2">
                          <span>Route Overview</span>
                          <span className="flex items-center gap-1"><Clock size={12} /> {Math.round(totalTime)} mins</span>
                        </div>
                        <p className="text-sm font-medium">Estimated Distance: {totalDist.toFixed(1)} km</p>
                      </div>
                      
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Turn-by-Turn Instructions</h4>
                        {routeSteps.map((step, idx) => (
                          <div key={idx} className="flex gap-3 items-start p-2 border-b last:border-0 hover:bg-slate-50 transition-colors">
                            <div className="mt-1">
                              {step.instruction.includes('Arriving') ? <MapPin size={14} className="text-primary" /> : <ChevronRight size={14} className="text-slate-400" />}
                            </div>
                            <div className="flex-1">
                              <p className={`text-sm ${step.instruction.includes('Arriving') ? 'font-bold text-primary' : 'text-slate-700'}`}>
                                {step.instruction.replace(/<[^>]*>?/gm, '')}
                              </p>
                              {step.distance > 0 && (
                                <p className="text-[10px] text-muted-foreground mt-0.5">{Math.round(step.distance)} meters</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Current Stop Sequence</h4>
                      {manualItinerary.map((site, idx) => (
                        <div key={site.id} className="flex gap-4 items-center">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{idx + 1}</div>
                          <div className="flex-1 text-sm font-medium">{site.name}</div>
                          <button onClick={() => toggleItinerary(site.id)} className="text-slate-300 hover:text-red-500">×</button>
                        </div>
                      ))}
                      <Button className="w-full mt-6 rounded-full h-11" onClick={handleGenerateRoute} disabled={isPlanningRoute}>
                        {isPlanningRoute ? <><Loader2 className="animate-spin mr-2" /> Calculating...</> : <><RouteIcon className="mr-2" size={16} /> Start Navigation</>}
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel: Interactive Map */}
        <div className="flex-1 h-full relative">
          <HeritageMap userLocation={userLocation} sites={nearbySites} itinerary={manualItinerary} routeCoordinates={routeCoords} />
          {routeSteps.length > 0 && (
            <div className="absolute bottom-6 left-6 right-6 md:left-auto md:w-64 bg-white/90 backdrop-blur p-4 rounded-2xl shadow-2xl border border-primary/10 z-[1000] animate-in fade-in slide-in-from-bottom-4">
              <p className="text-[10px] font-bold text-primary uppercase mb-1">Active Navigation</p>
              <h4 className="text-sm font-bold flex items-center justify-between">
                To {manualItinerary[manualItinerary.length - 1]?.name}
                <Badge variant="outline" className="text-[10px]">{Math.round(totalTime)}m</Badge>
              </h4>
              <Button size="sm" variant="ghost" className="w-full h-8 mt-2 text-xs text-red-500 hover:bg-red-50" onClick={() => { setRouteCoords([]); setRouteSteps([]); }}>Cancel Route</Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

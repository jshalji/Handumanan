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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Route as RouteIcon, 
  Map as MapIcon, 
  ChevronRight, 
  Search,
  Fuel,
  Hotel,
  Utensils,
  Maximize2,
  LocateFixed
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center">Loading Maps...</div>
});

const QUICK_FILTERS = [
  { label: 'Gas', icon: Fuel },
  { label: 'Hotels', icon: Hotel },
  { label: 'Restaurants', icon: Utensils },
];

export default function ExploreRoutePage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [travelMode, setTravelMode] = useState<'driving-car' | 'foot-walking'>('driving-car');

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
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
    } catch (err) {
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

  const nearbySites = sortedSites.slice(0, 15);

  const toggleItinerary = (id: string) => {
    setItineraryIds(prev => {
      const newIds = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
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
      const routeData = await getRoute(start, site.coordinates, travelMode);
      if (routeData) {
        fullRoute = [...fullRoute, ...routeData.coordinates];
        allSteps = [...allSteps, { instruction: `Arrive at ${site.name}`, distance: 0, duration: 0 } as any, ...routeData.steps];
        cumulativeDist += routeData.distance;
        cumulativeTime += routeData.duration;
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
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Navigation Search & Filter Bar (Overlay on Map) */}
        <div className="absolute top-4 left-4 right-4 md:left-[35%] md:right-4 z-[1000] flex flex-col gap-3 pointer-events-none">
          <div className="flex gap-2 pointer-events-auto">
            <div className="flex-1 relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary" size={18} />
              <Input 
                placeholder="Search heritage sites or along route..." 
                className="pl-10 h-12 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-md w-full focus:ring-2 ring-primary/20"
              />
            </div>
            <Button size="icon" className="h-12 w-12 rounded-2xl shadow-xl bg-white text-slate-600 hover:bg-slate-50 border-none" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
            </Button>
          </div>
          
          <div className="flex gap-2 pointer-events-auto overflow-x-auto pb-2 scrollbar-hide">
            {QUICK_FILTERS.map((filter) => (
              <Button key={filter.label} variant="secondary" className="rounded-full bg-white/90 backdrop-blur-sm border shadow-sm hover:shadow-md h-9 px-4 text-xs font-bold gap-2">
                <filter.icon size={14} className="text-primary" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sidebar Panel */}
        <div className="w-full md:w-[32%] border-r bg-white flex flex-col z-20 shadow-2xl transition-all">
          <div className="p-6 border-b bg-gradient-to-br from-primary/5 to-transparent">
            <h1 className="font-headline text-2xl font-bold text-primary flex items-center gap-3">
              <Navigation size={26} className="text-primary" /> Route Planner
            </h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-bold opacity-70">Metro Cebu Cultural Mapping</p>
            
            <div className="mt-6 flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => setTravelMode('driving-car')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${travelMode === 'driving-car' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                Driving
              </button>
              <button 
                onClick={() => setTravelMode('foot-walking')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${travelMode === 'foot-walking' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                Walking
              </button>
            </div>
          </div>

          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-11 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="discovery" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs">Explore</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary font-bold text-xs">Navigation {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  {nearbySites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="flex">
                        <div className="relative w-28 h-28 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" sizes="112px" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                          <Badge className="absolute bottom-2 left-2 bg-white/90 text-primary text-[10px] px-1.5 h-4 border-none font-bold">
                            {site.distance.toFixed(1)} km
                          </Badge>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-60 mt-0.5">{site.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <Link href={`/site/${site.id}`} className="text-[10px] font-bold text-blue-600 flex items-center gap-1 hover:gap-2 transition-all">
                              View <ArrowRight size={10} />
                            </Link>
                            <Button 
                              size="sm" 
                              variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                              className={`h-7 px-3 text-[10px] rounded-full font-bold shadow-sm ${itineraryIds.includes(site.id) ? 'bg-primary' : 'border-primary/20 hover:bg-primary/5'}`}
                              onClick={() => toggleItinerary(site.id)}
                            >
                              {itineraryIds.includes(site.id) ? "Added" : "Add to Route"}
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
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <MapIcon size={56} className="mb-4 text-slate-300" />
                      <p className="text-sm font-bold text-slate-600">No sites selected</p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">Select heritage sites from the Explore tab to start your journey.</p>
                    </div>
                  ) : routeSteps.length > 0 ? (
                    <div className="space-y-6">
                      <div className="bg-primary p-5 rounded-2xl text-white shadow-xl shadow-primary/20">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80 mb-3">
                          <span>Active Trip</span>
                          <span className="flex items-center gap-1.5 bg-white/20 px-2 py-0.5 rounded-full"><Clock size={12} /> {Math.round(totalTime)} min</span>
                        </div>
                        <h4 className="text-xl font-bold leading-tight">Navigating through {itineraryIds.length} stops</h4>
                        <p className="text-sm opacity-90 mt-1 font-medium">{totalDist.toFixed(1)} km total distance</p>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full mt-4 h-9 text-xs text-white bg-white/10 hover:bg-white/20 border-none rounded-xl"
                          onClick={() => { setRouteCoords([]); setRouteSteps([]); }}
                        >
                          Reset Route
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Maneuvers</h4>
                        <div className="relative pl-2">
                          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100" />
                          {routeSteps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 items-start mb-6 last:mb-0 relative z-10">
                              <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center border-2 bg-white ${step.instruction.includes('Arrive') ? 'border-primary text-primary' : 'border-slate-200 text-slate-400'}`}>
                                {step.instruction.includes('Arrive') ? <MapPin size={12} fill="currentColor" /> : <ChevronRight size={12} />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm leading-tight ${step.instruction.includes('Arrive') ? 'font-bold text-slate-900' : 'text-slate-600 font-medium'}`}>
                                  {step.instruction.replace(/<[^>]*>?/gm, '')}
                                </p>
                                {step.distance > 0 && (
                                  <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                                    {Math.round(step.distance)} meters &bull; {Math.round(step.duration / 60)} min
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Stop sequence</h4>
                        <div className="space-y-3">
                          {manualItinerary.map((site, idx) => (
                            <div key={site.id} className="flex gap-4 items-center group">
                              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                              <div className="flex-1 text-sm font-bold text-slate-700 truncate">{site.name}</div>
                              <button onClick={() => toggleItinerary(site.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                <Maximize2 size={14} className="rotate-45" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-bold text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-3 transition-all active:scale-[0.98]" 
                        onClick={handleGenerateRoute} 
                        disabled={isPlanningRoute}
                      >
                        {isPlanningRoute ? (
                          <><Loader2 className="animate-spin" size={20} /> Mapping Route...</>
                        ) : (
                          <><RouteIcon size={22} /> Start Journey</>
                        )}
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
          <HeritageMap 
            userLocation={userLocation} 
            sites={nearbySites} 
            itinerary={manualItinerary} 
            routeCoordinates={routeCoords} 
            totalTime={totalTime}
            totalDist={totalDist}
          />
          
          {/* Map Controls */}
          <div className="absolute bottom-10 right-6 z-[1000] flex flex-col gap-3">
            <Button 
              size="icon" 
              className="h-14 w-14 rounded-2xl bg-white text-slate-600 shadow-2xl hover:bg-slate-50 border border-slate-100"
              onClick={detectLocation}
            >
              <LocateFixed size={24} />
            </Button>
            <div className="flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
              <Button size="icon" variant="ghost" className="h-12 w-12 rounded-none border-b text-slate-600">+</Button>
              <Button size="icon" variant="ghost" className="h-12 w-12 rounded-none text-slate-600">-</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

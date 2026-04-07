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
  LocateFixed,
  Car,
  Footprints
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center">Loading Navigation...</div>
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
        
        {/* TOP OVERLAY: Google Maps Style Search & Filter Bar */}
        <div className="absolute top-6 left-4 right-4 md:left-[35%] md:right-8 z-[1000] pointer-events-none flex flex-col gap-4">
          <div className="flex gap-3 pointer-events-auto max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                placeholder="Search along the route..." 
                className="pl-12 h-14 rounded-2xl shadow-2xl border-none bg-white/95 backdrop-blur-xl w-full text-base font-medium focus:ring-2 ring-primary/30"
              />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-slate-600 hover:bg-slate-50 border-none transition-all active:scale-95" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>
          
          <div className="flex gap-2 pointer-events-auto overflow-x-auto pb-4 scrollbar-hide">
            {QUICK_FILTERS.map((filter) => (
              <Button key={filter.label} variant="secondary" className="rounded-full bg-white/95 backdrop-blur-md border shadow-lg hover:shadow-xl h-10 px-5 text-sm font-bold gap-2 text-slate-700 hover:bg-white transition-all">
                <filter.icon size={16} className="text-primary" />
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* SIDEBAR PANEL */}
        <div className="w-full md:w-[32%] border-r bg-white flex flex-col z-20 shadow-2xl transition-all">
          <div className="p-8 border-b bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-headline text-2xl font-black text-slate-900 flex items-center gap-3">
                <Navigation size={28} className="text-primary" /> Handumanan Nav
              </h1>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">Beta</Badge>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">Cultural Heritage Routing Engine</p>
            
            <div className="mt-6 flex bg-slate-100 p-1.5 rounded-2xl">
              <button 
                onClick={() => setTravelMode('driving-car')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all ${travelMode === 'driving-car' ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Car size={16} /> Driving
              </button>
              <button 
                onClick={() => setTravelMode('foot-walking')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black rounded-xl transition-all ${travelMode === 'foot-walking' ? 'bg-white shadow-md text-primary' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Footprints size={16} /> Walking
              </button>
            </div>
          </div>

          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-8 mt-6 h-12 bg-slate-100 rounded-2xl p-1.5">
              <TabsTrigger value="discovery" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-tighter">Explore</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-black text-xs uppercase tracking-tighter">Route {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-8 py-6">
                <div className="space-y-5">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Heritage nearby</h3>
                  {nearbySites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-2xl bg-slate-50/50">
                      <div className="flex">
                        <div className="relative w-32 h-32 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" sizes="128px" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                          <Badge className="absolute bottom-3 left-3 bg-white/95 text-primary text-[10px] px-2 h-5 border-none font-black shadow-lg">
                            {site.distance.toFixed(1)} km
                          </Badge>
                        </div>
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors text-slate-900">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter opacity-70 mt-1">{site.category}</p>
                          </div>
                          <div className="flex justify-between items-center mt-4">
                            <Link href={`/site/${site.id}`} className="text-[10px] font-black text-blue-600 flex items-center gap-1 hover:gap-2 transition-all group-hover:text-primary">
                              DETAILS <ArrowRight size={12} />
                            </Link>
                            <Button 
                              size="sm" 
                              variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                              className={`h-8 px-4 text-[10px] rounded-full font-black shadow-sm transition-all ${itineraryIds.includes(site.id) ? 'bg-primary border-none scale-105' : 'border-primary/20 hover:bg-primary/5 text-primary'}`}
                              onClick={() => toggleItinerary(site.id)}
                            >
                              {itineraryIds.includes(site.id) ? "ADDED" : "ADD ROUTE"}
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
                <ScrollArea className="flex-1 px-8 py-6">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <MapIcon size={32} className="text-slate-300" />
                      </div>
                      <p className="text-base font-black text-slate-800">No destinations yet</p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[220px] mx-auto leading-relaxed">Add cultural heritage sites from the Explore tab to start your journey through Metro Cebu.</p>
                    </div>
                  ) : routeSteps.length > 0 ? (
                    <div className="space-y-8">
                      <div className="bg-primary p-6 rounded-3xl text-white shadow-2xl shadow-primary/30 relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 rotate-12">
                          <Navigation size={120} />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80 mb-4">
                          <span className="flex items-center gap-1.5"><Car size={14} /> LIVE NAVIGATION</span>
                          <span className="bg-white/20 px-3 py-1 rounded-full">{Math.round(totalTime)} MIN</span>
                        </div>
                        <h4 className="text-2xl font-black leading-tight mb-2">{itineraryIds.length} STOPS PLANNED</h4>
                        <p className="text-sm opacity-90 font-bold">{totalDist.toFixed(1)} KM TOTAL JOURNEY</p>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full mt-6 h-10 text-[10px] font-black uppercase text-white bg-white/10 hover:bg-white/20 border-none rounded-xl tracking-widest"
                          onClick={() => { setRouteCoords([]); setRouteSteps([]); }}
                        >
                          RESET NAVIGATION
                        </Button>
                      </div>
                      
                      <div className="space-y-5">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Maneuvers</h4>
                        <div className="relative pl-3">
                          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100" />
                          {routeSteps.map((step, idx) => (
                            <div key={idx} className="flex gap-5 items-start mb-8 last:mb-0 relative z-10">
                              <div className={`mt-1.5 h-6 w-6 rounded-full flex items-center justify-center shadow-lg border-2 bg-white ${step.instruction.includes('Arrive') ? 'border-primary text-primary scale-125' : 'border-slate-200 text-slate-400'}`}>
                                {step.instruction.includes('Arrive') ? <MapPin size={12} fill="currentColor" /> : <ChevronRight size={12} />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-sm leading-snug ${step.instruction.includes('Arrive') ? 'font-black text-slate-900' : 'text-slate-600 font-bold'}`}>
                                  {step.instruction.replace(/<[^>]*>?/gm, '')}
                                </p>
                                {step.distance > 0 && (
                                  <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-tighter">
                                    {Math.round(step.distance)} METERS &bull; {Math.round(step.duration / 60)} MINS
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="bg-slate-50/80 p-6 rounded-3xl border-2 border-dashed border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Stop sequence</h4>
                        <div className="space-y-4">
                          {manualItinerary.map((site, idx) => (
                            <div key={site.id} className="flex gap-5 items-center group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 100}ms` }}>
                              <div className="w-8 h-8 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black shadow-sm">{idx + 1}</div>
                              <div className="flex-1 text-sm font-bold text-slate-800 truncate">{site.name}</div>
                              <button onClick={() => toggleItinerary(site.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-xl">
                                <Maximize2 size={16} className="rotate-45" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full rounded-3xl h-16 bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 transition-all active:scale-95 group" 
                        onClick={handleGenerateRoute} 
                        disabled={isPlanningRoute}
                      >
                        {isPlanningRoute ? (
                          <><Loader2 className="animate-spin" size={24} /> ANALYZING...</>
                        ) : (
                          <><RouteIcon size={24} className="group-hover:rotate-12 transition-transform" /> START JOURNEY</>
                        )}
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* MAP PANEL */}
        <div className="flex-1 h-full relative">
          <HeritageMap 
            userLocation={userLocation} 
            sites={nearbySites} 
            itinerary={manualItinerary} 
            routeCoordinates={routeCoords} 
            totalTime={totalTime}
            totalDist={totalDist}
          />
          
          {/* MAP CONTROLS */}
          <div className="absolute bottom-10 right-8 z-[1000] flex flex-col gap-4">
            <Button 
              size="icon" 
              className="h-16 w-16 rounded-3xl bg-white text-slate-600 shadow-2xl hover:bg-slate-50 border border-slate-100 transition-all active:scale-90"
              onClick={detectLocation}
            >
              <LocateFixed size={28} />
            </Button>
            <div className="flex flex-col bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
              <Button size="icon" variant="ghost" className="h-14 w-14 rounded-none border-b text-slate-600 hover:bg-slate-50 font-black text-xl">+</Button>
              <Button size="icon" variant="ghost" className="h-14 w-14 rounded-none text-slate-600 hover:bg-slate-50 font-black text-xl">-</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
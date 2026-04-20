
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
  Maximize2,
  LocateFixed,
  Car,
  Footprints,
  Calendar,
  Layers
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center">Loading Maps...</div>
});

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
  const [searchQuery, setSearchQuery] = useState('');

  const db = useFirestore();
  const sitesRef = useMemoFirebase(() => collection(db, 'heritageSites'), [db]);
  const { data: dbSites } = useCollection(sitesRef);

  const allSites = useMemo(() => {
    return HERITAGE_SITES;
  }, []);

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
    return allSites
      .map(site => ({
        ...site,
        distance: calculateDistance(loc.lat, loc.lng, site.coordinates.lat, site.coordinates.lng)
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [userLocation, allSites]);

  const filteredSites = useMemo(() => {
    if (!searchQuery) return sortedSites;
    return sortedSites.filter(site => 
      site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      site.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [sortedSites, searchQuery]);

  const toggleItinerary = (id: string) => {
    setItineraryIds(prev => {
      const isAlreadyIn = prev.includes(id);
      let newIds;
      if (isAlreadyIn) {
        newIds = prev.filter(i => i !== id);
      } else {
        if (prev.length >= 10) return prev; 
        newIds = [...prev, id];
      }
      setRouteCoords([]);
      setRouteSteps([]);
      return newIds;
    });
  };

  const manualItinerary = useMemo(() => {
    return itineraryIds.map(id => allSites.find(site => site.id === id)).filter(Boolean) as any[];
  }, [itineraryIds, allSites]);

  const handleGenerateRoute = async () => {
    if (manualItinerary.length === 0 || !userLocation) return;
    
    setIsPlanningRoute(true);
    let fullRoute: [number, number][] = [];
    let allSteps: RouteStep[] = [];
    let cumulativeDist = 0;
    let cumulativeTime = 0;
    
    // GREEDY NEAREST NEIGHBOR ROUTE OPTIMIZATION
    // Instead of sorting by distance from start, we find the closest next stop iteratively
    let optimizedSequence = [];
    let remaining = [...manualItinerary];
    let currentPos = userLocation;

    while (remaining.length > 0) {
      let nearestIdx = 0;
      let minDist = Infinity;
      
      for (let i = 0; i < remaining.length; i++) {
        const d = calculateDistance(currentPos.lat, currentPos.lng, remaining[i].coordinates.lat, remaining[i].coordinates.lng);
        if (d < minDist) {
          minDist = d;
          nearestIdx = i;
        }
      }
      
      const nextSite = remaining.splice(nearestIdx, 1)[0];
      optimizedSequence.push(nextSite);
      currentPos = nextSite.coordinates;
    }

    let start = userLocation;

    for (const site of optimizedSequence) {
      const routeData = await getRoute(start, site.coordinates, travelMode);
      if (routeData) {
        // Only append if it's the first segment or avoid duplicating the connection point
        fullRoute = [...fullRoute, ...routeData.coordinates];
        allSteps = [
          ...allSteps, 
          { instruction: `Destination: ${site.name}`, distance: 0, duration: 0 } as any, 
          ...routeData.steps
        ];
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

  const smartPlan = (duration: 'half' | 'full' | 'multi') => {
    setItineraryIds([]);
    const stopCount = duration === 'half' ? 3 : duration === 'full' ? 5 : 8;
    const selection = sortedSites.slice(0, stopCount).map(s => s.id);
    setItineraryIds(selection);
    setRouteCoords([]);
    setRouteSteps([]);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* TOP OVERLAY: Google Maps Style Search Bar */}
        <div className="absolute top-6 left-4 right-4 md:left-[35%] md:right-8 z-[1000] pointer-events-none flex flex-col gap-4">
          <div className="flex gap-3 pointer-events-auto max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                placeholder="Search heritage sites, cities, or categories..." 
                className="pl-12 h-14 rounded-2xl shadow-2xl border-none bg-white/95 backdrop-blur-xl w-full text-base font-medium focus:ring-2 ring-primary/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-slate-600 hover:bg-slate-50 border-none transition-all active:scale-95" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>
        </div>

        {/* SIDEBAR PANEL */}
        <div className="w-full md:w-[35%] border-r bg-white flex flex-col z-20 shadow-2xl transition-all">
          <div className="p-6 border-b bg-gradient-to-br from-primary/5 via-transparent to-transparent">
            <div className="flex items-center justify-between mb-4">
              <h1 className="font-headline text-2xl font-black text-slate-900 flex items-center gap-3">
                <Navigation size={28} className="text-primary" /> Explore & Route
              </h1>
              <Badge variant="outline" className="border-primary/20 text-primary font-bold">AI Pathing</Badge>
            </div>
            
            <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
              <button 
                onClick={() => { setTravelMode('driving-car'); setRouteCoords([]); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${travelMode === 'driving-car' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                <Car size={14} className="inline mr-1" /> Drive
              </button>
              <button 
                onClick={() => { setTravelMode('foot-walking'); setRouteCoords([]); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${travelMode === 'foot-walking' ? 'bg-white shadow-sm text-primary' : 'text-slate-500'}`}
              >
                <Footprints size={14} className="inline mr-1" /> Walk
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-lg" onClick={() => smartPlan('half')}>
                <Sparkles size={12} className="mr-1" /> Half-Day
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-lg" onClick={() => smartPlan('full')}>
                <Sparkles size={12} className="mr-1" /> Full-Day
              </Button>
              <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-lg" onClick={() => smartPlan('multi')}>
                <Sparkles size={12} className="mr-1" /> Multi-Day
              </Button>
            </div>
          </div>

          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-10 bg-slate-100 rounded-xl p-1">
              <TabsTrigger value="discovery" className="rounded-lg text-xs font-black uppercase">Nearby</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-lg text-xs font-black uppercase">Plan {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Nearby Heritage Treasures</h3>
                  {filteredSites.slice(0, 15).map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-xl bg-slate-50/50">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="96px" />
                          <Badge className="absolute bottom-1 left-1 bg-white/90 text-primary text-[8px] px-1 h-4 border-none font-black shadow-lg">
                            {site.distance.toFixed(1)} km
                          </Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xs line-clamp-1 text-slate-900">{site.name}</h3>
                            <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter mt-0.5">{site.city}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[9px] font-black text-blue-600 flex items-center gap-1">
                              INFO <ArrowRight size={10} />
                            </Link>
                            <Button 
                              size="sm" 
                              variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                              className={`h-6 px-3 text-[9px] rounded-full font-black ${itineraryIds.includes(site.id) ? 'bg-primary border-none' : 'border-primary/20 text-primary'}`}
                              onClick={() => toggleItinerary(site.id)}
                            >
                              {itineraryIds.includes(site.id) ? "ADDED" : "ADD STOP"}
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
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                        <MapIcon size={24} className="text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-800">Your trip is empty</p>
                      <p className="text-xs text-muted-foreground mt-2 max-w-[180px] mx-auto leading-relaxed">Add sites from Nearby or use a Smart Plan to begin your journey.</p>
                    </div>
                  ) : routeSteps.length > 0 ? (
                    <div className="space-y-6">
                      <div className="bg-primary p-4 rounded-2xl text-white shadow-lg relative overflow-hidden">
                        <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-80 mb-2">
                          <span>{travelMode === 'driving-car' ? 'DRIVING' : 'WALKING'} ROUTE</span>
                          <span>{Math.round(totalTime)} MINS</span>
                        </div>
                        <h4 className="text-lg font-black leading-tight">{itineraryIds.length} SITES OPTIMIZED</h4>
                        <p className="text-xs opacity-90 font-bold mt-1">{totalDist.toFixed(1)} KM TOTAL</p>
                        
                        <Button 
                          variant="ghost" 
                          className="w-full mt-4 h-8 text-[9px] font-black uppercase text-white bg-white/10 hover:bg-white/20 border-none rounded-lg"
                          onClick={() => { setRouteCoords([]); setRouteSteps([]); }}
                        >
                          EDIT SEQUENCE
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Route Instructions</h4>
                        <div className="relative pl-3">
                          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100" />
                          {routeSteps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 items-start mb-6 last:mb-0 relative z-10">
                              <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center shadow-md border bg-white ${step.instruction.includes('Destination') ? 'border-primary text-primary scale-110' : 'border-slate-200 text-slate-400'}`}>
                                {step.instruction.includes('Destination') ? <MapPin size={10} fill="currentColor" /> : <ChevronRight size={10} />}
                              </div>
                              <div className="flex-1">
                                <p className={`text-xs leading-snug ${step.instruction.includes('Destination') ? 'font-black text-slate-900' : 'text-slate-600 font-bold'}`}>
                                  {step.instruction.replace(/<[^>]*>?/gm, '')}
                                </p>
                                {step.distance > 0 && (
                                  <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">
                                    {Math.round(step.distance)} M &bull; {Math.round(step.duration / 60)} MIN
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
                      <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Selected Itinerary</h4>
                        <div className="space-y-3">
                          {manualItinerary.map((site, idx) => (
                            <div key={site.id} className="flex gap-3 items-center">
                              <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{idx + 1}</div>
                              <div className="flex-1 text-xs font-bold text-slate-800 truncate">{site.name}</div>
                              <button onClick={() => toggleItinerary(site.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                <Maximize2 size={14} className="rotate-45" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-black text-sm shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95" 
                        onClick={handleGenerateRoute} 
                        disabled={isPlanningRoute}
                      >
                        {isPlanningRoute ? (
                          <><Loader2 className="animate-spin" size={20} /> ANALYZING...</>
                        ) : (
                          <><RouteIcon size={20} /> GENERATE ACCURATE ROUTE</>
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
            sites={filteredSites} 
            itinerary={manualItinerary} 
            routeCoordinates={routeCoords} 
            totalTime={totalTime}
            totalDist={totalDist}
          />
          
          {/* MAP CONTROLS */}
          <div className="absolute bottom-8 right-6 z-[1000] flex flex-col gap-3">
            <Button 
              size="icon" 
              className="h-12 w-12 rounded-2xl bg-white text-slate-600 shadow-2xl hover:bg-slate-50 border border-slate-100 transition-all active:scale-90"
              onClick={detectLocation}
            >
              <LocateFixed size={24} />
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

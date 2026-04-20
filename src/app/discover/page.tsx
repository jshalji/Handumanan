
'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRoute, type RouteData, type RouteStep } from '@/lib/routing-service';
import { generatePersonalizedItinerary } from '@/ai/flows/generate-personalized-itinerary';
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
  BrainCircuit,
  Save,
  Key,
  X,
  Plus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center font-black uppercase tracking-widest text-xs opacity-50">Loading Mapping Engine...</div>
});

function ExploreRouteContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const siteIdFromUrl = searchParams.get('siteId');

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [travelMode, setTravelMode] = useState<'driving-car' | 'foot-walking'>('driving-car');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  
  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();
  const defaultLocation = { lat: 10.2936, lng: 123.9019 };
  const allSites = useMemo(() => HERITAGE_SITES, []);

  useEffect(() => {
    const savedKey = localStorage.getItem('ors_api_key');
    if (savedKey) {
      setOrsKey(savedKey);
    } else {
      setShowKeyDialog(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('ors_api_key', tempKey.trim());
      setOrsKey(tempKey.trim());
      setShowKeyDialog(false);
      toast({ title: "API Key Saved", description: "You can now generate road-accurate routes." });
    }
  };

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      return loc;
    } catch (err) {
      setUserLocation(defaultLocation);
      return defaultLocation;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  const handleGenerateRoute = async (customItinerary?: any[]) => {
    if (!orsKey) {
      setShowKeyDialog(true);
      return;
    }

    const activeItinerary = customItinerary || itineraryIds.map(id => allSites.find(site => site.id === id)).filter(Boolean);
    const startPoint = userLocation || await detectLocation();

    if (activeItinerary.length === 0) return;
    
    setIsPlanningRoute(true);
    let fullRoute: [number, number][] = [];
    let allSteps: RouteStep[] = [];
    let cumulativeDist = 0;
    let cumulativeTime = 0;
    
    let optimizedSequence = [];
    let remaining = [...activeItinerary];
    let currentPos = startPoint;

    // Greedy nearest neighbor optimization for the route sequence
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

    let start = startPoint;
    for (const site of optimizedSequence) {
      const routeData = await getRoute(start, site.coordinates, orsKey, travelMode);
      if (routeData) {
        fullRoute = [...fullRoute, ...routeData.coordinates];
        allSteps = [
          ...allSteps, 
          { instruction: `Destination: ${site.name}`, distance: 0, duration: 0 } as RouteStep, 
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
    setIsRecommendationsOpen(true);
  };

  // Auto-trigger routing when navigating from a specific site
  useEffect(() => {
    if (siteIdFromUrl && allSites.length > 0 && orsKey && userLocation) {
      const site = allSites.find(s => s.id === siteIdFromUrl);
      if (site) {
        setItineraryIds([siteIdFromUrl]);
        handleGenerateRoute([site]);
        toast({ title: "Routing Initiated", description: `Calculating best road path to ${site.name}.` });
      }
    }
  }, [siteIdFromUrl, orsKey, userLocation, allSites]);

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

  const manualItinerary = useMemo(() => {
    return itineraryIds.map(id => allSites.find(site => site.id === id)).filter(Boolean) as any[];
  }, [itineraryIds, allSites]);

  const handleAiItinerary = async () => {
    if (!orsKey) {
      setShowKeyDialog(true);
      return;
    }
    setIsAiThinking(true);
    try {
      const loc = userLocation || await detectLocation();
      const result = await generatePersonalizedItinerary({
        interests: ["History", "Architecture", "Religious Sites"],
        availableTimeHours: 6,
        startingLocation: `${loc.lat}, ${loc.lng}`,
        siteDatabase: JSON.stringify(allSites.slice(0, 20))
      });
      const suggestedIds = result.itinerary.map(item => allSites.find(s => s.name === item.siteName)?.id).filter(Boolean) as string[];
      setItineraryIds(suggestedIds);
      const suggestedSites = suggestedIds.map(id => allSites.find(s => s.id === id)).filter(Boolean);
      handleGenerateRoute(suggestedSites);
      toast({ title: "AI Plan Ready", description: "Mapping optimized heritage route." });
    } catch (error) {
      toast({ title: "AI Assistant Busy", description: "Falling back to proximity-based trip.", variant: "destructive" });
    } finally {
      setIsAiThinking(false);
    }
  };

  const smartPlan = (duration: 'half' | 'full') => {
    const stopCount = duration === 'half' ? 3 : 6;
    const selectedSites = sortedSites.slice(0, stopCount);
    setItineraryIds(selectedSites.map(s => s.id));
    handleGenerateRoute(selectedSites);
  };

  const toggleItinerary = (id: string) => {
    setItineraryIds(prev => {
      const isAlreadyIn = prev.includes(id);
      let newIds = isAlreadyIn ? prev.filter(i => i !== id) : [...prev, id].slice(0, 10);
      setRouteCoords([]);
      setRouteSteps([]);
      return newIds;
    });
  };

  const handleRecommendationClick = (site: any) => {
    // Add the site to itinerary and immediately calculate route
    const newItinerary = [...manualItinerary, site];
    setItineraryIds(newItinerary.map(s => s.id));
    handleGenerateRoute(newItinerary);
  };

  const saveToProfile = () => {
    if (!user || !db || manualItinerary.length === 0) {
        toast({ title: "Login Required", description: "Sign in to save your heritage trips.", variant: "destructive" });
        return;
    }
    const itinRef = doc(collection(db, 'users', user.uid, 'itineraries'));
    setDocumentNonBlocking(itinRef, {
        userId: user.uid,
        itineraryData: JSON.stringify({ itinerary: manualItinerary, routeSteps, totalDist, totalTime }),
        summary: `Heritage tour of ${manualItinerary[0].name} and ${itineraryIds.length - 1} other sites.`,
        createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Find this in your profile." });
  };

  const recommendedSites = useMemo(() => {
    return sortedSites.filter(s => !itineraryIds.includes(s.id)).slice(0, 5);
  }, [sortedSites, itineraryIds]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <div className="absolute top-6 left-4 right-4 md:left-[35%] md:right-8 z-[1000] pointer-events-none flex flex-col gap-4">
          <div className="flex gap-3 pointer-events-auto max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input placeholder="Search Heritage Sites..." className="pl-12 h-14 rounded-2xl shadow-2xl border-none bg-white/95 backdrop-blur-xl w-full text-base font-bold focus:ring-2 ring-primary/30" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-slate-600 hover:bg-slate-50 border-none" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>
        </div>

        <div className="w-full md:w-[35%] border-r bg-white flex flex-col z-20 shadow-2xl">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-headline text-2xl font-black text-slate-900 flex items-center gap-3">
                <Navigation size={28} className="text-primary" /> Route Planner
              </h1>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary" onClick={() => setShowKeyDialog(true)}>
                <Key size={18} />
              </Button>
            </div>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-6">
              <button onClick={() => { setTravelMode('driving-car'); setRouteCoords([]); setRouteSteps([]); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${travelMode === 'driving-car' ? 'bg-white shadow-md text-primary' : 'text-slate-500'}`}><Car size={14} /> Drive</button>
              <button onClick={() => { setTravelMode('foot-walking'); setRouteCoords([]); setRouteSteps([]); }} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${travelMode === 'foot-walking' ? 'bg-white shadow-md text-primary' : 'text-slate-500'}`}><Footprints size={14} /> Walk</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" size="sm" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-white border-slate-200" onClick={() => smartPlan('half')}><MapIcon size={14} className="mr-2" /> Quick Trip</Button>
              <Button variant="default" size="sm" className="h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary shadow-lg shadow-primary/20" onClick={handleAiItinerary} disabled={isAiThinking}>{isAiThinking ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} className="mr-2" />} AI Assistant</Button>
            </div>
          </div>
          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-11 bg-slate-100 rounded-2xl p-1.5">
              <TabsTrigger value="discovery" className="rounded-xl text-[10px] font-black uppercase tracking-widest">Directory</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-xl text-[10px] font-black uppercase tracking-widest">My Route {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>
            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  {filteredSites.slice(0, 20).map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-slate-50/50">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="96px" />
                          <Badge className="absolute bottom-1.5 left-1.5 bg-white/95 text-primary text-[8px] px-2 h-4 border-none font-black">{site.distance.toFixed(1)} km</Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                          <div>
                            <h3 className="font-bold text-[13px] line-clamp-1 text-slate-900">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-0.5">{site.city}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[9px] font-black text-blue-600 flex items-center gap-1 hover:underline">INFO <ArrowRight size={10} /></Link>
                            <Button size="sm" variant={itineraryIds.includes(site.id) ? "default" : "outline"} className={`h-7 px-3 text-[9px] rounded-full font-black ${itineraryIds.includes(site.id) ? 'bg-primary border-none text-white' : 'border-primary/20 text-primary'}`} onClick={() => toggleItinerary(site.id)}>{itineraryIds.includes(site.id) ? "REMOVE" : "ADD STOP"}</Button>
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
                      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6"><MapIcon size={32} className="text-slate-300" /></div>
                      <p className="text-sm font-black text-slate-800">No stops planned</p>
                      <p className="text-[11px] text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed font-bold">Use the Directory or AI Assistant to add heritage sites to your route.</p>
                    </div>
                  ) : routeSteps.length > 0 ? (
                    <div className="space-y-6">
                      <div className="bg-primary p-6 rounded-[2rem] text-white shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80 mb-3"><span>{travelMode === 'driving-car' ? 'DRIVE' : 'WALK'}</span><span>{Math.round(totalTime)} MIN</span></div>
                        <h4 className="text-xl font-black leading-tight">{itineraryIds.length} SITES PLANNED</h4>
                        <p className="text-[12px] opacity-90 font-bold mt-1.5">{totalDist.toFixed(1)} KM TOTAL</p>
                        <div className="grid grid-cols-2 gap-3 mt-6">
                          <Button variant="ghost" className="h-10 text-[10px] font-black uppercase text-white bg-white/10 hover:bg-white/20 border-none rounded-xl" onClick={() => { setRouteCoords([]); setRouteSteps([]); setItineraryIds([]); setIsRecommendationsOpen(false); }}>CLEAR</Button>
                          <Button variant="ghost" className="h-10 text-[10px] font-black uppercase text-white bg-white/10 hover:bg-white/20 border-none rounded-xl" onClick={saveToProfile}><Save size={12} className="mr-2" /> SAVE</Button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Maneuvers (From Your Location)</h4>
                        <div className="relative pl-3">
                          <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-slate-100" />
                          {routeSteps.map((step, idx) => (
                            <div key={idx} className="flex gap-4 items-start mb-6 last:mb-0 relative z-10">
                              <div className={`mt-1 h-5 w-5 rounded-full flex items-center justify-center shadow-md border bg-white ${step.instruction.includes('Destination') ? 'border-primary text-primary scale-110' : 'border-slate-200 text-slate-400'}`}>{step.instruction.includes('Destination') ? <MapPin size={10} fill="currentColor" /> : <ChevronRight size={10} />}</div>
                              <div className="flex-1">
                                <p className={`text-[12px] leading-snug ${step.instruction.includes('Destination') ? 'font-black text-slate-900' : 'text-slate-600 font-bold'}`}>{step.instruction.replace(/<[^>]*>?/gm, '')}</p>
                                {step.distance > 0 && <p className="text-[9px] font-black text-slate-400 mt-1 uppercase tracking-tighter">{step.distance >= 1 ? `${step.distance.toFixed(1)} KM` : `${Math.round(step.distance * 1000)} M`} &bull; {Math.round(step.duration)} MIN</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Trip stops</h4>
                        <div className="space-y-4">
                          {manualItinerary.map((site, idx) => (
                            <div key={site.id} className="flex gap-4 items-center group">
                              <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-900 flex items-center justify-center text-[10px] font-black shadow-sm group-hover:border-primary group-hover:text-primary transition-colors">{idx + 1}</div>
                              <div className="flex-1">
                                <p className="text-[12px] font-black text-slate-800 truncate">{site.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{site.city}</p>
                              </div>
                              <button onClick={() => toggleItinerary(site.id)} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Maximize2 size={16} className="rotate-45" /></button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95" onClick={() => handleGenerateRoute()} disabled={isPlanningRoute}>
                        {isPlanningRoute ? <><Loader2 className="animate-spin" size={20} /> MAPPING STREETS...</> : <><RouteIcon size={20} /> START NAVIGATION</>}
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1 h-full relative">
          <HeritageMap userLocation={userLocation} sites={filteredSites} itinerary={manualItinerary} routeCoordinates={routeCoords} totalTime={totalTime} totalDist={totalDist} />
          
          {/* Recommendations Floating Panel */}
          {isRecommendationsOpen && (
            <div className="fixed bottom-10 left-10 md:left-[37%] z-[1001] w-[calc(100%-2.5rem)] md:w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <Card className="rounded-[2.5rem] shadow-2xl border-none p-6 bg-white/95 backdrop-blur-2xl ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Sparkles size={14} /></div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nearby Picks</h4>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setIsRecommendationsOpen(false)}>
                    <X size={16} className="text-slate-400" />
                  </Button>
                </div>
                <ScrollArea className="h-48 pr-3">
                  <div className="space-y-4">
                    {recommendedSites.map(site => (
                      <div key={site.id} className="flex gap-4 items-center group cursor-pointer" onClick={() => handleRecommendationClick(site)}>
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-800 truncate leading-none mb-1">{site.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{site.distance.toFixed(1)} km &bull; {site.city}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Plus size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}

          <div className="absolute bottom-8 right-6 z-[1000] flex flex-col gap-3">
            <Button size="icon" className="h-14 w-14 rounded-2xl bg-white text-slate-600 shadow-2xl hover:bg-slate-50 border border-slate-100 transition-all active:scale-90" onClick={detectLocation}><LocateFixed size={28} /></Button>
          </div>
        </div>

        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl font-bold">OpenRouteService API Key</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">To generate road-accurate navigation in Metro Cebu, please enter your OpenRouteService API key. You can get one for free at <a href="https://openrouteservice.org/dev/#/signup" target="_blank" className="text-primary hover:underline font-bold">openrouteservice.org</a>.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4"><div className="grid flex-1 gap-2"><Input placeholder="Enter your API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-xl h-12" /></div></div>
            <DialogFooter className="sm:justify-start"><Button type="button" className="w-full h-12 rounded-xl font-bold" onClick={handleSaveKey}>Save & Continue</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default function ExploreRoutePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <ExploreRouteContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Navigation, 
  Loader2, 
  Sparkles, 
  Search,
  LocateFixed,
  X,
  Plus,
  Route,
  Home,
  Save,
  Church,
  Landmark,
  TreePine,
  Menu,
  Settings,
  BellRing,
  ChevronUp,
  ChevronDown,
  Trash2,
  MapPin,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useIsMobile } from '@/hooks/use-mobile';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black uppercase tracking-widest text-[10px] opacity-30">Map Initializing...</div>
});

const CITIES = ["Cebu City", "Mandaue City", "Lapu-Lapu City", "Talisay City"];

const CITY_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  "Cebu City": { lat: 10.3157, lng: 123.8854, zoom: 13 },
  "Mandaue City": { lat: 10.3403, lng: 123.9416, zoom: 13 },
  "Lapu-Lapu City": { lat: 10.3103, lng: 123.9494, zoom: 13 },
  "Talisay City": { lat: 10.2447, lng: 123.8494, zoom: 13 }
};

const CATEGORIES = [
  { label: "Churches", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Museums", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Landmarks", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Parks", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Houses", value: "Ancestral Houses & Heritage Residences", icon: Home }
];

function ExploreRouteContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [cityTarget, setCityTarget] = useState<{ lat: number; lng: number; zoom: number; timestamp: number } | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [alertedSites, setAlertedSites] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerStart, setPlannerStart] = useState('Cebu City Center');
  const [plannerTime, setPlannerTime] = useState([4]);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();

  // Sync route data with localStorage for Chatbot context
  useEffect(() => {
    if (itineraryIds.length > 0) {
      const context = {
        stops: itineraryIds.map(id => HERITAGE_SITES.find(s => s.id === id)?.name),
        totalDistance: totalDist,
        estimatedTime: totalTime
      };
      localStorage.setItem('active_itinerary_context', JSON.stringify(context));
    } else {
      localStorage.removeItem('active_itinerary_context');
    }
  }, [itineraryIds, totalDist, totalTime]);

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setSelectedCategory(null);
    setCityTarget({ ...CITY_COORDS[city], timestamp: Date.now() });
    setIsNavigating(false);
  };

  const handleRecenter = () => {
    setRecenterKey(prev => prev + 1);
  };

  const sitesQuery = useMemoFirebase(() => {
    if (!db) return null;
    const colRef = collection(db, 'heritageSites');
    if (selectedCity && selectedCategory) {
      return query(colRef, where('city', '==', selectedCity), where('category', '==', selectedCategory));
    }
    if (selectedCity) {
      return query(colRef, where('city', '==', selectedCity));
    }
    return colRef;
  }, [db, selectedCity, selectedCategory]);

  const { data: firestoreSites } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    const source = (firestoreSites && firestoreSites.length > 0) ? firestoreSites : HERITAGE_SITES;
    let result = source.map(site => ({
      ...site,
      coordinates: site.coordinates || { lat: site.latitude || 0, lng: site.longitude || 0 }
    })) as HeritageSite[];

    if (selectedCity) result = result.filter(s => s.city === selectedCity);
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    return result;
  }, [firestoreSites, selectedCity, selectedCategory]);

  useEffect(() => {
    const savedKey = localStorage.getItem('ors_api_key');
    if (savedKey) setOrsKey(savedKey);
    else setShowKeyDialog(true);
  }, []);

  const handleSaveKey = () => {
    if (tempKey.trim()) {
      localStorage.setItem('ors_api_key', tempKey.trim());
      setOrsKey(tempKey.trim());
      setShowKeyDialog(false);
      toast({ title: "Engine Ready", description: "Precision routing is now active." });
    }
  };

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      return loc;
    } catch (err) {
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    detectLocation();
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      (err) => {
        if (err.code === 1) toast({ title: "Permission Denied", description: "Location access required.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [detectLocation, toast]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds]);

  useEffect(() => {
    if (!userLocation || itinerarySites.length === 0) return;
    const currentDestination = itinerarySites[0];
    const dist = calculateDistance(userLocation.lat, userLocation.lng, currentDestination.coordinates.lat, currentDestination.coordinates.lng);
    if (dist <= 0.05 && !alertedSites.includes(currentDestination.id)) {
      toast({ title: "📍 Arrival!", description: `Welcome to ${currentDestination.name}!`, duration: 8000 });
      setAlertedSites(prev => [...prev, currentDestination.id]);
      setIsNavigating(false);
      if ('vibrate' in navigator) navigator.vibrate([300, 100, 300]);
    }
  }, [userLocation, itinerarySites, alertedSites, toast]);

  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q));
    }
    return result;
  }, [allSites, userLocation, searchQuery]);

  const aiSuggestions = useMemo(() => {
    let recommendations = allSites.map(s => {
      const dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) : 100;
      return { ...s, score: (s.isMustVisit ? 2 : 0) + (s.rating || 4) / 2 + (Math.max(0, 10 - dist)) };
    });
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations.slice(0, 5);
  }, [allSites, userLocation]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (itineraryIds.length < 2 || !orsKey) {
        setRouteCoords([]); setTotalDist(0); setTotalTime(0);
        return;
      }
      const data = await getRouteMulti(itinerarySites.map(s => s.coordinates), orsKey);
      if (data) {
        setRouteCoords(data.coordinates);
        setTotalDist(data.distance);
        setTotalTime(data.duration);
      }
    };
    fetchRoute();
  }, [itineraryIds, orsKey, itinerarySites]);

  const toggleSite = (id: string) => {
    setItineraryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newIds = [...itineraryIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newIds.length) {
      [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
      setItineraryIds(newIds);
    }
  };

  const centerOnSite = (site: HeritageSite | any) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
    setIsNavigating(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleGeneratePlanner = async () => {
    setIsGeneratingPlanner(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: plannerStart,
        availableTimeHours: plannerTime[0],
        interests: ["General Interest"],
        siteDatabase: JSON.stringify(HERITAGE_SITES)
      });
      const suggestedIds = output.itinerary
        .map(item => HERITAGE_SITES.find(s => s.name.toLowerCase() === item.siteName.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      if (suggestedIds.length > 0) {
        setItineraryIds(suggestedIds);
        centerOnSite(HERITAGE_SITES.find(s => s.id === suggestedIds[0]));
      }
      toast({ title: "Itinerary Ready", description: "Path generated based on proximity." });
    } catch (error) {
      toast({ title: "Planner Busy", description: "Please try again in a moment.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  const handleSavePlanner = () => {
    if (!user || !db || itineraryIds.length === 0) {
      toast({ title: "Login Required", description: "Sign in to save trips.", variant: "destructive" });
      return;
    }
    setDocumentNonBlocking(doc(collection(db, 'users', user.uid, 'itineraries')), {
      userId: user.uid,
      itineraryIds,
      summary: `${itineraryIds.length} stops in Metro Cebu`,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Find it in your profile." });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative font-body select-none">
      
      <div className="absolute inset-0 z-0">
        <HeritageMap 
          userLocation={userLocation} 
          sites={filteredAndSortedSites} 
          itinerary={itinerarySites} 
          routeCoordinates={routeCoords} 
          totalTime={totalTime} 
          totalDist={totalDist} 
          onAddSite={toggleSite}
          focusedLocation={focusedLocation}
          isNavigating={isNavigating}
          cityTarget={cityTarget}
          recenterKey={recenterKey}
        />
      </div>

      {/* TOP HEADER (MENU + SEARCH) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex flex-col items-start gap-3 pointer-events-none md:max-w-[360px] md:right-auto md:top-6 md:left-6">
        <div className="flex gap-2 items-center pointer-events-auto w-full">
          <Button 
            onClick={() => setIsDrawerOpen(true)}
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            <Menu size={20} />
          </Button>

          <div className="relative group flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search heritage sites..." 
              className="pl-11 h-12 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-[13px] ring-1 ring-black/5" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button size="icon" className="h-12 w-12 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary md:hidden" onClick={detectLocation}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
          </Button>
        </div>

        {/* DISCOVER PATH (SCROLLABLE FILTERS ON MOBILE) */}
        <div className="pointer-events-auto bg-white/95 backdrop-blur-xl rounded-[1.5rem] shadow-xl w-full ring-1 ring-black/5 overflow-hidden hidden md:block">
           <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><MapPin size={14} /></div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Discover Path</span>
                    <div className="text-[11px] font-black text-slate-900 leading-tight">
                       {selectedCity ? <span className="text-primary">{selectedCity} {selectedCategory && `> ${selectedCategory.split(' ')[0]}`}</span> : "Select City"}
                    </div>
                 </div>
              </div>
              {(selectedCity || selectedCategory) && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500 rounded-full" onClick={() => { setSelectedCity(null); setSelectedCategory(null); setIsNavigating(false); }}>
                  <X size={14} />
                </Button>
              )}
           </div>
           <div className="p-2 max-h-[220px] overflow-y-auto">
              {!selectedCity ? (
                <div className="space-y-1">
                  {CITIES.map(city => (
                    <button key={city} onClick={() => handleCitySelect(city)} className="w-full flex items-center justify-between p-2.5 hover:bg-slate-50 rounded-xl transition-all group">
                      <span className="text-[12px] font-bold text-slate-700 group-hover:text-primary">{city}</span>
                      <ChevronRight size={14} className="text-slate-200 group-hover:text-primary" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  <button onClick={() => { setSelectedCity(null); setSelectedCategory(null); }} className="w-full flex items-center gap-2 p-2 mb-1 text-[10px] font-black uppercase text-primary hover:bg-primary/5 rounded-lg">
                    <ArrowLeft size={12} /> Back to Cities
                  </button>
                  {CATEGORIES.map(cat => (
                    <button key={cat.value} onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} className={cn("w-full flex items-center justify-between p-2.5 rounded-xl transition-all group border-2", selectedCategory === cat.value ? "bg-primary/5 border-primary" : "hover:bg-slate-50 border-transparent")}>
                      <div className="flex items-center gap-3">
                         <cat.icon size={15} className={selectedCategory === cat.value ? "text-primary" : "text-slate-400"} />
                         <span className={cn("text-[12px] font-bold text-left", selectedCategory === cat.value ? "text-primary" : "text-slate-700")}>{cat.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
           </div>
        </div>

        {/* MOBILE HORIZONTAL FILTERS */}
        <div className="md:hidden w-full overflow-x-auto scrollbar-hide pointer-events-auto flex gap-2 pb-1">
          {CITIES.map(city => (
            <Button key={city} onClick={() => handleCitySelect(city)} size="sm" variant={selectedCity === city ? "default" : "secondary"} className="rounded-full shadow-lg h-9 text-[11px] font-black uppercase whitespace-nowrap px-4 border-none">
              {city.split(' ')[0]}
            </Button>
          ))}
        </div>
      </div>

      {/* NAVIGATION ACTIVE STATUS (TOP RIGHT ON DESKTOP, BOTTOM SHEET ON MOBILE) */}
      {isNavigating && userLocation && itinerarySites.length > 0 && (
        <div className={cn(
          "absolute z-[70] transition-all duration-500 pointer-events-none",
          isMobile ? "bottom-0 left-0 right-0" : "top-6 right-6 w-[320px]"
        )}>
          <Card className={cn(
            "pointer-events-auto border-none shadow-2xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
            isMobile ? "rounded-t-[2.5rem]" : "rounded-3xl p-5"
          )}>
            {isMobile && (
              <div className="p-4 flex flex-col items-center" onClick={() => setIsNavCollapsed(!isNavCollapsed)}>
                <div className="w-10 h-1 rounded-full bg-slate-200 mb-4" />
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-primary">Heading to</p>
                      <h4 className="text-[14px] font-black text-slate-900 leading-tight">{itinerarySites[0].name}</h4>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={(e) => { e.stopPropagation(); setIsNavigating(false); }}>
                    <X size={20} />
                  </Button>
                </div>
              </div>
            )}

            <div className={cn(
              "px-5 pb-8 space-y-5 transition-all",
              isMobile && isNavCollapsed ? "hidden" : "block"
            )}>
              {!isMobile && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase text-slate-400">Navigating</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-red-500" onClick={() => setIsNavigating(false)}>
                    <X size={18} />
                  </Button>
                </div>
              )}

              {!isMobile && (
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-primary">Next Stop</p>
                  <h4 className="text-[16px] font-black text-slate-900 leading-tight">{itinerarySites[0].name}</h4>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">Remaining</p>
                  <p className="text-[18px] font-black text-primary leading-none">{totalDist.toFixed(1)} KM</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-0.5">ETA</p>
                  <p className="text-[18px] font-black text-primary leading-none">{Math.round(totalTime)} MIN</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRecenter} className="flex-1 rounded-2xl h-12 bg-slate-900 text-white font-black text-[11px] uppercase tracking-widest shadow-xl">
                  Recenter
                </Button>
                <Button onClick={() => setIsNavigating(false)} variant="outline" className="flex-1 rounded-2xl h-12 border-2 border-slate-100 text-slate-500 font-black text-[11px] uppercase tracking-widest">
                  Stop
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* DRAWER (HAMBURGER MENU) */}
      <Dialog open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DialogContent className="fixed left-0 top-0 bottom-0 w-[280px] max-w-[80vw] h-full p-0 border-none bg-white rounded-none shadow-2xl transition-transform data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left duration-300">
           <div className="flex flex-col h-full">
              <DialogHeader className="p-6 flex items-center justify-between border-b flex-row space-y-0">
                 <DialogTitle className="font-headline text-2xl font-black text-primary">Handumanan</DialogTitle>
                 <DialogDescription className="sr-only">Main menu for heritage discovery and trip planning.</DialogDescription>
                 <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setIsDrawerOpen(false)}><X size={20} /></Button>
              </DialogHeader>
              
              <ScrollArea className="flex-1">
                <div className="p-5 space-y-6">
                   <Accordion type="multiple" defaultValue={["planner"]} className="space-y-4">
                      <AccordionItem value="planner" className="border-none">
                         <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">AI Trip Planner</AccordionTrigger>
                         <AccordionContent>
                            <div className="bg-slate-50 p-4 rounded-3xl space-y-4 border border-slate-100">
                               <div className="space-y-2">
                                  <Label className="text-[10px] font-black uppercase text-slate-400">Start Location</Label>
                                  <Input value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} className="h-10 rounded-xl border-none shadow-sm text-[12px] font-bold" />
                               </div>
                               <div className="space-y-3">
                                  <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
                                     <span>Available Time</span>
                                     <span className="text-primary">{plannerTime[0]} Hours</span>
                                  </div>
                                  <Slider value={plannerTime} onValueChange={setPlannerTime} max={12} min={2} step={1} />
                               </div>
                               <Button onClick={() => { handleGeneratePlanner(); setIsDrawerOpen(false); }} disabled={isGeneratingPlanner} className="w-full rounded-2xl h-11 bg-primary text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                                  {isGeneratingPlanner ? <Loader2 className="animate-spin" size={16} /> : "Build Route"}
                               </Button>
                            </div>
                         </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="directory" className="border-none">
                         <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Explore Sites</AccordionTrigger>
                         <AccordionContent>
                            <div className="space-y-2">
                               {filteredAndSortedSites.slice(0, 15).map(site => (
                                 <div key={site.id} onClick={() => { centerOnSite(site); setIsDrawerOpen(false); }} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-2xl cursor-pointer group">
                                    <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-sm shrink-0">
                                       <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-[12px] font-bold text-slate-900 leading-tight break-words">{site.name}</p>
                                       <p className="text-[9px] text-slate-400 uppercase font-black">{site.city}</p>
                                    </div>
                                 </div>
                               ))}
                            </div>
                         </AccordionContent>
                      </AccordionItem>
                   </Accordion>

                   <div className="pt-4 space-y-1 border-t">
                      <Link href="/" className="flex items-center gap-3 p-3.5 hover:bg-slate-50 rounded-2xl text-slate-600 font-bold transition-all"><Home size={18} /> Home</Link>
                      <Link href="/profile" className="flex items-center gap-3 p-3.5 hover:bg-slate-50 rounded-2xl text-slate-600 font-bold transition-all"><Settings size={18} /> My Profile</Link>
                   </div>
                </div>
              </ScrollArea>
           </div>
        </DialogContent>
      </Dialog>

      {/* ITINERARY MANAGER (BOTTOM CENTER DESKTOP) */}
      {itineraryIds.length > 0 && !isNavigating && (
        <div className={cn(
          "absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[360px] px-4 pointer-events-none transition-all duration-500",
          isMobile ? "bottom-20" : "bottom-10"
        )}>
          <Card className="pointer-events-auto rounded-[2.5rem] shadow-2xl bg-white/95 backdrop-blur-2xl p-5 ring-1 ring-black/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-2 rounded-xl text-primary"><Route size={18} /></div>
                <div>
                  <p className="text-[9px] font-black uppercase text-slate-400">Current Trip</p>
                  <p className="text-[13px] font-black text-slate-900">{itineraryIds.length} Stops</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8" onClick={() => setItineraryIds([])}><Trash2 size={16} /></Button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
               <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Total</span>
                  <p className="text-[16px] font-black text-primary">{totalDist.toFixed(1)} KM</p>
               </div>
               <div className="bg-slate-50 p-2.5 rounded-2xl text-center">
                  <span className="text-[9px] font-black text-slate-400 uppercase">Time</span>
                  <p className="text-[16px] font-black text-primary">~{Math.round(totalTime)} MIN</p>
               </div>
            </div>

            <div className="flex gap-2">
               <Button onClick={() => { setIsNavigating(true); setIsNavCollapsed(false); }} className="flex-1 rounded-2xl h-12 bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20">
                  <Navigation size={16} className="mr-2" /> Start Now
               </Button>
               <Button variant="outline" onClick={handleSavePlanner} className="w-12 h-12 rounded-2xl border-2 border-slate-100 flex items-center justify-center p-0">
                  <Save size={20} className="text-slate-400" />
               </Button>
            </div>
          </Card>
        </div>
      )}

      {/* KEY CONFIG DIALOG */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-10 border-none shadow-3xl bg-white/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-6"><Navigation size={32} /></div>
            <DialogTitle className="text-3xl font-black text-slate-900">Map Key Required</DialogTitle>
            <DialogDescription className="py-4 text-slate-500 font-medium">Please provide your OpenRouteService API key to enable road-accurate navigation through Metro Cebu.</DialogDescription>
          </DialogHeader>
          <Input placeholder="Enter API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-14 rounded-2xl bg-slate-100/80 border-none px-6 font-mono text-[12px]" />
          <DialogFooter className="mt-8">
            <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[12px] uppercase tracking-widest shadow-xl shadow-primary/30" onClick={handleSaveKey}>Initialize Maps</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExploreRoutePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={64} /></div>}>
      <ExploreRouteContent />
    </Suspense>
  );
}

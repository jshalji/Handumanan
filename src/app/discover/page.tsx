'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
import { generatePersonalizedItinerary } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Navigation, 
  Loader2, 
  Search,
  LocateFixed,
  X,
  Route,
  Home,
  Save,
  Church,
  Landmark,
  TreePine,
  Menu,
  Trash2,
  MapPin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save as SaveIcon,
  ArrowUp,
  ArrowDown,
  Clock,
  Compass,
  Settings
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
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);

  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerStart, setPlannerStart] = useState('Cebu City Center');
  const [plannerTime, setPlannerTime] = useState([4]);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();

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
      setRecenterKey(prev => prev + 1);
      return loc;
    } catch (err) {
      toast({ title: "Location Error", description: "Unable to retrieve your location.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const centerOnSite = (site: HeritageSite | any) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
    setIsNavigating(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
  };

  const handleGeneratePlanner = async (time?: number) => {
    const hours = time || plannerTime[0];
    setIsGeneratingPlanner(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: plannerStart,
        availableTimeHours: hours,
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
      toast({ title: "Itinerary Ready", description: `Route generated for ${hours} hours.` });
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

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newIds = [...itineraryIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex >= 0 && targetIndex < newIds.length) {
      [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
      setItineraryIds(newIds);
    }
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

      {/* TOP HEADER (SEARCH + MENU) */}
      <div className="absolute top-4 left-4 right-4 z-50 flex flex-col items-start gap-3 pointer-events-none md:max-w-[320px] md:right-auto md:top-6 md:left-6">
        <div className="flex gap-2 items-center pointer-events-auto w-full">
          <Button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            size="icon" 
            className="h-11 w-11 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            <Menu size={20} />
          </Button>

          <div className="relative group flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={16} />
            <Input 
              placeholder="Search heritage..." 
              className="pl-10 h-11 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-[12px] ring-1 ring-black/5" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* FLOATING DISCOVERY PANEL */}
        {!isNavigating && (
           <Card className={cn(
             "pointer-events-auto border-none shadow-2xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 w-full rounded-[1.5rem] flex flex-col transition-all duration-300",
             isPanelExpanded ? "max-h-[50vh]" : "max-h-[56px]"
           )}>
              <div 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50/50 rounded-t-[1.5rem]"
                onClick={() => setIsPanelExpanded(!isPanelExpanded)}
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Compass size={16} /></div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-900">Discover</span>
                </div>
                {isPanelExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
              </div>

              {isPanelExpanded && (
                <ScrollArea className="flex-1 px-4 pb-4">
                  <div className="space-y-6 pt-2">
                    {/* Step 1: City */}
                    <div className="space-y-3">
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Step 1: Location</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {CITIES.map(city => (
                          <button 
                            key={city} 
                            onClick={() => handleCitySelect(city)} 
                            className={cn(
                              "text-[10px] font-bold py-2.5 px-2 rounded-xl transition-all border",
                              selectedCity === city 
                                ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" 
                                : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                            )}
                          >
                            {city}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Category (Unlocked) */}
                    {selectedCity && (
                      <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Step 2: Category</p>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORIES.map(cat => (
                            <button 
                              key={cat.value} 
                              onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 rounded-xl transition-all border",
                                selectedCategory === cat.value 
                                  ? "bg-slate-900 text-white border-slate-900 shadow-lg" 
                                  : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                              )}
                            >
                              <cat.icon size={12} />
                              <span className="text-[10px] font-bold">{cat.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Smart Suggestions */}
                    <div className="space-y-3 pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">AI Suggestions</p>
                        <Badge variant="outline" className="text-[7px] font-black opacity-50 px-1.5 h-4">SMART</Badge>
                      </div>
                      <div className="space-y-2">
                        {aiSuggestions.map(site => (
                          <div 
                            key={site.id} 
                            onClick={() => centerOnSite(site)} 
                            className="group bg-white rounded-2xl border border-slate-100 p-2.5 hover:border-primary/30 transition-all cursor-pointer flex gap-3 items-center"
                          >
                            <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0">
                              <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-black text-slate-900 truncate">{site.name}</h4>
                              <p className="text-[8px] font-bold text-slate-400 uppercase">{site.city} • {site.distance?.toFixed(1)}km</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              )}
           </Card>
        )}
      </div>

      {/* NAVIGATION ACTIVE STATUS (TOP RIGHT) */}
      {isNavigating && userLocation && itinerarySites.length > 0 && (
        <div className={cn(
          "absolute z-[70] transition-all duration-500 pointer-events-none",
          isMobile ? "bottom-0 left-0 right-0" : "top-6 right-6 w-[280px]"
        )}>
          <Card className={cn(
            "pointer-events-auto border-none shadow-2xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5",
            isMobile ? "rounded-t-[2rem]" : "rounded-[1.5rem] p-4"
          )}>
            {isMobile && (
              <div className="p-4 flex flex-col items-center" onClick={() => setIsNavCollapsed(!isNavCollapsed)}>
                <div className="w-8 h-1 rounded-full bg-slate-200 mb-4" />
                <div className="w-full flex items-center justify-between px-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                    <div>
                      <p className="text-[8px] font-black uppercase text-primary tracking-widest leading-none mb-1">Navigation Active</p>
                      <h4 className="text-[13px] font-black text-slate-900 leading-tight truncate max-w-[180px]">{itinerarySites[0].name}</h4>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setIsNavigating(false); }}>
                    <X size={18} />
                  </Button>
                </div>
              </div>
            )}

            <div className={cn(
              "px-4 pb-6 space-y-4",
              isMobile && isNavCollapsed ? "hidden" : "block"
            )}>
              {!isMobile && (
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">On Route</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-red-500" onClick={() => setIsNavigating(false)}>
                    <X size={16} />
                  </Button>
                </div>
              )}

              {!isMobile && (
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black uppercase text-primary tracking-widest">Next Destination</p>
                  <h4 className="text-[14px] font-black text-slate-900 leading-tight">{itinerarySites[0].name}</h4>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">Remain</p>
                  <p className="text-[14px] font-black text-primary leading-none">{totalDist.toFixed(1)} KM</p>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-tighter mb-0.5">ETA</p>
                  <p className="text-[14px] font-black text-primary leading-none">{Math.round(totalTime)} MIN</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleRecenter} className="flex-1 rounded-xl h-10 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest">
                  Recenter
                </Button>
                <Button onClick={() => setIsNavigating(false)} variant="outline" className="flex-1 rounded-xl h-10 border-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest">
                  End
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* BOTTOM RIGHT CONTROLS STACK */}
      <div className="absolute bottom-6 right-6 z-[65] flex flex-col gap-3 pointer-events-none">
        <Button 
          onClick={detectLocation}
          size="icon" 
          className="h-12 w-12 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 pointer-events-auto ring-1 ring-black/5"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </Button>
        {/* Chatbot bubble is handled globally in layout, but spacer/position matches user request */}
        <div className="h-14 w-14" /> 
      </div>

      {/* NAVIGATION DRAWER (HAMBURGER MENU) */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 z-[100] bg-white shadow-2xl transition-transform duration-500 ease-in-out flex flex-col",
        isMobile ? "w-[180px]" : "w-[220px]",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
         <div className="p-5 flex items-center justify-between border-b shrink-0 bg-white">
            <h2 className="font-headline text-lg font-black text-primary truncate">Handumanan</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsDrawerOpen(false)}>
              <X size={16} />
            </Button>
         </div>
         
         <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
               <Accordion type="multiple" defaultValue={["planner"]} className="space-y-4">
                  <AccordionItem value="planner" className="border-none">
                     <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left whitespace-normal break-words">AI Route Planner</AccordionTrigger>
                     <AccordionContent>
                        <div className="bg-slate-50 p-3 rounded-xl space-y-4 border border-slate-100">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Starting At</Label>
                              <Input value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} className="h-8 rounded-lg border-none shadow-sm text-[10px] font-bold bg-white" />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-1.5">
                              <Button variant="outline" onClick={() => handleGeneratePlanner(4)} disabled={isGeneratingPlanner} className="h-8 rounded-lg text-[8px] font-black uppercase border-slate-200 bg-white hover:bg-primary/5 hover:text-primary transition-all">
                                Half-Day (4h)
                              </Button>
                              <Button variant="outline" onClick={() => handleGeneratePlanner(8)} disabled={isGeneratingPlanner} className="h-8 rounded-lg text-[8px] font-black uppercase border-slate-200 bg-white hover:bg-primary/5 hover:text-primary transition-all">
                                Full-Day (8h)
                              </Button>
                           </div>

                           <Button onClick={() => handleGeneratePlanner()} disabled={isGeneratingPlanner} className="w-full rounded-lg h-9 bg-primary text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                              {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : "Custom Build"}
                           </Button>
                        </div>

                        {/* Itinerary Manager inside Sidebar */}
                        {itineraryIds.length > 0 && (
                          <div className="mt-4 space-y-3">
                             <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Itinerary</p>
                             <div className="space-y-1.5">
                                {itineraryIds.map((id, idx) => {
                                  const site = HERITAGE_SITES.find(s => s.id === id);
                                  if (!site) return null;
                                  return (
                                    <div key={id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 group">
                                      <span className="text-[10px] font-black text-primary w-4">{idx + 1}</span>
                                      <p className="text-[9px] font-bold text-slate-700 flex-1 truncate">{site.name}</p>
                                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => moveItem(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-400 hover:text-primary disabled:opacity-20"><ArrowUp size={10} /></button>
                                        <button onClick={() => moveItem(idx, 'down')} disabled={idx === itineraryIds.length - 1} className="p-0.5 text-slate-400 hover:text-primary disabled:opacity-20"><ArrowDown size={10} /></button>
                                        <button onClick={() => toggleSite(id)} className="p-0.5 text-slate-400 hover:text-red-500"><Trash2 size={10} /></button>
                                      </div>
                                    </div>
                                  )
                                })}
                             </div>
                             <div className="flex gap-1.5 pt-2">
                                <Button onClick={() => { setIsNavigating(true); setIsDrawerOpen(false); }} className="flex-1 h-8 rounded-lg bg-slate-900 text-[8px] font-black uppercase tracking-widest">Start Now</Button>
                                <Button onClick={handleSavePlanner} variant="outline" className="h-8 w-8 p-0 rounded-lg"><SaveIcon size={14} /></Button>
                                <Button onClick={() => setItineraryIds([])} variant="ghost" className="h-8 w-8 p-0 rounded-lg text-red-500"><Trash2 size={14} /></Button>
                             </div>
                          </div>
                        )}
                     </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="directory" className="border-none">
                     <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left whitespace-normal break-words">Quick Directory</AccordionTrigger>
                     <AccordionContent>
                        <div className="space-y-1">
                           {filteredAndSortedSites.slice(0, 8).map(site => (
                             <div key={site.id} onClick={() => { centerOnSite(site); setIsDrawerOpen(false); }} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded-lg cursor-pointer group">
                                <div className="relative w-6 h-6 rounded-md overflow-hidden shrink-0 shadow-sm">
                                   <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-900 leading-tight truncate flex-1">{site.name}</p>
                             </div>
                           ))}
                        </div>
                     </AccordionContent>
                  </AccordionItem>
               </Accordion>

               <div className="pt-4 space-y-1 border-t">
                  <Link href="/" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all text-xs"><Home size={14} /> Home</Link>
                  <Link href="/profile" className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-lg text-slate-600 font-bold transition-all text-xs"><Settings size={14} /> Profile</Link>
               </div>
            </div>
         </ScrollArea>
      </div>

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

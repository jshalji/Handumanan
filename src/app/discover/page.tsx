'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
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
  Settings,
  Trash2,
  MapPin,
  ChevronRight,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save as SaveIcon
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
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);

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

  const centerOnSite = (site: HeritageSite | any) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
    setIsNavigating(false);
    if ('vibrate' in navigator) navigator.vibrate(50);
    if (isMobile) setIsSheetExpanded(false);
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
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
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
                      <h4 className="text-[14px] font-black text-slate-900 leading-tight whitespace-normal break-words">{itinerarySites[0].name}</h4>
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
                  <h4 className="text-[16px] font-black text-slate-900 leading-tight whitespace-normal break-words">{itinerarySites[0].name}</h4>
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

      {/* DISCOVERY BOTTOM SHEET */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[60] bg-white/95 backdrop-blur-2xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] transition-all duration-500 ease-in-out border-t border-slate-100",
        isSheetExpanded ? "h-[60vh]" : "h-20",
        isNavigating && "hidden"
      )}>
        {/* Toggle Handle */}
        <div 
          onClick={() => setIsSheetExpanded(!isSheetExpanded)}
          className="h-20 flex items-center justify-between px-6 cursor-pointer hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary"><Search size={20} /></div>
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Explore Heritage</p>
              <p className="text-[13px] font-black text-slate-900 leading-none">
                {selectedCity ? (
                  <span className="text-primary">{selectedCity} {selectedCategory && `> ${selectedCategory.split(' ')[0]}`}</span>
                ) : (
                  "Discover Path | Smart Suggestions"
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(selectedCity || selectedCategory) && (
               <Button variant="ghost" size="sm" className="h-8 text-[9px] font-black uppercase text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); setSelectedCity(null); setSelectedCategory(null); }}>
                 Clear
               </Button>
            )}
            <div className="p-2 rounded-full bg-slate-100">
              {isSheetExpanded ? <ChevronDown size={20} className="text-slate-500" /> : <ChevronUp size={20} className="text-slate-500" />}
            </div>
          </div>
        </div>

        <ScrollArea className="h-[calc(60vh-80px)] px-6 pb-12">
          <div className="space-y-8 py-4">
            {/* Discover Path Content */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">Step 1</Badge>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Select Location</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {CITIES.map(city => (
                  <button 
                    key={city} 
                    onClick={() => handleCitySelect(city)} 
                    className={cn(
                      "flex flex-col items-center justify-center p-4 rounded-3xl transition-all border-2",
                      selectedCity === city 
                        ? "bg-primary/5 border-primary shadow-lg shadow-primary/5 scale-[1.02]" 
                        : "bg-slate-50 border-transparent hover:bg-slate-100"
                    )}
                  >
                    <MapPin size={24} className={cn("mb-2", selectedCity === city ? "text-primary" : "text-slate-400")} />
                    <span className={cn("text-[11px] font-bold text-center", selectedCity === city ? "text-primary" : "text-slate-600")}>{city}</span>
                  </button>
                ))}
              </div>

              {selectedCity && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase">Step 2</Badge>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Filter Category</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button 
                        key={cat.value} 
                        onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                        className={cn(
                          "flex items-center gap-3 px-5 py-3 rounded-2xl transition-all border-2",
                          selectedCategory === cat.value 
                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.05]" 
                            : "bg-white border-slate-100 text-slate-600 hover:border-primary/30"
                        )}
                      >
                        <cat.icon size={16} />
                        <span className="text-[12px] font-black uppercase tracking-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Suggestions Content */}
            <div className="pt-8 border-t border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 rounded-lg text-accent"><Sparkles size={16} /></div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Smart Suggestions</h3>
                </div>
                <Badge variant="outline" className="text-[8px] font-black opacity-50">AI POWERED</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {aiSuggestions.map(site => (
                  <div 
                    key={site.id} 
                    onClick={() => centerOnSite(site)} 
                    className="group bg-white rounded-[2rem] border border-slate-100 p-3 hover:border-primary/30 hover:shadow-2xl transition-all cursor-pointer flex gap-4 items-center"
                  >
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-inner">
                      <Image src={site.imageUrl} alt={site.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[13px] font-black text-slate-900 leading-tight truncate mb-1">{site.name}</h4>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-2">{site.city} • {site.distance?.toFixed(1)}km</p>
                      <div className="flex gap-1">
                        {site.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[7px] font-black uppercase px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100">#{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-2 text-slate-200 group-hover:text-primary transition-colors">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* No Results Fallback */}
            {filteredAndSortedSites.length === 0 && (
              <div className="py-20 text-center space-y-4 bg-slate-50/50 rounded-[3rem]">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm text-slate-200"><MapPin size={32} /></div>
                <p className="text-sm font-bold text-slate-400">No heritage sites found for this selection.</p>
                <Button variant="ghost" className="text-[10px] font-black uppercase text-primary" onClick={() => { setSelectedCity(null); setSelectedCategory(null); }}>Reset Filters</Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* NAVIGATION DRAWER (HAMBURGER MENU) */}
      <div className={cn(
        "fixed left-0 top-0 bottom-0 z-[100] bg-white shadow-2xl transition-transform duration-500 ease-in-out flex flex-col",
        isMobile ? "w-[180px]" : "w-[220px]",
        isDrawerOpen ? "translate-x-0" : "-translate-x-full"
      )}>
         <div className="p-6 flex items-center justify-between border-b shrink-0 bg-white">
            <h2 className="font-headline text-xl font-black text-primary truncate">Menu</h2>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsDrawerOpen(false)}>
              <X size={18} />
            </Button>
         </div>
         
         <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
               <Accordion type="multiple" defaultValue={["planner"]} className="space-y-4">
                  <AccordionItem value="planner" className="border-none">
                     <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left whitespace-normal break-words">AI Trip Planner</AccordionTrigger>
                     <AccordionContent>
                        <div className="bg-slate-50 p-3 rounded-2xl space-y-4 border border-slate-100">
                           <div className="space-y-1.5">
                              <Label className="text-[9px] font-black uppercase text-slate-400">Start</Label>
                              <Input value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} className="h-9 rounded-xl border-none shadow-sm text-[11px] font-bold" />
                           </div>
                           <div className="space-y-2">
                              <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                 <span>Time</span>
                                 <span className="text-primary">{plannerTime[0]}h</span>
                              </div>
                              <Slider value={plannerTime} onValueChange={setPlannerTime} max={12} min={2} step={1} />
                           </div>
                           <Button onClick={() => { handleGeneratePlanner(); setIsDrawerOpen(false); }} disabled={isGeneratingPlanner} className="w-full rounded-xl h-9 bg-primary text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                              {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : "Build Route"}
                           </Button>
                        </div>
                     </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="directory" className="border-none">
                     <AccordionTrigger className="hover:no-underline py-0 mb-4 text-[9px] font-black uppercase tracking-widest text-slate-400 text-left whitespace-normal break-words">Explore Sites</AccordionTrigger>
                     <AccordionContent>
                        <div className="space-y-1">
                           {filteredAndSortedSites.slice(0, 10).map(site => (
                             <div key={site.id} onClick={() => { centerOnSite(site); setIsDrawerOpen(false); }} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl cursor-pointer group">
                                <div className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 shadow-sm">
                                   <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                                </div>
                                <div className="flex-1 min-w-0">
                                   <p className="text-[10px] font-bold text-slate-900 leading-tight whitespace-normal break-words">{site.name}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </AccordionContent>
                  </AccordionItem>
               </Accordion>

               <div className="pt-4 space-y-1 border-t">
                  <Link href="/" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 font-bold transition-all text-sm"><Home size={16} /> Home</Link>
                  <Link href="/profile" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl text-slate-600 font-bold transition-all text-sm"><Settings size={16} /> Profile</Link>
               </div>
            </div>
         </ScrollArea>
      </div>

      {/* ITINERARY MANAGER (ANCHORED ABOVE BOTTOM SHEET HANDLE) */}
      {itineraryIds.length > 0 && !isNavigating && (
        <div className={cn(
          "absolute left-1/2 -translate-x-1/2 z-[55] w-full max-w-[360px] px-4 pointer-events-none transition-all duration-500",
          isSheetExpanded ? "bottom-[62vh]" : "bottom-24"
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
               <Button onClick={() => { setIsNavigating(true); setIsNavCollapsed(false); setIsSheetExpanded(false); }} className="flex-1 rounded-2xl h-12 bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20">
                  <Navigation size={16} className="mr-2" /> Start Now
               </Button>
               <Button variant="outline" onClick={handleSavePlanner} className="w-12 h-12 rounded-2xl border-2 border-slate-100 flex items-center justify-center p-0">
                  <SaveIcon size={20} className="text-slate-400" />
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

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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Navigation, 
  Loader2, 
  Search,
  LocateFixed,
  X,
  Home,
  Church,
  Landmark,
  TreePine,
  Menu,
  Trash2,
  MapPin,
  ChevronUp,
  ChevronDown,
  Sparkles,
  Save as SaveIcon,
  ArrowUp,
  Compass,
  Clock,
  Plus,
  Building2,
  Route
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
  { label: "Churches & Religious Heritage Sites", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Ancestral Houses & Heritage Residences", value: "Ancestral Houses & Heritage Residences", icon: Home },
  { label: "Museums & Cultural Institutions", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Historical Landmarks & Monuments", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Plazas, Parks & Public Spaces", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Government & Historic Buildings", value: "Government & Historic Buildings", icon: Building2 },
  { label: "Cultural & Religious (Non-Catholic Sites)", value: "Cultural & Religious (Non-Catholic Sites)", icon: Church }
];

const TIME_PRESETS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: 'Half-Day', value: 4 },
  { label: 'Full-Day', value: 8 },
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
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [cityTarget, setCityTarget] = useState<{ lat: number; lng: number; zoom: number; timestamp: number } | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerTimeType, setPlannerTimeType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetTime, setSelectedPresetTime] = useState(4);
  const [customHours, setCustomHours] = useState('3');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();

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
  }, [detectLocation]);

  const allSites = useMemo(() => {
    let result = HERITAGE_SITES.map(site => ({
      ...site,
      coordinates: site.coordinates
    })) as HeritageSite[];

    if (selectedCity) result = result.filter(s => s.city === selectedCity);
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    return result;
  }, [selectedCity, selectedCategory]);

  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));
    if (searchQuery && !showSuggestions) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allSites, userLocation, searchQuery, showSuggestions]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds]);

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

  const centerOnSite = (site: HeritageSite) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
    setIsNavigating(false);
  };

  const handleGeneratePlanner = async () => {
    let hours = selectedPresetTime;
    if (plannerTimeType === 'custom') {
      hours = (parseInt(customHours) || 0) + ((parseInt(customMinutes) || 0) / 60);
    }
    
    setIsGeneratingPlanner(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: selectedCity || 'Cebu City Center',
        availableTimeHours: hours,
        interests: ["General Interest"],
        siteDatabase: JSON.stringify(HERITAGE_SITES)
      });
      const suggestedIds = output.itinerary
        .map(item => HERITAGE_SITES.find(s => s.name.toLowerCase() === item.siteName.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      if (suggestedIds.length > 0) {
        setItineraryIds(suggestedIds);
        centerOnSite(HERITAGE_SITES.find(s => s.id === suggestedIds[0])!);
      }
    } catch (error) {
      toast({ title: "Planner Error", description: "Failed to generate itinerary.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  const handleSavePlanner = () => {
    if (!user || !db || itineraryIds.length === 0) return;
    setDocumentNonBlocking(doc(collection(db, 'users', user.uid, 'itineraries')), {
      userId: user.uid,
      itineraryIds,
      summary: `${itineraryIds.length} stops in Metro Cebu`,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved" });
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

      <div className="absolute top-3 left-3 right-3 z-50 flex flex-col items-start gap-2 pointer-events-none md:max-w-[420px] md:top-6 md:left-6">
        <div className="flex gap-2 items-center pointer-events-auto w-full">
          <Button 
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            <Menu size={18} />
          </Button>

          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="Search heritage..." 
              className="pl-9 h-10 rounded-xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full text-xs font-bold" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button 
            onClick={detectLocation}
            size="icon" 
            className="h-10 w-10 shrink-0 rounded-xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <LocateFixed size={18} />}
          </Button>
        </div>

        {isPanelExpanded && (
          <Card className="pointer-events-auto w-full border-none shadow-2xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 rounded-2xl flex flex-col overflow-hidden max-h-[60vh]">
            <Tabs defaultValue="discover" className="w-full flex flex-col">
              <TabsList className="grid w-full grid-cols-2 bg-slate-50 rounded-none h-12">
                <TabsTrigger value="discover" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white">
                  <Compass size={14} className="mr-2" /> Discover
                </TabsTrigger>
                <TabsTrigger value="planner" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white">
                  <Sparkles size={14} className="mr-2" /> AI Planner
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto scrollbar-hide">
                <TabsContent value="discover" className="m-0 p-4 space-y-5 animate-in fade-in duration-300">
                  <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Cities</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {CITIES.map(city => (
                        <button 
                          key={city} 
                          onClick={() => { setSelectedCity(city); setCityTarget({ ...CITY_COORDS[city], timestamp: Date.now() }); }} 
                          className={cn(
                            "text-[10px] font-bold py-2 rounded-xl transition-all border min-h-[44px]",
                            selectedCity === city ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Categories</p>
                    <div className="grid grid-cols-1 gap-1">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.value} 
                          onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all border text-left leading-tight min-h-[44px]",
                            selectedCategory === cat.value ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600"
                          )}
                        >
                          <cat.icon size={14} className="shrink-0" />
                          <span className="text-[10px] font-bold break-words">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {itineraryIds.length > 0 && (
                    <div className="pt-4 border-t space-y-3">
                       <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Active Route</p>
                       <div className="space-y-1.5">
                         {itineraryIds.map((id, idx) => {
                           const site = HERITAGE_SITES.find(s => s.id === id);
                           return site ? (
                             <div key={id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                               <span className="text-[10px] font-black text-primary">{idx + 1}</span>
                               <span className="text-[10px] font-bold text-slate-700 flex-1 truncate">{site.name}</span>
                               <button onClick={() => toggleSite(id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                             </div>
                           ) : null;
                         })}
                       </div>
                       <Button onClick={() => setIsNavigating(true)} className="w-full h-11 bg-primary text-[10px] font-black uppercase tracking-widest rounded-xl">
                         <Route size={14} className="mr-2" /> Start Navigation
                       </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="planner" className="m-0 p-4 space-y-6 animate-in fade-in duration-300">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Travel Duration</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_PRESETS.map(preset => (
                          <button 
                            key={preset.value}
                            onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }}
                            className={cn(
                              "px-3 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all h-11",
                              plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-slate-100 text-slate-500"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <Button onClick={handleGeneratePlanner} disabled={isGeneratingPlanner} className="w-full h-12 rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                      {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : "Build Itinerary"}
                    </Button>

                    {itineraryIds.length > 0 && (
                      <Button variant="outline" onClick={handleSavePlanner} className="w-full h-12 rounded-xl text-[10px] font-black uppercase tracking-widest border-2">
                        <SaveIcon size={14} className="mr-2" /> Save Trip
                      </Button>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        )}
      </div>

      {isNavigating && userLocation && itinerarySites.length > 0 && (
        <div className="absolute bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-[320px] z-[70] pointer-events-none">
          <Card className="pointer-events-auto border-none shadow-3xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 rounded-3xl p-4 animate-in slide-in-from-bottom-4">
            <div className="flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">In Transit</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-red-50 text-red-500" onClick={() => setIsNavigating(false)}><X size={16} /></Button>
              </div>
              <h4 className="text-sm font-black text-slate-900 mb-1 text-center w-full truncate">{itinerarySites[0].name}</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{itinerarySites[0].city}</p>
              
              <div className="grid grid-cols-2 gap-2 w-full">
                 <div className="bg-slate-50 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Total Distance</p>
                    <p className="text-sm font-black text-primary">{totalDist.toFixed(1)} KM</p>
                 </div>
                 <div className="bg-slate-50 p-3 rounded-2xl text-center">
                    <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Est. Arrival</p>
                    <p className="text-sm font-black text-primary">{Math.round(totalTime)} MIN</p>
                 </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-xs rounded-3xl p-6 border-none shadow-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Map Key Required</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Enter your OpenRouteService API key to enable road-accurate routing.</DialogDescription>
          </DialogHeader>
          <Input placeholder="API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-11 rounded-xl bg-slate-100 border-none px-4" />
          <DialogFooter className="mt-4">
            <Button className="w-full h-11 rounded-xl bg-primary text-white font-black text-[10px] uppercase tracking-widest" onClick={handleSaveKey}>Initialize Maps</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function ExploreRoutePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" size={48} /></div>}>
      <ExploreRouteContent />
    </Suspense>
  );
}

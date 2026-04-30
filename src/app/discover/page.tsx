'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
import { generatePersonalizedItinerary } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Church,
  Landmark,
  TreePine,
  Menu,
  Trash2,
  MapPin,
  ChevronDown,
  Sparkles,
  Save as SaveIcon,
  Compass,
  Plus,
  Building2,
  Route,
  Home,
  Clock
} from 'lucide-react';
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
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
import Link from 'next/link';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black uppercase tracking-widest text-[10px] opacity-30">Map Initializing...</div>
});

const CITIES = ["Cebu City", "Mandaue City", "Talisay City", "Lapu-Lapu City"];

const CATEGORIES = [
  { label: "Churches & Religious Heritage Sites", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Ancestral Houses & Heritage Residences", value: "Ancestral Houses & Heritage Residences", icon: Landmark },
  { label: "Museums & Cultural Institutions", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Historical Landmarks & Monuments", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Plazas, Parks & Public Spaces", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Government & Historic Buildings", value: "Government & Historic Buildings", icon: Building2 },
  { label: "Cultural & Religious (Non-Catholic Sites)", value: "Cultural & Religious (Non-Catholic Sites)", icon: Church }
];

const TIME_PRESETS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: 'Half Day', value: 4 },
  { label: 'Full Day', value: 8 },
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
  const [recenterKey, setRecenterKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
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
    } catch (err: any) {
      toast({ title: "Location Error", description: "Location permission is required to show your position.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const allSites = useMemo(() => {
    let result = HERITAGE_SITES;
    if (selectedCity) result = result.filter(s => s.city === selectedCity);
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    return result;
  }, [selectedCity, selectedCategory]);

  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return result;
  }, [allSites, userLocation, searchQuery]);

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
    if (itineraryIds.includes(id)) {
      setItineraryIds(prev => prev.filter(i => i !== id));
    } else {
      setItineraryIds(prev => [...prev, id]);
      toast({ title: "Added to Itinerary" });
    }
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
          recenterKey={recenterKey}
        />
      </div>

      <div className="absolute top-3 left-3 right-3 z-50 flex flex-col items-start gap-2 pointer-events-none md:max-w-[320px] md:top-6 md:left-6">
        <div className="flex gap-2 items-center pointer-events-auto w-full">
          <Button 
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            size="icon" 
            className="h-9 w-9 shrink-0 rounded-xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            <Menu size={16} />
          </Button>

          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
            <Input 
              placeholder="Search heritage..." 
              className="pl-8 h-9 rounded-xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full text-xs font-bold" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border-none ring-1 ring-black/5 max-h-[200px] overflow-y-auto pointer-events-auto scrollbar-hide">
                {filteredAndSortedSites.slice(0, 8).map(site => (
                  <button 
                    key={site.id} 
                    onClick={() => { centerOnSite(site); setSearchQuery(''); }}
                    className="w-full text-left p-2.5 hover:bg-slate-50 flex flex-col gap-0.5 border-b border-slate-50 last:border-none"
                  >
                    <span className="text-[11px] font-black text-slate-900">{site.name}</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{site.city}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <Button 
            onClick={detectLocation}
            size="icon" 
            className="h-9 w-9 shrink-0 rounded-xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <LocateFixed size={16} />}
          </Button>
        </div>

        {isPanelExpanded && (
          <Card 
            className="pointer-events-auto w-full border-none shadow-2xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 rounded-2xl flex flex-col overflow-hidden max-h-[60vh] md:max-h-[70vh] mt-2 z-[1000]"
          >
            <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50/50 border-b shrink-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Discover & Plan</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsPanelExpanded(false)}>
                <ChevronDown size={14} />
              </Button>
            </div>
            
            <Tabs defaultValue="discover" className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 bg-slate-50 rounded-none h-9 shrink-0">
                <TabsTrigger value="discover" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white">
                  <Compass size={12} className="mr-1.5" /> Discover
                </TabsTrigger>
                <TabsTrigger value="planner" className="text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white">
                  <Sparkles size={12} className="mr-1.5" /> AI Planner
                </TabsTrigger>
              </TabsList>
              
              <div 
                className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain pb-8 scrollbar-hide pointer-events-auto"
                style={{ WebkitOverflowScrolling: 'touch' }}
              >
                <TabsContent value="discover" className="m-0 p-2.5 space-y-3 animate-in fade-in duration-300">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Cities</p>
                    <div className="grid grid-cols-2 gap-1">
                      {CITIES.map(city => (
                        <button 
                          key={city} 
                          onClick={() => setSelectedCity(selectedCity === city ? null : city)} 
                          className={cn(
                            "text-[9px] font-bold py-1.5 rounded-xl transition-all border h-8",
                            selectedCity === city ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Categories</p>
                    <div className="grid grid-cols-1 gap-1">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.value} 
                          onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                          className={cn(
                            "flex items-center gap-2 px-2.5 py-1.5 rounded-xl transition-all border text-left min-h-[36px]",
                            selectedCategory === cat.value ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600"
                          )}
                        >
                          <cat.icon size={12} className="shrink-0" />
                          <span className="text-[9px] font-bold leading-tight break-words">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Heritage Sites</p>
                    <div className="space-y-1">
                       {filteredAndSortedSites.slice(0, 10).map(site => (
                         <div key={site.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex-1 truncate mr-2">
                               <p className="text-[10px] font-bold text-slate-900 truncate">{site.name}</p>
                               <p className="text-[8px] text-slate-400 font-bold uppercase">{site.city}</p>
                            </div>
                            <Button 
                              onClick={() => toggleSite(site.id)}
                              size="icon" 
                              className={cn(
                                "h-7 w-7 rounded-lg shrink-0",
                                itineraryIds.includes(site.id) ? "bg-slate-200 text-slate-500 hover:bg-slate-300" : "bg-primary text-white"
                              )}
                            >
                               {itineraryIds.includes(site.id) ? <X size={12} /> : <Plus size={12} />}
                            </Button>
                         </div>
                       ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="planner" className="m-0 p-2.5 space-y-3 animate-in fade-in duration-300">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-[9px] font-black uppercase text-slate-400">Available Time</Label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {TIME_PRESETS.map(preset => (
                          <button 
                            key={preset.value}
                            onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }}
                            className={cn(
                              "px-2 py-1.5 rounded-xl text-[9px] font-black uppercase border h-8 transition-all",
                              plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-slate-100 text-slate-500"
                            )}
                          >
                            {preset.label}
                          </button>
                        ))}
                        <button 
                          onClick={() => setPlannerTimeType('custom')}
                          className={cn(
                            "px-2 py-1.5 rounded-xl text-[9px] font-black uppercase border h-8 transition-all col-span-2",
                            plannerTimeType === 'custom' ? "bg-primary text-white border-primary shadow-lg" : "bg-white border-slate-100 text-slate-500"
                          )}
                        >
                          Custom Time
                        </button>
                      </div>
                      
                      {plannerTimeType === 'custom' && (
                        <div className="flex items-center gap-2 mt-2 animate-in slide-in-from-top-1">
                          <Input type="number" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="Hr" className="h-8 text-xs rounded-lg" />
                          <span className="text-[9px] font-black text-slate-400">:</span>
                          <Input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Min" className="h-8 text-xs rounded-lg" />
                        </div>
                      )}
                    </div>
                    
                    <Button onClick={handleGeneratePlanner} disabled={isGeneratingPlanner} className="w-full h-9 rounded-xl bg-primary text-[9px] font-black uppercase tracking-widest shadow-xl shadow-primary/20">
                      {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : "Build Itinerary"}
                    </Button>

                    {itineraryIds.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t">
                        <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest px-1">Active Route</p>
                        <div className="space-y-1">
                           {itinerarySites.map((site, idx) => (
                             <div key={site.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                               <span className="text-[9px] font-black text-primary">{idx + 1}</span>
                               <span className="text-[9px] font-bold text-slate-700 flex-1 truncate">{site.name}</span>
                               <button onClick={() => toggleSite(site.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12} /></button>
                             </div>
                           ))}
                        </div>
                        <div className="flex gap-1 mt-2">
                           <Button onClick={() => setIsNavigating(true)} className="flex-1 h-9 bg-slate-900 text-[9px] font-black uppercase tracking-widest rounded-xl">
                             <Route size={12} className="mr-1.5" /> Start
                           </Button>
                           <Button variant="outline" onClick={handleSavePlanner} className="h-9 px-3 rounded-xl border-2">
                             <SaveIcon size={12} />
                           </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        )}

        {!isPanelExpanded && (
          <Button 
            onClick={() => setIsPanelExpanded(true)}
            className="pointer-events-auto h-9 px-4 rounded-full bg-white/95 backdrop-blur-xl text-primary font-black uppercase text-[9px] tracking-widest shadow-2xl ring-1 ring-black/5 hover:bg-white"
          >
            <Compass size={12} className="mr-1.5" /> Discover
          </Button>
        )}
        
        <Link href="/" className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3 py-2 rounded-xl shadow-xl ring-1 ring-black/5 hover:bg-slate-50 transition-colors">
          <Home size={14} className="text-primary" />
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">Home</span>
        </Link>
      </div>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-xs rounded-3xl p-6 border-none shadow-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900">Map Key Required</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Enter your OpenRouteService API key to enable road-accurate routing.</DialogDescription>
          </DialogHeader>
          <Input placeholder="API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-10 rounded-xl bg-slate-100 border-none px-4" />
          <DialogFooter className="mt-4">
            <Button className="w-full h-10 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest" onClick={handleSaveKey}>Initialize Maps</Button>
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

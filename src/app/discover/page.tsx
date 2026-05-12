'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti, RouteStep, getRoute } from '@/lib/routing-service';
import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
  Landmark as LandmarkIcon,
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
  RefreshCcw,
  Zap,
  LogOut,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  History
} from 'lucide-react';
import { useFirestore, useUser, useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
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
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black uppercase tracking-widest text-[10px] opacity-30">Map Initializing...</div>
});

const CITIES = ["Cebu City", "Mandaue City", "Talisay City", "Lapu-Lapu City"];

const CATEGORIES = [
  { label: "Churches & Religious Heritage Sites", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Ancestral Houses & Heritage Residences", value: "Ancestral Houses & Heritage Residences", icon: LandmarkIcon },
  { label: "Museums & Cultural Institutions", value: "Museums & Cultural Institutions", icon: LandmarkIcon },
  { label: "Historical Landmarks & Monuments", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Plazas, Parks & Public Spaces", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Government & Historic Buildings", value: "Government & Historic Buildings", icon: Building2 },
  { label: "Cultural & Religious (Non-Catholic Sites)", value: "Cultural & Religious (Non-Catholic Sites)", icon: Church }
];

function ExploreRouteContent() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  
  const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY || '';

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<RouteStep[]>([]);
  const [hasArrived, setHasArrived] = useState(false);

  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [recenterKey, setRecenterKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // NEW GENERATION STATES
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [aiItineraryData, setAiItineraryData] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const db = useFirestore();

  // LOCAL STORAGE SYNC
  useEffect(() => {
    const saved = localStorage.getItem('handumanan_draft_itinerary');
    if (saved) {
      try {
        setItineraryIds(JSON.parse(saved));
      } catch (e) {
        console.error("Storage parse error", e);
      }
    }
  }, []);

  const saveToLocal = (ids: string[]) => {
    localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(ids));
    setItineraryIds(ids);
  };

  useEffect(() => {
    const siteIdFromUrl = searchParams.get('siteId');
    if (siteIdFromUrl) {
      const site = HERITAGE_SITES.find(s => s.id === siteIdFromUrl);
      if (site) {
        setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
        if (!itineraryIds.includes(siteIdFromUrl)) {
          saveToLocal([...itineraryIds, siteIdFromUrl]);
        }
      }
    }
  }, [searchParams]);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      setRecenterKey(prev => prev + 1);
      return loc;
    } catch (err: any) {
      toast({ title: "Location Error", description: "Location permission is required.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filteredAndSortedSites = useMemo(() => {
    let result = HERITAGE_SITES;
    if (selectedCity) result = result.filter(s => s.city === selectedCity);
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    
    let mapped = result.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      mapped = mapped.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return mapped;
  }, [selectedCity, selectedCategory, userLocation, searchQuery]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds]);

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        if (isNavigating) {
          if (!userLocation || !itinerarySites[activeStopIndex] || !orsKey) return;
          const data = await getRoute(userLocation, itinerarySites[activeStopIndex].coordinates, orsKey);
          if (data) {
            setRouteCoords(data.coordinates);
            setNavigationSteps(data.steps);
            setTotalDist(data.distance);
            setTotalTime(data.duration);
          }
          return;
        }

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
      } catch (err) {
        console.warn("Routing error suppressed", err);
      }
    };
    fetchRoute();
  }, [itineraryIds, orsKey, itinerarySites, isNavigating, activeStopIndex, userLocation]);

  const toggleSite = (id: string) => {
    if (itineraryIds.includes(id)) {
      saveToLocal(itineraryIds.filter(i => i !== id));
    } else {
      saveToLocal([...itineraryIds, id]);
      toast({ title: "Added to Itinerary", description: "Optimize your route in the AI Planner." });
    }
  };

  const handleStartNavigation = async () => {
    if (itineraryIds.length === 0) {
      toast({ title: "No Destination", description: "Select at least one heritage site." });
      return;
    }
    const loc = await detectLocation();
    if (!loc) return;
    setIsNavigating(true);
    setActiveStopIndex(0);
    setHasArrived(false);
    setIsPanelExpanded(false);
    toast({ title: "Navigation Started", description: `Heading to ${itinerarySites[0].name}` });
  };

  const handleNextStop = () => {
    if (activeStopIndex < itineraryIds.length - 1) {
      setActiveStopIndex(prev => prev + 1);
      setHasArrived(false);
    } else {
      setIsNavigating(false);
      toast({ title: "Journey Complete", description: "All stops reached!" });
    }
  };

  // BASIC GENERATE PLANNER (LOCAL ONLY)
  const handleAutoGenerateFromLocal = async () => {
    if (itineraryIds.length === 0) {
      toast({ title: "No Data Found", description: "Please add sites to your itinerary first.", variant: "destructive" });
      return;
    }

    setIsGeneratingPlanner(true);
    try {
      const selectedSites = itineraryIds.map(id => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean);
      const output = await generatePersonalizedItinerary({
        selectedSitesJson: JSON.stringify(selectedSites.map(s => ({ id: s!.id, name: s!.name }))),
        availableTimeHours: 4
      });

      setAiItineraryData(output);
      
      // Update local order based on AI logic
      const orderedIds = output.itinerary.map(item => item.siteId);
      if (orderedIds.length > 0) {
        saveToLocal(orderedIds);
      }

      setIsResultModalOpen(true);
      toast({ title: "Planner Generated", description: "View your logical day plan below." });
    } catch (error: any) {
      toast({ title: "Generation Error", description: error.message || "Failed to generate plan.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  const handleSavePlanner = () => {
    if (!user || !db || itineraryIds.length === 0) {
      toast({ title: "Login Required", description: "Sign in to save itineraries." });
      return;
    }
    setDocumentNonBlocking(doc(collection(db, 'users', user.uid, 'itineraries')), {
      userId: user.uid,
      itineraryIds,
      summary: aiItineraryData?.summary || `${itineraryIds.length} stops planned`,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Access this trip in your profile." });
    setIsResultModalOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative font-body select-none">
      <div className="absolute inset-0 z-0">
        <HeritageMap 
          userLocation={userLocation} 
          sites={filteredAndSortedSites} 
          itinerary={itinerarySites} 
          routeCoords={routeCoords} 
          totalTime={totalTime} 
          totalDist={totalDist} 
          onAddSite={toggleSite}
          focusedLocation={focusedLocation}
          isNavigating={isNavigating}
          recenterKey={recenterKey}
        />
      </div>

      {/* HEADER */}
      <div className="fixed top-4 left-4 right-4 z-40 flex items-center justify-center gap-3 pointer-events-none md:max-w-4xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button 
            onClick={() => setIsNavDrawerOpen(true)}
            size="icon" 
            className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-white border-none ring-1 ring-black/5"
          >
            <Menu size={24} />
          </Button>
          <Button 
            onClick={() => setIsPanelExpanded(prev => !prev)}
            size="icon" 
            className={cn(
              "h-12 w-12 rounded-2xl shadow-3xl backdrop-blur-xl border-none ring-1 ring-black/5 transition-all",
              isPanelExpanded ? "bg-primary text-white" : "bg-white/95 text-slate-500"
            )}
          >
            <Compass size={20} />
          </Button>
        </div>

        <div className="relative flex-1 pointer-events-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input 
            placeholder="Search heritage..." 
            className="pl-9 pr-12 h-12 rounded-2xl shadow-3xl border-none bg-white/95 backdrop-blur-2xl w-full text-xs font-bold" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <Button 
          onClick={detectLocation}
          size="icon" 
          className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5 pointer-events-auto"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </Button>
      </div>

      {/* NAVIGATION OVERLAY */}
      {isNavigating && (
        <div className="fixed bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-[1001] animate-in slide-in-from-bottom-6">
          <Card className="rounded-[2.5rem] shadow-3xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl p-6">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><Navigation size={20} className="animate-pulse" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stop {activeStopIndex + 1} of {itineraryIds.length}</p>
                    <h3 className="font-headline text-lg font-black text-slate-900 truncate max-w-[200px]">{itinerarySites[activeStopIndex]?.name}</h3>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => setIsNavigating(false)}><X size={18} /></Button>
            </div>
            {hasArrived ? (
              <div className="flex flex-col gap-3">
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3"><CheckCircle2 className="text-green-500" /><p className="text-xs font-black text-green-700 uppercase">You have arrived!</p></div>
                 <Button onClick={handleNextStop} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl">
                   {activeStopIndex < itineraryIds.length - 1 ? "Next Stop" : "Finish"} <ArrowRight size={18} className="ml-2" />
                 </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</p><p className="text-lg font-black text-slate-900">{totalDist.toFixed(1)} KM</p></div>
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">ETE</p><p className="text-lg font-black text-slate-900">{Math.round(totalTime)} MIN</p></div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* DISCOVER PANEL */}
      <div className={cn(
        "fixed transition-all duration-500 ease-in-out z-30 pointer-events-auto",
        isMobile ? "bottom-0 left-0 right-0 rounded-t-[2.5rem] shadow-3xl-up bg-white/95 backdrop-blur-2xl border-t" : "top-20 left-4 w-96 rounded-[2rem] shadow-3xl bg-white/95 backdrop-blur-2xl",
        isPanelExpanded ? "translate-y-0 opacity-100" : (isMobile ? "translate-y-full opacity-0" : "-translate-x-full opacity-0 pointer-events-none")
      )}>
        <Card className="border-none bg-transparent flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-b shrink-0">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Heritage Explorer</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsPanelExpanded(false)}><ChevronDown size={18} /></Button>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-50 rounded-none h-12 shrink-0 p-1.5">
              <TabsTrigger value="discover" className="text-[10px] font-black uppercase tracking-widest rounded-xl"><Compass size={14} className="mr-2" /> Discover</TabsTrigger>
              <TabsTrigger value="planner" className="text-[10px] font-black uppercase tracking-widest rounded-xl"><Sparkles size={14} className="mr-2" /> AI Planner</TabsTrigger>
            </TabsList>
            <div className={cn("flex-1 overflow-y-auto overflow-x-hidden pb-10", isMobile ? "max-h-[60vh]" : "max-h-[65vh]")}>
              <TabsContent value="discover" className="m-0 p-5 space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Cities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CITIES.map(city => (
                      <button key={city} onClick={() => setSelectedCity(selectedCity === city ? null : city)} className={cn("text-[10px] font-bold py-3 rounded-2xl transition-all border h-10", selectedCity === city ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600")}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Categories</p>
                  <div className="grid grid-cols-1 gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat.value} onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} className={cn("flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border text-left min-h-[48px]", selectedCategory === cat.value ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600")}>
                        <cat.icon size={16} className="shrink-0" /><span className="text-[10px] font-bold uppercase tracking-wide">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Nearby Landmarks</p>
                  <div className="space-y-2">
                     {filteredAndSortedSites.slice(0, 15).map(site => (
                       <div key={site.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-[1.25rem] border border-slate-100">
                          <div className="flex-1 truncate mr-3 cursor-pointer" onClick={() => setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng })}>
                             <p className="text-[11px] font-bold text-slate-900 truncate">{site.name}</p>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{site.city}</p>
                          </div>
                          <Button onClick={() => toggleSite(site.id)} size="icon" variant={itineraryIds.includes(site.id) ? "secondary" : "default"} className={cn("h-9 w-9 rounded-xl", itineraryIds.includes(site.id) ? "bg-slate-200 text-slate-500" : "bg-primary text-white shadow-xl shadow-primary/20")}>
                             {itineraryIds.includes(site.id) ? <X size={16} /> : <Plus size={16} />}
                          </Button>
                       </div>
                     ))}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="planner" className="m-0 p-5 space-y-6">
                <Button 
                  onClick={handleAutoGenerateFromLocal} 
                  disabled={isGeneratingPlanner || itineraryIds.length === 0}
                  className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl border-none"
                >
                  {isGeneratingPlanner ? <Loader2 className="animate-spin mr-2" size={18} /> : <Zap size={18} className="mr-2" />} 
                  Auto-Generate Trip
                </Button>
                {itineraryIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                    <History size={40} className="mb-2" />
                    <p className="text-[10px] font-black uppercase">Your itinerary is empty</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {itinerarySites.map((site, idx) => (
                      <div key={site.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                        <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{site.name}</p>
                        </div>
                        <button onClick={() => saveToLocal(itineraryIds.filter(id => id !== site.id))} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 mt-6">
                       <Button onClick={handleStartNavigation} className="w-full h-12 bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl"><Route size={18} className="mr-2" /> Start Navigation</Button>
                       <Button variant="ghost" onClick={() => saveToLocal([])} className="text-[9px] font-black uppercase text-red-500">Clear All Stops</Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* GENERATED RESULTS MODAL */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="max-w-md w-[95vw] rounded-[2.5rem] bg-white p-0 overflow-hidden border-none shadow-3xl">
          <div className="bg-primary p-8 text-white">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl"><Sparkles size={20} /></div>
              <DialogTitle className="text-2xl font-headline font-black">AI Trip Scout</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Organized based on your local selections.</DialogDescription>
          </div>
          
          <ScrollArea className="max-h-[50vh] p-8">
            {aiItineraryData ? (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs italic text-slate-600 font-medium">"{aiItineraryData.summary}"</p>
                </div>
                <div className="space-y-4">
                  {aiItineraryData.itinerary.map((stop, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div className="h-6 w-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                        {i < aiItineraryData.itinerary.length - 1 && <div className="w-px flex-1 bg-slate-100" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 mb-1">{stop.siteName}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed">{stop.description}</p>
                        <div className="mt-2 flex items-center gap-2 text-[8px] font-black uppercase text-primary">
                          <History size={10} /> {stop.estimatedVisitDurationMinutes} min stay
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <Loader2 className="animate-spin text-primary mb-2" size={32} />
                <p className="text-[10px] font-black uppercase text-slate-400">Processing Route...</p>
              </div>
            )}
          </ScrollArea>

          <DialogFooter className="p-6 bg-slate-50 border-t flex flex-col gap-2 sm:flex-col">
            <Button onClick={handleSavePlanner} className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
              <SaveIcon size={18} className="mr-2" /> Save to Profile
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleAutoGenerateFromLocal} disabled={isGeneratingPlanner} className="rounded-2xl text-[10px] font-black uppercase tracking-widest h-12">
                {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} className="mr-2" />} 
                Regenerate
              </Button>
              <Button variant="ghost" onClick={() => setIsResultModalOpen(false)} className="rounded-2xl text-[10px] font-black uppercase tracking-widest h-12">
                Keep Draft
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NAV DRAWER */}
      <Sheet open={isNavDrawerOpen} onOpenChange={setIsNavDrawerOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-none shadow-2xl bg-white flex flex-col z-[1100]">
           <div className="p-8 bg-primary text-white shrink-0">
              <h2 className="text-white font-headline text-3xl font-black flex items-center gap-3"><LandmarkIcon size={32} /> Handumanan</h2>
              <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">Cebu Heritage System</p>
           </div>
           <div className="flex-1 overflow-y-auto p-6 space-y-2">
             {[
               { label: 'Home', href: '/', icon: Home },
               { label: 'Explore & Route', href: '/discover', icon: Compass },
               { label: 'Site Directory', href: '/explore', icon: Search },
               { label: 'My Profile', href: '/profile', icon: LandmarkIcon },
             ].map(item => (
               <Link key={item.label} href={item.href} onClick={() => setIsNavDrawerOpen(false)} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group">
                 <item.icon size={20} className="text-slate-400 group-hover:text-primary" />
                 <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{item.label}</span>
               </Link>
             ))}
           </div>
           <div className="p-6 border-t">
             {user ? (
               <button onClick={() => { signOut(auth); setIsNavDrawerOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors">
                 <LogOut size={20} />
                 <span className="text-sm font-black uppercase tracking-widest">Logout</span>
               </button>
             ) : (
               <Button asChild className="w-full h-12 rounded-2xl font-black uppercase tracking-widest">
                 <Link href="/auth">Sign In</Link>
               </Button>
             )}
           </div>
        </SheetContent>
      </Sheet>
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

'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
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
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  LogOut,
  ChevronRight,
  Shield,
  Map as MapIcon,
  CheckCircle2,
  Flag,
  ArrowRight
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
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

const TIME_PRESETS = [
  { label: '1h', value: 1 },
  { label: '2h', value: 2 },
  { label: 'Half Day', value: 4 },
  { label: 'Full Day', value: 8 },
];

function ExploreRouteContent() {
  const { user } = useUser();
  const auth = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  
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
  const watchIdRef = useRef<number | null>(null);

  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [recenterKey, setRecenterKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerTimeType, setPlannerTimeType] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetTime, setSelectedPresetTime] = useState(4);
  const [customHours, setCustomHours] = useState('3');
  const [customMinutes, setCustomMinutes] = useState('30');
  const [aiItineraryData, setAiItineraryData] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  
  const [isAutoDialogOpen, setIsAutoDialogOpen] = useState(false);
  const [autoMode, setAutoMode] = useState<'near' | 'theme' | 'balanced'>('near');
  const [autoTheme, setAutoTheme] = useState<string>(CATEGORIES[0].value);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  const [searchSuggestions, setSearchSuggestions] = useState<HeritageSite[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const db = useFirestore();

  useEffect(() => {
    const savedKey = localStorage.getItem('ors_api_key');
    if (savedKey && savedKey !== 'null' && savedKey !== 'undefined') {
      setOrsKey(savedKey);
    } else {
      setShowKeyDialog(true);
    }

    const siteIdFromUrl = searchParams.get('siteId');
    if (siteIdFromUrl) {
      const site = HERITAGE_SITES.find(s => s.id === siteIdFromUrl);
      if (site) {
        centerOnSite(site);
        if (!itineraryIds.includes(siteIdFromUrl)) {
          toggleSite(siteIdFromUrl);
        }
      }
    }
  }, [searchParams]);

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

  useEffect(() => {
    if (searchQuery.length > 0) {
      const q = searchQuery.toLowerCase();
      const matches = HERITAGE_SITES.filter(site => 
        site.name.toLowerCase().includes(q) || 
        site.city.toLowerCase().includes(q) ||
        site.category.toLowerCase().includes(q)
      ).slice(0, 6);
      setSearchSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const handleSelectSuggestion = (site: HeritageSite) => {
    setSearchQuery(site.name);
    setShowSuggestions(false);
    centerOnSite(site);
  };

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
      // Silent failure wrapper to prevent unhandled rejections from crashing the UI
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
          // CRITICAL: Return early so it doesn't fall through to multi-route calculation
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
        console.warn("Routing effect suppressed a failure:", err);
      }
    };
    fetchRoute();
  }, [itineraryIds, orsKey, itinerarySites, isNavigating, activeStopIndex, userLocation]);

  const toggleSite = (id: string) => {
    if (itineraryIds.includes(id)) {
      setItineraryIds(prev => prev.filter(i => i !== id));
    } else {
      setItineraryIds(prev => [...prev, id]);
      toast({ title: "Added to Itinerary", description: "Optimize your route in the AI Planner." });
    }
  };

  const removeSite = (id: string) => {
    setItineraryIds(prev => prev.filter(i => i !== id));
    if (aiItineraryData) {
      setAiItineraryData({
        ...aiItineraryData,
        itinerary: aiItineraryData.itinerary.filter(item => item.siteId !== id)
      });
    }
  };

  const reorderSite = (index: number, direction: 'up' | 'down') => {
    const newIds = [...itineraryIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    setItineraryIds(newIds);
  };

  const centerOnSite = (site: HeritageSite) => {
    setFocusedLocation({ lat: Number(site.coordinates.lat), lng: Number(site.coordinates.lng) });
  };

  const handleStartNavigation = async () => {
    if (itineraryIds.length === 0) {
      toast({ title: "No Destination", description: "Please select at least one heritage site." });
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
      toast({ title: "Journey Complete", description: "You've reached all stops in your itinerary!" });
    }
  };

  const handleGeneratePlanner = async (forcedSites?: string[]) => {
    let hours = selectedPresetTime;
    if (plannerTimeType === 'custom') {
      hours = (parseInt(customHours) || 0) + ((parseInt(customMinutes) || 0) / 60);
    }
    const targetIds = forcedSites || itineraryIds;
    const selectedSites = targetIds.map(id => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean);
    setIsGeneratingPlanner(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: userLocation ? `${userLocation.lat}, ${userLocation.lng}` : (selectedCity || 'Cebu City Center'),
        availableTimeHours: hours,
        interests: [autoMode === 'theme' ? autoTheme : "General Heritage"],
        siteDatabase: JSON.stringify(HERITAGE_SITES.slice(0, 30)),
        selectedSitesJson: JSON.stringify(selectedSites)
      });
      setAiItineraryData(output);
      const suggestedIds = output.itinerary
        .map(item => item.siteId || HERITAGE_SITES.find(s => s.name.toLowerCase() === item.siteName.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      if (suggestedIds.length > 0) setItineraryIds(suggestedIds);
      toast({ title: "Itinerary Optimized", description: output.routeSuggestion });
    } catch (error) {
      toast({ title: "Planner Error", description: "Failed to generate optimized itinerary.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
      setIsAutoDialogOpen(false);
    }
  };

  const handleAutoGenerate = async () => {
    if (autoMode === 'near' && !userLocation) {
      const loc = await detectLocation();
      if (!loc) return;
    }
    let candidateSites: HeritageSite[] = [...HERITAGE_SITES];
    let hours = selectedPresetTime;
    if (plannerTimeType === 'custom') {
      hours = (parseInt(customHours) || 0) + ((parseInt(customMinutes) || 0) / 60);
    }
    const limit = hours <= 1 ? 2 : hours <= 2 ? 3 : hours <= 4 ? 5 : 8;
    if (autoMode === 'near' && userLocation) {
      candidateSites = candidateSites
        .map(s => ({ ...s, dist: calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) }))
        .sort((a, b) => (a as any).dist - (b as any).dist)
        .slice(0, limit);
    } else if (autoMode === 'theme') {
      candidateSites = candidateSites.filter(s => s.category === autoTheme).slice(0, limit);
    } else if (autoMode === 'balanced') {
      const cats = Array.from(new Set(HERITAGE_SITES.map(s => s.category)));
      candidateSites = [];
      for (let i = 0; i < limit; i++) {
        const cat = cats[i % cats.length];
        const site = HERITAGE_SITES.find(s => s.category === cat && !candidateSites.some(cs => cs.id === s?.id));
        if (site) candidateSites.push(site);
      }
    }
    if (candidateSites.length === 0) {
      toast({ title: "No Sites Found", description: "Try another theme or duration.", variant: "destructive" });
      return;
    }
    handleGeneratePlanner(candidateSites.map(s => s.id));
  };

  const handleSavePlanner = () => {
    if (!user || !db || itineraryIds.length === 0) {
      toast({ title: "Login Required", description: "Sign in to save your itineraries." });
      return;
    }
    setDocumentNonBlocking(doc(collection(db, 'users', user.uid, 'itineraries')), {
      userId: user.uid,
      itineraryIds,
      summary: aiItineraryData?.routeSuggestion || `${itineraryIds.length} stops in Metro Cebu`,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Access this trip in your profile." });
  };

  const NavDrawer = () => (
    <Sheet open={isNavDrawerOpen} onOpenChange={setIsNavDrawerOpen}>
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-none shadow-2xl bg-white flex flex-col z-[10000]">
        <SheetHeader className="p-8 bg-primary text-white shrink-0 text-left">
          <SheetTitle className="text-white font-headline text-3xl font-black flex items-center gap-3">
             <LandmarkIcon size={32} /> Handumanan
          </SheetTitle>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Cebu Heritage Guide</p>
        </SheetHeader>
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
        <div className="p-6 border-t bg-slate-50/50">
          {user ? (
            <button onClick={() => { signOut(auth); setIsNavDrawerOpen(false); }} className="flex items-center gap-4 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors">
              <LogOut size={20} />
              <span className="text-sm font-black uppercase tracking-widest">Logout</span>
            </button>
          ) : (
            <Button asChild className="w-full h-12 rounded-2xl font-black uppercase tracking-widest" onClick={() => setIsNavDrawerOpen(false)}>
              <Link href="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );

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

      <NavDrawer />

      {/* FIXED ALIGNED HEADER ROW */}
      <div className="fixed top-4 left-4 right-4 z-[1000] flex items-center justify-center gap-3 pointer-events-none md:max-w-4xl md:mx-auto md:left-1/2 md:-translate-x-1/2">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button 
            onClick={() => setIsNavDrawerOpen(prev => !prev)}
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

        <div className="relative flex-1 pointer-events-auto group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <Input 
            placeholder="Search heritage..." 
            className="pl-9 pr-12 h-12 rounded-2xl shadow-3xl border-none bg-white/95 backdrop-blur-2xl w-full text-xs font-bold" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length > 0 && setShowSuggestions(true)}
          />
          {showSuggestions && (
            <Card className="absolute top-14 left-0 right-0 rounded-2xl shadow-3xl border-none bg-white/95 backdrop-blur-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <ScrollArea className="max-h-[300px]">
                <div className="p-2 space-y-1">
                  {searchSuggestions.length > 0 ? searchSuggestions.map(site => (
                    <button key={site.id} onClick={() => handleSelectSuggestion(site)} className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-primary/5 transition-colors text-left">
                      <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 shrink-0"><img src={site.imageUrl} className="h-full w-full object-cover" /></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-black text-slate-900 truncate">{site.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{site.city} • {site.category.split(' & ')[0]}</p>
                      </div>
                    </button>
                  )) : <div className="p-8 text-center opacity-30 text-[10px] font-black uppercase">No results found</div>}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>

        <Button 
          onClick={detectLocation}
          size="icon" 
          className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5 pointer-events-auto"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </Button>
      </div>

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
            <ScrollArea className="h-48 mb-6 border-y py-4">
              <div className="space-y-4">
                {navigationSteps.length > 0 ? navigationSteps.map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1"><ChevronRight size={14} className="text-primary" /></div>
                    <div className="flex-1">
                       <p className="text-xs font-bold text-slate-700 leading-snug">{step.instruction}</p>
                       <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{step.distance.toFixed(1)} km • {Math.round(step.duration)} min</p>
                    </div>
                  </div>
                )) : <div className="flex flex-col items-center justify-center py-10 opacity-50"><Loader2 className="animate-spin text-primary mb-2" /><p className="text-[10px] font-black uppercase">Calculating Route...</p></div>}
              </div>
            </ScrollArea>
            {hasArrived ? (
              <div className="flex flex-col gap-3">
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3"><CheckCircle2 className="text-green-500" /><p className="text-xs font-black text-green-700 uppercase">You have arrived!</p></div>
                 <Button onClick={handleNextStop} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl">
                   {activeStopIndex < itineraryIds.length - 1 ? "Navigate to Next Stop" : "Finish Journey"} <ArrowRight size={18} className="ml-2" />
                 </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Remaining</p><p className="text-lg font-black text-slate-900">{totalDist.toFixed(1)} KM</p></div>
                 <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Time ETE</p><p className="text-lg font-black text-slate-900">{Math.round(totalTime)} MIN</p></div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* DISCOVER PANEL */}
      <div className={cn(
        "fixed transition-all duration-500 ease-in-out z-[1000] pointer-events-auto",
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
              <TabsContent value="discover" className="m-0 p-5 space-y-6 animate-in fade-in duration-300">
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
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Sites in {selectedCity || "Metro Cebu"}</p>
                  <div className="space-y-2">
                     {filteredAndSortedSites.slice(0, 20).map(site => (
                       <div key={site.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-[1.25rem] border border-slate-100 group">
                          <div className="flex-1 truncate mr-3 cursor-pointer" onClick={() => centerOnSite(site)}>
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
              <TabsContent value="planner" className="m-0 p-5 space-y-6 animate-in fade-in duration-300">
                <Button onClick={() => setIsAutoDialogOpen(true)} className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl border-none">
                  <Zap size={18} className="mr-2" /> Auto-Generate Trip
                </Button>
                {itineraryIds.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                    <div className="bg-slate-50 p-8 rounded-full"><MapPin size={40} className="text-slate-300" /></div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tight">Choose heritage sites first to plan your route.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label className="text-[9px] font-black uppercase text-slate-400">Available Time</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_PRESETS.map(preset => (
                          <button key={preset.value} onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }} className={cn("px-2 py-3 rounded-2xl text-[10px] font-black uppercase border h-10", plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary" : "bg-white text-slate-500")}>
                            {preset.label}
                          </button>
                        ))}
                      </div>
                      <Button onClick={() => handleGeneratePlanner()} disabled={isGeneratingPlanner} className="w-full h-12 rounded-[1.25rem] bg-primary text-[10px] font-black uppercase tracking-widest shadow-xl">
                        {isGeneratingPlanner ? <Loader2 className="animate-spin mr-2" size={18} /> : <RefreshCcw size={16} className="mr-2" />} Optimize Route
                      </Button>
                    </div>
                    <div className="space-y-3 pt-6 border-t">
                      {itineraryIds.map((id, idx) => {
                        const site = HERITAGE_SITES.find(s => s.id === id);
                        if (!site) return null;
                        return (
                          <div key={id} className="flex flex-col p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                            <div className="flex items-center gap-4">
                              <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">{idx + 1}</div>
                              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => centerOnSite(site)}>
                                <p className="text-[11px] font-bold text-slate-700 truncate">{site.name}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">{site.city}</p>
                              </div>
                              <button onClick={() => removeSite(id)} className="p-1.5 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex flex-col gap-3 mt-6">
                       <Button onClick={handleStartNavigation} className="w-full h-12 bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl"><Route size={18} className="mr-2" /> Start Navigation</Button>
                       <div className="flex gap-3">
                         <Button variant="outline" onClick={handleSavePlanner} className="flex-1 h-12 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest"><SaveIcon size={16} className="mr-2" /> Save Trip</Button>
                         <Button variant="outline" onClick={() => setItineraryIds([])} className="h-12 px-5 rounded-[1.25rem] text-red-500"><Trash2 size={18} /></Button>
                       </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* AUTO-GENERATE DIALOG */}
      <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
        <DialogContent className={cn("border-none shadow-3xl bg-white text-slate-900 p-0 flex flex-col overflow-hidden z-[9999]", isMobile ? "max-w-[calc(100vw-24px)] bottom-4 top-auto translate-y-0 rounded-[2rem] max-h-[70vh]" : "max-w-[400px] rounded-[2rem] max-h-[75vh]")}>
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-xl font-headline font-black">Auto-Generate Trip</DialogTitle>
            <DialogDescription className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">AI builds your perfect heritage tour.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-y-auto px-6">
            <div className="space-y-6 pb-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-400">Generation Mode</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { id: 'near', label: 'Near Me', icon: LocateFixed, desc: 'Minimize travel' },
                    { id: 'theme', label: 'Themed Trip', icon: LandmarkIcon, desc: 'Focus on one category' },
                    { id: 'balanced', label: 'Balanced Tour', icon: Sparkles, desc: 'A mix of everything' }
                  ].map(mode => (
                    <button key={mode.id} onClick={() => setAutoMode(mode.id as any)} className={cn("flex items-center gap-4 p-3 rounded-2xl border text-left transition-all", autoMode === mode.id ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50")}>
                      <mode.icon size={18} className={cn(autoMode === mode.id ? "text-primary" : "text-slate-400")} />
                      <div><p className="text-[11px] font-bold">{mode.label}</p><p className="text-[9px] opacity-70 font-medium">{mode.desc}</p></div>
                    </button>
                  ))}
                </div>
              </div>
              {autoMode === 'theme' && (
                <div className="space-y-2">
                  <Label className="text-[9px] font-black uppercase text-slate-400">Select Theme</Label>
                  <Select value={autoTheme} onValueChange={setAutoTheme}>
                    <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none text-[10px] font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      {CATEGORIES.map(cat => (<SelectItem key={cat.value} value={cat.value} className="text-[10px] py-2">{cat.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-3">
                <Label className="text-[9px] font-black uppercase text-slate-400">Trip Duration</Label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_PRESETS.map(preset => (
                    <button key={preset.value} onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }} className={cn("px-2 py-2.5 rounded-2xl text-[10px] font-black uppercase border h-10", plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary" : "bg-white text-slate-500")}>
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-6 pt-2 border-t shrink-0">
            <Button className="w-full h-12 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleAutoGenerate} disabled={isGeneratingPlanner}>
              {isGeneratingPlanner ? <><Loader2 className="animate-spin mr-2" size={16} /> Planning...</> : "Generate My Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-xs rounded-[2.5rem] p-8 border-none shadow-3xl bg-white z-[9999]">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900">Routing Key</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">Enter your OpenRouteService API key.</DialogDescription>
          </DialogHeader>
          <Input placeholder="API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-14 rounded-xl bg-slate-50 border-none px-4 text-xs" />
          <DialogFooter className="mt-6"><Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleSaveKey}>Initialize Navigation</Button></DialogFooter>
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

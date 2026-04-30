'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
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
  RefreshCcw,
  ArrowUp,
  ArrowDown,
  Clock,
  Zap,
  Settings,
  LogOut,
  ChevronRight,
  Shield
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

  const [isHomeConfirmOpen, setIsHomeConfirmOpen] = useState(false);
  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  const db = useFirestore();

  useEffect(() => {
    const savedKey = localStorage.getItem('ors_api_key');
    if (savedKey) setOrsKey(savedKey);
    else setShowKeyDialog(true);

    const siteIdFromUrl = searchParams.get('siteId');
    if (siteIdFromUrl) {
      const site = HERITAGE_SITES.find(s => s.id === siteIdFromUrl);
      if (site) {
        centerOnSite(site);
        toggleSite(siteIdFromUrl);
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
      toast({ title: "Added to Itinerary", description: "Head to the AI Planner to optimize your trip." });
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
    
    if (aiItineraryData) {
      const newItin = [...aiItineraryData.itinerary];
      [newItin[index], newItin[targetIndex]] = [newItin[targetIndex], newItin[index]];
      setAiItineraryData({ ...aiItineraryData, itinerary: newItin });
    }
  };

  const centerOnSite = (site: HeritageSite) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
    setIsNavigating(false);
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
        
      if (suggestedIds.length > 0) {
        setItineraryIds(suggestedIds);
        centerOnSite(HERITAGE_SITES.find(s => s.id === suggestedIds[0])!);
      }
      
      toast({ title: "Itinerary Optimized", description: output.routeSuggestion });
    } catch (error) {
      console.error(error);
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
      candidateSites = candidateSites
        .filter(s => s.category === autoTheme)
        .slice(0, limit);
    } else if (autoMode === 'balanced') {
      const cats = Array.from(new Set(HERITAGE_SITES.map(s => s.category)));
      candidateSites = [];
      for (let i = 0; i < limit; i++) {
        const cat = cats[i % cats.length];
        const site = HERITAGE_SITES.find(s => s.category === cat && !candidateSites.includes(s));
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
      <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0 border-none shadow-2xl bg-white flex flex-col">
        <SheetHeader className="p-8 bg-primary text-white shrink-0">
          <SheetTitle className="text-white font-headline text-3xl font-black flex items-center gap-3">
             <Landmark size={32} /> Handumanan
          </SheetTitle>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Cebu Heritage Guide</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-2">
          {[
            { label: 'Home', href: '/', icon: Home },
            { label: 'Explore & Route', href: '/discover', icon: Compass },
            { label: 'Site Directory', href: '/explore', icon: Search },
            { label: 'My Profile', href: '/profile', icon: Landmark },
          ].map(item => (
            <Link 
              key={item.label} 
              href={item.href} 
              onClick={() => setIsNavDrawerOpen(false)}
              className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors group"
            >
              <item.icon size={20} className="text-slate-400 group-hover:text-primary" />
              <span className="text-sm font-black text-slate-700 uppercase tracking-widest">{item.label}</span>
            </Link>
          ))}
          
          <div className="pt-6 border-t mt-4">
             <button 
              onClick={() => { setActiveTab('planner'); setIsNavDrawerOpen(false); setIsPanelExpanded(true); }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/5 transition-colors group text-left"
             >
               <Sparkles size={20} className="text-primary" />
               <span className="text-sm font-black text-primary uppercase tracking-widest">AI Trip Planner</span>
             </button>
          </div>
        </div>

        <div className="p-6 border-t bg-slate-50/50">
          {user ? (
            <button 
              onClick={() => signOut(auth)} 
              className="flex items-center gap-4 w-full p-4 rounded-2xl text-red-500 hover:bg-red-50 transition-colors"
            >
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

      {/* PERSISTENT GLOBAL NAVIGATION */}
      <div className="fixed top-4 left-4 z-[1001] flex flex-col gap-3 pointer-events-auto">
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
          className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-slate-500 hover:text-primary hover:bg-white border-none ring-1 ring-black/5"
        >
          <Compass size={24} />
        </Button>
      </div>

      <NavDrawer />

      {/* TOP HEADER CONTROLS */}
      <div className="fixed top-4 left-20 right-4 z-[1000] flex flex-col items-start gap-2 pointer-events-none md:max-w-[400px] md:left-24">
        <div className="flex gap-2 items-center pointer-events-auto w-full">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <Input 
              placeholder="Search heritage..." 
              className="pl-9 h-12 rounded-2xl shadow-3xl border-none bg-white/95 backdrop-blur-2xl w-full text-xs font-bold" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button 
            onClick={detectLocation}
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
          </Button>

          <Button 
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            {isPanelExpanded ? <X size={20} /> : <Compass size={20} />}
          </Button>
        </div>

        {isPanelExpanded && (
          <Card 
            className="pointer-events-auto w-full border-none shadow-3xl bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 rounded-[2rem] flex flex-col overflow-hidden max-h-[60vh] md:max-h-[75vh] mt-2 z-[1000] discover-panel"
          >
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-b shrink-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Heritage Explorer</span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsPanelExpanded(false)}>
                <ChevronDown size={18} />
              </Button>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
              <TabsList className="grid w-full grid-cols-2 bg-slate-50 rounded-none h-12 shrink-0 p-1.5">
                <TabsTrigger value="discover" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white rounded-xl">
                  <Compass size={14} className="mr-2" /> Discover
                </TabsTrigger>
                <TabsTrigger value="planner" className="text-[10px] font-black uppercase tracking-widest data-[state=active]:bg-white rounded-xl">
                  <Sparkles size={14} className="mr-2" /> AI Planner
                </TabsTrigger>
              </TabsList>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden discover-panel-content pb-10">
                <TabsContent value="discover" className="m-0 p-5 space-y-6 animate-in fade-in duration-300">
                   <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Cities</p>
                    <div className="grid grid-cols-2 gap-2">
                      {CITIES.map(city => (
                        <button 
                          key={city} 
                          onClick={() => setSelectedCity(selectedCity === city ? null : city)} 
                          className={cn(
                            "text-[10px] font-bold py-3 rounded-2xl transition-all border h-10",
                            selectedCity === city ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                          )}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Categories</p>
                    <div className="grid grid-cols-1 gap-2">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat.value} 
                          onClick={() => setSelectedCategory(selectedCategory === cat.value ? null : cat.value)} 
                          className={cn(
                            "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border text-left min-h-[48px]",
                            selectedCategory === cat.value ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600"
                          )}
                        >
                          <cat.icon size={16} className="shrink-0" />
                          <span className="text-[10px] font-bold leading-normal uppercase tracking-wide">{cat.label}</span>
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
                            <Button 
                              onClick={() => toggleSite(site.id)}
                              size="icon" 
                              variant={itineraryIds.includes(site.id) ? "secondary" : "default"}
                              className={cn(
                                "h-9 w-9 rounded-xl shrink-0 transition-all",
                                itineraryIds.includes(site.id) ? "bg-slate-200 text-slate-500" : "bg-primary text-white shadow-xl shadow-primary/20"
                              )}
                            >
                               {itineraryIds.includes(site.id) ? <X size={16} /> : <Plus size={16} />}
                            </Button>
                         </div>
                       ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="planner" className="m-0 p-5 space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col gap-3">
                    <Button 
                      onClick={() => setIsAutoDialogOpen(true)} 
                      className="w-full h-12 bg-accent hover:bg-accent/90 text-accent-foreground text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl border-none"
                    >
                      <Zap size={18} className="mr-2" /> Auto-Generate Trip
                    </Button>
                    
                    <div className="relative py-2 flex items-center gap-4">
                      <div className="h-px bg-slate-100 flex-1" />
                      <span className="text-[8px] font-black uppercase text-slate-300">Or Build Manually</span>
                      <div className="h-px bg-slate-100 flex-1" />
                    </div>
                  </div>

                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                      <div className="bg-slate-50 p-8 rounded-full">
                        <MapPin size={40} className="text-slate-300" />
                      </div>
                      <div className="space-y-2 px-6">
                        <p className="text-[11px] font-black text-slate-900">Choose a few heritage sites first</p>
                        <p className="text-[10px] text-slate-500 leading-relaxed uppercase tracking-tight">Then I'll help you plan the best route based on your time.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        <div className="space-y-2.5">
                          <Label className="text-[9px] font-black uppercase text-slate-400">How much time do you have?</Label>
                          <div className="grid grid-cols-2 gap-2">
                            {TIME_PRESETS.map(preset => (
                              <button 
                                key={preset.value}
                                onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }}
                                className={cn(
                                  "px-2 py-3 rounded-2xl text-[10px] font-black uppercase border h-10 transition-all",
                                  plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-slate-100 text-slate-500"
                                )}
                              >
                                {preset.label}
                              </button>
                            ))}
                            <button 
                              onClick={() => setPlannerTimeType('custom')}
                              className={cn(
                                "px-2 py-3 rounded-2xl text-[10px] font-black uppercase border h-10 transition-all col-span-2",
                                plannerTimeType === 'custom' ? "bg-primary text-white border-primary shadow-lg shadow-primary/20" : "bg-white border-slate-100 text-slate-500"
                              )}
                            >
                              Custom Time
                            </button>
                          </div>
                          
                          {plannerTimeType === 'custom' && (
                            <div className="flex items-center gap-3 mt-3 animate-in slide-in-from-top-1">
                              <div className="flex-1 space-y-1">
                                <Label className="text-[8px] font-bold text-slate-400 uppercase">Hours</Label>
                                <Input type="number" value={customHours} onChange={(e) => setCustomHours(e.target.value)} placeholder="Hr" className="h-12 text-xs rounded-2xl" />
                              </div>
                              <span className="text-xl pt-4 font-black text-slate-300">:</span>
                              <div className="flex-1 space-y-1">
                                <Label className="text-[8px] font-bold text-slate-400 uppercase">Minutes</Label>
                                <Input type="number" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} placeholder="Min" className="h-12 text-xs rounded-2xl" />
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <Button 
                          onClick={() => handleGeneratePlanner()} 
                          disabled={isGeneratingPlanner} 
                          className="w-full h-12 rounded-[1.25rem] bg-primary text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                        >
                          {isGeneratingPlanner ? (
                            <><Loader2 className="animate-spin mr-2" size={18} /> Building Itinerary</>
                          ) : (
                            <><RefreshCcw size={16} className="mr-2" /> Optimize Selected Route</>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4 pt-6 border-t">
                        <div className="flex items-center justify-between px-1">
                          <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Active Stop List</p>
                          <p className="text-[9px] font-bold text-primary">{itineraryIds.length} stops</p>
                        </div>
                        
                        <div className="space-y-3">
                           {itineraryIds.map((id, idx) => {
                             const site = HERITAGE_SITES.find(s => s.id === id);
                             if (!site) return null;
                             const aiInfo = aiItineraryData?.itinerary.find(item => item.siteId === id);

                             return (
                               <div key={id} className="flex flex-col p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                 <div className="flex items-center gap-4">
                                   <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shadow-sm shrink-0">
                                     {idx + 1}
                                   </div>
                                   <div className="flex-1 min-w-0 cursor-pointer" onClick={() => centerOnSite(site)}>
                                     <p className="text-[11px] font-bold text-slate-700 truncate">{site.name}</p>
                                     <p className="text-[9px] text-slate-400 font-bold uppercase">{site.city}</p>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <button onClick={() => reorderSite(idx, 'up')} disabled={idx === 0} className="p-1.5 text-slate-300 hover:text-primary disabled:opacity-0"><ArrowUp size={16} /></button>
                                     <button onClick={() => reorderSite(idx, 'down')} disabled={idx === itineraryIds.length - 1} className="p-1.5 text-slate-300 hover:text-primary disabled:opacity-0"><ArrowDown size={16} /></button>
                                     <button onClick={() => removeSite(id)} className="p-1.5 text-slate-300 hover:text-red-500 ml-1"><Trash2 size={16} /></button>
                                   </div>
                                 </div>
                                 {aiInfo && (
                                   <div className="mt-3 pl-11 space-y-1.5">
                                     <div className="flex items-center gap-4 text-[9px] font-bold text-slate-500">
                                       <span className="flex items-center gap-1.5"><Clock size={10} /> {aiInfo.estimatedVisitDurationMinutes}m visit</span>
                                       {idx < itineraryIds.length - 1 && (
                                         <span className="flex items-center gap-1.5 text-primary"><Navigation size={10} /> {aiInfo.estimatedTravelTimeMinutes}m travel</span>
                                       )}
                                     </div>
                                     <p className="text-[9px] text-slate-500 leading-relaxed italic line-clamp-2">{aiInfo.description}</p>
                                   </div>
                                 )}
                               </div>
                             );
                           })}
                        </div>

                        {itineraryIds.length > 0 && (
                          <div className="flex flex-col gap-3 mt-6">
                             <Button onClick={() => setIsNavigating(true)} className="w-full h-12 bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl">
                               <Route size={18} className="mr-2" /> Start Navigation
                             </Button>
                             <div className="flex gap-3">
                               <Button variant="outline" onClick={handleSavePlanner} className="flex-1 h-12 rounded-[1.25rem] border-2 text-[10px] font-black uppercase tracking-widest">
                                 <SaveIcon size={16} className="mr-2" /> Save Trip
                               </Button>
                               <Button variant="outline" onClick={() => { setItineraryIds([]); setAiItineraryData(null); }} className="h-12 px-5 rounded-[1.25rem] border-2 text-red-500 hover:bg-red-50">
                                 <Trash2 size={18} />
                               </Button>
                             </div>
                             {aiItineraryData && (
                               <div className="p-5 bg-primary/5 rounded-[1.5rem] border border-primary/10">
                                 <p className="text-[9px] font-black uppercase text-primary tracking-widest mb-1.5">AI Guide Tip</p>
                                 <p className="text-[10px] text-slate-700 leading-relaxed italic">{aiItineraryData.routeSuggestion}</p>
                               </div>
                             )}
                          </div>
                        )}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        )}
      </div>

      {/* BOTTOM RIGHT FLOATING CONTROLS */}
      <div className="fixed bottom-6 right-6 z-[1001] flex flex-col gap-4 items-end pointer-events-auto">
        {/* Only Chatbot here now, location is beside search bar */}
      </div>

      {/* AUTO-GENERATE DIALOG */}
      <Dialog open={isAutoDialogOpen} onOpenChange={setIsAutoDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-32px)] sm:max-w-[400px] rounded-[2.5rem] p-6 sm:p-8 border-none shadow-3xl bg-white text-slate-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black">Auto-Generate Trip</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">
              Let AI build a perfect heritage tour for you in seconds.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400">Generation Mode</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: 'near', label: 'Near Me', icon: LocateFixed, desc: 'Minimize travel distance' },
                  { id: 'theme', label: 'Themed Trip', icon: Landmark, desc: 'Focus on one category' },
                  { id: 'balanced', label: 'Balanced Tour', icon: Sparkles, desc: 'A mix of everything' }
                ].map(mode => (
                  <button 
                    key={mode.id}
                    onClick={() => setAutoMode(mode.id as any)}
                    className={cn(
                      "flex items-center gap-4 p-3.5 rounded-2xl border text-left transition-all",
                      autoMode === mode.id ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    <mode.icon size={18} className={cn(autoMode === mode.id ? "text-primary" : "text-slate-400")} />
                    <div>
                      <p className="text-[11px] font-bold">{mode.label}</p>
                      <p className="text-[9px] opacity-70">{mode.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {autoMode === 'theme' && (
              <div className="space-y-2 animate-in slide-in-from-top-1">
                <Label className="text-[9px] font-black uppercase text-slate-400">Select Theme</Label>
                <Select value={autoTheme} onValueChange={setAutoTheme}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none text-[11px] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-[11px]">{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[9px] font-black uppercase text-slate-400">Trip Duration</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_PRESETS.map(preset => (
                  <button 
                    key={preset.value}
                    onClick={() => { setPlannerTimeType('preset'); setSelectedPresetTime(preset.value); }}
                    className={cn(
                      "px-2 py-2.5 rounded-2xl text-[10px] font-black uppercase border h-10 transition-all",
                      plannerTimeType === 'preset' && selectedPresetTime === preset.value ? "bg-primary text-white border-primary" : "bg-white border-slate-100 text-slate-500"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-8">
            <Button 
              className="w-full h-12 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" 
              onClick={handleAutoGenerate}
              disabled={isGeneratingPlanner}
            >
              {isGeneratingPlanner ? <><Loader2 className="animate-spin mr-2" size={16} /> Planning...</> : "Generate My Trip"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRMATION FOR LEAVING NAVIGATION */}
      <AlertDialog open={isHomeConfirmOpen} onOpenChange={setIsHomeConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none shadow-3xl bg-white text-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-headline font-black">Return Home?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 leading-relaxed">
              This will reset your current itinerary and end navigation. Are you sure you want to return to the landing page?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="h-12 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { setIsNavigating(false); router.push('/'); }}
              className="h-12 rounded-2xl bg-red-500 text-white hover:bg-red-600 font-black uppercase text-[10px] tracking-widest"
            >
              Confirm & Return
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="max-w-xs rounded-[2.5rem] p-8 border-none shadow-3xl bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black text-slate-900">Routing Key</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 leading-relaxed">Enter your OpenRouteService API key to enable road-accurate navigation in Metro Cebu.</DialogDescription>
          </DialogHeader>
          <Input placeholder="API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="h-14 rounded-xl bg-slate-50 border-none px-4 text-xs" />
          <DialogFooter className="mt-6">
            <Button className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleSaveKey}>Initialize Navigation</Button>
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

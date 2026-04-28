'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { 
  Navigation, 
  Loader2, 
  Sparkles, 
  Map as MapIcon, 
  Search,
  LocateFixed,
  X,
  Plus,
  CheckCircle2,
  Menu,
  RotateCcw,
  Navigation2,
  MapPin,
  Route,
  Home,
  Building2,
  ArrowRight,
  Clock,
  Save,
  Globe,
  Church,
  Landmark,
  TreePine,
  Info,
  ChevronRight,
  Settings,
  BellRing
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black uppercase tracking-widest text-[10px] opacity-30">Map Initializing...</div>
});

const CATEGORIES = [
  { label: "Churches", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Houses", value: "Ancestral Houses & Heritage Residences", icon: Home },
  { label: "Museums", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Landmarks", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Parks", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Government", value: "Government & Historic Buildings", icon: Building2 },
  { label: "Cultural", value: "Cultural & Religious (Non-Catholic Sites)", icon: Globe }
];

const INTERESTS_OPTIONS = [
  "History", "Architecture", "Religious Sites", "Photography", "Spanish Heritage", "Parks", "WWII History"
];

function ExploreRouteContent() {
  const { user } = useUser();
  const { toast } = useToast();
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isNearMeEnabled, setIsNearMeEnabled] = useState(false);
  const [alertedSites, setAlertedSites] = useState<string[]>([]);

  // AI Planner State
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerResult, setPlannerResult] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [plannerStart, setPlannerStart] = useState('Cebu City Center');
  const [plannerTime, setPlannerTime] = useState([4]);
  const [plannerInterests, setPlannerInterests] = useState<string[]>([]);
  const [isSavingPlanner, setIsSavingPlanner] = useState(false);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();

  const sitesQuery = useMemoFirebase(() => {
    if (!db) return null;
    const colRef = collection(db, 'heritageSites');
    if (selectedCategories.length > 0) {
      return query(colRef, where('category', 'in', selectedCategories));
    }
    return colRef;
  }, [db, selectedCategories]);

  const { data: firestoreSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    const source = (firestoreSites && firestoreSites.length > 0) ? firestoreSites : HERITAGE_SITES;
    return source.map(site => ({
      ...site,
      coordinates: site.coordinates || { lat: site.latitude || 0, lng: site.longitude || 0 }
    })) as HeritageSite[];
  }, [firestoreSites]);

  // Key initialization
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
      toast({ title: "Location Access Denied", description: "Defaulting to Cebu City Center.", variant: "destructive" });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Continuous location tracking and Arrival Alert Logic
  useEffect(() => {
    detectLocation();
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const currentPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(currentPos);
      },
      (err) => console.warn("Watch position error:", err),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [detectLocation]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds, allSites]);

  // Arrival Alert Logic
  useEffect(() => {
    if (!userLocation || itinerarySites.length === 0) return;
    
    const currentDestination = itinerarySites[0];
    const dist = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      currentDestination.coordinates.lat, 
      currentDestination.coordinates.lng
    );

    // 20 meters = 0.02 km
    if (dist <= 0.02 && !alertedSites.includes(currentDestination.id)) {
      toast({
        title: "📍 Destination Reached!",
        description: `Welcome to ${currentDestination.name}!`,
        duration: 8000,
      });
      setAlertedSites(prev => [...prev, currentDestination.id]);
      
      // Haptic Feedback for mobile
      if ('vibrate' in navigator) {
        navigator.vibrate([300, 100, 300]);
      }
    }
  }, [userLocation, itinerarySites, alertedSites, toast]);

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

    if (isNearMeEnabled && userLocation) {
      result = result.filter(s => s.distance <= 5);
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [allSites, userLocation, searchQuery, isNearMeEnabled]);

  const aiSuggestions = useMemo(() => {
    let suggestions = [...allSites];
    if (userLocation) {
      suggestions.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });
    } else {
      suggestions = suggestions.filter(s => s.isMustVisit);
    }
    
    return suggestions.slice(0, 5).map(s => ({
      ...s,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) : undefined
    }));
  }, [allSites, userLocation]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (itineraryIds.length < 2 || !orsKey) {
        setRouteCoords([]);
        setTotalDist(0);
        setTotalTime(0);
        return;
      }
      const points = itinerarySites.map(s => s.coordinates);
      const data = await getRouteMulti(points, orsKey);
      if (data) {
        setRouteCoords(data.coordinates);
        setTotalDist(data.distance);
        setTotalTime(data.duration);
      }
    };
    fetchRoute();
  }, [itineraryIds, orsKey, itinerarySites]);

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]);
  };

  const toggleSite = (id: string) => {
    setItineraryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const centerOnSite = (site: HeritageSite) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
  };

  const handleGeneratePlanner = async () => {
    setIsGeneratingPlanner(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: plannerStart,
        availableTimeHours: plannerTime[0],
        interests: plannerInterests.length > 0 ? plannerInterests : ["General Interest"],
        siteDatabase: JSON.stringify(HERITAGE_SITES)
      });
      setPlannerResult(output);
      const suggestedIds = output.itinerary
        .map(item => allSites.find(s => s.name.toLowerCase() === item.siteName.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      
      if (suggestedIds.length > 0) {
        setItineraryIds(suggestedIds);
        const firstSite = allSites.find(s => s.id === suggestedIds[0]);
        if (firstSite) setFocusedLocation({ lat: firstSite.coordinates.lat, lng: firstSite.coordinates.lng });
      }
      toast({ title: "Itinerary Ready", description: "Your route has been generated." });
    } catch (error) {
      toast({ title: "Planner Error", description: "Assistant busy. Try again.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  const handleSavePlanner = () => {
    if (!user || !db || !plannerResult) {
      toast({ title: "Login Required", description: "Sign in to save trips.", variant: "destructive" });
      return;
    }
    const itRef = doc(collection(db, 'users', user.uid, 'itineraries'));
    setDocumentNonBlocking(itRef, {
      userId: user.uid,
      itineraryData: JSON.stringify(plannerResult),
      summary: plannerResult.routeSuggestion,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Check your profile." });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative font-body">
      
      {/* BACKGROUND MAP */}
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
        />
      </div>

      {/* TOP FLOATING CONTROLS */}
      <div className="absolute top-6 inset-x-0 z-50 flex flex-col items-center gap-4 px-4">
        <div className="w-full max-w-2xl flex gap-3 items-center">
          {/* HAMBURGER MENU */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="h-14 w-14 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5">
                <Menu size={24} />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 md:w-[400px] border-none bg-white/95 backdrop-blur-2xl p-0 overflow-hidden flex flex-col">
              <SheetHeader className="p-8 pb-4">
                <SheetTitle className="font-headline text-3xl font-black text-primary tracking-tight">Explore Route</SheetTitle>
              </SheetHeader>
              <ScrollArea className="flex-1 px-8 py-4">
                <div className="space-y-8">
                  <Accordion type="multiple" defaultValue={["discovery"]} className="space-y-6">
                    
                    {/* Discovery Section */}
                    <AccordionItem value="discovery" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-0 mb-4 group">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                            <MapPin size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary">Heritage Sites</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-white">
                            <div className="flex items-center gap-3">
                              <div className={cn("p-2 rounded-xl transition-colors", isNearMeEnabled ? "bg-primary text-white" : "bg-slate-200 text-slate-400")}>
                                <LocateFixed size={16} />
                              </div>
                              <Label htmlFor="near-me-toggle-drawer" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Proximity Sort</Label>
                            </div>
                            <Switch id="near-me-toggle-drawer" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} className="scale-90" />
                          </div>

                          {filteredAndSortedSites.map((site) => (
                            <div key={site.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group" onClick={() => centerOnSite(site)}>
                              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0">
                                <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{site.name}</p>
                                <p className="text-[10px] text-slate-400 uppercase font-black">{site.city}</p>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn("h-8 w-8 rounded-lg", itineraryIds.includes(site.id) ? 'text-primary' : 'text-slate-200')} 
                                onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }}
                              >
                                {itineraryIds.includes(site.id) ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* AI Planner Section */}
                    <AccordionItem value="planner" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-0 mb-4 group">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                            <Sparkles size={18} />
                          </div>
                          <span className="text-[11px] font-black uppercase tracking-widest text-primary">AI Route Planner</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                           <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 shadow-inner">
                              <div className="space-y-1">
                                <Label className="text-[9px] font-black uppercase text-slate-400">Starting From</Label>
                                <Input placeholder="Location" value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} className="rounded-xl border-none shadow-sm text-xs font-bold" />
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-[9px] font-black uppercase text-slate-400">
                                  <span>Time Limit</span>
                                  <span className="text-primary">{plannerTime[0]}h</span>
                                </div>
                                <Slider value={plannerTime} onValueChange={setPlannerTime} max={12} min={2} step={1} />
                              </div>
                              <Button onClick={handleGeneratePlanner} disabled={isGeneratingPlanner} className="w-full rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest h-11">
                                {isGeneratingPlanner ? <Loader2 className="animate-spin" size={16} /> : "Generate Plan"}
                              </Button>
                           </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    {/* App Links */}
                    <div className="pt-8 space-y-2">
                      <p className="text-[9px] font-black uppercase text-slate-400 mb-4 px-2">Application</p>
                      <Link href="/" className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4 text-slate-600 group-hover:text-primary">
                           <Home size={20} />
                           <span className="text-sm font-bold">Home</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                      </Link>
                      <Link href="/explore" className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4 text-slate-600 group-hover:text-primary">
                           <Search size={20} />
                           <span className="text-sm font-bold">Heritage Directory</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                      </Link>
                      <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-all group cursor-pointer" onClick={() => setShowKeyDialog(true)}>
                        <div className="flex items-center gap-4 text-slate-600 group-hover:text-primary">
                           <Settings size={20} />
                           <span className="text-sm font-bold">Engine Settings</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-200" />
                      </div>
                    </div>
                  </Accordion>
                </div>
              </ScrollArea>
              <div className="p-8 border-t bg-slate-50/50">
                 <div className="flex items-center gap-2 mb-2">
                    <BellRing size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Live Arrival Alerts</span>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed">The app will automatically notify you when you are within 20m of your destination stop.</p>
              </div>
            </SheetContent>
          </Sheet>

          {/* SEARCH BAR */}
          <div className="flex-1 relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
            <Input 
              placeholder="Search historical sites..." 
              className="pl-14 h-14 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-sm ring-1 ring-black/5" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button size="icon" className="h-14 w-14 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5" onClick={detectLocation}>
            {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
          </Button>
        </div>

        {/* FILTER BAR */}
        <div className="w-full">
          <ScrollArea className="w-full pb-2">
            <div className="flex items-center justify-center gap-2 px-1">
              <Button 
                  onClick={() => setSelectedCategories([])}
                  variant="ghost"
                  className={cn(
                      "h-10 px-5 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      selectedCategories.length === 0 ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
                  )}
              >
                  <RotateCcw size={14} className="mr-2" />
                  All
              </Button>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = selectedCategories.includes(cat.value);
                return (
                  <Button 
                    key={cat.value}
                    onClick={() => toggleCategory(cat.value)}
                    variant="ghost"
                    className={cn(
                      "h-10 px-5 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      isSelected ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
                    )}
                  >
                    <Icon size={14} className="mr-2" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      {/* BOTTOM CENTER ROUTE SUMMARY */}
      {itineraryIds.length > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-6">
          <Card className="rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                    <Route size={20} />
                  </div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Trip</h4>
                    <p className="text-sm font-black text-slate-900 leading-none">{itinerarySites.length} Destinations</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:bg-slate-100 rounded-full" onClick={() => setItineraryIds([])}>
                  <X size={16} />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Time</p>
                  <p className="text-xl font-black text-primary">{Math.round(totalTime)} min</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-1">Distance</p>
                  <p className="text-xl font-black text-primary">{totalDist.toFixed(1)} km</p>
                </div>
              </div>

              <div className="flex gap-2">
                 <Button className="flex-1 rounded-2xl bg-primary text-white font-black text-[10px] uppercase tracking-widest h-14 shadow-lg shadow-primary/20">
                    <Navigation size={16} className="mr-2" /> Start Navigation
                 </Button>
                 <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50">
                    <Save size={20} />
                 </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* AI RECOMMENDATION POPUP (Always Content) */}
      {!itineraryIds.length && (
         <div className="absolute bottom-10 right-10 z-50 w-72 hidden md:block">
            <Card className="rounded-[2rem] border-none bg-white/95 backdrop-blur-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="p-5 border-b border-slate-50 flex items-center gap-3">
                   <div className="p-2 bg-primary/10 rounded-xl text-primary">
                      <Sparkles size={16} />
                   </div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900">Nearby Highlights</h3>
                </div>
                <div className="p-2">
                   {aiSuggestions.map(site => (
                     <button 
                      key={site.id} 
                      onClick={() => centerOnSite(site)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-left"
                     >
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 relative shadow-sm">
                           <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[11px] font-bold text-slate-900 truncate">{site.name}</p>
                           <p className="text-[8px] font-black text-primary uppercase">{site.distance?.toFixed(1)} km away</p>
                        </div>
                     </button>
                   ))}
                </div>
            </Card>
         </div>
      )}

      {/* DIALOGS */}
      <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
        <DialogContent className="w-[92vw] max-w-md rounded-[2.5rem] p-10 border-none shadow-3xl bg-white/95 backdrop-blur-2xl">
          <DialogHeader>
            <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8">
              <Navigation size={32} />
            </div>
            <DialogTitle className="font-headline text-3xl font-black text-slate-900 leading-tight">Mapping Engine</DialogTitle>
            <DialogDescription className="text-slate-500 text-sm py-4 leading-relaxed font-medium">
              Provide an API key from OpenRouteService to enable street-accurate routing across Metro Cebu landmarks.
            </DialogDescription>
          </DialogHeader>
          <Input placeholder="Enter Engine Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-2xl h-14 bg-slate-100/80 border-none px-6 font-mono text-xs focus-visible:ring-2 focus-visible:ring-primary/20" />
          <DialogFooter className="mt-8">
            <Button type="button" className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/30" onClick={handleSaveKey}>
              Initialize Routing
            </Button>
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

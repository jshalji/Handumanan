'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES, HeritageSite } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti, type RouteStep } from '@/lib/routing-service';
import { generatePersonalizedItinerary } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Sparkles, 
  Clock, 
  Route as RouteIcon, 
  Map as MapIcon, 
  Search,
  LocateFixed,
  Car,
  Footprints,
  BrainCircuit,
  Save,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  History,
  Church,
  Landmark,
  TreePine,
  Building2,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 flex items-center justify-center font-black uppercase tracking-widest text-[10px] opacity-30">Map Initializing...</div>
});

const CATEGORIES = [
  { label: "Churches", icon: Church },
  { label: "Museums", icon: Landmark },
  { label: "Landmarks", icon: Landmark },
  { label: "Parks", icon: TreePine }
];

const CITIES = ["All", "Cebu City", "Lapu-Lapu City", "Mandaue City", "Talisay City"];

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
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("All");
  const [isNearMeEnabled, setIsNearMeEnabled] = useState(false);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [visitedSites, setVisitedSites] = useState<string[]>([]);
  const arrivalToastRef = useRef<string | null>(null);

  const db = useFirestore();
  const defaultLocation = { lat: 10.2936, lng: 123.9019 };

  // Firestore Site Fetching with Multi-Category Support
  const sitesQuery = useMemoFirebase(() => {
    if (!db) return null;
    const colRef = collection(db, 'heritageSites');
    if (selectedCategories.length > 0) {
      console.log("Filtering Firestore by categories:", selectedCategories);
      return query(colRef, where('category', 'in', selectedCategories));
    }
    return colRef;
  }, [db, selectedCategories]);

  const { data: firestoreSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  useEffect(() => {
    if (firestoreSites) {
      console.log("Firestore query successful. Results:", firestoreSites.length);
    }
  }, [firestoreSites]);

  // Fallback to static data if Firestore is empty or loading
  const allSites = useMemo(() => {
    if (firestoreSites && firestoreSites.length > 0) return firestoreSites as any as HeritageSite[];
    return HERITAGE_SITES;
  }, [firestoreSites]);

  // API Key Loading
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
      toast({ title: "Location Denied", description: "Enable location to use 'Near Me' feature.", variant: "destructive" });
      setUserLocation(defaultLocation);
      return defaultLocation;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // Arrival Tracker Logic
  useEffect(() => {
    if (!userLocation || itineraryIds.length === 0) return;

    const watchId = navigator.geolocation.watchPosition((position) => {
      const currentLat = position.coords.latitude;
      const currentLng = position.coords.longitude;
      setUserLocation({ lat: currentLat, lng: currentLng });

      itineraryIds.forEach(id => {
        const site = allSites.find(s => s.id === id);
        if (site && !visitedSites.includes(id)) {
          const distance = calculateDistance(currentLat, currentLng, site.coordinates.lat, site.coordinates.lng);
          if (distance < 0.05) { // 50 meters
            setVisitedSites(prev => [...prev, id]);
            if (arrivalToastRef.current !== id) {
              toast({
                title: "Arrival Notification!",
                description: `You have arrived at ${site.name}!`,
                variant: "default",
              });
              if ('vibrate' in navigator) navigator.vibrate(200);
              arrivalToastRef.current = id;
            }
          }
        }
      });
    }, (err) => console.error(err), { enableHighAccuracy: true });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userLocation, itineraryIds, visitedSites, allSites, toast]);

  const handleGenerateRoute = async (customIds?: string[]) => {
    const idsToRoute = customIds || itineraryIds;
    if (idsToRoute.length === 0) {
      toast({ title: "No Destinations", description: "Select at least one destination.", variant: "destructive" });
      return;
    }

    if (!orsKey) {
      setShowKeyDialog(true);
      return;
    }

    setIsPlanningRoute(true);
    try {
      const startPoint = userLocation || await detectLocation();
      const destinations = idsToRoute.map(id => allSites.find(s => s.id === id)?.coordinates).filter(Boolean) as {lat: number, lng: number}[];
      
      const routeData = await getRouteMulti([startPoint, ...destinations], orsKey, travelMode);
      
      if (routeData) {
        setRouteCoords(routeData.coordinates);
        setRouteSteps(routeData.steps);
        setTotalDist(routeData.distance);
        setTotalTime(routeData.duration);
        if (window.innerWidth < 768) setIsPanelExpanded(true); 
      } else {
        toast({ title: "Route Error", description: "Check your API key or connection.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPlanningRoute(false);
    }
  };

  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));

    // Firestore handling happens at query level, but we keep fallback filter for static data
    if (selectedCategories.length > 0 && (!firestoreSites || firestoreSites.length === 0)) {
        result = result.filter(s => selectedCategories.some(cat => s.category.includes(cat)));
    }

    if (selectedCity !== "All") {
      result = result.filter(s => s.city === selectedCity);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }

    if (isNearMeEnabled) {
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [allSites, userLocation, selectedCategories, selectedCity, searchQuery, isNearMeEnabled, firestoreSites]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds, allSites]);

  const nearbySites = useMemo(() => {
    if (!userLocation) return [];
    return allSites
      .filter(site => !itineraryIds.includes(site.id))
      .map(site => ({
        ...site,
        distance: calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng)
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);
  }, [allSites, userLocation, itineraryIds]);

  const toggleCategory = (label: string) => {
    setSelectedCategories(prev => 
      prev.includes(label) ? prev.filter(c => c !== label) : [...prev, label]
    );
  };

  const handleAiItinerary = async () => {
    if (!orsKey) {
      setShowKeyDialog(true);
      return;
    }
    setIsAiThinking(true);
    try {
      const loc = userLocation || await detectLocation();
      const result = await generatePersonalizedItinerary({
        interests: selectedCategories.length > 0 ? selectedCategories : ["History", "Architecture"],
        availableTimeHours: 6,
        startingLocation: `${loc.lat}, ${loc.lng}`,
        siteDatabase: JSON.stringify(allSites.slice(0, 30))
      });
      
      const suggestedIds = result.itinerary.map(item => allSites.find(s => s.name === item.siteName)?.id).filter(Boolean) as string[];
      setItineraryIds(suggestedIds);
      handleGenerateRoute(suggestedIds);
      toast({ title: "AI Plan Ready", description: "Mapping optimized heritage route." });
    } catch (error) {
      toast({ title: "AI Assistant Busy", description: "Could not generate AI plan.", variant: "destructive" });
    } finally {
      setIsAiThinking(false);
    }
  };

  const moveItineraryItem = (index: number, direction: 'up' | 'down') => {
    setItineraryIds(prev => {
      const newIds = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex >= 0 && targetIndex < newIds.length) {
        [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
      }
      return newIds;
    });
  };

  const saveToProfile = () => {
    if (!user || !db || itineraryIds.length === 0) {
        toast({ title: "Login Required", description: "Sign in to save your trips.", variant: "destructive" });
        return;
    }
    const itinRef = doc(collection(db, 'users', user.uid, 'itineraries'));
    setDocumentNonBlocking(itinRef, {
        userId: user.uid,
        selectedPlaces: itineraryIds,
        itineraryData: JSON.stringify({ itinerary: itinerarySites, routeSteps, totalDist, totalTime }),
        summary: `Heritage tour of ${itinerarySites[0].name} and ${itineraryIds.length - 1} other sites.`,
        createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Check your profile." });
  };

  const toggleSite = (id: string) => {
    setItineraryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      <Navbar />
      
      <main className="flex-1 relative overflow-hidden">
        
        {/* Full Screen Map Canvas */}
        <div className="absolute inset-0 z-0">
          <HeritageMap 
            userLocation={userLocation} 
            sites={filteredAndSortedSites} 
            itinerary={itinerarySites} 
            routeCoordinates={routeCoords} 
            totalTime={totalTime} 
            totalDist={totalDist} 
            onAddSite={toggleSite}
          />
        </div>

        {/* Floating Top Controls (Search + Quick Actions) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-2xl z-50 space-y-4">
          <div className="flex gap-2 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Find a heritage site..." 
                className="pl-11 h-14 rounded-2xl shadow-2xl border-none bg-white/95 backdrop-blur-xl w-full font-bold text-sm ring-1 ring-black/5" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-slate-600 hover:bg-slate-50 border-none ring-1 ring-black/5" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
            </Button>
          </div>

          {/* Horizontal Category Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 px-1">
            <Button 
                onClick={() => setSelectedCategories([])}
                variant="ghost"
                className={cn(
                    "h-10 px-5 rounded-full shadow-sm bg-white/90 backdrop-blur-md border border-white/50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    selectedCategories.length === 0 ? "bg-primary text-white shadow-primary/20 scale-105" : "text-slate-600 hover:bg-white"
                )}
            >
                <RotateCcw size={14} className="mr-2" />
                Show All
            </Button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategories.includes(cat.label);
              return (
                <Button 
                  key={cat.label}
                  onClick={() => toggleCategory(cat.label)}
                  variant="ghost"
                  className={cn(
                    "h-10 px-5 rounded-full shadow-sm bg-white/90 backdrop-blur-md border border-white/50 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                    isSelected ? "bg-primary text-white shadow-primary/20 scale-105" : "text-slate-600 hover:bg-white"
                  )}
                >
                  <Icon size={14} className="mr-2" />
                  {cat.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Nearby Recommendations (Bottom-Right Floating) */}
        {itineraryIds.length > 0 && (
          <div className="fixed bottom-10 right-10 z-[1000] w-72 animate-in fade-in slide-in-from-right-10 hidden lg:block">
            <Card className="rounded-[2.5rem] shadow-2xl border-none p-6 bg-white/95 backdrop-blur-2xl ring-1 ring-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Sparkles size={14} className="text-accent" /> Nearby Picks
                </h3>
              </div>
              <ScrollArea className="h-48">
                <div className="space-y-3 pr-4">
                  {nearbySites.map(site => (
                    <div 
                      key={site.id} 
                      className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                      onClick={() => toggleSite(site.id)}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative shadow-sm">
                        <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-800 truncate leading-none mb-1">{site.name}</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase">{site.distance.toFixed(1)} km</p>
                      </div>
                      <Plus size={14} className="text-slate-300 group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        )}

        {/* Explore & Itinerary Panel (Floating Side/Bottom Panel) */}
        <div 
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out md:left-6 md:top-24 md:bottom-auto md:w-[320px] bg-white/95 backdrop-blur-2xl shadow-2xl border-none flex flex-col rounded-t-[2.5rem] md:rounded-[2.5rem] ring-1 ring-black/5",
            isPanelExpanded ? "h-[85vh] md:h-[calc(100vh-120px)]" : "h-[72px] md:h-14"
          )}
        >
          {/* Header/Handle */}
          <button 
            className="w-full h-14 flex items-center justify-between px-6 shrink-0"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <MapIcon size={18} className="text-primary" />
              </div>
              <h2 className="font-headline text-lg font-black text-slate-900">Heritage Explorer</h2>
            </div>
            <div className="flex items-center gap-2">
               {itineraryIds.length > 0 && (
                <Badge className="bg-primary text-white border-none rounded-full h-5 min-w-5 flex items-center justify-center text-[10px] font-black">
                  {itineraryIds.length}
                </Badge>
              )}
              {isPanelExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronUp size={20} className="text-slate-400" />}
            </div>
          </button>

          <div className={cn("flex-1 flex flex-col overflow-hidden", !isPanelExpanded && "hidden")}>
            <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 mx-4 mt-2 h-12 bg-slate-100/50 rounded-2xl p-1.5">
                <TabsTrigger value="discovery" className="rounded-xl text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Discovery</TabsTrigger>
                <TabsTrigger value="navigation" className="rounded-xl text-[9px] font-black uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm">Route Plan</TabsTrigger>
              </TabsList>

              <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
                <div className="p-4 bg-slate-50/50 border-b space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <LocateFixed size={14} className={isNearMeEnabled ? "text-primary" : "text-slate-400"} />
                      <Label htmlFor="near-me-toggle" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Proximity Filter</Label>
                    </div>
                    <Switch id="near-me-toggle" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} className="scale-75 origin-right" />
                  </div>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white border-none shadow-sm font-bold text-xs uppercase tracking-wider px-4">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITIES.map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="flex-1 px-4">
                  {isSitesLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                          <Loader2 className="animate-spin text-primary" size={24} />
                          <p className="text-[10px] font-black uppercase tracking-widest">Querying Archives...</p>
                      </div>
                  ) : (
                    <div className="space-y-4 py-4">
                        {filteredAndSortedSites.length === 0 ? (
                            <div className="text-center py-20 opacity-40">
                                <p className="text-[10px] font-black uppercase tracking-widest">No sites match filters.</p>
                            </div>
                        ) : filteredAndSortedSites.map((site) => (
                        <Card key={site.id} className={cn(
                            "group overflow-hidden border-none shadow-sm rounded-3xl transition-all duration-300",
                            itineraryIds.includes(site.id) ? "bg-primary/5 ring-1 ring-primary/20" : "bg-slate-50/50 hover:bg-white hover:shadow-md"
                        )}>
                            <div className="flex items-center p-3 gap-4">
                            <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm">
                                <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="64px" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-sm line-clamp-1 text-slate-900 leading-tight mb-1">{site.name}</h3>
                                <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tight">{site.city} • {site.distance.toFixed(1)} km</p>
                                <Link href={`/site/${site.id}`} className="text-[10px] font-black text-primary hover:underline mt-2 inline-block">Site Details</Link>
                            </div>
                            <Button 
                                size="sm" 
                                variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                                className={cn("h-10 w-10 p-0 rounded-2xl", itineraryIds.includes(site.id) ? 'bg-primary border-none shadow-lg' : 'border-slate-200 text-slate-400')} 
                                onClick={() => toggleSite(site.id)}
                            >
                                {itineraryIds.includes(site.id) ? <X size={16} /> : <Plus size={16} />}
                            </Button>
                            </div>
                        </Card>
                        ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-6 border-t bg-white/80">
                  <Button variant="outline" className="w-full h-14 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border-2 border-dashed border-primary/20 hover:border-primary/40 text-primary" onClick={handleAiItinerary} disabled={isAiThinking}>
                    {isAiThinking ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit size={18} className="mr-2" />} AI Recommendation
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="navigation" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
                <div className="p-4 bg-slate-50/50 border-b flex items-center justify-between">
                   <div className="flex bg-slate-200/50 p-1 rounded-xl w-40">
                    <button onClick={() => setTravelMode('driving-car')} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2", travelMode === 'driving-car' ? 'bg-white shadow-sm text-primary' : 'text-slate-500')}><Car size={12} /> Drive</button>
                    <button onClick={() => setTravelMode('foot-walking')} className={cn("flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2", travelMode === 'foot-walking' ? 'bg-white shadow-sm text-primary' : 'text-slate-500')}><Footprints size={12} /> Walk</button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-slate-400 hover:text-red-500 gap-1.5" onClick={() => { setItineraryIds([]); setRouteCoords([]); setRouteSteps([]); }}>
                    <Trash2 size={12} /> Clear
                  </Button>
                </div>
                
                <ScrollArea className="flex-1 px-4 py-4">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                        <MapIcon size={32} className="text-slate-300" />
                      </div>
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest max-w-[150px]">Your route is empty.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {itinerarySites.map((site, idx) => (
                        <div key={site.id} className="flex gap-4 items-center bg-white p-4 rounded-[1.5rem] shadow-sm ring-1 ring-slate-100 group border-l-4 border-l-primary animate-in fade-in slide-in-from-left-2">
                          <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shrink-0 shadow-lg shadow-primary/20">
                            {visitedSites.includes(site.id) ? <CheckCircle2 size={16} className="text-white" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{site.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{site.city}</p>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveItineraryItem(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-300 hover:text-primary disabled:opacity-20"><ArrowUp size={14} /></button>
                            <button onClick={() => moveItineraryItem(idx, 'down')} disabled={idx === itineraryIds.length - 1} className="p-1 text-slate-300 hover:text-primary disabled:opacity-20"><ArrowDown size={14} /></button>
                          </div>
                          <button onClick={() => setItineraryIds(prev => prev.filter(id => id !== site.id))} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><X size={18} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-6 border-t bg-white space-y-4">
                  {routeSteps.length > 0 && (
                    <div className="bg-primary/5 p-4 rounded-3xl space-y-2 border border-primary/10">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary/60">
                        <span>Trip Summary</span>
                        <Badge variant="outline" className="text-[9px] border-primary/20 text-primary">{totalDist.toFixed(1)} KM</Badge>
                      </div>
                      <p className="text-2xl font-black text-primary leading-none">{Math.round(totalTime)} MINS <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Est. Travel</span></p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 h-14 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border-2" onClick={saveToProfile} disabled={itineraryIds.length === 0}>
                      <Save size={16} className="mr-2" /> Save
                    </Button>
                    <Button 
                      className="flex-[2] rounded-[2rem] h-14 bg-primary hover:bg-primary/90 text-white font-black text-[10px] tracking-widest uppercase shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 shadow-primary/30" 
                      onClick={() => handleGenerateRoute()} 
                      disabled={isPlanningRoute || itineraryIds.length === 0}
                    >
                      {isPlanningRoute ? <Loader2 className="animate-spin" size={20} /> : <><RouteIcon size={18} /> Start Route</>}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* API Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="w-[90vw] max-w-md rounded-[2.5rem] p-8">
            <DialogHeader>
              <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Navigation size={32} />
              </div>
              <DialogTitle className="font-headline text-3xl font-black">Activation Required</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm py-4 leading-relaxed">
                To enable street-level navigation, provide an API key from <a href="https://openrouteservice.org" target="_blank" className="text-primary font-bold hover:underline decoration-2">openrouteservice.org</a>.
              </DialogDescription>
            </DialogHeader>
            <Input placeholder="PASTE_API_KEY_HERE" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-2xl h-14 bg-slate-50 border-none px-6 font-mono text-xs" />
            <DialogFooter className="mt-8">
              <Button type="button" className="w-full h-16 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20" onClick={handleSaveKey}>
                Enable Engine
              </Button>
            </DialogFooter>
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
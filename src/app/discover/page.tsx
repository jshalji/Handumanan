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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  MapPin, 
  Navigation, 
  Loader2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  Route as RouteIcon, 
  Map as MapIcon, 
  Search,
  LocateFixed,
  Car,
  Footprints,
  BrainCircuit,
  Save,
  Key,
  X,
  Plus,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Info,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const HeritageMap = dynamic(() => import('@/components/map/HeritageMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-50 flex items-center justify-center font-black uppercase tracking-widest text-xs opacity-50">Loading Mapping Engine...</div>
});

const CATEGORIES = [
  "All",
  "Churches & Religious Heritage Sites",
  "Ancestral Houses & Heritage Residences",
  "Museums & Cultural Institutions",
  "Historical Landmarks & Monuments",
  "Plazas, Parks & Public Spaces",
  "Government & Historic Buildings",
  "Cultural & Religious (Non-Catholic Sites)"
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
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  
  // Filter States
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [isNearMeEnabled, setIsNearMeEnabled] = useState(false);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [visitedSites, setVisitedSites] = useState<string[]>([]);
  const arrivalToastRef = useRef<string | null>(null);

  const db = useFirestore();
  const defaultLocation = { lat: 10.2936, lng: 123.9019 };
  const allSites = useMemo(() => HERITAGE_SITES, []);

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
        setIsPanelExpanded(false); // Collapse to show map
      } else {
        toast({ title: "Route Error", description: "Check your API key or connection.", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPlanningRoute(false);
    }
  };

  // URL Site ID handling
  useEffect(() => {
    if (siteIdFromUrl && allSites.length > 0 && orsKey && userLocation) {
      if (!itineraryIds.includes(siteIdFromUrl)) {
        setItineraryIds([siteIdFromUrl]);
        handleGenerateRoute([siteIdFromUrl]);
      }
    }
  }, [siteIdFromUrl, orsKey, userLocation, allSites]);

  // Site Filtering Logic
  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));

    if (selectedCategory !== "All") {
      result = result.filter(s => s.category === selectedCategory);
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
  }, [allSites, userLocation, selectedCategory, selectedCity, searchQuery, isNearMeEnabled]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds, allSites]);

  // Recommendations logic
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

  const handleAiItinerary = async () => {
    if (!orsKey) {
      setShowKeyDialog(true);
      return;
    }
    setIsAiThinking(true);
    try {
      const loc = userLocation || await detectLocation();
      const result = await generatePersonalizedItinerary({
        interests: selectedCategory !== "All" ? [selectedCategory] : ["History", "Architecture"],
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

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* Map Container */}
        <div className="flex-1 h-full relative z-0">
          <HeritageMap 
            userLocation={userLocation} 
            sites={filteredAndSortedSites} 
            itinerary={itinerarySites} 
            routeCoordinates={routeCoords} 
            totalTime={totalTime} 
            totalDist={totalDist} 
          />
          
          {/* Floating Controls */}
          <div className="absolute top-4 left-4 right-4 z-[1000] flex gap-2">
            <div className="flex-1 relative group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Find a site..." 
                className="pl-10 h-12 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-xl w-full font-bold text-sm" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsPanelExpanded(true)}
              />
            </div>
            <Button size="icon" className="h-12 w-12 rounded-2xl shadow-xl bg-white text-slate-600 hover:bg-slate-50 border-none" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
            </Button>
          </div>

          {/* Navigation Overlay Stats */}
          {routeSteps.length > 0 && !isPanelExpanded && (
            <div className="absolute top-20 right-4 z-[1000] animate-in fade-in slide-in-from-right-4">
              <Card className="p-3 rounded-2xl shadow-2xl bg-primary text-white border-none flex items-center gap-3">
                <Navigation size={18} />
                <div className="text-xs font-black uppercase tracking-widest">
                  {Math.round(totalTime)}m • {totalDist.toFixed(1)}km
                </div>
              </Card>
            </div>
          )}

          {/* Nearby Picks Modal - BOTTOM RIGHT */}
          {itineraryIds.length > 0 && !isPanelExpanded && (
            <div className="fixed bottom-10 right-10 z-[1000] w-72 md:w-80 animate-in fade-in slide-in-from-bottom-10">
              <Card className="rounded-[2.5rem] shadow-2xl border-none p-6 bg-white/95 backdrop-blur-2xl ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Nearby Picks</h3>
                  <Sparkles size={14} className="text-primary" />
                </div>
                <ScrollArea className="h-48 pr-4">
                  <div className="space-y-3">
                    {nearbySites.map(site => (
                      <div 
                        key={site.id} 
                        className="flex items-center gap-3 p-2 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer group"
                        onClick={() => {
                          if (!itineraryIds.includes(site.id)) {
                            const newIds = [...itineraryIds, site.id];
                            setItineraryIds(newIds);
                            handleGenerateRoute(newIds);
                            toast({ title: "Site Added", description: `Rerouting to ${site.name}` });
                          }
                        }}
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden relative">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="40px" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-slate-800 truncate leading-none mb-1 group-hover:text-primary transition-colors">{site.name}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase">{site.distance.toFixed(1)} km • {site.city}</p>
                        </div>
                        <Plus size={14} className="text-slate-300 group-hover:text-primary" />
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar / Bottom Panel */}
        <div 
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out md:relative md:inset-auto md:w-[350px] lg:w-[400px] md:h-full bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] md:shadow-none flex flex-col rounded-t-[2.5rem] md:rounded-none",
            isPanelExpanded ? "h-[85vh]" : "h-[72px] md:h-full"
          )}
        >
          {/* Mobile Handle */}
          <button 
            className="md:hidden w-full h-8 flex items-center justify-center pt-2 pb-1"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
          </button>

          {/* Panel Header */}
          <div className="px-6 pb-4 border-b flex items-center justify-between">
            <h2 className="font-headline text-xl font-black text-slate-900 flex items-center gap-2">
              <MapIcon size={20} className="text-primary" /> Discovery
            </h2>
            <button 
              className="md:hidden p-2 text-slate-400"
              onClick={() => setIsPanelExpanded(!isPanelExpanded)}
            >
              {isPanelExpanded ? <ChevronDown size={24} /> : <ChevronUp size={24} />}
            </button>
          </div>

          <div className={cn("flex-1 flex flex-col overflow-hidden", !isPanelExpanded && "hidden md:flex")}>
            <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
              <TabsList className="grid grid-cols-2 mx-4 mt-4 h-11 bg-slate-100 rounded-xl p-1">
                <TabsTrigger value="discovery" className="rounded-lg text-[9px] font-black uppercase tracking-widest">Heritage Sites</TabsTrigger>
                <TabsTrigger value="navigation" className="rounded-lg text-[9px] font-black uppercase tracking-widest">My Itinerary {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
              </TabsList>

              <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
                <div className="p-4 space-y-3 bg-slate-50/50">
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={selectedCity} onValueChange={setSelectedCity}>
                      <SelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm font-bold text-[10px] uppercase tracking-wider">
                        <SelectValue placeholder="City" />
                      </SelectTrigger>
                      <SelectContent>
                        {CITIES.map(c => <SelectItem key={c} value={c} className="text-[10px] font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                      <SelectTrigger className="h-10 rounded-xl bg-white border-none shadow-sm font-bold text-[10px] uppercase tracking-wider">
                        <SelectValue placeholder="Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-[10px] font-bold">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                    <div className="flex items-center gap-2">
                      <LocateFixed size={14} className={isNearMeEnabled ? "text-primary" : "text-slate-400"} />
                      <Label htmlFor="near-me-toggle" className="text-[10px] font-black uppercase tracking-widest text-slate-600">Near Me Only</Label>
                    </div>
                    <Switch id="near-me-toggle" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} className="scale-75 origin-right" />
                  </div>
                </div>
                <ScrollArea className="flex-1 px-4">
                  <div className="space-y-3 py-4">
                    {filteredAndSortedSites.map((site) => (
                      <Card key={site.id} className="group overflow-hidden border-none shadow-sm rounded-2xl bg-slate-50/80 hover:bg-white transition-colors">
                        <div className="flex items-center p-3 gap-3">
                          <div className="relative w-14 h-14 flex-shrink-0 rounded-xl overflow-hidden shadow-sm">
                            <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="56px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-[12px] line-clamp-1 text-slate-900">{site.name}</h3>
                            <p className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{site.city} • {site.distance.toFixed(1)} km</p>
                            <Link href={`/site/${site.id}`} className="text-[8px] font-black text-blue-600 uppercase hover:underline">Details</Link>
                          </div>
                          <Button 
                            size="sm" 
                            variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                            className={cn("h-10 w-10 p-0 rounded-xl font-black", itineraryIds.includes(site.id) ? 'bg-primary border-none text-white' : 'border-primary/20 text-primary')} 
                            onClick={() => setItineraryIds(prev => prev.includes(site.id) ? prev.filter(i => i !== site.id) : [...prev, site.id])}
                          >
                            {itineraryIds.includes(site.id) ? <X size={16} /> : <Plus size={16} />}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t bg-white">
                  <Button variant="outline" className="w-full h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 border-dashed" onClick={handleAiItinerary} disabled={isAiThinking}>
                    {isAiThinking ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit size={16} className="mr-2 text-primary" />} AI Suggested Itinerary
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="navigation" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
                <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                   <div className="flex bg-slate-200 p-1 rounded-lg w-40">
                    <button onClick={() => setTravelMode('driving-car')} className={cn("flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1", travelMode === 'driving-car' ? 'bg-white shadow-sm text-primary' : 'text-slate-500')}><Car size={10} /> Drive</button>
                    <button onClick={() => setTravelMode('foot-walking')} className={cn("flex-1 py-1 text-[8px] font-black uppercase tracking-widest rounded transition-all flex items-center justify-center gap-1", travelMode === 'foot-walking' ? 'bg-white shadow-sm text-primary' : 'text-slate-500')}><Footprints size={10} /> Walk</button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-[9px] font-black uppercase text-slate-400" onClick={() => { setItineraryIds([]); setRouteCoords([]); setRouteSteps([]); }}>Clear All</Button>
                </div>
                <ScrollArea className="flex-1 px-4 py-4">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                      <MapIcon size={48} className="mb-4 text-slate-300" />
                      <p className="text-xs font-black text-slate-800 uppercase tracking-widest">Select stops to route</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {itinerarySites.map((site, idx) => (
                        <div key={site.id} className="flex gap-3 items-center bg-white p-3 rounded-2xl shadow-sm ring-1 ring-slate-100 border-l-4 border-l-primary">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[11px] font-black shrink-0 shadow-lg">
                            {visitedSites.includes(site.id) ? <CheckCircle2 size={14} className="text-green-400" /> : idx + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-black text-slate-800 truncate leading-none">{site.name}</p>
                            <p className="text-[8px] text-slate-400 font-black uppercase mt-1">{site.city}</p>
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <button onClick={() => moveItineraryItem(idx, 'up')} disabled={idx === 0} className="p-1 text-slate-300 hover:text-primary disabled:opacity-20"><ArrowUp size={14} /></button>
                            <button onClick={() => moveItineraryItem(idx, 'down')} disabled={idx === itineraryIds.length - 1} className="p-1 text-slate-300 hover:text-primary disabled:opacity-20"><ArrowDown size={14} /></button>
                          </div>
                          <button onClick={() => setItineraryIds(prev => prev.filter(id => id !== site.id))} className="p-2 text-slate-300 hover:text-red-500"><X size={16} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                {/* STICKY FOOTER ACTIONS */}
                <div className="p-6 border-t bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] space-y-4">
                  {routeSteps.length > 0 && (
                    <Card className="bg-primary p-5 rounded-[2rem] text-white shadow-xl space-y-3 border-none animate-in fade-in zoom-in-95">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest opacity-80">
                        <span>ESTIMATED STATS</span>
                        <div className="flex items-center gap-1"><Clock size={10} /> {Math.round(totalTime)} MIN</div>
                      </div>
                      <h4 className="text-lg font-black leading-tight flex items-center gap-2">
                        <Navigation size={18} className="text-white/60" />
                        {totalDist.toFixed(1)} KM TOTAL
                      </h4>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button variant="ghost" className="h-10 text-[9px] font-black uppercase text-white bg-white/10 hover:bg-white/20 rounded-xl" onClick={() => { setItineraryIds([]); setRouteCoords([]); setRouteSteps([]); }}>Reset</Button>
                        <Button variant="ghost" className="h-10 text-[9px] font-black uppercase text-white bg-white/10 hover:bg-white/20 rounded-xl" onClick={saveToProfile}><Save size={12} className="mr-2" /> Save Trip</Button>
                      </div>
                    </Card>
                  )}

                  <Button 
                    className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50" 
                    onClick={() => handleGenerateRoute()} 
                    disabled={isPlanningRoute || itineraryIds.length === 0}
                  >
                    {isPlanningRoute ? <Loader2 className="animate-spin" size={20} /> : <><RouteIcon size={18} /> GENERATE ROAD ROUTE</>}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* API Key Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="w-[90vw] max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl font-bold">Navigation Service</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm py-4">To draw road-accurate routes, please enter your free API key from <a href="https://openrouteservice.org" target="_blank" className="text-primary font-bold hover:underline">openrouteservice.org</a>.</DialogDescription>
            </DialogHeader>
            <Input placeholder="Enter API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-xl h-12 mb-4" />
            <DialogFooter><Button type="button" className="w-full h-14 rounded-2xl font-bold" onClick={handleSaveKey}>Activate Routing</Button></DialogFooter>
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

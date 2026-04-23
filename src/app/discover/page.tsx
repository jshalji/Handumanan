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
  ChevronRight, 
  Search,
  Maximize2,
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
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFirestore, useUser } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';
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
  const [isRecommendationsOpen, setIsRecommendationsOpen] = useState(false);
  
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
      toast({ title: "Location Denied", description: "Location access needed for 'Near Me' feature.", variant: "destructive" });
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
      toast({ title: "No Destinations", description: "Please select at least one destination.", variant: "destructive" });
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
        setIsRecommendationsOpen(true);
      } else {
        toast({ title: "Route Error", description: "Failed to map road route. Please check your API key.", variant: "destructive" });
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
        toast({ title: "Login Required", description: "Sign in to save your heritage trips.", variant: "destructive" });
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
    toast({ title: "Trip Saved", description: "Find this in your profile." });
  };

  const recommendedSites = useMemo(() => {
    return filteredAndSortedSites.filter(s => !itineraryIds.includes(s.id)).slice(0, 5);
  }, [filteredAndSortedSites, itineraryIds]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Search Overlay */}
        <div className="absolute top-6 left-4 right-4 md:left-[30%] md:right-8 z-[1000] pointer-events-none flex flex-col gap-4">
          <div className="flex gap-3 pointer-events-auto max-w-2xl">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input placeholder="Search Heritage Sites..." className="pl-12 h-14 rounded-2xl shadow-2xl border-none bg-white/95 backdrop-blur-xl w-full text-base font-bold focus:ring-2 ring-primary/30" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-slate-600 hover:bg-slate-50 border-none" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>
        </div>

        {/* Control Sidebar */}
        <div className="w-full md:w-[30%] border-r bg-white flex flex-col z-20 shadow-2xl">
          <div className="p-6 border-b space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-headline text-2xl font-black text-slate-900 flex items-center gap-3">
                <Navigation size={28} className="text-primary" /> Handumanan Maps
              </h1>
              <Button variant="ghost" size="icon" className="rounded-full text-slate-400 hover:text-primary" onClick={() => setShowKeyDialog(true)}>
                <Key size={18} />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] uppercase tracking-wider">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  {CITIES.map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-[11px] uppercase tracking-wider">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c} value={c} className="text-xs font-bold">{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-2">
                <LocateFixed size={16} className={isNearMeEnabled ? "text-primary" : "text-slate-400"} />
                <Label htmlFor="near-me" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Near Me Only</Label>
              </div>
              <Switch id="near-me" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} />
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl">
              <button onClick={() => setTravelMode('driving-car')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${travelMode === 'driving-car' ? 'bg-white shadow-md text-primary' : 'text-slate-500'}`}><Car size={14} /> Drive</button>
              <button onClick={() => setTravelMode('foot-walking')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${travelMode === 'foot-walking' ? 'bg-white shadow-md text-primary' : 'text-slate-500'}`}><Footprints size={14} /> Walk</button>
            </div>
          </div>

          <Tabs defaultValue="discovery" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid grid-cols-2 mx-6 mt-4 h-11 bg-slate-100 rounded-2xl p-1.5">
              <TabsTrigger value="discovery" className="rounded-xl text-[10px] font-black uppercase tracking-widest">Directory</TabsTrigger>
              <TabsTrigger value="navigation" className="rounded-xl text-[10px] font-black uppercase tracking-widest">My Itinerary {itineraryIds.length > 0 && `(${itineraryIds.length})`}</TabsTrigger>
            </TabsList>

            <TabsContent value="discovery" className="flex-1 overflow-hidden p-0 m-0">
              <ScrollArea className="h-full px-6 py-4">
                <div className="space-y-4">
                  {filteredAndSortedSites.map((site) => (
                    <Card key={site.id} className="group overflow-hidden border-none shadow-sm hover:shadow-md transition-all rounded-3xl bg-slate-50/50">
                      <div className="flex">
                        <div className="relative w-24 h-24 flex-shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="96px" />
                          <Badge className="absolute bottom-1.5 left-1.5 bg-white/95 text-primary text-[8px] px-2 h-4 border-none font-black">{site.distance.toFixed(1)} km</Badge>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between overflow-hidden">
                          <div>
                            <h3 className="font-bold text-[13px] line-clamp-1 text-slate-900">{site.name}</h3>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter mt-0.5">{site.city}</p>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <Link href={`/site/${site.id}`} className="text-[9px] font-black text-blue-600 flex items-center gap-1 hover:underline">INFO <ArrowRight size={10} /></Link>
                            <Button size="sm" variant={itineraryIds.includes(site.id) ? "default" : "outline"} className={`h-7 px-3 text-[9px] rounded-full font-black ${itineraryIds.includes(site.id) ? 'bg-primary border-none text-white' : 'border-primary/20 text-primary'}`} onClick={() => setItineraryIds(prev => prev.includes(site.id) ? prev.filter(i => i !== site.id) : [...prev, site.id])}>
                              {itineraryIds.includes(site.id) ? "REMOVE" : "ADD STOP"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="navigation" className="flex-1 overflow-hidden p-0 m-0">
              <div className="h-full flex flex-col">
                <ScrollArea className="flex-1 px-6 py-4">
                  {itineraryIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6 text-slate-300"><MapIcon size={32} /></div>
                      <p className="text-sm font-black text-slate-800">Your trip is empty</p>
                      <p className="text-[11px] text-muted-foreground mt-2 max-w-[200px] mx-auto leading-relaxed font-bold">Select heritage sites from the directory to build your manual itinerary.</p>
                      <Button variant="outline" size="sm" className="mt-6 rounded-xl font-black text-[10px] uppercase tracking-widest" onClick={handleAiItinerary} disabled={isAiThinking}>
                        {isAiThinking ? <Loader2 className="animate-spin mr-2" /> : <BrainCircuit size={14} className="mr-2" />} Get AI Suggestion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-slate-50 p-5 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Itinerary Order</h4>
                        <div className="space-y-3">
                          {itinerarySites.map((site, idx) => (
                            <div key={site.id} className="flex gap-4 items-center group bg-white p-3 rounded-2xl shadow-sm">
                              <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">
                                {visitedSites.includes(site.id) ? <CheckCircle2 size={14} /> : idx + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-black text-slate-800 truncate">{site.name}</p>
                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{site.city}</p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <button onClick={() => moveItineraryItem(idx, 'up')} disabled={idx === 0} className="text-slate-300 hover:text-primary disabled:opacity-30"><ArrowUp size={14} /></button>
                                <button onClick={() => moveItineraryItem(idx, 'down')} disabled={idx === itineraryIds.length - 1} className="text-slate-300 hover:text-primary disabled:opacity-30"><ArrowDown size={14} /></button>
                              </div>
                              <button onClick={() => setItineraryIds(prev => prev.filter(id => id !== site.id))} className="text-slate-300 hover:text-red-500 p-1"><X size={16} /></button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {routeSteps.length > 0 && (
                         <div className="bg-primary p-6 rounded-[2rem] text-white shadow-2xl space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-80">
                              <span>ROUTE STATS</span>
                              <span>{Math.round(totalTime)} MIN</span>
                            </div>
                            <h4 className="text-xl font-black leading-tight">{totalDist.toFixed(1)} KM TOTAL TRIP</h4>
                            <div className="grid grid-cols-2 gap-2">
                              <Button variant="ghost" className="h-10 text-[10px] font-black uppercase text-white bg-white/10 hover:bg-white/20 rounded-xl" onClick={() => { setItineraryIds([]); setRouteCoords([]); setRouteSteps([]); }}>CLEAR</Button>
                              <Button variant="ghost" className="h-10 text-[10px] font-black uppercase text-white bg-white/10 hover:bg-white/20 rounded-xl" onClick={saveToProfile}><Save size={12} className="mr-2" /> SAVE</Button>
                            </div>
                         </div>
                      )}

                      <Button className="w-full rounded-2xl h-14 bg-primary hover:bg-primary/90 text-white font-black text-xs tracking-widest uppercase shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95" onClick={() => handleGenerateRoute()} disabled={isPlanningRoute}>
                        {isPlanningRoute ? <><Loader2 className="animate-spin" size={20} /> CALCULATING...</> : <><RouteIcon size={20} /> GENERATE ROAD ROUTE</>}
                      </Button>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Map Display */}
        <div className="flex-1 h-full relative">
          <HeritageMap userLocation={userLocation} sites={filteredAndSortedSites} itinerary={itinerarySites} routeCoordinates={routeCoords} totalTime={totalTime} totalDist={totalDist} />
          
          {/* Stats Overlay for the Map */}
          {routeSteps.length > 0 && (
            <div className="absolute top-24 right-6 z-[1000] animate-in fade-in slide-in-from-right-4">
              <Card className="p-4 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border-none ring-1 ring-slate-100 flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Navigation size={20} /></div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Navigation</p>
                  <p className="text-sm font-black text-slate-900">{Math.round(totalTime)} min • {totalDist.toFixed(1)} km</p>
                </div>
              </Card>
            </div>
          )}

          {/* Recommendations Floating Panel */}
          {isRecommendationsOpen && (
            <div className="fixed bottom-10 right-10 z-[1001] w-[calc(100%-2.5rem)] md:w-80 animate-in slide-in-from-bottom-10 fade-in duration-300">
              <Card className="rounded-[2.5rem] shadow-2xl border-none p-6 bg-white/95 backdrop-blur-2xl ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-primary/10 rounded-xl text-primary"><Sparkles size={14} /></div>
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Nearby Picks</h4>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setIsRecommendationsOpen(false)}>
                    <X size={16} className="text-slate-400" />
                  </Button>
                </div>
                <ScrollArea className="h-48 pr-3">
                  <div className="space-y-4">
                    {recommendedSites.map(site => (
                      <div key={site.id} className="flex gap-4 items-center group cursor-pointer" onClick={() => {
                        setItineraryIds(prev => [...prev, site.id]);
                        handleGenerateRoute([...itineraryIds, site.id]);
                      }}>
                        <div className="relative w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover group-hover:scale-110 transition-transform" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-black text-slate-800 truncate leading-none mb-1">{site.name}</p>
                          <p className="text-[10px] text-primary font-black uppercase tracking-tighter">{site.distance.toFixed(1)} km &bull; {site.city}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                          <Plus size={14} />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>
          )}

          <div className="absolute bottom-8 left-6 md:left-auto md:right-6 z-[1000] flex flex-col gap-3">
             <div className="bg-white/95 backdrop-blur-xl p-3 rounded-2xl shadow-2xl ring-1 ring-slate-100 flex items-center gap-4">
                <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Info size={16} /></div>
                <p className="text-[9px] font-bold text-slate-600 leading-tight">Live arrival tracking enabled.<br/>Arrival notified within 50m.</p>
             </div>
          </div>
        </div>

        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="sm:max-w-md rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-headline text-2xl font-bold">OpenRouteService API Key</DialogTitle>
              <DialogDescription className="text-slate-500 font-medium">To generate road-accurate navigation in Metro Cebu, please enter your OpenRouteService API key. You can get one for free at <a href="https://openrouteservice.org/dev/#/signup" target="_blank" className="text-primary hover:underline font-bold">openrouteservice.org</a>.</DialogDescription>
            </DialogHeader>
            <div className="flex items-center space-x-2 py-4"><div className="grid flex-1 gap-2"><Input placeholder="Enter your API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-xl h-12" /></div></div>
            <DialogFooter className="sm:justify-start"><Button type="button" className="w-full h-12 rounded-xl font-bold" onClick={handleSaveKey}>Save & Continue</Button></DialogFooter>
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

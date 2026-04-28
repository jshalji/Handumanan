'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { 
  Navigation, 
  Loader2, 
  Sparkles, 
  Search,
  LocateFixed,
  X,
  Plus,
  Route,
  Home,
  Save,
  Globe,
  Church,
  Landmark,
  TreePine,
  Menu,
  Settings,
  BellRing,
  ChevronUp,
  ChevronDown,
  Trash2,
  MapPin
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
  { label: "Government", value: "Government & Historic Buildings", icon: Landmark },
  { label: "Cultural", value: "Cultural & Religious (Non-Catholic Sites)", icon: Globe }
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
  const [alertedSites, setAlertedSites] = useState<string[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // AI Planner State
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [plannerResult, setPlannerResult] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [plannerStart, setPlannerStart] = useState('Cebu City Center');
  const [plannerTime, setPlannerTime] = useState([4]);
  const [plannerInterests, setPlannerInterests] = useState<string[]>([]);

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

  const { data: firestoreSites } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    const source = (firestoreSites && firestoreSites.length > 0) ? firestoreSites : HERITAGE_SITES;
    return source.map(site => ({
      ...site,
      coordinates: site.coordinates || { lat: site.latitude || 0, lng: site.longitude || 0 }
    })) as HeritageSite[];
  }, [firestoreSites]);

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

  useEffect(() => {
    if (!userLocation || itinerarySites.length === 0) return;
    const currentDestination = itinerarySites[0];
    const dist = calculateDistance(
      userLocation.lat, 
      userLocation.lng, 
      currentDestination.coordinates.lat, 
      currentDestination.coordinates.lng
    );
    if (dist <= 0.02 && !alertedSites.includes(currentDestination.id)) {
      toast({
        title: "📍 Destination Reached!",
        description: `Welcome to ${currentDestination.name}!`,
        duration: 8000,
      });
      setAlertedSites(prev => [...prev, currentDestination.id]);
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

    return result;
  }, [allSites, userLocation, searchQuery]);

  // SMART RECOMMENDATION LOGIC
  const aiSuggestions = useMemo(() => {
    let recommendations = allSites.map(s => {
      const dist = userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) : 100;
      // SCORING: distance_weight (closer is better) + popularity_weight (rating/must-visit)
      const popularityBonus = s.isMustVisit ? 2 : 0;
      const ratingBonus = (s.rating || 4) / 2;
      const distScore = Math.max(0, 10 - dist); // Higher score for being closer (max 10km)
      const totalScore = distScore + popularityBonus + ratingBonus;
      
      return { ...s, distance: dist, score: totalScore };
    });
    
    // Sort by combined score descending
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations.slice(0, 5);
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

  const moveStop = (index: number, direction: 'up' | 'down') => {
    const newIds = [...itineraryIds];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newIds.length) return;
    [newIds[index], newIds[targetIndex]] = [newIds[targetIndex], newIds[index]];
    setItineraryIds(newIds);
  };

  const centerOnSite = (site: HeritageSite | any) => {
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
      
      // LOGICAL ORDERING: Nearest neighbor logic for the trip
      const suggestedIds = output.itinerary
        .map(item => allSites.find(s => s.name.toLowerCase() === item.siteName.toLowerCase())?.id)
        .filter((id): id is string => !!id);
      
      if (suggestedIds.length > 0) {
        setItineraryIds(suggestedIds);
        const firstSite = allSites.find(s => s.id === suggestedIds[0]);
        if (firstSite) centerOnSite(firstSite);
      }
      toast({ title: "Itinerary Ready", description: "Logical route generated based on your location." });
    } catch (error) {
      toast({ title: "Planner Error", description: "Assistant busy. Try again.", variant: "destructive" });
    } finally {
      setIsGeneratingPlanner(false);
    }
  };

  const handleSavePlanner = () => {
    if (!user || !db || itineraryIds.length === 0) {
      toast({ title: "Login Required", description: "Sign in to save trips.", variant: "destructive" });
      return;
    }
    const itRef = doc(collection(db, 'users', user.uid, 'itineraries'));
    setDocumentNonBlocking(itRef, {
      userId: user.uid,
      itineraryIds: itineraryIds,
      summary: `${itineraryIds.length} stops in Metro Cebu`,
      createdAt: serverTimestamp()
    }, { merge: true });
    toast({ title: "Trip Saved", description: "Check your profile." });
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
        />
      </div>

      <div className="absolute top-6 inset-x-0 z-50 flex flex-col items-center gap-3 px-4 pointer-events-none">
        <div className="w-full max-w-xl flex gap-2 items-center pointer-events-auto">
          <Button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            size="icon" 
            className="h-12 w-12 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          >
            <Menu size={20} />
          </Button>

          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <Input 
              placeholder="Search historical sites..." 
              className="pl-12 h-12 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-sm ring-1 ring-black/5" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button size="icon" className="h-12 w-12 shrink-0 rounded-2xl shadow-xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5" onClick={detectLocation}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
          </Button>
        </div>

        <div className="w-full max-w-2xl pointer-events-auto">
          <ScrollArea className="w-full pb-2">
            <div className="flex items-center justify-center gap-1.5 px-1">
              <Button 
                  onClick={() => setSelectedCategories([])}
                  variant="ghost"
                  className={cn(
                      "h-9 px-4 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      selectedCategories.length === 0 ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
                  )}
              >
                  Show All
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
                      "h-9 px-4 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                      isSelected ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
                    )}
                  >
                    <Icon size={12} className="mr-1.5" />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>
      </div>

      <div 
        className={cn(
          "fixed left-0 top-0 h-full bg-white/95 backdrop-blur-2xl z-[60] transition-transform duration-300 shadow-2xl border-r border-slate-100 flex flex-col",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: 'var(--drawer-width)' }}
      >
        <style jsx>{`
          div { --drawer-width: 220px; }
          @media (max-width: 768px) { div { --drawer-width: 180px; } }
        `}</style>
        
        <div className="p-6 pb-2 flex items-center justify-between">
           <span className="font-headline text-lg font-black text-primary tracking-tight">Handumanan</span>
           <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsDrawerOpen(false)}>
              <X size={16} />
           </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            <Accordion type="multiple" defaultValue={["discovery", "planner"]} className="space-y-4">
              <AccordionItem value="discovery" className="border-none">
                <AccordionTrigger className="hover:no-underline py-0 mb-3 group text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Directory
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    {filteredAndSortedSites.slice(0, 8).map((site) => (
                      <div key={site.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-all cursor-pointer group" onClick={() => centerOnSite(site)}>
                        <div className="relative w-8 h-8 rounded-lg overflow-hidden shadow-sm shrink-0">
                          <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">{site.name}</p>
                          <p className="text-[8px] text-slate-400 uppercase font-black">{site.city}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="planner" className="border-none">
                <AccordionTrigger className="hover:no-underline py-0 mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Auto Itinerary
                </AccordionTrigger>
                <AccordionContent>
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                      <div className="space-y-1">
                        <Label className="text-[8px] font-black uppercase text-slate-400">Start</Label>
                        <Input placeholder="Location" value={plannerStart} onChange={(e) => setPlannerStart(e.target.value)} className="h-8 rounded-lg border-none shadow-sm text-[10px] font-bold" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                          <span>Available Time</span>
                          <span className="text-primary">{plannerTime[0]}h</span>
                        </div>
                        <Slider value={plannerTime} onValueChange={setPlannerTime} max={12} min={2} step={1} className="py-1" />
                      </div>
                      <Button onClick={handleGeneratePlanner} disabled={isGeneratingPlanner} className="w-full rounded-lg bg-primary text-[8px] font-black uppercase tracking-widest h-8">
                        {isGeneratingPlanner ? <Loader2 className="animate-spin" size={12} /> : "Generate Route"}
                      </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <div className="pt-4 space-y-1">
              <Link href="/" className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-600 hover:text-primary">
                 <Home size={16} />
                 <span className="text-[11px] font-bold">Home</span>
              </Link>
              <div className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-600 hover:text-primary cursor-pointer" onClick={() => setShowKeyDialog(true)}>
                 <Settings size={16} />
                 <span className="text-[11px] font-bold">Engine Config</span>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className="p-4 border-t bg-slate-50/50">
           <div className="flex items-center gap-2 mb-1">
              <BellRing size={12} className="text-primary" />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-900">Arrival Alerts</span>
           </div>
           <p className="text-[8px] text-slate-400 font-medium leading-tight">Vibrating alerts active (20m range).</p>
        </div>
      </div>

      {itineraryIds.length > 0 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[70] w-full max-w-sm px-4">
          <Card className="rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-xl text-primary">
                    <Route size={16} />
                  </div>
                  <div>
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400">Custom Trip</h4>
                    <p className="text-xs font-black text-slate-900 leading-none">{itinerarySites.length} Stops Active</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-100 rounded-full" onClick={() => setItineraryIds([])}>
                    <Trash2 size={14} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:bg-slate-100 rounded-full" onClick={() => setItineraryIds([])}>
                    <X size={14} />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="max-h-32 mb-4 pr-3">
                <div className="space-y-1.5">
                  {itinerarySites.map((site, idx) => (
                    <div key={site.id} className="flex items-center justify-between gap-2 p-2 bg-slate-50/50 rounded-xl border border-slate-100/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[9px] font-black text-primary w-4">{idx + 1}</span>
                        <p className="text-[10px] font-bold text-slate-900 truncate">{site.name}</p>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStop(idx, 'up')} disabled={idx === 0}><ChevronUp size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStop(idx, 'down')} disabled={idx === itineraryIds.length - 1}><ChevronDown size={12} /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400" onClick={() => toggleSite(site.id)}><X size={12} /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Est. Time</p>
                  <p className="text-lg font-black text-primary">{Math.round(totalTime)} min</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 mb-0.5">Total Dist</p>
                  <p className="text-lg font-black text-primary">{totalDist.toFixed(1)} km</p>
                </div>
              </div>

              <div className="flex gap-2">
                 <Button className="flex-1 rounded-xl bg-primary text-white font-black text-[9px] uppercase tracking-widest h-11 shadow-lg shadow-primary/20">
                    <Navigation size={14} className="mr-1.5" /> Start Trip
                 </Button>
                 <Button variant="outline" className="h-11 w-11 rounded-xl border-2 border-slate-100 text-slate-400 hover:bg-slate-50" onClick={handleSavePlanner}>
                    <Save size={16} />
                 </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* SMART RECOMMENDATIONS SIDE CARD */}
      {!itineraryIds.length && (
         <div className="absolute bottom-10 right-10 z-50 w-64 hidden md:block">
            <Card className="rounded-3xl border-none bg-white/95 backdrop-blur-2xl shadow-xl ring-1 ring-black/5 overflow-hidden">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                         <Sparkles size={14} />
                      </div>
                      <h3 className="text-[9px] font-black uppercase tracking-widest text-slate-900">Smart Suggestions</h3>
                   </div>
                </div>
                <div className="p-1.5 max-h-64 overflow-y-auto scrollbar-hide">
                   {aiSuggestions.map(site => (
                     <button 
                      key={site.id} 
                      onClick={() => centerOnSite(site)}
                      className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-xl transition-all text-left group"
                     >
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0 relative shadow-sm">
                           <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="text-[10px] font-bold text-slate-900 truncate">{site.name}</p>
                           <p className="text-[8px] font-black text-primary uppercase">
                            {userLocation ? `${site.distance.toFixed(1)} km away` : 'Popular Site'}
                           </p>
                        </div>
                        <Plus size={14} className="text-slate-200 group-hover:text-primary transition-colors shrink-0" onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }} />
                     </button>
                   ))}
                   {!aiSuggestions.length && (
                     <p className="text-[9px] p-4 text-center text-slate-400 font-medium italic">No recommendations available</p>
                   )}
                </div>
            </Card>
         </div>
      )}

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

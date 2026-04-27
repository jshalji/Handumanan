'use client';

import { useState, useEffect, useMemo, useCallback, Suspense, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti, type RouteStep } from '@/lib/routing-service';
import { generatePersonalizedItinerary } from '@/ai/flows/generate-personalized-itinerary';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Navigation, 
  Loader2, 
  Sparkles, 
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
  Church,
  Landmark,
  TreePine,
  Trash2,
  RotateCcw,
  Navigation2,
  MapPin,
  Clock,
  Info,
  ChevronRight
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';
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
  { label: "Churches", value: "Churches & Religious Heritage Sites", icon: Church },
  { label: "Museums", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Landmarks", value: "Historical Landmarks & Monuments", icon: Landmark },
  { label: "Parks", value: "Plazas, Parks & Public Spaces", icon: TreePine }
];

const CITIES = ["All", "Cebu City", "Lapu-Lapu City", "Mandaue City", "Talisay City"];

function ExploreRouteContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [routeSteps, setRouteSteps] = useState<RouteStep[]>([]);
  const [isPlanningRoute, setIsPlanningRoute] = useState(false);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [travelMode, setTravelMode] = useState<'driving-car' | 'foot-walking'>('driving-car');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [isAiSectionExpanded, setIsAiSectionExpanded] = useState(true);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
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

  // Firestore Site Fetching with Category Filtering
  const sitesQuery = useMemoFirebase(() => {
    if (!db) return null;
    const colRef = collection(db, 'heritageSites');
    
    // Multi-category support via 'in' query
    if (selectedCategories.length > 0) {
      return query(colRef, where('category', 'in', selectedCategories));
    }
    return colRef;
  }, [db, selectedCategories]);

  const { data: firestoreSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    return (firestoreSites || []) as any as HeritageSite[];
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
      toast({ title: "Engine Activated", description: "Street-level navigation is now live." });
    }
  };

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      return loc;
    } catch (err) {
      toast({ title: "Location Denied", description: "Enable GPS for nearby suggestions.", variant: "destructive" });
      setUserLocation(null);
      return null;
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
                title: "You have arrived!",
                description: `Welcome to ${site.name}.`,
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

  // UI Filtering and Sorting
  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));

    if (selectedCity !== "All") {
      result = result.filter(s => s.city === selectedCity);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q)
      );
    }

    if (isNearMeEnabled && userLocation) {
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [allSites, userLocation, selectedCity, searchQuery, isNearMeEnabled]);

  const aiSuggestions = useMemo(() => {
    if (allSites.length === 0) return [];
    
    let suggestions = [...allSites];
    if (userLocation) {
      suggestions.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });
    } else {
      suggestions = suggestions.filter(s => s.isMustVisit);
      if (suggestions.length === 0) suggestions = allSites;
    }
    
    return suggestions.slice(0, 5).map(s => ({
      ...s,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) : undefined
    }));
  }, [allSites, userLocation]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds, allSites]);

  const toggleCategory = (value: string) => {
    setSelectedCategories(prev => 
      prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
    );
  };

  const toggleSite = (id: string) => {
    setItineraryIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const centerOnSite = (site: HeritageSite) => {
    setFocusedLocation({ lat: site.coordinates.lat, lng: site.coordinates.lng });
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden relative">
      <Navbar />
      
      <main className="flex-1 relative overflow-hidden">
        
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

        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl z-50 flex flex-col items-center gap-3">
          <div className="w-full flex gap-2 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                placeholder="Search Metro Cebu heritage..." 
                className="pl-12 h-14 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-sm ring-1 ring-black/5" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-2xl bg-white text-primary hover:bg-slate-50 border-none ring-1 ring-black/5" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>

          <div className="w-full overflow-hidden">
            <ScrollArea className="w-full pb-2">
              <div className="flex items-center gap-2 px-1">
                <Button 
                    onClick={() => setSelectedCategories([])}
                    variant="ghost"
                    className={cn(
                        "h-10 px-5 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                        selectedCategories.length === 0 ? "bg-primary text-white shadow-primary/30 scale-105" : "text-slate-600 hover:bg-white"
                    )}
                >
                    <RotateCcw size={14} className="mr-2" />
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
                        "h-10 px-5 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                        isSelected ? "bg-primary text-white shadow-primary/30 scale-105" : "text-slate-600 hover:bg-white"
                      )}
                    >
                      <Icon size={14} className="mr-2" />
                      {cat.label}
                      {isSelected && <CheckCircle2 size={12} className="ml-2" />}
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
            "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-in-out md:left-6 md:top-24 md:bottom-auto md:w-[340px] bg-white/90 backdrop-blur-2xl shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-none flex flex-col rounded-t-[2.5rem] md:rounded-[2.5rem] ring-1 ring-black/5",
            isPanelExpanded ? "h-[75vh] md:h-[calc(100vh-140px)]" : "h-[76px] md:h-16"
          )}
        >
          <button 
            className="w-full h-16 flex items-center justify-between px-6 shrink-0"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Navigation2 size={20} className="text-primary" />
              </div>
              <h2 className="font-headline text-lg font-black text-slate-900">Explore</h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-1 rounded-full bg-slate-100 text-slate-400">
                {isPanelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            </div>
          </button>

          <div className={cn("flex-1 flex flex-col overflow-hidden", !isPanelExpanded && "hidden")}>
                <div className="p-4 bg-slate-50/40 border-b space-y-3 px-6">
                  <div className="flex items-center justify-between p-3 bg-white/80 rounded-2xl shadow-sm border border-white">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-1.5 rounded-lg transition-colors", isNearMeEnabled ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
                        <LocateFixed size={14} />
                      </div>
                      <Label htmlFor="near-me-toggle" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Proximity Sort</Label>
                    </div>
                    <Switch id="near-me-toggle" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} className="scale-75 origin-right" />
                  </div>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-12 rounded-2xl bg-white/80 border-none shadow-sm font-bold text-xs uppercase tracking-wider px-4">
                      <SelectValue placeholder="City: All Areas" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {CITIES.map(c => <SelectItem key={c} value={c} className="text-xs font-bold rounded-xl">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <ScrollArea className="flex-1 px-6">
                  <div className="space-y-8 py-6">
                      <div className="space-y-3">
                         <button 
                          onClick={() => setIsAiSectionExpanded(!isAiSectionExpanded)}
                          className="w-full flex items-center justify-between p-4 bg-primary/5 rounded-[1.5rem] hover:bg-primary/10 transition-all border border-primary/10"
                         >
                            <div className="flex items-center gap-3">
                              <div className="bg-primary/20 p-2 rounded-xl text-primary">
                                <Sparkles size={16} />
                              </div>
                              <span className="text-[11px] font-black uppercase tracking-widest text-primary">AI Recommendations</span>
                            </div>
                            {isAiSectionExpanded ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-primary" />}
                         </button>
                         
                         {isAiSectionExpanded && (
                           <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                             {isSitesLoading ? (
                               <div className="py-4 text-center">
                                  <Loader2 className="animate-spin text-primary mx-auto" size={20} />
                                  <p className="text-[10px] font-black uppercase text-slate-400 mt-2">Personalizing...</p>
                               </div>
                             ) : aiSuggestions.length === 0 ? (
                               <div className="p-6 text-center bg-slate-50 rounded-2xl">
                                  <Info size={20} className="mx-auto text-slate-300 mb-2" />
                                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recommendations available</p>
                               </div>
                             ) : aiSuggestions.map(site => (
                               <button 
                                key={`suggest-${site.id}`}
                                onClick={() => centerOnSite(site)}
                                className="w-full flex items-center gap-3 p-3 bg-white/50 rounded-2xl border border-white hover:border-primary/40 hover:bg-white transition-all text-left group shadow-sm"
                               >
                                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative ring-1 ring-slate-100">
                                      <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-[11px] font-black text-slate-800 truncate leading-none mb-1">{site.name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase truncate">
                                        {site.category.split(' & ')[0]} {site.distance !== undefined && `• ${site.distance.toFixed(1)} km`}
                                      </p>
                                  </div>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-10 w-10 p-0 rounded-xl text-primary hover:bg-primary/10"
                                    onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }}
                                  >
                                    {itineraryIds.includes(site.id) ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                                  </Button>
                               </button>
                             ))}
                           </div>
                         )}
                      </div>

                      <div className="space-y-4">
                         <div className="flex items-center gap-3 px-1">
                            <MapIcon size={16} className="text-slate-400" />
                            <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Heritage Results</h3>
                         </div>
                         {isSitesLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
                                <Loader2 className="animate-spin text-primary" size={32} />
                                <p className="text-[10px] font-black uppercase tracking-widest">Querying Archives...</p>
                            </div>
                        ) : filteredAndSortedSites.length === 0 ? (
                            <div className="text-center py-16 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                <Search size={32} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No results found</p>
                            </div>
                        ) : filteredAndSortedSites.map((site) => (
                          <Card key={site.id} className={cn(
                              "group overflow-hidden border-none shadow-sm rounded-3xl transition-all duration-300",
                              itineraryIds.includes(site.id) ? "bg-primary/5 ring-2 ring-primary/20" : "bg-white hover:shadow-xl hover:translate-y-[-2px]"
                          )}>
                              <div className="flex items-center p-4 gap-4" onClick={() => centerOnSite(site)}>
                                <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-md ring-1 ring-black/5">
                                    <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="64px" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm line-clamp-1 text-slate-900 leading-tight mb-1">{site.name}</h3>
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{site.city} {site.distance > 0 && `• ${site.distance.toFixed(1)} km`}</p>
                                    <Link href={`/site/${site.id}`} className="text-[11px] font-black text-primary hover:underline mt-1 inline-flex items-center">View Profile <ChevronRight size={10} className="ml-1" /></Link>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                                    className={cn("h-11 w-11 p-0 rounded-2xl transition-all", itineraryIds.includes(site.id) ? 'bg-primary border-none shadow-lg scale-110' : 'border-slate-200 text-slate-400 hover:border-primary hover:text-primary')} 
                                    onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }}
                                >
                                    {itineraryIds.includes(site.id) ? <X size={20} /> : <Plus size={20} />}
                                </Button>
                              </div>
                          </Card>
                        ))}
                      </div>
                  </div>
                </ScrollArea>
          </div>
        </div>

        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="w-[92vw] max-w-md rounded-[3rem] p-10 border-none shadow-3xl bg-white/95 backdrop-blur-2xl">
            <DialogHeader>
              <div className="w-20 h-20 rounded-[2.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
                <Navigation size={40} />
              </div>
              <DialogTitle className="font-headline text-4xl font-black text-slate-900 leading-tight">Activate Engine</DialogTitle>
              <DialogDescription className="text-slate-500 text-base py-4 leading-relaxed font-medium">
                To enable street-level heritage navigation, provide an API key from <a href="https://openrouteservice.org" target="_blank" className="text-primary font-black hover:underline decoration-4 underline-offset-4">ORS Engine</a>.
              </DialogDescription>
            </DialogHeader>
            <Input placeholder="Enter Engine API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-[1.5rem] h-16 bg-slate-100/80 border-none px-6 font-mono text-xs focus-visible:ring-2 focus-visible:ring-primary/20" />
            <DialogFooter className="mt-10">
              <Button type="button" className="w-full h-16 rounded-[2rem] bg-primary text-white font-black text-[13px] uppercase tracking-widest shadow-2xl shadow-primary/40 transition-all active:scale-95" onClick={handleSaveKey}>
                Initialize Navigation
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-6"><Loader2 className="animate-spin text-primary" size={64} /><p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Loading Heritage Engine</p></div></div>}>
      <ExploreRouteContent />
    </Suspense>
  );
}

'use client';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { getRouteMulti } from '@/lib/routing-service';
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
  X,
  Plus,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Church,
  Landmark,
  TreePine,
  RotateCcw,
  Navigation2,
  MapPin,
  Route,
  Trash2,
  Star,
  Info,
  Home,
  Building2
} from 'lucide-react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';
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
  { label: "Ancestral Houses", value: "Ancestral Houses & Heritage Residences", icon: Home },
  { label: "Museums", value: "Museums & Cultural Institutions", icon: Landmark },
  { label: "Landmarks", value: "Historical Landmarks & Monuments", icon: MapPin },
  { label: "Parks", value: "Plazas, Parks & Public Spaces", icon: TreePine },
  { label: "Government", value: "Government & Historic Buildings", icon: Building2 },
  { label: "Other Cultural", value: "Cultural & Religious (Non-Catholic Sites)", icon: Sparkles }
];

function ExploreRouteContent() {
  const { user } = useUser();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [isNearMeEnabled, setIsNearMeEnabled] = useState(false);

  const [orsKey, setOrsKey] = useState<string>('');
  const [showKeyDialog, setShowKeyDialog] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const db = useFirestore();

  // Firestore Site Fetching with Category Filtering
  const sitesQuery = useMemoFirebase(() => {
    if (!db) return null;
    const colRef = collection(db, 'heritageSites');
    if (selectedCategories.length > 0) {
      console.log("[DEBUG] Filtering categories:", selectedCategories);
      // Firestore 'in' operator supports up to 10 items
      return query(colRef, where('category', 'in', selectedCategories));
    }
    return colRef;
  }, [db, selectedCategories]);

  const { data: firestoreSites, isLoading: isSitesLoading } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    // Standardize coordinates for map usage
    const source = (firestoreSites && firestoreSites.length > 0) ? firestoreSites : HERITAGE_SITES;
    return (source as any[]).map(site => ({
      ...site,
      coordinates: site.coordinates || { lat: site.latitude || 0, lng: site.longitude || 0 }
    })) as HeritageSite[];
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
      toast({ title: "Engine Active", description: "Street-level routing enabled." });
    }
  };

  const detectLocation = useCallback(async () => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      return loc;
    } catch (err) {
      toast({ title: "Location Access Denied", description: "Using default view.", variant: "destructive" });
      setUserLocation(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    detectLocation();
  }, [detectLocation]);

  // UI Filtering and Sorting
  const filteredAndSortedSites = useMemo(() => {
    let result = allSites.map(site => ({
      ...site,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, site.coordinates.lat, site.coordinates.lng) : 0
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q)
      );
    }

    if (isNearMeEnabled && userLocation) {
      result = result.filter(s => s.distance <= 5); // 5km radius
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [allSites, userLocation, searchQuery, isNearMeEnabled]);

  // Enhanced AI Recommendations logic
  const aiSuggestions = useMemo(() => {
    let suggestions = [...allSites];
    if (userLocation) {
      // Sort by proximity
      suggestions.sort((a, b) => {
        const distA = calculateDistance(userLocation.lat, userLocation.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(userLocation.lat, userLocation.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });
    } else {
      // Show must-visit/featured sites if location unavailable
      suggestions = suggestions.filter(s => s.isMustVisit);
      if (suggestions.length === 0) suggestions = [...allSites].slice(0, 5);
    }
    
    return suggestions.slice(0, 5).map(s => ({
      ...s,
      distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, s.coordinates.lat, s.coordinates.lng) : undefined
    }));
  }, [allSites, userLocation]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as HeritageSite[];
  }, [itineraryIds, allSites]);

  // Automatic Routing Logic
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
        
        {/* Full Screen Map */}
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

        {/* Top Floating Controls */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[92vw] max-w-2xl z-50 flex flex-col items-center gap-4">
          <div className="w-full flex gap-3 items-center">
            <div className="flex-1 relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
              <Input 
                placeholder="Search historical sites..." 
                className="pl-14 h-14 rounded-2xl shadow-xl border-none bg-white/95 backdrop-blur-2xl w-full font-bold text-sm ring-1 ring-black/5" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button size="icon" className="h-14 w-14 rounded-2xl shadow-xl bg-white text-primary hover:bg-slate-50 border-none ring-1 ring-black/5" onClick={detectLocation}>
              {loading ? <Loader2 className="animate-spin" size={24} /> : <LocateFixed size={24} />}
            </Button>
          </div>

          {/* Filter Pills */}
          <div className="w-full">
            <ScrollArea className="w-full pb-2">
              <div className="flex items-center justify-center gap-2 px-1">
                <Button 
                    onClick={() => setSelectedCategories([])}
                    variant="ghost"
                    className={cn(
                        "h-10 px-5 rounded-full shadow-lg bg-white/90 backdrop-blur-md border border-white/50 text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all",
                        selectedCategories.length === 0 ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
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
                        isSelected ? "bg-primary text-white" : "text-slate-600 hover:bg-white"
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

        {/* Route Summary (Floating Card) */}
        {itineraryIds.length > 0 && (
          <div className="absolute top-24 right-6 z-[60] w-72 hidden md:block">
            <Card className="rounded-[2rem] shadow-2xl border-none bg-white/95 backdrop-blur-2xl ring-1 ring-black/5 overflow-hidden">
                <CardHeader className="bg-primary p-5 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Route size={18} />
                        <CardTitle className="text-xs font-black uppercase tracking-widest">Live Trip Summary</CardTitle>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => setItineraryIds([])}>
                      <X size={14} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Duration</p>
                      <p className="text-lg font-black text-primary">{Math.round(totalTime)} min</p>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Distance</p>
                      <p className="text-lg font-black text-primary">{totalDist.toFixed(1)} km</p>
                    </div>
                  </div>
                  <Button className="w-full rounded-2xl font-black text-[10px] uppercase tracking-widest h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                    <Navigation size={16} className="mr-2" /> Start Navigation
                  </Button>
                </CardContent>
            </Card>
          </div>
        )}

        {/* Left Side Floating Panel */}
        <div 
          className={cn(
            "fixed inset-x-0 bottom-0 z-[55] transition-all duration-500 ease-in-out md:left-6 md:top-24 md:bottom-auto md:w-[380px] bg-white/95 backdrop-blur-2xl shadow-[0_40px_80px_rgba(0,0,0,0.2)] border-none flex flex-col rounded-t-[2.5rem] md:rounded-[2.5rem] ring-1 ring-black/5",
            isPanelExpanded ? "h-[75vh] md:h-[calc(100vh-140px)]" : "h-20 md:h-16"
          )}
        >
          {/* Panel Header */}
          <button 
            className="w-full h-16 flex items-center justify-between px-7 shrink-0"
            onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                <Navigation2 size={22} />
              </div>
              <h2 className="font-headline text-lg font-black text-slate-900 tracking-tight">Explore Route</h2>
            </div>
            <div className="flex items-center gap-3">
              {itineraryIds.length > 0 && !isPanelExpanded && (
                <Badge className="bg-primary text-white border-none font-black text-[10px] px-3 h-7">{itineraryIds.length} stops</Badge>
              )}
              <div className="p-1.5 rounded-full bg-slate-100 text-slate-400">
                {isPanelExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
              </div>
            </div>
          </button>

          {/* Collapsible Content */}
          <div className={cn("flex-1 flex flex-col overflow-hidden", !isPanelExpanded && "hidden")}>
                <div className="p-5 bg-slate-50/40 border-y space-y-3 px-7">
                  <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-white">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-xl transition-colors", isNearMeEnabled ? "bg-primary text-white" : "bg-slate-100 text-slate-400")}>
                        <LocateFixed size={16} />
                      </div>
                      <Label htmlFor="near-me-toggle" className="text-[11px] font-black uppercase tracking-widest text-slate-600">Near Me (5km)</Label>
                    </div>
                    <Switch id="near-me-toggle" checked={isNearMeEnabled} onCheckedChange={setIsNearMeEnabled} className="scale-90" />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  <div className="p-7 space-y-6">
                    <Accordion type="multiple" defaultValue={["discovery"]} className="space-y-4">
                      
                      {/* Discovery Section */}
                      <AccordionItem value="discovery" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 mb-4 group">
                          <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2.5 rounded-xl text-slate-500 group-data-[state=open]:bg-primary/10 group-data-[state=open]:text-primary transition-colors">
                              <MapIcon size={18} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 group-data-[state=open]:text-primary">Discovery</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4">
                            {isSitesLoading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-4">
                                    <Loader2 className="animate-spin text-primary" size={32} />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Consulting Archives...</p>
                                </div>
                            ) : filteredAndSortedSites.length === 0 ? (
                                <div className="text-center py-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200">
                                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">No sites found</p>
                                </div>
                            ) : filteredAndSortedSites.map((site) => (
                              <Card key={site.id} className={cn(
                                  "group overflow-hidden border-none shadow-sm rounded-[2rem] transition-all duration-300",
                                  itineraryIds.includes(site.id) ? "bg-primary/5 ring-1 ring-primary/20" : "bg-white hover:shadow-md"
                              )}>
                                  <div className="flex items-center p-4 gap-4" onClick={() => centerOnSite(site)}>
                                    <div className="relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden shadow-sm">
                                        <Image src={site.imageUrl} alt={site.name} fill className="object-cover" sizes="64px" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-sm line-clamp-1 text-slate-900 leading-tight mb-1">{site.name}</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-tight">{site.city} {site.distance > 0 && `• ${site.distance.toFixed(1)} km`}</p>
                                    </div>
                                    <Button 
                                        size="icon" 
                                        variant={itineraryIds.includes(site.id) ? "default" : "outline"} 
                                        className={cn("h-10 w-10 rounded-2xl transition-all", itineraryIds.includes(site.id) ? 'bg-primary border-none shadow-lg' : 'border-slate-100 text-slate-300 hover:border-primary hover:text-primary')} 
                                        onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }}
                                    >
                                        {itineraryIds.includes(site.id) ? <X size={18} /> : <Plus size={18} />}
                                    </Button>
                                  </div>
                              </Card>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      {/* AI Suggestions Section */}
                      <AccordionItem value="ai" className="border-none">
                        <AccordionTrigger className="hover:no-underline py-0 mb-4 group">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
                              <Sparkles size={18} />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-primary">AI Suggestions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-3">
                             {aiSuggestions.map(site => (
                               <button 
                                key={`suggest-${site.id}`}
                                onClick={() => centerOnSite(site)}
                                className="w-full flex items-center gap-4 p-4 bg-primary/5 rounded-[2rem] border border-primary/10 hover:bg-primary/10 transition-all text-left group"
                               >
                                  <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 relative shadow-sm">
                                      <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                      <p className="text-xs font-black text-primary truncate mb-1">{site.name}</p>
                                      <div className="flex items-center gap-2">
                                        <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{site.category.split(' & ')[0]}</p>
                                        {site.distance !== undefined && <Badge variant="outline" className="text-[8px] h-4 px-1.5 font-black border-primary/20 text-primary/60">{site.distance.toFixed(1)} km</Badge>}
                                      </div>
                                  </div>
                                  <Plus size={18} className="text-primary opacity-40 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); toggleSite(site.id); }} />
                               </button>
                             ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                    </Accordion>
                  </div>
                </ScrollArea>
          </div>
        </div>

        {/* ORS Activation Dialog */}
        <Dialog open={showKeyDialog} onOpenChange={setShowKeyDialog}>
          <DialogContent className="w-[92vw] max-w-md rounded-[2.5rem] p-10 border-none shadow-3xl bg-white/95 backdrop-blur-2xl">
            <DialogHeader>
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/10 flex items-center justify-center text-primary mb-8 animate-pulse">
                <Navigation size={32} />
              </div>
              <DialogTitle className="font-headline text-3xl font-black text-slate-900 leading-tight">Initialize Navigation</DialogTitle>
              <DialogDescription className="text-slate-500 text-sm py-4 leading-relaxed font-medium">
                To enable precise street-level routing across Metro Cebu heritage sites, please provide an API key from <a href="https://openrouteservice.org" target="_blank" className="text-primary font-black hover:underline underline-offset-4">OpenRouteService</a>.
              </DialogDescription>
            </DialogHeader>
            <Input placeholder="Enter Engine API Key" value={tempKey} onChange={(e) => setTempKey(e.target.value)} className="rounded-2xl h-14 bg-slate-100/80 border-none px-6 font-mono text-xs focus-visible:ring-2 focus-visible:ring-primary/20" />
            <DialogFooter className="mt-8">
              <Button type="button" className="w-full h-14 rounded-2xl bg-primary text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/30 transition-all active:scale-95" onClick={handleSaveKey}>
                Enable Routing Engine
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-6"><Loader2 className="animate-spin text-primary" size={64} /><p className="font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Loading Mapping Engine</p></div></div>}>
      <ExploreRouteContent />
    </Suspense>
  );
}

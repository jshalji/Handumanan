'use client';

import Image from 'next/image';

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import { DEPRECATED_HERITAGE_SITE_IDS, HeritageSite, HERITAGE_SITES } from '@/lib/heritage-data';
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
import { useFirestore, useUser, useAuth, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { signOut } from 'firebase/auth';
import { collection, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
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
  SheetDescription,
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
  const db = useFirestore();
  
  const orsKey = process.env.NEXT_PUBLIC_ORS_API_KEY || '';

  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [itineraryIds, setItineraryIds] = useState<string[]>([]);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [totalDist, setTotalDist] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [focusedLocation, setFocusedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedMapSiteId, setSelectedMapSiteId] = useState<string | null>(null);
  const [isolatedItinerarySiteId, setIsolatedItinerarySiteId] = useState<string | null>(null);
  
  const [isNavigating, setIsNavigating] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(0);
  const [navigationSteps, setNavigationSteps] = useState<RouteStep[]>([]);
  const [hasArrived, setHasArrived] = useState(false);

  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState('discover');
  const [recenterKey, setRecenterKey] = useState(0);
  const [mapResetKey, setMapResetKey] = useState(0);
  
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const [isGeneratingPlanner, setIsGeneratingPlanner] = useState(false);
  const [aiItineraryData, setAiItineraryData] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isAutoGenerateOpen, setIsAutoGenerateOpen] = useState(false);
  const [isTripMapFocused, setIsTripMapFocused] = useState(false);
  const [generationMode, setGenerationMode] = useState<'near' | 'themed' | 'balanced'>('near');
  const [plannerCategory, setPlannerCategory] = useState(CATEGORIES[0].value);
  const [tripDurationHours, setTripDurationHours] = useState(4);
  const [customTripDuration, setCustomTripDuration] = useState('4');

  const [isNavDrawerOpen, setIsNavDrawerOpen] = useState(false);

  // LOAD DYNAMIC SITES FROM FIRESTORE
  const sitesQuery = useMemoFirebase(() => db ? query(collection(db, 'heritageSites'), orderBy('name')) : null, [db]);
  const { data: dbSites } = useCollection(sitesQuery);

  const allSites = useMemo(() => {
    const deprecatedIds = new Set(DEPRECATED_HERITAGE_SITE_IDS);
    const sitesById = new Map(HERITAGE_SITES.map(site => [site.id, site as any]));

    dbSites?.forEach(dbSite => {
      if (!dbSite?.id || deprecatedIds.has(dbSite.id)) return;
      const existingSite = sitesById.get(dbSite.id) || {};
      const coordinates = dbSite.coordinates || (
        dbSite.latitude !== undefined && dbSite.longitude !== undefined
          ? { lat: dbSite.latitude, lng: dbSite.longitude }
          : existingSite.coordinates
      );
      sitesById.set(dbSite.id, {
        ...existingSite,
        ...dbSite,
        coordinates,
        tags: Array.isArray(dbSite.tags) ? dbSite.tags : (Array.isArray(existingSite.tags) ? existingSite.tags : []),
      } as any);
    });

    return Array.from(sitesById.values()).filter(site => (
      !deprecatedIds.has(site.id) &&
      site.isActive !== false &&
      site.status !== 'Inactive'
    ));
  }, [dbSites]);

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

  const getSiteCoords = useCallback((site: any) => site.coordinates || { lat: site.latitude, lng: site.longitude }, []);

  const optimizeItineraryIds = useCallback((ids: string[], origin: { lat: number; lng: number } | null) => {
    const cleanIds = Array.from(new Set(ids.filter(id => !DEPRECATED_HERITAGE_SITE_IDS.includes(id))));
    if (!origin || cleanIds.length < 2) return cleanIds;

    const sitesById = new Map(allSites.map(site => [site.id, site]));
    const remainingSites = cleanIds
      .map(id => sitesById.get(id))
      .filter((site): site is HeritageSite => {
        if (!site) return false;
        const coords = getSiteCoords(site);
        return Number.isFinite(Number(coords.lat)) && Number.isFinite(Number(coords.lng));
      });
    const orderedIds: string[] = [];
    let currentPoint = origin;

    while (remainingSites.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      remainingSites.forEach((site, index) => {
        const coords = getSiteCoords(site);
        const distance = calculateDistance(currentPoint.lat, currentPoint.lng, Number(coords.lat), Number(coords.lng));
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const [nearestSite] = remainingSites.splice(nearestIndex, 1);
      const nearestCoords = getSiteCoords(nearestSite);
      orderedIds.push(nearestSite.id);
      currentPoint = { lat: Number(nearestCoords.lat), lng: Number(nearestCoords.lng) };
    }

    return orderedIds;
  }, [allSites, getSiteCoords]);

  const saveToLocal = useCallback((ids: string[]) => {
    const cleanIds = ids.filter(id => !DEPRECATED_HERITAGE_SITE_IDS.includes(id));
    localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(cleanIds));
    setItineraryIds(cleanIds);
  }, []);

  // LOAD SAVED TRIP FROM URL PARAM
  const itineraryIdParam = searchParams.get('itineraryId');
  const savedItinRef = useMemoFirebase(() => 
    (db && user && itineraryIdParam) ? doc(db, 'users', user.uid, 'itineraries', itineraryIdParam) : null,
    [db, user, itineraryIdParam]
  );
  const { data: savedItin } = useDoc(savedItinRef);

  useEffect(() => {
    if (savedItin) {
      if (savedItin.itineraryIds) {
        saveToLocal(savedItin.itineraryIds);
        toast({ title: "Trip Loaded", description: savedItin.summary });
      } else if (savedItin.itineraryData) {
        try {
          const parsed = JSON.parse(savedItin.itineraryData);
          const ids = parsed.itinerary.map((stop: any) => stop.siteId);
          saveToLocal(ids);
          toast({ title: "Trip Loaded", description: savedItin.summary });
        } catch (e) {
          console.error("Failed to parse legacy itinerary data", e);
        }
      }
    }
  }, [savedItin, saveToLocal, toast]);

  const focusSingleSite = useCallback((site: any, options: { updateSearch?: boolean; openExplorer?: boolean } = {}) => {
    const coords = site.coordinates || { lat: (site as any).latitude, lng: (site as any).longitude };
    setSelectedMapSiteId(site.id);
    setFocusedLocation({ lat: coords.lat, lng: coords.lng });
    if (options.openExplorer) {
      setIsPanelExpanded(true);
      setActiveTab('discover');
    }
    if (options.updateSearch) {
      setSearchQuery(site.name);
    }
  }, []);

  const clearSingleSiteFocus = useCallback(() => {
    setSelectedMapSiteId(null);
    setIsolatedItinerarySiteId(null);
    setFocusedLocation(null);
  }, []);

  const resetMapView = useCallback(() => {
    setSearchQuery('');
    setIsSearchFocused(false);
    setSelectedCity(null);
    setSelectedCategory(null);
    setIsTripMapFocused(false);
    clearSingleSiteFocus();
    setMapResetKey(prev => prev + 1);
  }, [clearSingleSiteFocus]);

  useEffect(() => {
    const siteIdFromUrl = searchParams.get('siteId');
    const tripFromChat = searchParams.get('trip') === 'chat';

    if (tripFromChat) {
      const saved = localStorage.getItem('handumanan_draft_itinerary');
      if (saved) {
        try {
          const savedIds = JSON.parse(saved);
          const hasNewRoute = JSON.stringify(savedIds) !== JSON.stringify(itineraryIds);
          if (hasNewRoute) setItineraryIds(savedIds);
          setActiveTab('planner');
          setIsPanelExpanded(true);
          if (hasNewRoute) toast({ title: "Route Generated", description: "Your chat-generated trip is ready on the map." });
        } catch (e) {
          console.error("Storage parse error", e);
        }
      }
    }

    if (siteIdFromUrl) {
      const site = allSites.find(s => s.id === siteIdFromUrl);
      if (site) {
        focusSingleSite(site);
      }
    }
  }, [searchParams, allSites, itineraryIds, toast, focusSingleSite]);

  const detectLocation = useCallback(async (options: { showError?: boolean } = {}) => {
    setLoading(true);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
      setRecenterKey(prev => prev + 1);
      return loc;
    } catch (err: any) {
      if (options.showError !== false) {
        const message = err?.code === 1
          ? "Location permission was blocked. Enable location for this site in your browser settings."
          : "Your phone could not share its location. You can still generate a trip without Near Me mode.";
        toast({ title: "Location Unavailable", description: message, variant: "destructive" });
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveOptimizedToLocal = useCallback((ids: string[], origin = userLocation) => {
    const orderedIds = optimizeItineraryIds(ids, origin);
    saveToLocal(orderedIds);
    return orderedIds;
  }, [optimizeItineraryIds, saveToLocal, userLocation]);

  const clearRouteData = useCallback(() => {
    setRouteCoords([]);
    setNavigationSteps([]);
    setTotalDist(0);
    setTotalTime(0);
  }, []);

  const filteredAndSortedSites = useMemo(() => {
    let result = allSites;
    if (selectedCity) result = result.filter(s => s.city === selectedCity);
    if (selectedCategory) result = result.filter(s => s.category === selectedCategory);
    
    let mapped = result.map(site => {
      const coords = site.coordinates || { lat: (site as any).latitude, lng: (site as any).longitude };
      return {
        ...site,
        distance: userLocation ? calculateDistance(userLocation.lat, userLocation.lng, coords.lat, coords.lng) : 0
      };
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      mapped = mapped.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    }
    return mapped;
  }, [selectedCity, selectedCategory, userLocation, searchQuery, allSites]);

  const itinerarySites = useMemo(() => {
    return itineraryIds.map(id => allSites.find(s => s.id === id)).filter(Boolean) as any[];
  }, [itineraryIds, allSites]);

  useEffect(() => {
    if (!userLocation || isNavigating || itineraryIds.length < 2) return;

    const optimizedIds = optimizeItineraryIds(itineraryIds, userLocation);
    if (optimizedIds.join('|') !== itineraryIds.join('|')) {
      saveToLocal(optimizedIds);
    }
  }, [isNavigating, itineraryIds, optimizeItineraryIds, saveToLocal, userLocation]);

  useEffect(() => {
    if (activeStopIndex < itinerarySites.length || itinerarySites.length === 0) return;
    setActiveStopIndex(Math.max(0, itinerarySites.length - 1));
    setHasArrived(false);
  }, [activeStopIndex, itinerarySites.length]);

  const mapSites = useMemo(() => {
    if (isolatedItinerarySiteId) {
      const selectedSite = allSites.find(site => site.id === isolatedItinerarySiteId);
      return selectedSite ? [selectedSite] : [];
    }

    if (isTripMapFocused) {
      if (selectedMapSiteId) {
        const selectedTripSite = itinerarySites.find(site => site.id === selectedMapSiteId);
        if (selectedTripSite) {
          return [selectedTripSite];
        }
      }

      return itinerarySites;
    }

    const sitesById = new Map<string, any>();
    filteredAndSortedSites.forEach(site => sitesById.set(site.id, site));
    itinerarySites.forEach(site => sitesById.set(site.id, site));

    if (selectedMapSiteId && !sitesById.has(selectedMapSiteId)) {
      const selectedSite = allSites.find(site => site.id === selectedMapSiteId);
      if (selectedSite) {
        sitesById.set(selectedSite.id, selectedSite);
      }
    }

    return Array.from(sitesById.values());
  }, [allSites, filteredAndSortedSites, isolatedItinerarySiteId, isTripMapFocused, itinerarySites, selectedMapSiteId]);

  const searchSuggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length === 0) return [];

    return allSites
      .filter(site => {
        const searchable = `${site.name} ${site.city} ${site.category} ${site.description} ${site.tags?.join(' ') || ''}`.toLowerCase();
        return searchable.includes(q);
      })
      .sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aStarts = aName.startsWith(q) ? 0 : 1;
        const bStarts = bName.startsWith(q) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.localeCompare(bName);
      })
      .slice(0, 6);
  }, [allSites, searchQuery]);

  const handleSelectSearchSuggestion = (site: any) => {
    focusSingleSite(site, { updateSearch: true });
    setIsSearchFocused(false);
  };

  const focusItinerarySite = useCallback((site: any, stopIndex?: number) => {
    setIsolatedItinerarySiteId(site.id);
    focusSingleSite(site);

    if (isNavigating) {
      const nextStopIndex = typeof stopIndex === 'number' ? stopIndex : itineraryIds.indexOf(site.id);
      if (nextStopIndex >= 0) {
        setActiveStopIndex(nextStopIndex);
        setHasArrived(false);
      }
    }
  }, [focusSingleSite, isNavigating, itineraryIds]);

  useEffect(() => {
    let isRouteRequestCurrent = true;

    const applyRouteData = (data: Awaited<ReturnType<typeof getRouteMulti>> | Awaited<ReturnType<typeof getRoute>>) => {
      if (!isRouteRequestCurrent) return;

      if (data) {
        setRouteCoords(data.coordinates);
        setNavigationSteps(data.steps);
        setTotalDist(data.distance);
        setTotalTime(data.duration);
      } else {
        clearRouteData();
      }
    };

    const clearRouteDataIfCurrent = () => {
      if (isRouteRequestCurrent) {
        clearRouteData();
      }
    };

    const fetchRoute = async () => {
      let shouldClearRoute = false;

      try {
        if (isolatedItinerarySiteId) {
          if (!userLocation) {
            clearRouteDataIfCurrent();
            return;
          }

          const isolatedStop = allSites.find(site => site.id === isolatedItinerarySiteId);
          if (!isolatedStop) {
            clearRouteDataIfCurrent();
            return;
          }

          const stopCoords = getSiteCoords(isolatedStop);
          const data = await getRoute(userLocation, stopCoords, orsKey);
          applyRouteData(data);
          return;
        }

        if (isNavigating) {
          if (!userLocation || !itinerarySites[activeStopIndex]) {
            clearRouteDataIfCurrent();
            return;
          }
          const stop = itinerarySites[activeStopIndex];
          const stopCoords = stop.coordinates || { lat: stop.latitude, lng: stop.longitude };
          const data = await getRoute(userLocation, stopCoords, orsKey);
          applyRouteData(data);
          return;
        }

        // Prepend user location if available for better routing experience
        const pathCoords = itinerarySites.map(s => s.coordinates || { lat: (s as any).latitude, lng: (s as any).longitude });
        const pointsToRoute = userLocation ? [userLocation, ...pathCoords] : pathCoords;

        if (pointsToRoute.length < 2) {
          clearRouteDataIfCurrent();
          return;
        }
        
        const data = await getRouteMulti(pointsToRoute, orsKey);
        if (data && isRouteRequestCurrent) {
          applyRouteData(data);
        } else if (!data) {
          shouldClearRoute = true;
        }
      } catch (err) {
        console.warn("Routing fetch suppressed:", err);
        shouldClearRoute = true;
      } finally {
        if (shouldClearRoute) {
          clearRouteDataIfCurrent();
        }
      }
    };
    fetchRoute();

    return () => {
      isRouteRequestCurrent = false;
    };
  }, [activeStopIndex, allSites, clearRouteData, getSiteCoords, isolatedItinerarySiteId, itineraryIds, orsKey, itinerarySites, isNavigating, userLocation]);

  useEffect(() => {
    if (!isNavigating || !userLocation || hasArrived) return;

    const destination = itinerarySites[activeStopIndex];
    if (!destination) return;

    const coords = getSiteCoords(destination);
    const destinationLat = Number(coords.lat);
    const destinationLng = Number(coords.lng);
    if (!Number.isFinite(destinationLat) || !Number.isFinite(destinationLng)) return;

    const distanceKm = calculateDistance(userLocation.lat, userLocation.lng, destinationLat, destinationLng);
    if (distanceKm <= 0.05) {
      setHasArrived(true);
      toast({ title: "Arrived", description: `You have arrived at ${destination.name}.` });
    }
  }, [activeStopIndex, getSiteCoords, hasArrived, isNavigating, itinerarySites, toast, userLocation]);

  const toggleSite = async (id: string) => {
    const isRemoving = itineraryIds.includes(id);
    const nextIds = isRemoving ? itineraryIds.filter(i => i !== id) : [...itineraryIds, id];

    if (isRemoving) {
      saveOptimizedToLocal(nextIds);
      if (isolatedItinerarySiteId === id) {
        clearSingleSiteFocus();
      }
      if (nextIds.length === 0) {
        setIsTripMapFocused(false);
      }
      return;
    }

    if (nextIds.length < 2) {
      saveToLocal(nextIds);
      toast({
        title: "Added to Itinerary",
        description: "Add another stop and enable location to optimize the route."
      });
      return;
    }

    if (userLocation) {
      saveOptimizedToLocal(nextIds, userLocation);
      toast({ title: "Added to Itinerary", description: "Route order optimized from your current location." });
      return;
    }

    saveToLocal(nextIds);
    const optimizationOrigin = await detectLocation();

    if (optimizationOrigin) {
      saveOptimizedToLocal(nextIds, optimizationOrigin);
      toast({ title: "Route Optimized", description: "Stops are now sequenced by nearest destination." });
    }
  };

  const handleStartNavigation = async () => {
    if (itinerarySites.length === 0) {
      toast({ title: "No Destination", description: "Select at least one heritage site." });
      return;
    }
    const loc = await detectLocation();
    if (!loc) return;
    const optimizedIds = optimizeItineraryIds(itinerarySites.map(site => site.id), loc);
    if (optimizedIds.join('|') !== itineraryIds.join('|')) {
      saveToLocal(optimizedIds);
    }
    const nextStop = allSites.find(site => site.id === optimizedIds[0]);
    setIsNavigating(true);
    setActiveStopIndex(0);
    setHasArrived(false);
    setIsPanelExpanded(false);
    toast({ title: "Navigation Started", description: `Heading to ${nextStop?.name || itinerarySites[0].name}` });
  };

  const handleNextStop = () => {
    if (activeStopIndex < itinerarySites.length - 1) {
      setActiveStopIndex(prev => prev + 1);
      setHasArrived(false);
    } else {
      setIsNavigating(false);
      setHasArrived(false);
      toast({ title: "Journey Complete", description: "All stops reached!" });
    }
  };

  const sortSitesByDistanceAndQuality = (sites: any[], location: { lat: number; lng: number } | null) => {
    return [...sites].sort((a, b) => {
      if (location) {
        const aCoords = getSiteCoords(a);
        const bCoords = getSiteCoords(b);
        const aDistance = calculateDistance(location.lat, location.lng, aCoords.lat, aCoords.lng);
        const bDistance = calculateDistance(location.lat, location.lng, bCoords.lat, bCoords.lng);

        if (aDistance !== bDistance) return aDistance - bDistance;
      }

      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  };

  const selectBalancedSites = (sites: any[], maxStops: number, location: { lat: number; lng: number } | null) => {
    const selected: any[] = [];
    const usedIds = new Set<string>();
    const usedCategories = new Set<string>();
    const cityNames = Array.from(new Set([...CITIES, ...sites.map(site => site.city).filter(Boolean)]));

    for (let pass = 0; selected.length < maxStops && pass < 3; pass++) {
      for (const city of cityNames) {
        if (selected.length >= maxStops) break;

        const cityCandidates = sortSitesByDistanceAndQuality(
          sites.filter(site => site.city === city && !usedIds.has(site.id)),
          location
        );
        const nextSite = cityCandidates.find(site => pass > 0 || !usedCategories.has(site.category)) || cityCandidates[0];

        if (nextSite) {
          selected.push(nextSite);
          usedIds.add(nextSite.id);
          usedCategories.add(nextSite.category);
        }
      }
    }

    if (selected.length < maxStops) {
      for (const site of sortSitesByDistanceAndQuality(sites.filter(site => !usedIds.has(site.id)), location)) {
        selected.push(site);
        usedIds.add(site.id);
        if (selected.length >= maxStops) break;
      }
    }

    return selected;
  };

  const normalizeSiteName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

  const dedupeGeneratedItinerary = (
    itinerary: GeneratePersonalizedItineraryOutput['itinerary'],
    sourceSites: any[],
    maxStops: number
  ): GeneratePersonalizedItineraryOutput['itinerary'] => {
    const usedKeys = new Set<string>();
    const cleaned = itinerary.filter(stop => {
      const key = stop.siteId || normalizeSiteName(stop.siteName);
      const nameKey = normalizeSiteName(stop.siteName);

      if (usedKeys.has(key) || usedKeys.has(nameKey)) return false;

      usedKeys.add(key);
      usedKeys.add(nameKey);
      return true;
    });

    for (const site of sourceSites) {
      if (cleaned.length >= maxStops) break;

      const key = site.id;
      const nameKey = normalizeSiteName(site.name);
      if (usedKeys.has(key) || usedKeys.has(nameKey)) continue;

      cleaned.push({
        siteId: site.id,
        siteName: site.name,
        estimatedVisitDurationMinutes: 40,
        description: `Added as a unique nearby heritage stop to keep the route varied and avoid duplicate places.`,
      });
      usedKeys.add(key);
      usedKeys.add(nameKey);
    }

    return cleaned;
  };

  const getRoutePointsForItinerary = (
    itinerary: GeneratePersonalizedItineraryOutput['itinerary'],
    sourceSites: any[],
    origin: { lat: number; lng: number } | null
  ) => {
    const sitesById = new Map(sourceSites.map(site => [site.id, site]));
    const stopPoints = itinerary
      .map(stop => sitesById.get(stop.siteId))
      .filter(Boolean)
      .map(site => getSiteCoords(site));

    return origin ? [origin, ...stopPoints] : stopPoints;
  };

  const handleAutoGenerateFromLocal = async () => {
    setIsGeneratingPlanner(true);
    try {
      const requestedHours = Math.min(12, Math.max(1, Number(customTripDuration) || tripDurationHours));
      const plannerLocation = await detectLocation({ showError: generationMode === 'near' });
      const effectiveGenerationMode = generationMode === 'near' && !plannerLocation ? 'balanced' : generationMode;
      if (generationMode === 'near' && !plannerLocation) {
        toast({
          title: "Balanced Trip Generated Instead",
          description: "Location was unavailable, so Handumanan will suggest a route without using your current position."
        });
      }
      const selectedPlannerCategory = selectedCategory || plannerCategory;
      const maxStops = requestedHours <= 1 ? 2 : requestedHours <= 2 ? 3 : requestedHours <= 4 ? 4 : requestedHours <= 6 ? 5 : 6;
      const isUsingUserPreference = !!(selectedCity || selectedCategory || searchQuery.trim());
      const candidateSites = effectiveGenerationMode === 'themed'
        ? allSites.filter(site => site.category === selectedPlannerCategory && (!selectedCity || site.city === selectedCity))
        : effectiveGenerationMode === 'balanced'
          ? allSites
          : isUsingUserPreference
          ? filteredAndSortedSites
          : allSites;
      const activeCandidateSites = candidateSites.filter(site => site.isActive !== false);
      const starterSites = effectiveGenerationMode === 'balanced'
        ? selectBalancedSites(activeCandidateSites, maxStops, plannerLocation)
        : sortSitesByDistanceAndQuality(activeCandidateSites, plannerLocation).slice(0, maxStops);
      const sitesToPlan = itinerarySites.length > 0 ? itinerarySites : starterSites;

      if (sitesToPlan.length === 0) {
        toast({ title: "No Sites Found", description: "Try clearing filters or search first.", variant: "destructive" });
        return;
      }

      const output = await generatePersonalizedItinerary({
        selectedSitesJson: JSON.stringify(sitesToPlan.map(s => ({ id: s.id, name: s.name, city: s.city, coordinates: s.coordinates }))),
        availableTimeHours: requestedHours
      });

      const cleanedItinerary = dedupeGeneratedItinerary(output.itinerary, sitesToPlan, maxStops);
      const routePoints = getRoutePointsForItinerary(cleanedItinerary, sitesToPlan, plannerLocation);
      const generatedRoute = await getRouteMulti(routePoints, orsKey);
      const travelMinutes = generatedRoute?.duration ?? 0;
      const visitMinutes = cleanedItinerary.reduce((total, stop) => total + stop.estimatedVisitDurationMinutes, 0);
      const routeSummaryNote = generatedRoute
        ? `Estimated time includes ${Math.round(travelMinutes)} minutes of travel${plannerLocation ? ' from your current location' : ''}.`
        : 'Live route distance was unavailable, so the estimate includes visit time only.';
      const cleanedOutput = {
        ...output,
        itinerary: cleanedItinerary,
        summary: cleanedItinerary.length === output.itinerary.length
          ? `${output.summary} ${routeSummaryNote}`
          : `${output.summary} Duplicate stops were removed so each place appears once. ${routeSummaryNote}`,
        totalEstimatedDurationMinutes: Math.round(visitMinutes + travelMinutes),
      };

      setAiItineraryData(cleanedOutput);
      if (generatedRoute) {
        setRouteCoords(generatedRoute.coordinates);
        setTotalDist(generatedRoute.distance);
        setTotalTime(generatedRoute.duration);
      } else {
        clearRouteData();
      }
      
      const orderedIds = cleanedItinerary.map(item => item.siteId).filter(id => sitesToPlan.some(site => site.id === id));
      if (orderedIds.length > 0) {
        saveToLocal(orderedIds);
      } else if (itinerarySites.length === 0) {
        saveToLocal(sitesToPlan.map(site => site.id));
      }

      setSearchQuery('');
      setSelectedCity(null);
      setSelectedCategory(null);
      clearSingleSiteFocus();
      setIsTripMapFocused(true);
      setMapResetKey(prev => prev + 1);
      setIsResultModalOpen(true);
      setIsAutoGenerateOpen(false);
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

  const hasMapViewFilters = Boolean(isTripMapFocused || isolatedItinerarySiteId || selectedMapSiteId || selectedCity || selectedCategory || searchQuery.trim());

  return (
    <div className="flex flex-col h-[100dvh] bg-background overflow-hidden relative font-body select-none">
      <div className="absolute inset-0 z-0">
        <HeritageMap
          userLocation={userLocation}
          sites={mapSites}
          itinerary={itinerarySites}
          routeCoords={selectedMapSiteId && !isolatedItinerarySiteId && !isTripMapFocused ? [] : routeCoords}
          totalTime={totalTime}
          totalDist={totalDist}
          onAddSite={toggleSite}
          onSelectSite={(site) => {
            if (isTripMapFocused && itineraryIds.includes(site.id)) {
              focusItinerarySite(site);
            } else {
              focusSingleSite(site);
            }
          }}
          selectedSiteId={selectedMapSiteId}
          focusedLocation={focusedLocation}
          isNavigating={isNavigating}
          recenterKey={recenterKey}
          fitSitesKey={mapResetKey}
        />
      </div>

      {hasMapViewFilters && (
        <Button
          type="button"
          onClick={resetMapView}
          className={cn(
            "fixed left-1/2 z-40 h-11 -translate-x-1/2 rounded-2xl bg-white px-5 text-[10px] font-black uppercase tracking-widest text-slate-800 shadow-3xl ring-1 ring-black/5 hover:bg-slate-50",
            isMobile
              ? isPanelExpanded
                ? "bottom-[calc(62dvh+1rem)]"
                : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
              : "bottom-6"
          )}
        >
          Show All Sites
        </Button>
      )}

      {/* HEADER */}
      <div className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-40 flex items-start gap-2 pointer-events-none md:left-4 md:right-auto md:top-4 md:w-[430px] md:gap-3">
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            onClick={() => setIsNavDrawerOpen(true)}
            size="icon"
            className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-white border-none ring-1 ring-black/5 shrink-0"
          >
            <Menu size={24} />
          </Button>
        </div>

        <div className="relative flex-1 pointer-events-auto">
          <div className="rounded-2xl bg-white/95 shadow-3xl ring-1 ring-black/5 backdrop-blur-2xl">
            <Search className="absolute left-4 top-6 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search heritage..."
              className="pl-11 pr-12 h-12 rounded-2xl border-none bg-transparent w-full text-sm font-bold shadow-none focus-visible:ring-2 focus-visible:ring-primary/20"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedMapSiteId(null);
                setIsTripMapFocused(false);
              }}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 150)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setIsTripMapFocused(false);
                  clearSingleSiteFocus();
                }}
                className="absolute right-3 top-6 -translate-y-1/2 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {isSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-14 z-[1002] overflow-hidden rounded-2xl bg-white/98 shadow-3xl ring-1 ring-black/5 backdrop-blur-2xl">
              {searchSuggestions.length > 0 ? (
                <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto p-2 md:max-h-80">
                  {searchSuggestions.map(site => {
                    const category = CATEGORIES.find(category => category.value === site.category);
                    const Icon = category?.icon || MapPin;
                    return (
                      <button
                        key={site.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSelectSearchSuggestion(site)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Icon size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-black text-slate-900">{site.name}</p>
                          <p className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-400">{site.city} • {site.category}</p>
                        </div>
                        <ChevronRight size={14} className="text-slate-300" />
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="p-5 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No matching sites</p>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="hidden md:flex items-center gap-2 pointer-events-auto">
          <Button 
            onClick={() => setIsPanelExpanded(prev => !prev)}
            size="icon" 
            className={cn("h-12 w-12 rounded-2xl shadow-3xl backdrop-blur-xl border-none ring-1 ring-black/5 transition-all", isPanelExpanded ? "bg-primary text-white" : "bg-white/95 text-slate-500")}
          >
            <Compass size={20} />
          </Button>
          <Button onClick={() => detectLocation()} size="icon" className="h-12 w-12 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "fixed left-3 z-40 flex items-center gap-2 md:hidden",
          isPanelExpanded
            ? "bottom-[calc(62dvh+1rem)]"
            : "bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
        )}
      >
        <Button
          onClick={() => setIsPanelExpanded(prev => !prev)}
          size="icon"
          className={cn(
            "h-11 w-11 rounded-2xl shadow-3xl backdrop-blur-xl border-none ring-1 ring-black/5 transition-all",
            isPanelExpanded ? "bg-primary text-white" : "bg-white/95 text-primary"
          )}
          aria-label={isPanelExpanded ? "Close heritage explorer" : "Open heritage explorer"}
        >
          <Compass size={19} />
        </Button>
        <Button
          onClick={() => detectLocation()}
          size="icon"
          className="h-11 w-11 rounded-2xl shadow-3xl bg-white/95 backdrop-blur-xl text-primary hover:bg-slate-50 border-none ring-1 ring-black/5"
          aria-label="Use current location"
        >
          {loading ? <Loader2 className="animate-spin" size={19} /> : <LocateFixed size={19} />}
        </Button>
      </div>

      {/* NAVIGATION OVERLAY */}
      {isNavigating && (
        <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+1rem)] left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-[1001] animate-in slide-in-from-bottom-6">
          <Card className="rounded-[2.5rem] shadow-3xl border-none overflow-hidden bg-white/95 backdrop-blur-2xl p-6">
            <div className="flex items-center justify-between mb-6">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><Navigation size={20} className="animate-pulse" /></div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Stop {activeStopIndex + 1} of {itinerarySites.length}</p>
                    <h3 className="font-headline text-lg font-black text-slate-900 truncate max-w-[200px]">{itinerarySites[activeStopIndex]?.name}</h3>
                  </div>
               </div>
               <Button variant="ghost" size="icon" onClick={() => {
                 setIsNavigating(false);
                 setHasArrived(false);
               }}><X size={18} /></Button>
            </div>
            {hasArrived ? (
              <div className="flex flex-col gap-3">
                 <div className="bg-green-50 p-4 rounded-2xl border border-green-100 flex items-center gap-3"><CheckCircle2 className="text-green-500" /><p className="text-xs font-black text-green-700 uppercase">You have arrived!</p></div>
                 <Button onClick={handleNextStop} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest shadow-xl">
                   {activeStopIndex < itinerarySites.length - 1 ? "Next Stop" : "Finish"} <ArrowRight size={18} className="ml-2" />
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
        isMobile ? "bottom-0 left-0 right-0 max-h-[calc(100dvh-5rem)] rounded-t-[2rem] shadow-3xl-up bg-white/95 backdrop-blur-2xl border-t pb-[env(safe-area-inset-bottom)]" : "top-20 left-4 w-96 rounded-[2rem] shadow-3xl bg-white/95 backdrop-blur-2xl",
        isPanelExpanded ? "translate-y-0 opacity-100" : (isMobile ? "translate-y-full opacity-0" : "-translate-x-full opacity-0 pointer-events-none")
      )}>
        <Card className="max-h-full border-none bg-transparent flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 bg-slate-50/50 border-b shrink-0 md:px-6 md:py-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Heritage Explorer</span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsPanelExpanded(false)}><ChevronDown size={18} /></Button>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-2 bg-slate-50 rounded-none h-12 shrink-0 p-1.5">
              <TabsTrigger value="discover" className="text-[10px] font-black uppercase tracking-wide rounded-xl"><Compass size={14} className="mr-2" /> Discover</TabsTrigger>
              <TabsTrigger value="planner" className="text-[10px] font-black uppercase tracking-wide rounded-xl"><Sparkles size={14} className="mr-2" /> AI Planner</TabsTrigger>
            </TabsList>
            <div className={cn("flex-1 overflow-y-auto overflow-x-hidden", isMobile ? "max-h-[62dvh] pb-6" : "max-h-[65vh] pb-10")}>
              <TabsContent value="discover" className="m-0 p-5 space-y-6">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Cities</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CITIES.map(city => (
                      <button key={city} onClick={() => {
                        clearSingleSiteFocus();
                        setIsTripMapFocused(false);
                        setSelectedCity(selectedCity === city ? null : city);
                      }} className={cn("min-h-10 rounded-2xl border px-2 py-2.5 text-[10px] font-bold leading-tight transition-all", selectedCity === city ? "bg-primary text-white border-primary shadow-lg" : "bg-slate-50 border-slate-100 text-slate-600")}>
                        {city}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Categories</p>
                  <div className="grid grid-cols-1 gap-2">
                    {CATEGORIES.map(cat => (
                      <button key={cat.value} onClick={() => {
                        clearSingleSiteFocus();
                        setIsTripMapFocused(false);
                        setSelectedCategory(selectedCategory === cat.value ? null : cat.value);
                      }} className={cn("flex items-center gap-4 px-4 py-3 rounded-2xl transition-all border text-left min-h-[48px]", selectedCategory === cat.value ? "bg-slate-900 text-white border-slate-900 shadow-lg" : "bg-white border-slate-100 text-slate-600")}>
                        <cat.icon size={16} className="shrink-0" /><span className="text-[10px] font-bold uppercase tracking-wide leading-tight">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest px-1">Nearby Landmarks</p>
                  <div className="space-y-2">
                     {filteredAndSortedSites.slice(0, 15).map(site => {
                       const coords = site.coordinates || { lat: (site as any).latitude, lng: (site as any).longitude };
                       return (
                         <div key={site.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-[1.25rem] border border-slate-100">
                            <div className="flex-1 truncate mr-3 cursor-pointer" onClick={() => focusSingleSite(site)}>
                               <p className="text-[11px] font-bold text-slate-900 truncate">{site.name}</p>
                               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{site.city}</p>
                            </div>
                            <Button onClick={() => toggleSite(site.id)} size="icon" variant={itineraryIds.includes(site.id) ? "secondary" : "default"} className={cn("h-9 w-9 rounded-xl", itineraryIds.includes(site.id) ? "bg-slate-200 text-slate-500" : "bg-primary text-white shadow-xl shadow-primary/20")}>
                               {itineraryIds.includes(site.id) ? <X size={16} /> : <Plus size={16} />}
                            </Button>
                         </div>
                       );
                     })}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="planner" className="m-0 p-5 space-y-6">
                <Button
                  onClick={() => setIsAutoGenerateOpen(true)}
                  disabled={isGeneratingPlanner}
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
                      <div
                        key={site.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => focusItinerarySite(site, idx)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            focusItinerarySite(site, idx);
                          }
                        }}
                        className={cn(
                          "flex cursor-pointer items-center gap-4 rounded-[1.5rem] border p-4 transition-all",
                          isolatedItinerarySiteId === site.id
                            ? "border-primary/30 bg-primary/10 shadow-sm"
                            : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        <div className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-black shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-slate-700 truncate">{site.name}</p>
                        </div>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            saveOptimizedToLocal(itineraryIds.filter(id => id !== site.id));
                            if (isolatedItinerarySiteId === site.id) {
                              clearSingleSiteFocus();
                            }
                          }}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <div className="flex flex-col gap-3 mt-6">
                       <Button onClick={handleStartNavigation} className="w-full h-12 bg-slate-900 text-[10px] font-black uppercase tracking-widest rounded-[1.25rem] shadow-xl"><Route size={18} className="mr-2" /> Start Navigation</Button>
                       <Button variant="ghost" onClick={() => {
                         setIsTripMapFocused(false);
                         saveToLocal([]);
                       }} className="text-[9px] font-black uppercase text-red-500">Clear All Stops</Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* AUTO-GENERATE OPTIONS MODAL */}
      <Dialog open={isAutoGenerateOpen} onOpenChange={setIsAutoGenerateOpen}>
        <DialogContent className="h-[92dvh] max-h-[92dvh] w-[calc(100vw-1.5rem)] max-w-md rounded-[1.5rem] bg-white p-0 overflow-hidden border-none shadow-3xl flex flex-col sm:rounded-[2rem]">
          <div className="px-5 pt-6 pb-4 shrink-0 sm:px-7 sm:pt-7">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="font-headline text-2xl font-black text-slate-950">Auto-Generate Trip</DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-400">
                Let AI build a Cebu heritage tour around your preferred route style.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-5 sm:px-7">
            <div className="space-y-7 pb-4">

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Generation Mode</p>
              {[
                { value: 'near', title: 'Near Me', description: 'Minimize travel distance', icon: LocateFixed },
                { value: 'themed', title: 'Themed Trip', description: 'Focus on one category', icon: LandmarkIcon },
                { value: 'balanced', title: 'Balanced Tour', description: 'A mix of everything', icon: Sparkles },
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setGenerationMode(option.value as 'near' | 'themed' | 'balanced')}
                  className={cn(
                    "w-full min-h-[70px] rounded-2xl border p-4 text-left flex items-center gap-4 transition-all",
                    generationMode === option.value
                      ? "bg-slate-950 text-white border-slate-950 shadow-xl"
                      : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50"
                  )}
                >
                  <option.icon size={20} className={generationMode === option.value ? "text-primary" : "text-slate-400"} />
                  <span className="min-w-0">
                    <span className="block text-sm font-black">{option.title}</span>
                    <span className={cn("block text-[10px] font-bold", generationMode === option.value ? "text-white/60" : "text-slate-400")}>{option.description}</span>
                  </span>
                </button>
              ))}
              {generationMode === 'near' && (
                <p className="rounded-2xl bg-slate-50 px-4 py-3 text-[10px] font-bold leading-relaxed text-slate-500">
                  Near Me requires phone location access. If location is blocked, the system will still generate a balanced trip.
                </p>
              )}
            </div>

            {generationMode === 'themed' && (
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Theme Category</p>
                <div className="grid grid-cols-1 gap-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => setPlannerCategory(category.value)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all",
                        (selectedCategory || plannerCategory) === category.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-slate-100 bg-white text-slate-500"
                      )}
                    >
                      <category.icon size={16} />
                      <span className="text-[10px] font-black uppercase tracking-wide">{category.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Trip Duration</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: '1H', value: 1 },
                  { label: '2H', value: 2 },
                  { label: 'Half Day', value: 4 },
                  { label: 'Full Day', value: 8 },
                ].map(duration => (
                  <button
                    key={duration.value}
                    type="button"
                    onClick={() => {
                      setTripDurationHours(duration.value);
                      setCustomTripDuration(String(duration.value));
                    }}
                    className={cn(
                      "h-12 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all",
                      Number(customTripDuration) === duration.value
                        ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                        : "bg-white text-slate-500 border-slate-100 hover:bg-slate-50"
                    )}
                  >
                    {duration.label}
                  </button>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <Label htmlFor="custom-trip-duration" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Custom Time Available
                </Label>
                <div className="mt-3 flex items-center gap-3">
                  <Input
                    id="custom-trip-duration"
                    type="number"
                    min={1}
                    max={12}
                    step={0.5}
                    value={customTripDuration}
                    onChange={(event) => {
                      setCustomTripDuration(event.target.value);
                      const nextValue = Number(event.target.value);
                      if (nextValue > 0) setTripDurationHours(nextValue);
                    }}
                    className="h-12 rounded-2xl border-none bg-white text-center text-sm font-black shadow-sm focus-visible:ring-primary/20"
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">hours</span>
                </div>
              </div>
            </div>
            </div>
          </div>

          <div className="px-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pt-4 shrink-0 bg-white border-t border-slate-100 sm:px-7 sm:pb-7">
            <Button
              onClick={handleAutoGenerateFromLocal}
              disabled={isGeneratingPlanner}
              className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/25"
            >
              {isGeneratingPlanner ? <Loader2 className="animate-spin mr-2" size={18} /> : <Sparkles size={18} className="mr-2" />}
              Generate My Trip
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* GENERATED RESULTS MODAL */}
      <Dialog open={isResultModalOpen} onOpenChange={setIsResultModalOpen}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-md rounded-[1.5rem] bg-white p-0 overflow-hidden border-none shadow-3xl sm:rounded-[2.5rem]">
          <div className="bg-primary p-6 text-white sm:p-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 rounded-xl"><Sparkles size={20} /></div>
              <DialogTitle className="text-2xl font-headline font-black">AI Trip Scout</DialogTitle>
            </div>
            <DialogDescription className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Organized based on your selections.</DialogDescription>
          </div>
          
          <ScrollArea className="max-h-[50dvh] p-5 sm:p-8">
            {aiItineraryData ? (
              <div className="space-y-6">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs italic text-slate-600 font-medium">"{aiItineraryData.summary}"</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-primary/5 p-3 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Total</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{Math.round(aiItineraryData.totalEstimatedDurationMinutes)} min</p>
                  </div>
                  <div className="rounded-2xl bg-primary/5 p-3 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Travel</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{Math.round(totalTime)} min</p>
                  </div>
                  <div className="rounded-2xl bg-primary/5 p-3 text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Distance</p>
                    <p className="mt-1 text-sm font-black text-slate-900">{totalDist.toFixed(1)} km</p>
                  </div>
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

          <DialogFooter className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] bg-slate-50 border-t flex flex-col gap-2 sm:flex-col sm:p-6">
            <Button onClick={handleSavePlanner} className="w-full h-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl">
              <SaveIcon size={18} className="mr-2" /> Save Trip
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={handleAutoGenerateFromLocal} disabled={isGeneratingPlanner} className="rounded-2xl text-[10px] font-black uppercase tracking-widest h-12">
                {isGeneratingPlanner ? <Loader2 className="animate-spin" size={14} /> : <RefreshCcw size={14} className="mr-2" />} 
                Regenerate
              </Button>
              <Button variant="ghost" onClick={() => setIsResultModalOpen(false)} className="rounded-2xl text-[10px] font-black uppercase tracking-widest h-12">
                Close
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NAV DRAWER */}
      <Sheet open={isNavDrawerOpen} onOpenChange={setIsNavDrawerOpen}>
        <SheetContent side="left" className="w-[88vw] max-w-[320px] p-0 border-none shadow-2xl bg-white flex flex-col z-[1100]">
           <SheetHeader className="p-8 bg-primary text-white shrink-0 text-left space-y-0">
              <SheetTitle className="text-white font-headline text-3xl font-black flex items-center gap-3">
                <Image src="/logo.png" alt="Handumanan" width={36} height={36} className="w-9 h-9 rounded-lg shadow-lg" /> Handumanan
              </SheetTitle>
              <SheetDescription className="text-white/70 text-[10px] font-bold uppercase tracking-widest mt-2">
                Cebu Heritage System
              </SheetDescription>
           </SheetHeader>
           <div className="flex-1 overflow-y-auto p-6 space-y-2">
             {[
               { label: 'Home', href: '/', icon: Home },
               { label: 'Explore & Route', href: '/discover', icon: Compass },
               { label: 'Site Directory', href: '/explore', icon: Search },
               { label: 'My Profile', href: '/profile', icon: Home },
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

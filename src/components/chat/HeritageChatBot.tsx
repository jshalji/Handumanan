'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles, MapPin, Heart, Minimize2, Loader2, Navigation, Compass, ExternalLink } from 'lucide-react';
import { chatWithHeritageBot } from '@/ai/flows/heritage-chat-flow';
import type { HeritageChatInput } from '@/ai/flows/heritage-chat-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { HERITAGE_SITES, isSiteVisibleToUser } from '@/lib/heritage-data';
import { getCurrentLocation } from '@/lib/location-utils';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageSources } from '@/lib/site-images';

interface Message {
  role: 'user' | 'model';
  text: string;
  siteIds?: string[];
}

type ChatDirectorySite = NonNullable<HeritageChatInput['directorySites']>[number];

const QUICK_REPLIES = [
  { label: 'My Favorites', icon: Heart },
  { label: 'Top Sites', icon: Sparkles },
  { label: 'Next Stop?', icon: MapPin },
];

function compactSiteForChat(site: any): ChatDirectorySite | null {
  const coordinates = site?.coordinates;
  const lat = Number(coordinates?.lat ?? coordinates?.latitude ?? site?.latitude);
  const lng = Number(coordinates?.lng ?? coordinates?.longitude ?? site?.longitude);
  const id = String(site?.id || '').trim();
  const name = String(site?.name || '').trim();

  if (!id || !name || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  const payload: ChatDirectorySite = {
    id,
    name,
    description: site?.description ? String(site.description) : undefined,
    overview: site?.overview ? String(site.overview) : undefined,
    significance: site?.significance ? String(site.significance) : undefined,
    category: site?.category ? String(site.category) : undefined,
    location: site?.location ? String(site.location) : undefined,
    city: site?.city ? String(site.city) : undefined,
    visitingHours: site?.visitingHours ? String(site.visitingHours) : undefined,
    imageUrl: site?.imageUrl ? String(site.imageUrl) : undefined,
    rating: Number.isFinite(Number(site?.rating)) ? Number(site.rating) : undefined,
    tags: Array.isArray(site?.tags) ? site.tags.map(String).filter(Boolean) : undefined,
    coordinates: { lat, lng },
    latitude: lat,
    longitude: lng,
    isMustVisit: Boolean(site?.isMustVisit),
    isActive: site?.isActive !== false,
    status: site?.status ? String(site.status) : undefined,
    demolitionStatus: site?.demolitionStatus ? String(site.demolitionStatus) : undefined,
    accessibilityStatus: site?.accessibilityStatus ? String(site.accessibilityStatus) : undefined,
  };

  const compactPayload = payload as Record<string, unknown>;
  Object.keys(payload).forEach(key => {
    if (compactPayload[key] === undefined || compactPayload[key] === '') delete compactPayload[key];
  });

  return payload;
}

function isTripPlanningRequest(text: string) {
  const query = text.toLowerCase();
  const hasTravelEndpoints =
    /\bfrom\b.+\bto\b/.test(query) ||
    /\bbetween\b.+\band\b/.test(query);
  const asksForTravelTime =
    /\b(how long|how many hours|how many minutes|travel time|trip time|drive time|driving time|eta|duration|distance|far)\b/.test(query) ||
    /\b(take|takes)\b.+\b(go|get|travel|drive)\b/.test(query);
  const hasExplicitPlanningKeyword =
    /\b(itinerary|route|trip|tour|tours|planner|planning)\b/.test(query) ||
    (/\bplan\b/.test(query) && /\b(cebu|heritage|site|sites|place|places|route|trip|tour|museum|church|landmark|day|hour|hours)\b/.test(query));

  return (
    /\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/.test(query) ||
    (hasTravelEndpoints && asksForTravelTime) ||
    hasExplicitPlanningKeyword
  );
}

function isNearbyLocationRequest(text: string) {
  const query = text.toLowerCase();

  return (
    /\b(near me|nearby|nearest|closest|close to me|around me|my location|current location|next stop)\b/.test(query) ||
    /\b(near|close)\b.+\b(me|my|current|location)\b/.test(query)
  );
}

function normalizeChatText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

const CHAT_METRO_CEBU_SCOPE_REGEX = /\b(cebu|metro cebu|cebu city|mandaue|talisay|lapu lapu|lapulapu|lapu-lapu|mactan|parian|colon)\b/;
const CHAT_OUTSIDE_SCOPE_PLACE_REGEX = /\b(china|japan|korea|south korea|north korea|taiwan|hong kong|singapore|thailand|vietnam|indonesia|malaysia|usa|united states|america|canada|australia|europe|manila|luzon|davao|iloilo|bacolod|bohol|palawan|boracay|baguio|vigan|intramuros)\b/;
const CHAT_SELF_LOCATION_SCOPE_REGEX = /\b(near me|nearby|nearest|closest|close to me|around me|my location|current location)\b/;
const CHAT_GENERAL_OFF_TOPIC_REGEX = /\b(president|vice president|prime minister|senator|congressman|election|politics|political|mayor|governor|weather|temperature|sports|basketball|football|volleyball|nba|movie|movies|anime|manga|cartoon|actor|actress|celebrity|celebrities|kpop|song|songs|music|lyrics|recipe|cook|math|homework|essay|translate|currency|stock|crypto|python|javascript|java|php|html|css|code|coding|program|programming|login|register|authentication|database|sql|science|planet|planets|space|religion|bible)\b/;
const CHAT_GENERAL_TASK_REQUEST_REGEX = /\b(generate|create|build|make|write|code|develop|implement|debug|fix)\b/;
const CHAT_HANDUMANAN_CONTEXT_REGEX = /\b(handumanan|heritage|cebu|metro cebu|cebu city|mandaue|talisay|lapu lapu|lapu-lapu|mactan|magellan|colon|parian|museum|museums|church|churches|cathedral|basilica|shrine|plaza|plazas|landmark|landmarks|monument|monuments|ancestral|historic|historical|route|itinerary|tour|trip|site|sites|directory|visiting hours|open sites|nearby sites|must visit)\b/;
const CHAT_NON_LOCATION_SCOPE_WORDS = new Set([
  'church',
  'churches',
  'museum',
  'museums',
  'ancestral',
  'house',
  'houses',
  'landmark',
  'landmarks',
  'monument',
  'monuments',
  'plaza',
  'plazas',
  'park',
  'parks',
  'government',
  'building',
  'buildings',
  'temple',
  'temples',
  'religious',
  'cultural',
  'historical',
]);

function isOutsideHandumananScope(text: string) {
  const query = normalizeChatText(text);
  const hasHandumananContext = CHAT_HANDUMANAN_CONTEXT_REGEX.test(query);
  if (CHAT_GENERAL_TASK_REQUEST_REGEX.test(query) && !hasHandumananContext) {
    return true;
  }

  if (CHAT_GENERAL_OFF_TOPIC_REGEX.test(query) && !CHAT_SELF_LOCATION_SCOPE_REGEX.test(query) && !hasHandumananContext) {
    return true;
  }

  const isPlaceSeekingQuery = /\b(tourist|destination|destinations|attraction|attractions|museum|museums|church|churches|site|sites|place|places|landmark|landmarks|heritage)\b/.test(query);
  if (!isPlaceSeekingQuery) return false;
  if (CHAT_SELF_LOCATION_SCOPE_REGEX.test(query)) return false;

  if (CHAT_OUTSIDE_SCOPE_PLACE_REGEX.test(query) && !CHAT_METRO_CEBU_SCOPE_REGEX.test(query)) {
    return true;
  }

  const scopeMatches = Array.from(query.matchAll(/\b(?:in|at|near|around|outside)\s+([a-z][a-z\s-]{1,40})(?=$|\?|\.|,|\b(?:for|with|please|that|today|now)\b)/g));
  if (scopeMatches.length === 0) return false;

  return scopeMatches.some(match => {
    const scope = match[1].trim();
    const scopeWords = scope.split(/\s+/).filter(Boolean);
    const isCategoryScope = scopeWords.length > 0 && scopeWords.every(word => CHAT_NON_LOCATION_SCOPE_WORDS.has(word));
    if (isCategoryScope) return false;
    return !CHAT_METRO_CEBU_SCOPE_REGEX.test(scope);
  });
}

function getClientStrongMatches(query: string, sites: any[], limit = 5) {
  const normalizedQuery = normalizeChatText(query);

  return sites
    .map(site => {
      const normalizedName = normalizeChatText(String(site?.name || ''));
      const nameWords = normalizedName.split(' ').filter(word => word.length > 2);
      const matchedNameWords = nameWords.filter(word => normalizedQuery.includes(word)).length;
      const searchable = normalizeChatText(`${site?.name || ''} ${site?.city || ''} ${site?.category || ''} ${site?.description || ''} ${site?.tags?.join(' ') || ''}`);
      const score =
        normalizedName && normalizedQuery.includes(normalizedName) ? 100 :
        matchedNameWords >= 2 ? 70 :
        matchedNameWords === 1 && CHAT_HANDUMANAN_CONTEXT_REGEX.test(normalizedQuery) ? 35 :
        CHAT_HANDUMANAN_CONTEXT_REGEX.test(normalizedQuery) && normalizedQuery.split(' ').some(term => term.length > 3 && searchable.includes(term)) ? 20 :
        0;

      return { site, score };
    })
    .filter(result => result.score >= 35)
    .sort((a, b) => b.score - a.score || Number(b.site?.rating ?? 0) - Number(a.site?.rating ?? 0))
    .slice(0, limit)
    .map(result => result.site);
}

function getClientFallbackResponse(text: string, sites: any[]): { text: string; suggestedSiteIds: string[] } {
  const query = normalizeChatText(text);
  const activeSites = sites.filter(site => site?.isActive !== false && site?.status !== 'Inactive');
  const mustVisitSites = activeSites
    .filter(site => site?.isMustVisit)
    .sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
    .slice(0, 3);

  if (/^(hi|hello|hey|good day|good morning|good afternoon|good evening|maayong adlaw)$/.test(query)) {
    return {
      text: "Hello! Maayong adlaw. I can still help you explore Handumanan's Metro Cebu heritage directory, routes, and must-visit sites.",
      suggestedSiteIds: mustVisitSites.map(site => site.id),
    };
  }

  if (isOutsideHandumananScope(text)) {
    return {
      text: "Sorry, I can only answer questions related to Metro Cebu heritage sites, tourism guidance, routes, itineraries, and the Handumanan system.",
      suggestedSiteIds: [],
    };
  }

  const city = ['cebu city', 'mandaue city', 'talisay city', 'lapu-lapu city']
    .find(cityName => query.includes(cityName));
  const cityLabel = city
    ? city.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ').replace('Lapu-lapu', 'Lapu-Lapu')
    : null;
  const categoryKeywords = [
    { keyword: 'church', category: 'Churches & Religious Heritage Sites' },
    { keyword: 'museum', category: 'Museums & Cultural Institutions' },
    { keyword: 'ancestral', category: 'Ancestral Houses & Heritage Residences' },
    { keyword: 'landmark', category: 'Historical Landmarks & Monuments' },
    { keyword: 'monument', category: 'Historical Landmarks & Monuments' },
    { keyword: 'plaza', category: 'Plazas, Parks & Public Spaces' },
    { keyword: 'park', category: 'Plazas, Parks & Public Spaces' },
    { keyword: 'government', category: 'Government & Historic Buildings' },
    { keyword: 'temple', category: 'Cultural & Religious (Non-Catholic Sites)' },
  ];
  const category = categoryKeywords.find(item => query.includes(item.keyword))?.category;
  const strongMatches = getClientStrongMatches(text, activeSites, 5);
  const hasSupportedFallbackIntent =
    CHAT_HANDUMANAN_CONTEXT_REGEX.test(query) ||
    Boolean(cityLabel) ||
    Boolean(category) ||
    isNearbyLocationRequest(text) ||
    isTripPlanningRequest(text) ||
    strongMatches.length > 0;

  if (!hasSupportedFallbackIntent) {
    return {
      text: "Sorry, I can only answer questions related to Metro Cebu heritage sites, tourism guidance, routes, itineraries, and the Handumanan system.",
      suggestedSiteIds: [],
    };
  }

  const matches = activeSites
    .filter(site => !cityLabel || site.city === cityLabel)
    .filter(site => !category || site.category === category)
    .filter(site => {
      if (cityLabel || category || /\b(top|best|must|recommend|site|sites|place|places|directory|list|show)\b/.test(query)) return true;
      return strongMatches.some(match => match.id === site.id);
    })
    .sort((a, b) => {
      if (Boolean(a.isMustVisit) !== Boolean(b.isMustVisit)) return a.isMustVisit ? -1 : 1;
      return Number(b.rating ?? 0) - Number(a.rating ?? 0);
    })
    .slice(0, 5);

  if (isTripPlanningRequest(text)) {
    const routeSites = (matches.length >= 2 ? matches : mustVisitSites).slice(0, 4);
    return {
      text: `I prepared a simple heritage route using available directory data: ${routeSites.map(site => site.name).join(', ')}. Opening these on the map can help you review the stops.`,
      suggestedSiteIds: routeSites.map(site => site.id),
    };
  }

  if (matches.length > 0) {
    return {
      text: `Here are relevant Handumanan sites: ${matches.map(site => `${site.name} (${site.city})`).join(', ')}. You can open each card to view details and map directions.`,
      suggestedSiteIds: matches.map(site => site.id),
    };
  }

  return {
    text: "I can help with Handumanan topics like Metro Cebu heritage sites, routes, cities, categories, and must-visit places. Try asking: recommend heritage sites in Cebu City.",
    suggestedSiteIds: [],
  };
}

export function HeritageChatBot() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Maayong adlaw! I am your Handumanan Guide. How can I help with your Cebu heritage journey today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatLocation, setChatLocation] = useState<{ lat: number; lng: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user } = useUser();
  const db = useFirestore();
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const userRole = userData?.role;

  // READ DATA FROM DATABASE (Firestore)
  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'));
  }, [db, user]);
  const { data: favorites } = useCollection(favoritesQuery);

  const itinerariesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'itineraries'), orderBy('createdAt', 'desc'), limit(1));
  }, [db, user]);
  const { data: itineraries } = useCollection(itinerariesQuery);

  const sitesQuery = useMemoFirebase(() => (
    db ? query(collection(db, 'heritageSites'), orderBy('name')) : null
  ), [db]);
  const { data: dbSites } = useCollection(sitesQuery);

  const directorySites = useMemo(() => {
    const sitesById = new Map(HERITAGE_SITES.map(site => [site.id, site as any]));

    dbSites?.forEach((site: any) => {
      if (!site?.id) return;
      if (site.isActive === false || site.status === 'Inactive') {
        sitesById.delete(site.id);
        return;
      }
      const existingSite = sitesById.get(site.id) || {};
      const coordinates = site.coordinates || (
        site.latitude !== undefined && site.longitude !== undefined
          ? { lat: site.latitude, lng: site.longitude }
          : existingSite.coordinates
      );
      sitesById.set(site.id, {
        ...existingSite,
        ...site,
        coordinates,
        tags: Array.isArray(site.tags) ? site.tags : (Array.isArray(existingSite.tags) ? existingSite.tags : []),
      });
    });

    return Array.from(sitesById.values())
      .map(site => ({
        ...site,
        verificationStatus: site.verificationStatus || 'Pending Verification',
      }))
      .filter(site => (
        site.isActive !== false &&
        site.status !== 'Inactive' &&
        isSiteVisibleToUser(site, userRole)
      ));
  }, [dbSites, userRole]);

  const directorySitesForChat = useMemo(() => (
    (directorySites || [])
      .filter((site: any) => site?.id)
      .map(compactSiteForChat)
      .filter((site): site is ChatDirectorySite => Boolean(site))
  ), [dbSites]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToLatestMessage = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({
      behavior,
      block: 'end',
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const frameId = requestAnimationFrame(() => {
      scrollToLatestMessage(messages.length <= 1 ? 'auto' : 'smooth');
    });
    const timeoutId = window.setTimeout(() => {
      scrollToLatestMessage('smooth');
    }, 150);

    return () => {
      cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [messages, isLoading, isOpen, scrollToLatestMessage]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let locationForRequest = chatLocation;
      if (isNearbyLocationRequest(text) && !locationForRequest) {
        try {
          locationForRequest = await getCurrentLocation();
          setChatLocation(locationForRequest);
        } catch (locationError) {
          console.warn('Chat location unavailable:', locationError);
        }
      }

      const history = newMessages.map(m => ({
        role: m.role as 'user' | 'model',
        content: [{ text: m.text }]
      }));

      // Pass Database Context to AI
      const response = await chatWithHeritageBot({
        history,
        userId: user?.uid,
        favorites: favorites?.map(f => f.siteName),
        lastItinerary: itineraries?.[0]?.summary,
        userLocation: locationForRequest ?? undefined,
        directorySites: directorySitesForChat,
      });
      const suggestedSiteIds = response.suggestedSiteIds?.filter(Boolean) ?? [];

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response.text,
        siteIds: suggestedSiteIds
      }]);

      if (isTripPlanningRequest(text) && suggestedSiteIds.length > 1) {
        localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(suggestedSiteIds));
        setIsOpen(false);
        router.push('/discover?trip=chat');
      }
    } catch (error) {
      console.error(error);
      const fallbackResponse = getClientFallbackResponse(text, directorySites);
      setMessages(prev => [...prev, {
        role: 'model',
        text: fallbackResponse.text,
        siteIds: fallbackResponse.suggestedSiteIds,
      }]);

      if (isTripPlanningRequest(text) && fallbackResponse.suggestedSiteIds.length > 1) {
        localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(fallbackResponse.suggestedSiteIds));
        setIsOpen(false);
        router.push('/discover?trip=chat');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = (siteId: string) => {
    setIsOpen(false);
    router.push(`/discover?siteId=${siteId}`);
  };

  if (!mounted) return null;

  const isDiscoverPage = pathname === '/discover';

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed h-12 w-12 md:h-14 md:w-14 rounded-2xl shadow-3xl z-40 transition-all duration-300 bg-primary hover:bg-primary/90 text-white p-0",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100",
          "right-4 md:right-6",
          isDiscoverPage
            ? (isMobile ? "top-[calc(env(safe-area-inset-top)+4.75rem)]" : "bottom-6")
            : "bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] md:bottom-6"
        )}
      >
        <MessageCircle size={28} />
      </Button>

      <Card 
        className={cn(
          "fixed left-3 right-3 md:left-auto md:right-8 w-auto md:w-[380px] h-[550px] md:h-[620px] max-h-[calc(100dvh-1.5rem)] md:max-h-[85vh] z-50 transition-all duration-500 flex flex-col rounded-[2rem] md:rounded-[2.5rem] shadow-3xl border-none overflow-hidden bg-white/95 backdrop-blur-3xl ring-1 ring-black/5",
          isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none",
          isDiscoverPage
            ? (isMobile ? "top-[calc(env(safe-area-inset-top)+4.5rem)]" : "bottom-8")
            : "bottom-[calc(env(safe-area-inset-bottom)+1rem)] md:bottom-8"
        )}
      >
        <CardHeader className="bg-primary text-white p-5 md:p-6 flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-xl">
              <Sparkles size={18} />
            </div>
            <div>
              <CardTitle className="text-sm md:text-base font-headline font-black uppercase tracking-widest">Heritage Guide</CardTitle>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">AI Tour Assistant</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
              <Minimize2 size={20} />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-50/10">
          <ScrollArea className="flex-1 p-4 md:p-5">
            <div className="space-y-6 pb-6">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={cn(
                    "flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400",
                    msg.role === 'user' ? "ml-auto items-end max-w-[85%]" : "mr-auto items-start max-w-[90%]"
                  )}
                >
                  <div className={cn(
                    "p-4 rounded-2xl md:rounded-[1.5rem] text-[12px] md:text-[14px] font-medium leading-relaxed shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-white rounded-tr-none" 
                      : "bg-white text-slate-800 rounded-tl-none ring-1 ring-black/5"
                  )}>
                    {msg.text}
                  </div>

                  {msg.siteIds && msg.siteIds.length > 0 && (
                    <div className="w-full flex flex-col gap-3 mt-1">
                      {msg.siteIds.map(siteId => {
                        const site = directorySites.find((s: any) => s.id === siteId);
                        if (!site) return null;
                        const imageSources = getSiteImageSources(site);
                        return (
                          <Card key={siteId} className="w-full rounded-[1.5rem] overflow-hidden border-none shadow-md bg-white ring-1 ring-black/5">
                            <div className="relative h-32 w-full">
                              <SafeImage
                                src={imageSources[0]}
                                alt={site.name || 'Handumanan heritage site'}
                                className="h-full w-full object-cover"
                                fallbackSrc={imageSources.slice(1)}
                                fallbackClassName="object-cover"
                                onLoad={() => scrollToLatestMessage('smooth')}
                              />
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-full text-[8px] font-black text-primary uppercase shadow-sm">
                                {site.city || 'Handumanan'}
                              </div>
                            </div>
                            <div className="p-3 space-y-2">
                              <div>
                                <h4 className="font-black text-xs text-slate-900 leading-tight">{site.name || 'Heritage Site'}</h4>
                                <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">{site.description}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                  onClick={() => handleViewOnMap(siteId)}
                                >
                                  <Compass size={12} className="mr-1.5" /> View on Map
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                  asChild
                                >
                                  <a href={`/site/${siteId}`}><ExternalLink size={12} className="mr-1.5" /> Details</a>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-3 text-primary animate-pulse">
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="text-[10px] font-black uppercase tracking-widest ml-1">Guide is thinking...</span>
                </div>
              )}
              <div ref={messagesEndRef} aria-hidden="true" />
            </div>
          </ScrollArea>

          <div className="px-4 pb-3 overflow-x-auto scrollbar-hide shrink-0">
            <div className="flex gap-2">
              {QUICK_REPLIES.map((reply, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-full bg-white text-[10px] font-black uppercase tracking-wider gap-2 px-4 shadow-sm border-slate-100 hover:bg-slate-50 transition-colors"
                  onClick={() => handleSendMessage(`Tell me about ${reply.label.toLowerCase()}`)}
                >
                  <reply.icon size={12} /> {reply.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-3 md:p-4 bg-white border-t shrink-0">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="flex w-full items-center gap-3"
          >
            <Input
              placeholder="Ask the Heritage Guide..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="rounded-2xl h-11 md:h-12 bg-slate-50 border-none text-[13px] px-4 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-inner"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-11 w-11 md:h-12 md:w-12 rounded-2xl shrink-0 shadow-xl shadow-primary/20 transition-transform active:scale-90" 
              disabled={isLoading || !input.trim()}
            >
              <Send size={18} />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </>
  );
}

'use client';

import Link from 'next/link';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles, MapPin, Heart, Minimize2, Loader2, Navigation, Compass, ExternalLink, Info } from 'lucide-react';
import { chatWithHeritageBot } from '@/ai/flows/heritage-chat-flow';
import {
  tokenizeInlineChatMarkdown,
  isTechnicalRouteRequest,
  type ChatMarkdownOptions,
} from '@/lib/chat-markdown';
import { isSafeHttpUrl, type GroundedSource } from '@/lib/chat-grounding';
import {
  isExplicitTourRequest,
  isTourPlanningMode,
  evaluateTourPlanningState,
  analyzeHeritageQueryIntent,
  retrieveAndValidateSites,
  selectSiteCardsForIntent,
  buildHistoricalTopicExplanation,
  answerGeneralKnowledgeQuery,
  isActiveEmergencyQuery,
  getEmergencyResponse,
  isPromptInjectionQuery,
  getPromptInjectionRefusal,
  isFoodOrDiningQuery,
  getFoodRecommendationLimitationResponse,
  isBroadCebuQuestion,
  getBroadCebuResponse,
  checkNonexistentOrUnlistedSite,
  checkMissingFactInSiteRecord,
  resolveConversationContext,
} from '@/lib/heritage-intent';
import type { HeritageChatInput } from '@/ai/flows/heritage-chat-flow';
import { cn } from '@/lib/utils';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, orderBy, limit } from 'firebase/firestore';
import { usePathname, useRouter } from 'next/navigation';
import { useIsMobile } from '@/hooks/use-mobile';
import { HERITAGE_SITES, isSiteVisibleToUser, hasExplicitHeritageIntent, mergeAdminSitesWithStatic } from '@/lib/heritage-data';
import { getCurrentLocation } from '@/lib/location-utils';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageSources } from '@/lib/site-images';

interface Message {
  role: 'user' | 'model';
  text: string;
  siteIds?: string[];
  requiresAuth?: boolean;
  isGeneratedItinerary?: boolean;
  sources?: GroundedSource[];
}

type ChatDirectorySite = NonNullable<HeritageChatInput['directorySites']>[number];

const QUICK_REPLIES = [
  { label: 'Find heritage sites', icon: Sparkles, prompt: 'Find heritage sites in Metro Cebu' },
  { label: "What's near me?", icon: MapPin, prompt: "What's near me?" },
  { label: 'Plan a trip', icon: Compass, prompt: 'Plan a trip to top heritage sites' },
  { label: 'Tell me about a site', icon: Info, prompt: 'Tell me about Casa Gorordo Museum' },
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
    rating: undefined,
    tags: Array.isArray(site?.tags) ? site.tags.map(String).filter(Boolean) : undefined,
    coordinates: { lat, lng },
    latitude: lat,
    longitude: lng,
    isMustVisit: Boolean(site?.isMustVisit),
    isActive: site?.isActive !== false,
    status: site?.status ? String(site.status) : undefined,
    demolitionStatus: site?.demolitionStatus ? String(site.demolitionStatus) : undefined,
    accessibilityStatus: site?.accessibilityStatus ? String(site.accessibilityStatus) : undefined,
    entranceFee: site?.entranceFee ? String(site.entranceFee) : undefined,
  };

  const compactPayload = payload as Record<string, unknown>;
  Object.keys(payload).forEach(key => {
    if (compactPayload[key] === undefined || compactPayload[key] === '') delete compactPayload[key];
  });

  return payload;
}

function isTripPlanningRequest(text: string, history?: any[]) {
  return isExplicitTourRequest(text, history);
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
  'basilica',
  'cathedral',
  'shrine',
  'cross',
  'fort',
  'mansion',
  'residence',
  'residences',
  'library',
  'libraries',
  'memorial',
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

function renderInlineChatMarkdown(text: string, keyPrefix: string, options: ChatMarkdownOptions = {}) {
  const tokens = tokenizeInlineChatMarkdown(text, options);
  return tokens.map((token, idx) => {
    const key = `${keyPrefix}-${idx}`;
    if (token.type === 'internal_link') {
      return (
        <Link
          key={key}
          href={token.href}
          className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {token.label}
        </Link>
      );
    }
    if (token.type === 'external_link') {
      return (
        <a
          key={key}
          href={token.href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary underline decoration-primary/40 underline-offset-2 hover:text-primary/80 transition-colors inline-flex items-center gap-1"
        >
          <span>{token.label}</span>
          <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
        </a>
      );
    }
    if (token.type === 'image') {
      return (
        <img
          key={key}
          src={token.src}
          alt={token.alt}
          loading="lazy"
          className="my-2 max-h-48 w-auto rounded-xl object-cover border border-slate-200/80"
        />
      );
    }
    if (token.type === 'code') {
      return (
        <code key={key} className="px-1.5 py-0.5 mx-0.5 rounded bg-slate-100 text-slate-900 font-mono text-[0.9em]">
          {token.value}
        </code>
      );
    }
    if (token.type === 'bold') {
      return <strong key={key} className="font-bold text-slate-950">{token.value}</strong>;
    }
    if (token.type === 'italic') {
      return <em key={key} className="italic">{token.value}</em>;
    }
    return token.value;
  });
}

function renderSafeChatMarkdown(rawText: string, options: ChatMarkdownOptions = {}) {
  const blocks = String(rawText || '').trim().split(/\n{2,}/);
  return (
    <div className="space-y-2.5">
      {blocks.map((block, blockIdx) => {
        const lines = block.split('\n').map(l => l.trimEnd()).filter(Boolean);
        const isBulletList = lines.length > 0 && lines.every(l => /^[-*]\s+/.test(l));
        const isOrderedList = lines.length > 0 && lines.every(l => /^\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={`b-${blockIdx}`} className="list-disc pl-5 space-y-1">
              {lines.map((line, lineIdx) => (
                <li key={`li-${blockIdx}-${lineIdx}`}>
                  {renderInlineChatMarkdown(line.replace(/^[-*]\s+/, ''), `ul-${blockIdx}-${lineIdx}`, options)}
                </li>
              ))}
            </ul>
          );
        }

        if (isOrderedList) {
          return (
            <ol key={`o-${blockIdx}`} className="list-decimal pl-5 space-y-1">
              {lines.map((line, lineIdx) => (
                <li key={`ol-${blockIdx}-${lineIdx}`}>
                  {renderInlineChatMarkdown(line.replace(/^\d+\.\s+/, ''), `ol-${blockIdx}-${lineIdx}`, options)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={`p-${blockIdx}`} className="whitespace-pre-wrap">
            {lines.map((line, lineIdx) => (
              <span key={`ln-${blockIdx}-${lineIdx}`}>
                {lineIdx > 0 && <br />}
                {renderInlineChatMarkdown(line, `p-${blockIdx}-${lineIdx}`, options)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function getClientFallbackResponse(text: string, sites: any[], input?: any): { text: string; suggestedSiteIds: string[]; isGeneratedItinerary?: boolean } {
  const activeSites = sites.filter(site => site?.isActive !== false && site?.status !== 'Inactive');
  const history = input?.history || [{ role: 'user', content: [{ text }] }];
  const resolvedContext = resolveConversationContext(history.slice(0, -1), activeSites);

  if (isActiveEmergencyQuery(text, resolvedContext)) {
    const em = getEmergencyResponse(text, resolvedContext);
    return { text: em.text, suggestedSiteIds: [], isGeneratedItinerary: false };
  }

  if (isPromptInjectionQuery(text)) {
    const refusal = getPromptInjectionRefusal(text);
    return { text: refusal.text, suggestedSiteIds: [], isGeneratedItinerary: false };
  }

  const query = normalizeChatText(text);

  if (/^(hi|hello|hey|good day|good morning|good afternoon|good evening|maayong adlaw|kumusta|kamusta)$/.test(query) || /^(hi|hello|hey)\s+(there|everyone|all)$/.test(query)) {
    return {
      text: "Hello! Maayong adlaw. I can help you explore Handumanan's Metro Cebu heritage directory, routes, and must-visit sites.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (/^(thank you|thanks|thank u|salamat|salamat po|maraming salamat)$/.test(query) || /^(thank you|thanks|salamat)\s+(so much|very much|a lot)$/.test(query)) {
    return {
      text: "You're welcome! Salamat! I'm here to help you explore Metro Cebu's heritage sites, routes, and itineraries whenever you need.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (/^(bye|goodbye|see you|see ya|paalam|paalam po|take care)$/.test(query) || /^(bye|goodbye|see you)\s+(for now|everyone|all)$/.test(query)) {
    return {
      text: "Goodbye! Salamat for visiting Handumanan. Come back anytime to explore more of Metro Cebu's heritage.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (isTourPlanningMode(input?.history, text)) {
    const result = evaluateTourPlanningState(text, input || { history: [{ role: 'user', content: [{ text }] }] }, sites);
    return {
      text: result.text,
      suggestedSiteIds: result.suggestedSiteIds || [],
      isGeneratedItinerary: result.isGeneratedItinerary,
    };
  }

  const analyzed = analyzeHeritageQueryIntent(text, history, activeSites);

  if (isBroadCebuQuestion(text)) {
    const broad = getBroadCebuResponse();
    return { text: broad.text, suggestedSiteIds: [], isGeneratedItinerary: false };
  }

  if (analyzed.intent === 'out_of_scope') {
    const scopeMsg =
      analyzed.geographicRegion === 'outside_metro_cebu_province' || analyzed.geographicRegion === 'metro_cebu_not_covered'
        ? "Handumanan currently covers verified heritage sites in Cebu City, Mandaue City, Lapu-Lapu City, and Talisay City only, so I don't have verified records for that area."
        : "I'm currently in offline fallback mode and can best help with Metro Cebu heritage sites, visiting hours, routes, and the Handumanan directory.";
    return {
      text: scopeMsg,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.intent === 'general_knowledge_question') {
    const gkReply = answerGeneralKnowledgeQuery(text, resolvedContext, analyzed.location);
    return {
      text: gkReply.text,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.intent === 'conversational') {
    return {
      text: "Thanks for sharing! Whenever you'd like to explore heritage sites, historic architecture, or routes in Metro Cebu, feel free to ask.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.intent === 'ambiguous_clarification') {
    return {
      text: analyzed.clarificationPrompt || 'Which heritage site or Metro Cebu city would you like to explore?',
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  const unlisted = checkNonexistentOrUnlistedSite(text, activeSites);
  if (unlisted) {
    return { text: unlisted.text, suggestedSiteIds: [], isGeneratedItinerary: false };
  }

  const missingFact = checkMissingFactInSiteRecord(text, activeSites, resolvedContext.lastReferencedSite);
  if (missingFact) {
    return {
      text: missingFact.text,
      suggestedSiteIds: missingFact.suggestedSiteIds || [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.intent === 'general_historical_question') {
    const topicReply = buildHistoricalTopicExplanation(text, activeSites, resolvedContext);
    return {
      text: topicReply.text,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.intent === 'system_question') {
    return {
      text: "Handumanan's AI Heritage Guide answers from the verified Metro Cebu directory and admits when details (such as unrecorded builders, exact years, or live opening status) are missing rather than guessing.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  if (analyzed.requestedCount === 0) {
    return {
      text: "Zero recommendations requested, so I haven't listed any heritage sites.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  const limit = analyzed.requestedCount ?? 5;
  const validated = retrieveAndValidateSites(text, activeSites, analyzed, limit);
  const cards = selectSiteCardsForIntent(analyzed, validated, limit);
  const finalSites = cards.siteIds.length > 0
    ? validated.filter(s => cards.siteIds.includes(s.id))
    : validated;

  if (
    analyzed.intent === 'visiting_information' &&
    finalSites.length === 1 &&
    /\b(right\s+now|currently|open\s+now|sunday|sundays)\b/i.test(text)
  ) {
    const target = finalSites[0];
    return {
      text: `I cannot verify live, real-time opening status right now, as Handumanan only stores published directory schedules. For ${target.name}, the listed visiting hours are ${target.visitingHours}. Please verify current hours directly with the site before visiting.`,
      suggestedSiteIds: [target.id],
      isGeneratedItinerary: false,
    };
  }

  if (
    analyzed.entities.length > 1 &&
    (analyzed.intent === 'visiting_information' || analyzed.intent === 'follow_up_question') &&
    finalSites.length > 1
  ) {
    if (/\b(sunday|sundays|open|hours|schedule)\b/i.test(text)) {
      return {
        text: `Here are the published visiting hours from Handumanan's directory: ${finalSites.map(s => `${s.name} (${s.visitingHours})`).join('; ')}. Please verify current Sunday or holiday hours directly with each site.`,
        suggestedSiteIds: finalSites.map(s => s.id),
        isGeneratedItinerary: false,
      };
    }
    if (/\b(fee|fees|entrance|admission|free|cost|price)\b/i.test(text)) {
      return {
        text: `Here are the listed entrance fees in Handumanan's directory: ${finalSites.map(s => `${s.name} (${s.entranceFee || 'Fee not confirmed'})`).join('; ')}.`,
        suggestedSiteIds: finalSites.map(s => s.id),
        isGeneratedItinerary: false,
      };
    }
  }

  if (finalSites.length > 0) {
    const correctionPrefix = analyzed.isExclusionCorrection
      ? `My mistake—I've excluded ${analyzed.excludedCategories.join(', ')} and updated your recommendations. `
      : '';
    const countNote =
      analyzed.requestedCount && finalSites.length < analyzed.requestedCount
        ? `Note: You requested ${analyzed.requestedCount} sites, but only ${finalSites.length} matching verified ${finalSites.length === 1 ? 'site is' : 'sites are'} available. `
        : '';
    return {
      text: `${correctionPrefix}${countNote}Here ${finalSites.length === 1 ? 'is 1 verified Handumanan site' : `are ${finalSites.length} verified Handumanan sites`}: ${finalSites.map(site => `${site.name} (${site.city})`).join(', ')}. Open each card for recorded details and listed visiting hours.`,
      suggestedSiteIds: cards.siteIds,
      isGeneratedItinerary: false,
    };
  }

  return {
    text: "I couldn't find matching heritage sites for those criteria in Handumanan's Metro Cebu directory. Try another Metro Cebu city or heritage category.",
    suggestedSiteIds: [],
    isGeneratedItinerary: false,
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
    db ? collection(db, 'heritageSites') : null
  ), [db]);
  const { data: dbSites } = useCollection(sitesQuery);

  const directorySites = useMemo(() => {
    return mergeAdminSitesWithStatic(dbSites, null);
  }, [dbSites]);

  const directorySitesForChat = useMemo(() => (
    (directorySites || [])
      .filter((site: any) => site?.id)
      .map(compactSiteForChat)
      .filter((site): site is ChatDirectorySite => Boolean(site))
  ), [directorySites]);

  const availableCount = directorySites.length;

  useEffect(() => {
    if (availableCount > 0) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'model') {
          return [{
            role: 'model',
            text: `Maayong adlaw! I'm the Handumanan Guide. I can help you explore the ${availableCount} heritage sites currently available on Handumanan, learn about their history, compare places, find nearby heritage sites, check visiting information, and plan routes or trips around Metro Cebu.`
          }];
        }
        return prev;
      });
    }
  }, [availableCount]);

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

    if (!user) {
      setMessages(prev => [
        ...prev,
        { role: 'user', text },
        {
          role: 'model',
          text: 'Please log in to use the Handumanan AI Guide.',
          requiresAuth: true,
        }
      ]);
      setInput('');
      return;
    }

    const newMessages: Message[] = [...messages, { role: 'user', text }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      let locationForRequest = chatLocation;
      if (isNearbyLocationRequest(text) && !locationForRequest) {
        try {
          const evalLoc = await getCurrentLocation({ enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
          if (evalLoc.isTrusted) {
            locationForRequest = { lat: evalLoc.lat, lng: evalLoc.lng };
            setChatLocation(locationForRequest);
          } else {
            locationForRequest = null;
            setChatLocation(null);
          }
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
        userId: user?.uid ? String(user.uid) : undefined,
        favorites: Array.isArray(favorites)
          ? favorites.map(f => String(f.siteName || f.id || '')).filter(Boolean)
          : undefined,
        lastItinerary: itineraries?.[0]?.summary ? String(itineraries[0].summary) : undefined,
        userLocation: locationForRequest
          ? { lat: Number(locationForRequest.lat), lng: Number(locationForRequest.lng) }
          : undefined,
        directorySites: directorySitesForChat,
      });
      const suggestedSiteIds = response.suggestedSiteIds?.filter(Boolean) ?? [];
      const isGeneratedItinerary = Boolean(response.isGeneratedItinerary);
      const validSources = Array.isArray(response.sources)
        ? response.sources
            .filter(s => Boolean(s?.title && isSafeHttpUrl(s?.url)))
            .slice(0, 5)
        : undefined;

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: response.text,
        siteIds: suggestedSiteIds,
        isGeneratedItinerary,
        ...(validSources && validSources.length > 0 ? { sources: validSources } : {}),
      }]);

      if (isGeneratedItinerary && suggestedSiteIds.length > 1) {
        localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(suggestedSiteIds));
        setIsOpen(false);
        router.push(`/discover?trip=chat&t=${Date.now()}`);
      }
    } catch (error) {
      console.error(error);
      const history = newMessages.map(m => ({
        role: m.role as 'user' | 'model',
        content: [{ text: m.text }]
      }));
      const fallbackResponse = getClientFallbackResponse(text, directorySites, { history, userLocation: chatLocation });
      const isGeneratedItinerary = Boolean(fallbackResponse.isGeneratedItinerary);

      setMessages(prev => [...prev, {
        role: 'model',
        text: fallbackResponse.text,
        siteIds: fallbackResponse.suggestedSiteIds,
        isGeneratedItinerary,
      }]);

      if (isGeneratedItinerary && fallbackResponse.suggestedSiteIds.length > 1) {
        localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(fallbackResponse.suggestedSiteIds));
        setIsOpen(false);
        router.push(`/discover?trip=chat&t=${Date.now()}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOnMap = (siteId: string) => {
    const site = directorySites.find((s: any) => s.id === siteId);
    if (site?.name) {
      setMessages(prev => [...prev, { role: 'user', text: `Selected site: ${site.name}` }]);
    }
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
                    {msg.role === 'user'
                      ? msg.text
                      : renderSafeChatMarkdown(msg.text, {
                          preserveTechnicalRoutes: isTechnicalRouteRequest(
                            messages.slice(0, i).reverse().find(m => m.role === 'user')?.text || ''
                          ),
                        })}
                    {msg.requiresAuth && (
                      <div className="mt-3">
                        <Button
                          asChild
                          size="sm"
                          className="rounded-xl font-bold bg-primary text-white hover:bg-primary/90 shadow-md"
                        >
                          <Link href="/auth">Log In to Continue</Link>
                        </Button>
                      </div>
                    )}
                    {msg.role === 'model' && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((source, sourceIdx) => {
                            const safeHref = isSafeHttpUrl(source.url);
                            if (!safeHref) return null;
                            return (
                              <a
                                key={`${safeHref}-${sourceIdx}`}
                                href={safeHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={source.supportedSegments?.join(' • ') || `${source.title} (${source.category || 'Travel Guide'})`}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-50 text-[11px] font-medium text-primary underline decoration-primary/40 underline-offset-2 transition-colors max-w-[260px]"
                              >
                                <span className="truncate">{source.title}</span>
                                {source.category && (
                                  <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 no-underline shrink-0">
                                    {source.category}
                                  </span>
                                )}
                                <ExternalLink className="h-3 w-3 shrink-0 text-primary/70" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {msg.siteIds && msg.siteIds.length > 0 && (
                    <div className="w-full flex flex-col gap-3 mt-1">
                      {msg.siteIds.map(siteId => {
                        const site = directorySites.find((s: any) => s.id === siteId);
                        if (!site) return null;
                        const imageSources = getSiteImageSources(site);
                        if (pathname === '/auth' || pathname === '/admin-login' || pathname === '/lgu-login') return null;

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
                                {site.entranceFee && (
                                  <p className="text-[10px] font-bold text-amber-800 mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/80 inline-block">
                                    {site.entranceFee}
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest"
                                  onClick={() => handleViewOnMap(siteId)}
                                >
                                  <Compass size={12} className="mr-1.5" aria-hidden="true" /> View on Map
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="flex-1 h-8 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
                                  asChild
                                >
                                  <Link href={`/site/${siteId}`}><ExternalLink size={12} className="mr-1.5" aria-hidden="true" /> Details</Link>
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                      {msg.siteIds.length > 1 && msg.isGeneratedItinerary && (
                        <Button
                          onClick={() => {
                            localStorage.setItem('handumanan_draft_itinerary', JSON.stringify(msg.siteIds));
                            setIsOpen(false);
                            router.push(`/discover?trip=chat&t=${Date.now()}`);
                          }}
                          className="w-full h-9 rounded-xl bg-primary hover:bg-primary/90 text-white font-headline text-[10px] uppercase font-black tracking-widest shadow-md flex items-center justify-center gap-2 mt-1"
                        >
                          <Compass size={14} /> Open Tour on Map
                        </Button>
                      )}
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
                  className="h-8 shrink-0 rounded-full bg-white text-[10px] font-bold tracking-wide gap-1.5 px-3.5 shadow-sm border-slate-200 hover:bg-slate-100 hover:text-primary transition-colors"
                  onClick={() => handleSendMessage(reply.prompt || reply.label)}
                >
                  <reply.icon size={12} className="text-primary shrink-0" /> {reply.label}
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


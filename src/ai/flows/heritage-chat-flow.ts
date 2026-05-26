'use server';
/**
 * @fileOverview Refined AI Chatbot flow for the Handumanan system.
 */

import { ai, hasGoogleAiApiKey } from '@/ai/genkit';
import { z } from 'genkit';
import { DEPRECATED_HERITAGE_SITE_IDS, HERITAGE_SITES } from '@/lib/heritage-data';
import { getSiteAvailability, isSiteOpenForVisit } from '@/lib/site-availability';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const DirectorySiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  overview: z.string().optional(),
  significance: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  city: z.string().optional(),
  visitingHours: z.string().optional(),
  imageUrl: z.string().optional(),
  galleryImages: z.array(z.string()).optional(),
  rating: z.number().optional(),
  tags: z.array(z.string()).optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  isMustVisit: z.boolean().optional(),
  isActive: z.boolean().optional(),
  status: z.string().optional(),
  demolitionStatus: z.string().optional(),
  accessibilityStatus: z.string().optional(),
}).passthrough();

const HeritageChatInputSchema = z.object({
  history: z.array(MessageSchema),
  userLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
  userId: z.string().optional(),
  favorites: z.array(z.string()).optional(),
  lastItinerary: z.string().optional(),
  directorySites: z.array(DirectorySiteSchema).optional(),
});

const HeritageChatOutputSchema = z.object({
  text: z.string(),
  suggestedSiteIds: z.array(z.string()).optional(),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;
export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

type HeritageSiteRecord = (typeof HERITAGE_SITES)[number];
type DirectorySiteInput = z.infer<typeof DirectorySiteSchema>;
type GeoPoint = { lat: number; lng: number };

const DEFAULT_CATEGORY: HeritageSiteRecord['category'] = 'Historical Landmarks & Monuments';
const DEFAULT_CITY: HeritageSiteRecord['city'] = 'Cebu City';

const HERITAGE_CATEGORIES: HeritageSiteRecord['category'][] = [
  'Churches & Religious Heritage Sites',
  'Ancestral Houses & Heritage Residences',
  'Museums & Cultural Institutions',
  'Historical Landmarks & Monuments',
  'Plazas, Parks & Public Spaces',
  'Government & Historic Buildings',
  'Cultural & Religious (Non-Catholic Sites)',
];

const HERITAGE_CITIES: HeritageSiteRecord['city'][] = [
  'Cebu City',
  'Lapu-Lapu City',
  'Mandaue City',
  'Talisay City',
];

function isHeritageCategory(value: unknown): value is HeritageSiteRecord['category'] {
  return typeof value === 'string' && HERITAGE_CATEGORIES.includes(value as HeritageSiteRecord['category']);
}

function isHeritageCity(value: unknown): value is HeritageSiteRecord['city'] {
  return typeof value === 'string' && HERITAGE_CITIES.includes(value as HeritageSiteRecord['city']);
}

function isValidGeoPoint(value: unknown): value is GeoPoint {
  if (!value || typeof value !== 'object') return false;
  const point = value as Partial<GeoPoint>;
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Number(point.lat) >= -90 &&
    Number(point.lat) <= 90 &&
    Number(point.lng) >= -180 &&
    Number(point.lng) <= 180
  );
}

function normalizeDirectorySite(site: DirectorySiteInput): HeritageSiteRecord | null {
  if (!site.id || !site.name || DEPRECATED_HERITAGE_SITE_IDS.includes(site.id)) return null;

  const coordinates = isValidGeoPoint(site.coordinates)
    ? site.coordinates
    : Number.isFinite(site.latitude) && Number.isFinite(site.longitude)
      ? { lat: Number(site.latitude), lng: Number(site.longitude) }
      : null;

  if (!coordinates) return null;

  return {
    id: site.id,
    name: site.name,
    description: site.description || 'A listed Handumanan heritage site.',
    overview: site.overview || site.description || 'This site is included in the Handumanan directory.',
    significance: site.significance || 'Historical significance details are not yet available in the directory.',
    category: isHeritageCategory(site.category) ? site.category : DEFAULT_CATEGORY,
    location: site.location || 'Location details are not yet available.',
    city: isHeritageCity(site.city) ? site.city : DEFAULT_CITY,
    visitingHours: site.visitingHours || 'Visiting hours are not yet available.',
    imageUrl: site.imageUrl || '/logo.png',
    galleryImages: site.galleryImages,
    rating: Number.isFinite(site.rating) ? Number(site.rating) : 4.5,
    tags: Array.isArray(site.tags) ? site.tags.filter(Boolean) : [],
    coordinates,
    isMustVisit: Boolean(site.isMustVisit),
    needsVerification: Boolean(site.needsVerification),
    isActive: site.isActive !== false && site.status !== 'Inactive',
    status: site.status === 'Inactive' ? 'Inactive' : 'Active',
    demolitionStatus: site.demolitionStatus === 'Demolished' || site.demolitionStatus === 'Partially Demolished'
      ? site.demolitionStatus
      : 'Non-Demolished',
    accessibilityStatus: site.accessibilityStatus || 'Accessibility details are not yet available.',
  };
}

function getSiteCorpus(input?: HeritageChatInput): HeritageSiteRecord[] {
  const sitesById = new Map<string, HeritageSiteRecord>();

  HERITAGE_SITES.forEach(site => {
    if (!DEPRECATED_HERITAGE_SITE_IDS.includes(site.id)) {
      sitesById.set(site.id, site);
    }
  });

  input?.directorySites?.forEach(site => {
    const normalizedSite = normalizeDirectorySite(site);
    if (normalizedSite) {
      sitesById.set(normalizedSite.id, normalizedSite);
    }
  });

  return Array.from(sitesById.values()).filter(site => site.isActive !== false && site.status !== 'Inactive');
}

function parseAvailableHours(query: string): number {
  const match = query.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
  return match ? Number(match[1]) : 4;
}

function isTripPlanningQuery(query: string): boolean {
  const hasExplicitPlanningKeyword =
    /\b(itinerary|route|trip|tour|tours|planner|planning)\b/.test(query) ||
    (/\bplan\b/.test(query) && /\b(cebu|heritage|site|sites|place|places|route|trip|tour|museum|church|landmark|day|hour|hours)\b/.test(query));

  return (
    isTravelTimeQuery(query) ||
    /\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/.test(query) ||
    hasExplicitPlanningKeyword
  );
}

function getStopCountForHours(hours: number): number {
  if (hours <= 1) return 2;
  if (hours <= 2) return 3;
  if (hours <= 5) return 4;
  return 6;
}

function getBalancedRouteSites(stopCount: number, sites: HeritageSiteRecord[]) {
  const activeSites = sites.filter(site => isSiteOpenForVisit(site));
  const selected = [];
  const usedIds = new Set<string>();
  const usedCities = new Set<string>();
  const usedCategories = new Set<string>();

  const sortedSites = [...activeSites].sort((a, b) => {
    if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
    return b.rating - a.rating;
  });

  for (const site of sortedSites) {
    if (selected.length >= stopCount) break;
    if (usedCities.has(site.city) || usedCategories.has(site.category)) continue;

    selected.push(site);
    usedIds.add(site.id);
    usedCities.add(site.city);
    usedCategories.add(site.category);
  }

  for (const site of sortedSites) {
    if (selected.length >= stopCount) break;
    if (usedIds.has(site.id)) continue;

    selected.push(site);
    usedIds.add(site.id);
  }

  return selected;
}

const CHAT_SEARCH_STOP_WORDS = new Set([
  'what',
  'whats',
  'where',
  'when',
  'who',
  'why',
  'how',
  'the',
  'and',
  'for',
  'with',
  'about',
  'info',
  'information',
  'details',
  'detail',
  'tell',
  'give',
  'show',
  'please',
  'top',
  'best',
  'must',
  'recommend',
  'recommended',
  'tourist',
  'tourists',
  'destination',
  'destinations',
  'attraction',
  'attractions',
  'spot',
  'spots',
  'visit',
  'visits',
  'place',
  'places',
  'site',
  'sites',
  'heritage',
  'cebu',
  'city',
  'here',
  'open',
  'opened',
  'available',
  'still',
  'currently',
  'now',
  'today',
]);

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isSimpleGreetingQuery(query: string) {
  return /^(hi|hello|hey|maayong adlaw|good day|good morning|good afternoon|good evening)$/.test(normalizeSearchText(query));
}

function isWellbeingQuery(query: string) {
  return /^(how are you|how are you doing|how s it going|are you okay|kumusta|kamusta)$/.test(normalizeSearchText(query));
}

function isThanksQuery(query: string) {
  return /^(thanks|thank you|thank you so much|salamat|ty)$/.test(normalizeSearchText(query));
}

function isHelpQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return (
    normalizedQuery === 'help' ||
    normalizedQuery === 'who are you' ||
    normalizedQuery === 'what are you' ||
    normalizedQuery === 'what can you do' ||
    normalizedQuery === 'what can i ask you'
  );
}

function isSystemQuestion(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const mentionsHandumanan = /\b(handumanan|this app|this system|this website|this platform|this chatbot|your chatbot|your ai|heritage guide)\b/.test(normalizedQuery);
  const asksAppCapability = /\b(what can you do|what can i ask|how to use|how do i use|features|feature|about handumanan|what is handumanan|how does handumanan work)\b/.test(normalizedQuery);
  const asksHandumananFeature =
    /\b(what can|how does|how do|why does|explain)\b.*\b(chatbot|planner|itinerary|route|routing|navigation|live location|location tracking|firebase|google maps|maps|source of truth|verified|verification|closed site|open site)\b/.test(normalizedQuery) ||
    /\b(chatbot|planner|itinerary|route|routing|navigation|live location|location tracking)\b.*\b(handumanan|this app|this system|work|works|do|feature|features)\b/.test(normalizedQuery);

  return (
    asksAppCapability ||
    asksHandumananFeature ||
    (mentionsHandumanan && /\b(system|app|application|website|platform|feature|features|how|what|about)\b/.test(normalizedQuery)) ||
    (mentionsHandumanan && /\b(ai|chatbot|planner|itinerary|route|routing|navigation|live location|location tracking|privacy|data|firebase|google maps|maps|source of truth|verified|verification|closed site|open site)\b/.test(normalizedQuery))
  );
}

function isFriendlyChatQuery(query: string) {
  return isSimpleGreetingQuery(query) || isWellbeingQuery(query) || isThanksQuery(query) || isHelpQuery(query);
}

const CITY_ALIASES: Record<string, string> = {
  'cebu city': 'Cebu City',
  'mandaue': 'Mandaue City',
  'mandaue city': 'Mandaue City',
  'talisay': 'Talisay City',
  'talisay city': 'Talisay City',
  'lapu lapu': 'Lapu-Lapu City',
  'lapu lapu city': 'Lapu-Lapu City',
  'lapu city': 'Lapu-Lapu City',
  'lapulapu': 'Lapu-Lapu City',
};

const CATEGORY_ALIASES: Record<string, (typeof HERITAGE_SITES)[number]['category']> = {
  church: 'Churches & Religious Heritage Sites',
  churches: 'Churches & Religious Heritage Sites',
  catholic: 'Churches & Religious Heritage Sites',
  shrine: 'Churches & Religious Heritage Sites',
  museum: 'Museums & Cultural Institutions',
  museums: 'Museums & Cultural Institutions',
  cultural: 'Museums & Cultural Institutions',
  ancestral: 'Ancestral Houses & Heritage Residences',
  house: 'Ancestral Houses & Heritage Residences',
  houses: 'Ancestral Houses & Heritage Residences',
  residence: 'Ancestral Houses & Heritage Residences',
  residences: 'Ancestral Houses & Heritage Residences',
  landmark: 'Historical Landmarks & Monuments',
  landmarks: 'Historical Landmarks & Monuments',
  monument: 'Historical Landmarks & Monuments',
  monuments: 'Historical Landmarks & Monuments',
  historical: 'Historical Landmarks & Monuments',
  plaza: 'Plazas, Parks & Public Spaces',
  plazas: 'Plazas, Parks & Public Spaces',
  park: 'Plazas, Parks & Public Spaces',
  parks: 'Plazas, Parks & Public Spaces',
  public: 'Plazas, Parks & Public Spaces',
  government: 'Government & Historic Buildings',
  building: 'Government & Historic Buildings',
  buildings: 'Government & Historic Buildings',
  temple: 'Cultural & Religious (Non-Catholic Sites)',
  taoist: 'Cultural & Religious (Non-Catholic Sites)',
  'non catholic': 'Cultural & Religious (Non-Catholic Sites)',
};

function getSearchTerms(query: string) {
  return normalizeSearchText(query)
    .split(' ')
    .filter(word => word.length > 2 && !CHAT_SEARCH_STOP_WORDS.has(word));
}

function getCityFromQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return Object.entries(CITY_ALIASES).find(([alias]) => normalizedQuery.includes(alias))?.[1];
}

function getCityFromEndpoint(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return Object.entries(CITY_ALIASES)
    .sort((a, b) => b[0].length - a[0].length)
    .find(([alias]) => normalizedQuery === alias || normalizedQuery.includes(alias))?.[1];
}

function getCategoryFromQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return Object.entries(CATEGORY_ALIASES).find(([alias]) => normalizedQuery.includes(alias))?.[1];
}

function isDirectoryListQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return (
    /\b(all|any|list|show|which|where|find|directory|locations|places|sites)\b/.test(normalizedQuery) ||
    Boolean(getCityFromQuery(query)) ||
    Boolean(getCategoryFromQuery(query))
  );
}

function getDirectoryMatches(query: string, limit = 8, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const city = getCityFromQuery(query);
  const category = getCategoryFromQuery(query);
  const terms = getSearchTerms(query);
  const normalizedQuery = normalizeSearchText(query);

  let matches = sites.filter(site => isSiteOpenForVisit(site));
  if (city) matches = matches.filter(site => site.city === city);
  if (category) matches = matches.filter(site => site.category === category);

  if (!city && !category && terms.length > 0) {
    const searchMatches = findMatchingSites(query, limit, sites);
    if (searchMatches.length > 0) {
      matches = searchMatches;
    } else if (!/\b(all|directory|locations|places|sites)\b/.test(normalizedQuery)) {
      matches = [];
    }
  }

  return matches
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      return b.rating - a.rating;
    })
    .slice(0, limit);
}

function formatSiteList(sites: HeritageSiteRecord[], totalCount?: number) {
  const names = sites.map(site => `${site.name} (${site.city})`).join(', ');
  const count = totalCount ?? sites.length;
  const suffix = count > sites.length ? ` Showing ${sites.length}; refine by city or category for more.` : '';
  return `I found ${count} matching site${count === 1 ? '' : 's'}: ${names}.${suffix}`;
}

function getScopedSites(query: string, sites: HeritageSiteRecord[]) {
  const city = getCityFromQuery(query);
  const category = getCategoryFromQuery(query);

  return {
    city,
    category,
    scopedSites: sites
      .filter(site => !city || site.city === city)
      .filter(site => !category || site.category === category),
  };
}

function formatScopeText(category?: string, city?: string) {
  return [category, city].filter(Boolean).join(' in ');
}

function getTourGuideReason(site: HeritageSiteRecord) {
  if (site.isMustVisit) return 'it is marked as a must-visit entry in the directory';
  if (site.category.includes('Churches')) return 'it gives visitors a strong look at Cebu religious heritage';
  if (site.category.includes('Museums')) return 'it is useful for learning historical context before visiting nearby sites';
  if (site.category.includes('Ancestral')) return 'it shows preserved local architecture and family heritage';
  if (site.category.includes('Plazas')) return 'it is easy to include as a public-space stop during a walking route';
  return `it represents ${site.category.toLowerCase()} in ${site.city}`;
}

function formatGuideRecommendationList(sites: HeritageSiteRecord[]) {
  return sites
    .map(site => {
      const availability = getSiteAvailability(site);
      const status = availability.isOpen ? 'open/available now' : 'closed or unavailable now';
      return `${site.name} (${site.city}) - ${status}; recommended because ${getTourGuideReason(site)}. Hours: ${site.visitingHours}`;
    })
    .join(' ');
}

function isHeritageRecommendationQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return (
    /\b(recommend|recommended|suggest|suggested|top|best|must visit|must see|where should|what should|worth visiting)\b/.test(normalizedQuery) &&
    (
      HANDUMANAN_DOMAIN_REGEX.test(normalizedQuery) ||
      METRO_CEBU_SCOPE_REGEX.test(normalizedQuery) ||
      Boolean(getCityFromQuery(query)) ||
      Boolean(getCategoryFromQuery(query))
    )
  );
}

function getGuideRecommendationResponse(query: string, sites: HeritageSiteRecord[], limit = 4): HeritageChatOutput {
  const { city, category, scopedSites } = getScopedSites(query, sites);
  const scopeText = formatScopeText(category, city);
  const openSites = scopedSites
    .filter(site => isSiteOpenForVisit(site))
    .sort((a, b) => {
      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      return b.rating - a.rating;
    });
  const unavailableSites = scopedSites.filter(site => !isSiteOpenForVisit(site));
  const shownSites = openSites.slice(0, limit);

  if (shownSites.length === 0) {
    const alternatives = sites
      .filter(site => isSiteOpenForVisit(site))
      .filter(site => !city || site.city === city)
      .filter(site => !category || site.category === category)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);

    return {
      text: alternatives.length > 0
        ? `I could not find currently open recommendations${scopeText ? ` for ${scopeText}` : ''}. As a practical alternative, you can try: ${formatGuideRecommendationList(alternatives)}`
        : `I could not find currently open recommendations${scopeText ? ` for ${scopeText}` : ''} based on the directory's listed status and visiting hours.`,
      suggestedSiteIds: alternatives.map(site => site.id),
    };
  }

  const unavailableNote = unavailableSites.length > 0
    ? ` I skipped ${unavailableSites.length} closed or unavailable ${unavailableSites.length === 1 ? 'site' : 'sites'} so the route stays practical.`
    : '';

  return {
    text: `As your Handumanan guide, I recommend these currently open heritage stops${scopeText ? ` for ${scopeText}` : ''}: ${formatGuideRecommendationList(shownSites)}${unavailableNote}`,
    suggestedSiteIds: shownSites.map(site => site.id),
  };
}

function isOpenSitesQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const asksOpenOrAvailable = /\b(open|available|visit today|right now|currently open|open today|still open)\b/.test(normalizedQuery);
  const hasHeritageTarget =
    /\b(heritage|site|sites|place|places|directory|destinations|tourist|tourism|landmark|landmarks|museum|museums|church|churches)\b/.test(normalizedQuery) ||
    Boolean(getCityFromQuery(query)) ||
    Boolean(getCategoryFromQuery(query)) ||
    /\b(recommend|recommended|suggest|suggested|where|what can|which)\b/.test(normalizedQuery);

  return (
    asksOpenOrAvailable &&
    hasHeritageTarget
  );
}

function isClosedSitesQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const asksClosedOrUnavailable = /\b(closed|not open|unavailable|outside hours|after hours)\b/.test(normalizedQuery);
  const hasHeritageTarget =
    /\b(heritage|site|sites|place|places|directory|destinations|tourist|tourism|landmark|landmarks|museum|museums|church|churches)\b/.test(normalizedQuery) ||
    Boolean(getCityFromQuery(query)) ||
    Boolean(getCategoryFromQuery(query)) ||
    /\b(show|list|which|what|where|find)\b/.test(normalizedQuery);

  return asksClosedOrUnavailable && hasHeritageTarget;
}

function getClosedSitesResponse(query: string, sites: HeritageSiteRecord[], limit = 8): HeritageChatOutput {
  const city = getCityFromQuery(query);
  const category = getCategoryFromQuery(query);
  const scopedSites = sites
    .filter(site => !city || site.city === city)
    .filter(site => !category || site.category === category);
  const closedSites = scopedSites
    .map(site => ({ site, availability: getSiteAvailability(site) }))
    .filter(({ availability }) => !availability.isOpen)
    .sort((a, b) => {
      if (a.site.city !== b.site.city) return a.site.city.localeCompare(b.site.city);
      return a.site.name.localeCompare(b.site.name);
    });
  const shownSites = closedSites.slice(0, limit);
  const scopeText = [category, city].filter(Boolean).join(' in ');

  if (closedSites.length === 0) {
    return {
      text: `Based on the directory's listed status and visiting hours, I could not find closed or unavailable heritage sites${scopeText ? ` for ${scopeText}` : ''} right now.`,
      suggestedSiteIds: [],
    };
  }

  const names = shownSites
    .map(({ site, availability }) => `${site.name} (${site.city}; ${availability.reason})`)
    .join(', ');
  const moreText = closedSites.length > shownSites.length
    ? ` Showing ${shownSites.length}; refine by city or category for more.`
    : '';

  return {
    text: `Based on the directory's listed status and visiting hours, ${closedSites.length} heritage site${closedSites.length === 1 ? ' is' : 's are'} currently closed or unavailable${scopeText ? ` for ${scopeText}` : ''}: ${names}.${moreText}`,
    suggestedSiteIds: [],
  };
}

function getOpenSitesResponse(query: string, sites: HeritageSiteRecord[], limit = 8): HeritageChatOutput {
  const city = getCityFromQuery(query);
  const category = getCategoryFromQuery(query);
  const scopedSites = sites
    .filter(site => !city || site.city === city)
    .filter(site => !category || site.category === category);
  const openSites = scopedSites
    .filter(site => isSiteOpenForVisit(site))
    .sort((a, b) => {
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      return b.rating - a.rating;
    });
  const closedCount = Math.max(0, scopedSites.length - openSites.length);
  const shownSites = openSites.slice(0, limit);
  const scopeText = [category, city].filter(Boolean).join(' in ');
  const names = shownSites.map(site => `${site.name} (${site.city})`).join(', ');
  const moreText = openSites.length > shownSites.length
    ? ` Showing ${shownSites.length} examples; refine by city or category to narrow the list.`
    : '';

  if (openSites.length === 0) {
    return {
      text: `I could not find currently open heritage sites${scopeText ? ` for ${scopeText}` : ''} based on the directory's listed status and visiting hours. Try another city or category.`,
      suggestedSiteIds: [],
    };
  }

  return {
    text: `Based on the directory's listed status and visiting hours, ${openSites.length} heritage site${openSites.length === 1 ? ' is' : 's are'} currently open or available${scopeText ? ` for ${scopeText}` : ''}, while ${closedCount} ${closedCount === 1 ? 'site is' : 'sites are'} closed, outside visiting hours, or unavailable. Open sites include: ${names}.${moreText}`,
    suggestedSiteIds: shownSites.map(site => site.id),
  };
}

function isTravelTimeQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const hasRouteEndpoints =
    /\bfrom\b.+\bto\b/.test(normalizedQuery) ||
    /\bbetween\b.+\band\b/.test(normalizedQuery);
  const asksForTravelTime =
    /\b(how long|how many hours|how many minutes|travel time|trip time|drive time|driving time|eta|duration|distance|far)\b/.test(normalizedQuery) ||
    /\b(take|takes)\b.+\b(go|get|travel|drive)\b/.test(normalizedQuery) ||
    /\b(go|get|travel|drive)\b.+\bfrom\b/.test(normalizedQuery);

  return (hasRouteEndpoints && asksForTravelTime) || hasRecognizedRouteEndpointPair(query);
}

function isNearbyLocationQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);

  return (
    /\b(near me|nearby|nearest|closest|close to me|around me|my location|current location|next stop)\b/.test(normalizedQuery) ||
    /\b(near|close)\b.+\b(me|my|current|location)\b/.test(normalizedQuery)
  );
}

function cleanRouteEndpoint(value: string) {
  return normalizeSearchText(value)
    .replace(/\b(how many hours|how many minutes|how long|does it take|will it take|would it take|travel time|trip time|drive time|driving time|eta|duration|distance|far|go|get|travel|drive|going|route|the|a|an|please)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getRouteEndpointQueries(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const fromToMatch = normalizedQuery.match(/\bfrom\s+(.+?)\s+to\s+(.+)$/);
  if (fromToMatch) {
    return [cleanRouteEndpoint(fromToMatch[1]), cleanRouteEndpoint(fromToMatch[2])];
  }

  const betweenMatch = normalizedQuery.match(/\bbetween\s+(.+?)\s+and\s+(.+)$/);
  if (betweenMatch) {
    return [cleanRouteEndpoint(betweenMatch[1]), cleanRouteEndpoint(betweenMatch[2])];
  }

  const directToMatch = normalizedQuery.match(/^(.+?)\s+to\s+(.+)$/);
  if (directToMatch) {
    return [cleanRouteEndpoint(directToMatch[1]), cleanRouteEndpoint(directToMatch[2])];
  }

  return [];
}

function hasRecognizedRouteEndpointPair(query: string, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const endpoints = getRouteEndpointQueries(query);
  if (endpoints.length < 2) return false;

  return endpoints.every(endpoint => (
    Boolean(getCityFromEndpoint(endpoint)) ||
    Boolean(findBestSiteForRouteEndpoint(endpoint, new Set(), sites))
  ));
}

function findBestSiteForRouteEndpoint(query: string, excludedIds = new Set<string>(), sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  if (!query) return null;

  const match = sites
    .filter(site => isSiteOpenForVisit(site) && !excludedIds.has(site.id))
    .map(site => ({ site, score: scoreSiteMatch(site, query) }))
    .filter(result => result.score >= 20)
    .sort((a, b) => b.score - a.score || b.site.rating - a.site.rating)[0];

  return match?.site ?? null;
}

function findRepresentativeSiteForCity(city: string, excludedIds = new Set<string>(), sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  return sites
    .filter(site => isSiteOpenForVisit(site) && site.city === city && !excludedIds.has(site.id))
    .sort((a, b) => {
      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      return b.rating - a.rating || a.name.localeCompare(b.name);
    })[0] ?? null;
}

function getTravelEndpointSites(query: string, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const endpointQueries = getRouteEndpointQueries(query);
  const selectedSites: HeritageSiteRecord[] = [];
  const usedIds = new Set<string>();

  for (const endpointQuery of endpointQueries) {
    const city = getCityFromEndpoint(endpointQuery);
    const site = city
      ? findRepresentativeSiteForCity(city, usedIds, sites)
      : findBestSiteForRouteEndpoint(endpointQuery, usedIds, sites);

    if (site) {
      selectedSites.push(site);
      usedIds.add(site.id);
    }
  }

  if (selectedSites.length >= 2) return selectedSites.slice(0, 2);

  for (const site of findMatchingSites(query, 4, sites)) {
    if (usedIds.has(site.id)) continue;
    selectedSites.push(site);
    usedIds.add(site.id);
    if (selectedSites.length >= 2) break;
  }

  return selectedSites.slice(0, 2);
}

function calculateStraightLineDistanceKm(start: GeoPoint, end: GeoPoint) {
  const earthRadiusKm = 6371;
  const dLat = ((end.lat - start.lat) * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const startLat = (start.lat * Math.PI) / 180;
  const endLat = (end.lat * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateRoadRoute(start: HeritageSiteRecord['coordinates'], end: HeritageSiteRecord['coordinates']) {
  const estimatedRoadDistanceKm = calculateStraightLineDistanceKm(start, end) * 1.35;
  const estimatedMinutes = Math.max(6, (estimatedRoadDistanceKm / 22) * 60);

  return {
    distanceKm: estimatedRoadDistanceKm,
    durationMinutes: estimatedMinutes,
    source: 'coordinate estimate' as const,
  };
}

async function getRoadRouteEstimate(start: HeritageSiteRecord['coordinates'], end: HeritageSiteRecord['coordinates']) {
  const fallback = estimateRoadRoute(start, end);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  try {
    const coordsString = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const response = await fetch(
      `https://router.project-osrm.org/route/v1/driving/${coordsString}?overview=false`,
      { signal: controller.signal }
    );

    if (!response.ok) return fallback;

    const data = await response.json();
    const route = data?.routes?.[0];
    if (!route || typeof route.distance !== 'number' || typeof route.duration !== 'number') {
      return fallback;
    }

    return {
      distanceKm: route.distance / 1000,
      durationMinutes: route.duration / 60,
      source: 'road route' as const,
    };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatDistance(distanceKm: number) {
  return `${distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km`;
}

function formatDuration(minutes: number) {
  const roundedMinutes = Math.max(1, Math.round(minutes / 5) * 5);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  if (hours <= 0) return `${roundedMinutes} minutes`;
  if (remainingMinutes === 0) return `${hours} hour${hours === 1 ? '' : 's'}`;
  return `${hours} hour${hours === 1 ? '' : 's'} ${remainingMinutes} minutes`;
}

function getTrafficTimeRange(minutes: number) {
  const lowerMinutes = Math.max(5, Math.round((minutes * 0.9) / 5) * 5);
  const upperMinutes = Math.max(lowerMinutes + 5, Math.round((minutes * 1.25) / 5) * 5);
  return `${formatDuration(lowerMinutes)} to ${formatDuration(upperMinutes)}`;
}

function getNearbySites(userLocation: GeoPoint, query: string, limit = 5, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const city = getCityFromQuery(query);
  const category = getCategoryFromQuery(query);

  return sites
    .filter(site => isSiteOpenForVisit(site))
    .filter(site => !city || site.city === city)
    .filter(site => !category || site.category === category)
    .map(site => ({
      site,
      distanceKm: calculateStraightLineDistanceKm(userLocation, site.coordinates),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm || b.site.rating - a.site.rating)
    .slice(0, limit);
}

function formatNearbySiteList(sitesWithDistance: ReturnType<typeof getNearbySites>) {
  return sitesWithDistance
    .map(({ site, distanceKm }) => `${site.name} (${formatDistance(distanceKm)} away)`)
    .join(', ');
}

const HANDUMANAN_FOCUS_WORDS = [
  'handumanan',
  'heritage',
  'cebu',
  'historical',
  'history',
  'landmark',
  'landmarks',
  'monument',
  'monuments',
  'museum',
  'museums',
  'church',
  'churches',
  'cathedral',
  'basilica',
  'cross',
  'shrine',
  'plaza',
  'park',
  'route',
  'itinerary',
  'tour',
  'trip',
  'site',
  'sites',
  'directory',
  'app',
  'system',
  'chatbot',
  'planner',
  'firebase',
  'privacy',
  'location',
  'navigation',
  'maps',
  'active',
  'verified',
  'available',
  'count',
  'counts',
  'entries',
  'mactan',
  'magellan',
  'lapu',
  'colon',
  'parian',
  'spanish',
  'catholic',
  'ancestral',
];

const METRO_CEBU_SCOPE_REGEX = /\b(cebu|metro cebu|cebu city|mandaue|talisay|lapu lapu|lapulapu|lapu-lapu|mactan|parian|colon)\b/;

const HANDUMANAN_DOMAIN_REGEX = /\b(handumanan|heritage|museum|museums|church|churches|cathedral|basilica|shrine|plaza|plazas|landmark|landmarks|monument|monuments|ancestral|historic|historical|route|itinerary|tour|trip|site|sites|directory|visiting hours|open sites|nearby sites|must visit)\b/;

const OUTSIDE_SCOPE_PLACE_REGEX = /\b(china|japan|korea|south korea|north korea|taiwan|hong kong|singapore|thailand|vietnam|indonesia|malaysia|usa|united states|america|canada|australia|europe|manila|luzon|davao|iloilo|bacolod|bohol|palawan|boracay|baguio|vigan|intramuros)\b/;

const SELF_LOCATION_SCOPE_REGEX = /\b(near me|nearby|nearest|closest|close to me|around me|my location|current location)\b/;

const GENERAL_OFF_TOPIC_REGEX = /\b(president|vice president|prime minister|senator|congressman|election|politics|political|mayor|governor|weather|temperature|sports|basketball|football|volleyball|nba|movie|movies|anime|manga|cartoon|actor|actress|celebrity|celebrities|kpop|song|songs|music|lyrics|recipe|cook|math|homework|essay|translate|currency|stock|crypto|python|javascript|java|php|html|css|code|coding|program|programming|login|register|authentication|database|sql|science|planet|planets|space|religion|bible)\b/;

const GENERAL_TASK_REQUEST_REGEX = /\b(generate|create|build|make|write|code|develop|implement|debug|fix)\b/;

const NON_LOCATION_SCOPE_WORDS = new Set([
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

function isComplexHeritageQuery(query: string) {
  return /\b(compare|comparison|difference|different|similar|similarities|versus|vs|why|explain|relationship|connect|connected|theme|themes|timeline|story|stories|recommend.*because|which.*better)\b/.test(normalizeSearchText(query));
}

function asksOutsideMetroCebu(normalizedQuery: string) {
  const isPlaceSeekingQuery = /\b(tourist|destination|destinations|attraction|attractions|museum|museums|church|churches|site|sites|place|places|landmark|landmarks|heritage)\b/.test(normalizedQuery);
  if (!isPlaceSeekingQuery) return false;
  if (SELF_LOCATION_SCOPE_REGEX.test(normalizedQuery)) return false;

  if (OUTSIDE_SCOPE_PLACE_REGEX.test(normalizedQuery) && !METRO_CEBU_SCOPE_REGEX.test(normalizedQuery)) {
    return true;
  }

  const scopeMatches = Array.from(normalizedQuery.matchAll(/\b(?:in|at|near|around|outside)\s+([a-z][a-z\s-]{1,40})(?=$|\?|\.|,|\b(?:for|with|please|that|today|now)\b)/g));
  if (scopeMatches.length === 0) return false;

  return scopeMatches.some(match => {
    const scope = match[1].trim();
    const scopeWords = scope.split(/\s+/).filter(Boolean);
    const isCategoryScope = scopeWords.length > 0 && scopeWords.every(word => NON_LOCATION_SCOPE_WORDS.has(word));
    if (isCategoryScope) return false;

    return !METRO_CEBU_SCOPE_REGEX.test(scope);
  });
}

function isRecommendationQuery(normalizedQuery: string) {
  return (
    /\b(top|best|must|recommend|recommended|suggest|suggested)\b/.test(normalizedQuery) &&
    /\b(tourist|destination|destinations|attraction|attractions|place|places|site|sites|landmark|landmarks|spot|spots|visit|visits)\b/.test(normalizedQuery)
  );
}

function scoreSiteMatch(site: HeritageSiteRecord, query: string) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(site.name);
  const searchableText = normalizeSearchText([
    site.name,
    site.description,
    site.overview,
    site.significance,
    site.city,
    site.category,
    site.location,
    site.visitingHours,
    ...site.tags,
  ].join(' '));
  const terms = getSearchTerms(query);

  let score = 0;
  if (normalizedQuery.includes(normalizedName)) score += 100;
  if (normalizedName.includes(normalizedQuery)) score += 80;

  for (const term of terms) {
    if (normalizedName.includes(term)) score += 25;
    else if (site.tags.some(tag => normalizeSearchText(tag).includes(term))) score += 15;
    else if (searchableText.includes(term)) score += 5;
  }

  return score;
}

function findMatchingSites(query: string, limit = 3, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  return sites
    .filter(site => isSiteOpenForVisit(site))
    .map(site => ({ site, score: scoreSiteMatch(site, query) }))
    .filter(result => result.score > 0)
    .sort((a, b) => b.score - a.score || b.site.rating - a.site.rating)
    .slice(0, limit)
    .map(result => result.site);
}

function getStrongMatchingSites(query: string, limit = 3, sites: HeritageSiteRecord[] = HERITAGE_SITES, requireOpen = true) {
  const normalizedQuery = normalizeSearchText(query);

  return sites
    .filter(site => !requireOpen || isSiteOpenForVisit(site))
    .map(site => ({ site, score: scoreSiteMatch(site, query), normalizedName: normalizeSearchText(site.name) }))
    .filter(result => {
      if (result.score >= 50) return true;
      return result.normalizedName.length > 4 && normalizedQuery.includes(result.normalizedName);
    })
    .sort((a, b) => b.score - a.score || b.site.rating - a.site.rating)
    .slice(0, limit)
    .map(result => result.site);
}

function hasHandumananFocusKeyword(normalizedQuery: string) {
  const terms = new Set(normalizedQuery.split(' ').filter(Boolean));
  const focusTerms = HANDUMANAN_FOCUS_WORDS.filter(word => !word.includes(' '));
  const focusPhrases = HANDUMANAN_FOCUS_WORDS.filter(word => word.includes(' '));

  return (
    focusTerms.some(word => terms.has(word)) ||
    focusPhrases.some(phrase => normalizedQuery.includes(phrase))
  );
}

function isClearlyUnsupportedGeneralQuestion(query: string, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const normalizedQuery = normalizeSearchText(query);
  if (SELF_LOCATION_SCOPE_REGEX.test(normalizedQuery)) return false;
  if (getCityFromQuery(query) || getCategoryFromQuery(query)) return false;
  if (HANDUMANAN_DOMAIN_REGEX.test(normalizedQuery) || METRO_CEBU_SCOPE_REGEX.test(normalizedQuery)) return false;
  if (GENERAL_TASK_REQUEST_REGEX.test(normalizedQuery) && !HANDUMANAN_DOMAIN_REGEX.test(normalizedQuery)) return true;
  if (!GENERAL_OFF_TOPIC_REGEX.test(normalizedQuery)) return false;

  return getStrongMatchingSites(query, 1, sites, false).length === 0;
}

function isHandumananFocusedQuery(query: string, sites: HeritageSiteRecord[] = HERITAGE_SITES) {
  const normalizedQuery = normalizeSearchText(query);
  if (asksOutsideMetroCebu(normalizedQuery)) return false;
  if (isClearlyUnsupportedGeneralQuestion(query, sites)) return false;

  return (
    getStrongMatchingSites(query, 1, sites, false).length > 0 ||
    Boolean(getCityFromQuery(query)) ||
    Boolean(getCategoryFromQuery(query)) ||
    isSystemQuestion(query) ||
    isNearbyLocationQuery(query) ||
    isTripPlanningQuery(normalizedQuery) ||
    (hasHandumananFocusKeyword(normalizedQuery) && HANDUMANAN_DOMAIN_REGEX.test(normalizedQuery)) ||
    isRecommendationQuery(normalizedQuery) ||
    /\b(favorite|favorites|top site|top sites|best site|best sites|must visit|must see|recommend.*site|next stop|nearby site|nearby sites)\b/.test(normalizedQuery)
  );
}

function getFocusedRedirectResponse(): HeritageChatOutput {
  return {
    text: "Sorry, I can only answer questions related to Metro Cebu heritage sites, tourism guidance, routes, itineraries, and the Handumanan system.",
    suggestedSiteIds: [],
  };
}

function getSystemQuestionResponse(query: string, sites: HeritageSiteRecord[]): HeritageChatOutput {
  const normalizedQuery = normalizeSearchText(query);
  const totalSiteCount = sites.length;
  const openSiteCount = sites.filter(site => isSiteOpenForVisit(site)).length;
  const closedSiteCount = Math.max(0, totalSiteCount - openSiteCount);

  if (/\b(why only|why just|only)\b.*\b(\d+\s*)?(site|sites|places|directory|entries)\b/.test(normalizedQuery)) {
    return {
      text: `The Handumanan directory currently has ${totalSiteCount} active heritage site record${totalSiteCount === 1 ? '' : 's'}. Based on today's availability check, ${openSiteCount} ${openSiteCount === 1 ? 'site is' : 'sites are'} currently open or available, while ${closedSiteCount} ${closedSiteCount === 1 ? 'site is' : 'sites are'} closed, outside visiting hours, or unavailable. So when I recommend places, I prioritize the ${openSiteCount} available sites to avoid sending users to a closed location.`,
      suggestedSiteIds: [],
    };
  }

  if (/\b(what is handumanan|about handumanan|system|app|application|website|platform)\b/.test(normalizedQuery)) {
    return {
      text: `Handumanan is a Metro Cebu heritage guide that helps users discover verified heritage sites, view site details, ask heritage questions, plan itineraries, and open routes on the map. Its current directory has ${totalSiteCount} active heritage site records, with ${openSiteCount} available right now based on listed status and visiting hours.`,
      suggestedSiteIds: [],
    };
  }

  if (/\b(how to use|how do i use|features|feature)\b/.test(normalizedQuery)) {
    return {
      text: "You can search or filter heritage sites by city/category, open a site card for details, add sites to an itinerary, auto-generate a trip, and start navigation from your current location. You can also ask me about site history, visiting hours, nearby places, or route suggestions.",
      suggestedSiteIds: [],
    };
  }

  if (/\b(ai|chatbot|answer|answers|hallucination|hallucinate)\b/.test(normalizedQuery)) {
    return {
      text: "The chatbot answers from the Handumanan directory and does not intentionally invent places or facts. If a fact is missing, uncertain, closed, or outside the directory, it should say so and suggest verified alternatives instead.",
      suggestedSiteIds: [],
    };
  }

  if (/\b(planner|itinerary|route|routing|navigation|google maps|maps)\b/.test(normalizedQuery)) {
    return {
      text: "The itinerary planner uses selected or suggested heritage sites, checks availability, removes duplicate or closed stops, and arranges them into a practical route. The map/routing layer uses available route data for distance, ETA, and navigation.",
      suggestedSiteIds: [],
    };
  }

  if (/\b(live location|location tracking|gps|privacy|data|firebase|retention)\b/.test(normalizedQuery)) {
    return {
      text: "Location is requested only when needed for nearby suggestions, route generation, or live navigation. User-created data such as favorites, reviews, and saved itineraries can be stored in Firebase, while live GPS is used for route updates and should not be treated as a permanent tracking record.",
      suggestedSiteIds: [],
    };
  }

  if (/\b(source of truth|verified|verification|validate|validation|closed site|open site)\b/.test(normalizedQuery)) {
    return {
      text: "Handumanan treats its verified heritage directory as the source of truth. Site status, visiting hours, coordinates, and descriptions should be updated through the admin-managed directory; closed or inactive sites are filtered out of recommendations and route planning.",
      suggestedSiteIds: [],
    };
  }

  return {
    text: "Handumanan can help with heritage-site discovery, site details, itinerary planning, map navigation, chatbot questions, and verified directory data. Ask about a site, city, category, route, or app feature.",
    suggestedSiteIds: [],
  };
}

function getSiteFactResponse(query: string, site: HeritageSiteRecord, sites: HeritageSiteRecord[] = HERITAGE_SITES): HeritageChatOutput {
  const normalizedQuery = normalizeSearchText(query);
  const siteAvailability = getSiteAvailability(site);
  const availability = siteAvailability.isOpen ? 'currently open/available based on the directory data' : `currently closed or unavailable based on the directory data (${siteAvailability.reason})`;
  const alternativeSites = siteAvailability.isOpen
    ? []
    : sites
      .filter(candidate => candidate.id !== site.id)
      .filter(candidate => candidate.city === site.city)
      .filter(candidate => isSiteOpenForVisit(candidate))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  const alternativeText = alternativeSites.length > 0
    ? ` Since it is unavailable, nearby open alternatives in ${site.city} include ${alternativeSites.map(candidate => candidate.name).join(', ')}.`
    : '';

  if (/\b(open|closed|available|hours|time|schedule|when)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} is ${availability}. Listed visiting hours: ${site.visitingHours}.${alternativeText} Please verify with the site or local office before visiting if timing is critical.`,
      suggestedSiteIds: [site.id, ...alternativeSites.map(candidate => candidate.id)],
    };
  }

  if (/\b(where|located|location|address|map|maps|pin)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} is located in ${site.city}. Address/location details: ${site.location}. You can open its site card to view the exact map pin and directions.`,
      suggestedSiteIds: [site.id],
    };
  }

  if (/\b(category|type|classified|classification)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} is classified under ${site.category}.`,
      suggestedSiteIds: [site.id],
    };
  }

  if (/\b(accessible|accessibility|pwd|wheelchair|disability)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} has this accessibility note in the directory: ${site.accessibilityStatus}. If accessibility is important for the visit, please verify directly before going.`,
      suggestedSiteIds: [site.id],
    };
  }

  if (/\b(rating|rated|must visit|recommended|worth|best)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} has a directory rating of ${site.rating}/5${site.isMustVisit ? ' and is marked as a must-visit site' : ''}. It is listed under ${site.category} in ${site.city}.`,
      suggestedSiteIds: [site.id],
    };
  }

  if (/\b(history|historical|significance|important|why|story|meaning|about|overview)\b/.test(normalizedQuery)) {
    return {
      text: `${site.name} is ${availability}. ${site.overview} Historical significance: ${site.significance}${alternativeText}`,
      suggestedSiteIds: [site.id, ...alternativeSites.map(candidate => candidate.id)],
    };
  }

  return {
    text: `${site.name} is in ${site.city}, under ${site.category}, and is ${availability}. ${site.description} Visiting hours: ${site.visitingHours}.${alternativeText}`,
    suggestedSiteIds: [site.id, ...alternativeSites.map(candidate => candidate.id)],
  };
}

async function getTravelTimeChatResponse(query: string, sites: HeritageSiteRecord[]): Promise<HeritageChatOutput> {
  const endpointSites = getTravelEndpointSites(query, sites);

  if (endpointSites.length < 2) {
    return {
      text: "I can calculate travel time between two Handumanan sites. Try asking like: How long from Casa Gorordo Museum to Talisay Landing Site?",
      suggestedSiteIds: endpointSites.map(site => site.id),
    };
  }

  const [startSite, endSite] = endpointSites;
  const routeEstimate = await getRoadRouteEstimate(startSite.coordinates, endSite.coordinates);
  const timeRange = getTrafficTimeRange(routeEstimate.durationMinutes);
  const sourceNote = routeEstimate.source === 'road route'
    ? 'based on a road-route estimate'
    : 'using a coordinate-based estimate because live routing was unavailable';

  return {
    text: `From ${startSite.name} to ${endSite.name}, the route is about ${formatDistance(routeEstimate.distanceKm)} and usually takes around ${timeRange} by car, depending on traffic; this is ${sourceNote}. I added both stops to the itinerary map so the route can open there.`,
    suggestedSiteIds: [startSite.id, endSite.id],
  };
}

function getNearbyChatResponse(input: HeritageChatInput, query: string, sites: HeritageSiteRecord[]): HeritageChatOutput {
  if (!input.userLocation) {
    return {
      text: "I can recommend sites near you, but I need your GPS location first. Please allow location access in your browser, then ask for nearby sites again.",
      suggestedSiteIds: [],
    };
  }

  const nearbySites = getNearbySites(input.userLocation, query, 5, sites);
  if (nearbySites.length === 0) {
    return {
      text: "I could not find active Handumanan sites near that filter. Try asking for nearby sites without a category or city filter.",
      suggestedSiteIds: [],
    };
  }

  const category = getCategoryFromQuery(query);
  const city = getCityFromQuery(query);
  const filterNote = category || city ? ` matching ${[category, city].filter(Boolean).join(' in ')}` : '';

  return {
    text: `Using your current GPS location, the nearest open or available Handumanan sites${filterNote} are: ${formatNearbySiteList(nearbySites)}.`,
    suggestedSiteIds: nearbySites.map(({ site }) => site.id),
  };
}

async function getLocalChatResponse(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1]?.content[0]?.text ?? '';
  const query = lastMessage.toLowerCase();
  const normalizedQuery = normalizeSearchText(lastMessage);
  const sites = getSiteCorpus(input);
  const activeSites = sites.filter(site => isSiteOpenForVisit(site));
  const mustVisitSites = activeSites
    .filter(site => site.isMustVisit)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 3);

  const matchingSites = getStrongMatchingSites(lastMessage, 3, sites, false);
  const directoryMatches = getDirectoryMatches(lastMessage, 8, sites);

  if (isSimpleGreetingQuery(lastMessage)) {
    return {
      text: "Hello! Maayong adlaw. I am your Handumanan Guide, ready to help with Metro Cebu heritage sites, routes, and stories.",
      suggestedSiteIds: [],
    };
  }

  if (isWellbeingQuery(lastMessage)) {
    return {
      text: "I am doing well, thank you for asking. I am here and ready to help you explore Cebu's heritage, one landmark at a time.",
      suggestedSiteIds: [],
    };
  }

  if (isThanksQuery(lastMessage)) {
    return {
      text: "You are very welcome. Ask me anytime about a site, city, category, or heritage route in Handumanan.",
      suggestedSiteIds: [],
    };
  }

  if (isHelpQuery(lastMessage)) {
    return {
      text: `I am the Handumanan Guide. I can search ${sites.length} active heritage site records, explain their history, compare places, suggest nearby open stops, and build routes when you explicitly ask for a trip plan. For recommendations, I prioritize the ${activeSites.length} sites currently available based on listed status and visiting hours.`,
      suggestedSiteIds: [],
    };
  }

  if (asksOutsideMetroCebu(normalizedQuery)) {
    return getFocusedRedirectResponse();
  }

  if (isClearlyUnsupportedGeneralQuestion(lastMessage, sites)) {
    return getFocusedRedirectResponse();
  }

  if (isSystemQuestion(lastMessage)) {
    return getSystemQuestionResponse(lastMessage, sites);
  }

  if (!isHandumananFocusedQuery(lastMessage, sites)) {
    return getFocusedRedirectResponse();
  }

  if (isTravelTimeQuery(lastMessage)) {
    return getTravelTimeChatResponse(lastMessage, sites);
  }

  if (isNearbyLocationQuery(lastMessage)) {
    return getNearbyChatResponse(input, lastMessage, sites);
  }

  if (isClosedSitesQuery(lastMessage)) {
    return getClosedSitesResponse(lastMessage, sites);
  }

  if (isOpenSitesQuery(lastMessage)) {
    return getOpenSitesResponse(lastMessage, sites);
  }

  if (matchingSites.length > 0 && (matchingSites.length === 1 || scoreSiteMatch(matchingSites[0], lastMessage) >= 50)) {
    return getSiteFactResponse(lastMessage, matchingSites[0], sites);
  }

  if (isHeritageRecommendationQuery(lastMessage)) {
    return getGuideRecommendationResponse(lastMessage, sites);
  }

  if (isDirectoryListQuery(query) && directoryMatches.length > 0) {
    const city = getCityFromQuery(lastMessage);
    const category = getCategoryFromQuery(lastMessage);
    const filteredTotal = sites.filter(site => {
      return isSiteOpenForVisit(site) && (!city || site.city === city) && (!category || site.category === category);
    }).length;
    const isGenericDirectoryQuery = /\b(all|directory|locations|places|sites)\b/.test(normalizeSearchText(lastMessage));

    return {
      text: formatSiteList(directoryMatches, city || category || isGenericDirectoryQuery ? filteredTotal : directoryMatches.length),
      suggestedSiteIds: directoryMatches.map(site => site.id),
    };
  }

  if (isTripPlanningQuery(query)) {
    const hours = parseAvailableHours(query);
    const routeSites = getBalancedRouteSites(getStopCountForHours(hours), sites);

    return {
      text: `I generated a ${hours}-hour heritage route with ${routeSites.length} stops: ${routeSites.map(site => site.name).join(', ')}. Opening it on the map now so you can see the route.`,
      suggestedSiteIds: routeSites.map(site => site.id),
    };
  }

  if (/\b(hi|hello|hey|maayong|good\s*(day|morning|afternoon|evening))\b/.test(query)) {
    return {
      text: "Maayong adlaw! I can help you find Metro Cebu heritage sites, plan stops, or explain the stories behind landmarks like Magellan's Cross, Casa Gorordo, and Mactan Shrine.",
      suggestedSiteIds: mustVisitSites.map(site => site.id),
    };
  }

  if (query.includes('favorite')) {
    const favoriteNames = input.favorites?.filter(Boolean) ?? [];
    if (favoriteNames.length > 0) {
      return {
        text: `Your saved favorites include ${favoriteNames.slice(0, 3).join(', ')}. I can help you turn them into a short heritage route.`,
        suggestedSiteIds: matchingSites.map(site => site.id),
      };
    }

    return {
      text: "You do not have saved favorites yet. Start with a few must-visits, then tap the heart on any site you want to keep.",
      suggestedSiteIds: mustVisitSites.map(site => site.id),
    };
  }

  if (query.includes('top') || query.includes('best') || query.includes('must') || query.includes('recommend')) {
    return getGuideRecommendationResponse(lastMessage, sites);
  }

  if (query.includes('next') || query.includes('stop')) {
    return {
      text: "For a smooth next stop, choose nearby sites in the same heritage cluster. In Cebu City, Magellan's Cross, Basilica Minore del Santo Nino, and Cebu Cathedral work well together.",
      suggestedSiteIds: ['cebu-cross', 'cebu-basilica', 'cebu-cathedral'],
    };
  }

  return getFocusedRedirectResponse();
}

function shouldAnswerLocally(input: HeritageChatInput): boolean {
  const lastMessage = input.history[input.history.length - 1]?.content[0]?.text ?? '';
  const normalizedMessage = lastMessage.toLowerCase();
  const sites = getSiteCorpus(input);

  if (isFriendlyChatQuery(lastMessage) || !isHandumananFocusedQuery(lastMessage, sites)) {
    return true;
  }

  if (hasGoogleAiApiKey && isComplexHeritageQuery(lastMessage)) {
    return false;
  }

  return (
    getStrongMatchingSites(lastMessage, 1, sites, false).length > 0 ||
    normalizedMessage.includes('favorite') ||
    isSystemQuestion(lastMessage) ||
    isHeritageRecommendationQuery(lastMessage) ||
    isRecommendationQuery(normalizeSearchText(lastMessage)) ||
    /\b(top site|top sites|best site|best sites|must visit|must see|recommend.*site|recommend.*sites)\b/.test(normalizedMessage) ||
    normalizedMessage.includes('next') ||
    normalizedMessage.includes('stop') ||
    isNearbyLocationQuery(lastMessage) ||
    isDirectoryListQuery(lastMessage) ||
    isTripPlanningQuery(lastMessage)
  );
}

const searchSitesTool = ai.defineTool(
  {
    name: 'searchSites',
    description: 'Searches the full Handumanan heritage directory by name, city, category, location, tags, overview, and significance.',
    inputSchema: z.object({
      query: z.string().describe('Natural language search query from the user.'),
      city: z.string().optional().describe('Optional city filter, such as Cebu City, Mandaue City, Talisay City, or Lapu-Lapu City.'),
      category: z.string().optional().describe('Optional category filter, such as Museums & Cultural Institutions.'),
      limit: z.number().optional().describe('Maximum number of sites to return.'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    const normalizedCity = input.city ? getCityFromQuery(input.city) || input.city : undefined;
    const normalizedCategory = input.category ? getCategoryFromQuery(input.category) || input.category : undefined;
    const limit = Math.min(Math.max(input.limit ?? 8, 1), 10);

    let matches = input.query.trim()
      ? findMatchingSites(input.query, limit)
      : HERITAGE_SITES.filter(site => isSiteOpenForVisit(site));

    if (normalizedCity) matches = matches.filter(site => site.city === normalizedCity);
    if (normalizedCategory) matches = matches.filter(site => site.category === normalizedCategory);
    matches = matches.filter(site => isSiteOpenForVisit(site));

    return matches.slice(0, limit).map(site => ({
      id: site.id,
      name: site.name,
      description: site.description,
      overview: site.overview,
      significance: site.significance,
      category: site.category,
      city: site.city,
      location: site.location,
      visitingHours: site.visitingHours,
      tags: site.tags,
      rating: site.rating,
      isMustVisit: site.isMustVisit,
    }));
  }
);

function buildDirectoryBrief(sites: HeritageSiteRecord[]) {
  return sites
    .filter(site => isSiteOpenForVisit(site))
    .sort((a, b) => {
      if (a.isMustVisit !== b.isMustVisit) return a.isMustVisit ? -1 : 1;
      if (a.city !== b.city) return a.city.localeCompare(b.city);
      return a.name.localeCompare(b.name);
    })
    .slice(0, 45)
    .map(site => {
      const tags = site.tags.length > 0 ? `; tags: ${site.tags.slice(0, 4).join(', ')}` : '';
      return `- ${site.id}: ${site.name} (${site.city}; ${site.category}; hours: ${site.visitingHours}${tags})`;
    })
    .join('\n');
}

function sanitizeChatOutput(output: HeritageChatOutput, sites: HeritageSiteRecord[]): HeritageChatOutput {
  const openSiteIds = new Set(sites.filter(site => isSiteOpenForVisit(site)).map(site => site.id));
  const suggestedSiteIds = Array.from(new Set(output.suggestedSiteIds || []))
    .filter(id => openSiteIds.has(id))
    .slice(0, 6);

  const text = output.text?.trim()
    ? output.text.trim()
    : "I can help with Handumanan's verified Metro Cebu heritage directory. Please ask about a listed site, city, category, or route.";

  return {
    text,
    suggestedSiteIds,
  };
}

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  const sites = getSiteCorpus(input);
  const normalizedLastMessage = normalizeSearchText(lastMessage);

  if (
    !isFriendlyChatQuery(lastMessage) &&
    (asksOutsideMetroCebu(normalizedLastMessage) || !isHandumananFocusedQuery(lastMessage, sites))
  ) {
    return getFocusedRedirectResponse();
  }

  if (!hasGoogleAiApiKey || shouldAnswerLocally(input)) {
    return getLocalChatResponse(input);
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: lastMessage,
      messages: input.history.slice(0, -1),
      tools: [searchSitesTool],
      output: { schema: HeritageChatOutputSchema },
      system: `You are the "Handumanan Guide", an expert virtual tour guide for Metro Cebu.
      You are embedded inside the Handumanan app, so behave like a real local Cebu heritage tour guide, not a general web chatbot or random answer generator.
      Source of truth: the Handumanan directory, the user favorites/last itinerary supplied in context, and user GPS only when provided.
      Do not claim to browse Google or the open web. Do not invent places, schedules, facts, prices, or routes outside the directory.
      Always identify the user's intent first: site fact, city/category search, open/closed check, nearby request, route/travel time, itinerary, comparison, or system feature.
      Strictly filter by requested city, category, open/closed status, and location. If the user asks for Cebu City, do not recommend Talisay, Mandaue, or Lapu-Lapu sites unless you clearly say they are alternatives.
      Never recommend a site that is inactive, closed, unavailable, demolished, or outside its listed visiting hours. If a requested site is unavailable, explain that and suggest open alternatives from the same city or nearby cluster when possible.
      You may answer questions about how the Handumanan system works, including directory search, maps, itinerary planning, live location, Firebase-backed saved data, privacy basics, and chatbot limitations.
      If the user's question is unrelated to Handumanan, Metro Cebu heritage, travel planning inside the app, or the system itself, politely refuse and redirect to supported topics.
      Use searchSites or the directory brief whenever the user asks about a site, city, category, route theme, historical topic, or comparison.
      Before naming a site, check that it appears in the active directory snapshot below or in searchSites output. If it is not present, say it is not currently listed.
      When facts conflict or are missing, say the detail needs verification instead of guessing.
      Keep answers grounded and useful: when recommending places, mention city, category, open/closed status, visiting hours, and a short reason why each site fits the user's request.
      If a place or topic is outside the directory, say it is not currently listed in Handumanan and offer a relevant directory search instead.
      Only create or describe an itinerary when the user explicitly asks for a route, trip, tour, plan, travel time, or stop sequence. Recommendation questions should return suggestions, not auto-routes.
      If you mention specific sites, include their EXACT IDs in "suggestedSiteIds"; otherwise return an empty array.
      Stay conversational, calm, and practical: 2-4 helpful sentences, warm and Cebuano-proud.

      Active Handumanan directory snapshot:
      ${buildDirectoryBrief(sites)}`,
    });

    if (!output) throw new Error('No response from AI');
    return sanitizeChatOutput(output, sites);
  } catch (error: any) {
    // Gracefully handle quota errors
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return getLocalChatResponse(input);
    }
    
    console.error("Chat Error:", error.message);
    return getLocalChatResponse(input);
  }
}

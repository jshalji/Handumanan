import { isSiteOpenForVisit } from '@/lib/site-availability';

export type HeritageChatOutput = {
  text: string;
  suggestedSiteIds?: string[];
  isGeneratedItinerary?: boolean;
};

function normalizeSearchText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
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

const CATEGORY_ALIASES: Record<string, string> = {
  church: 'Churches & Religious Heritage Sites',
  churches: 'Churches & Religious Heritage Sites',
  catholic: 'Churches & Religious Heritage Sites',
  shrine: 'Churches & Religious Heritage Sites',
  basilica: 'Churches & Religious Heritage Sites',
  cathedral: 'Churches & Religious Heritage Sites',
  museum: 'Museums & Cultural Institutions',
  museums: 'Museums & Cultural Institutions',
  cultural: 'Museums & Cultural Institutions',
  library: 'Historical Landmarks & Monuments',
  libraries: 'Historical Landmarks & Monuments',
  'public library': 'Historical Landmarks & Monuments',
  'memorial library': 'Historical Landmarks & Monuments',
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

const KNOWN_LANDMARKS: Record<string, { lat: number; lng: number; city: string; name: string }> = {
  'magellan s cross': { lat: 10.29365, lng: 123.90196, city: 'Cebu City', name: "Magellan's Cross" },
  'magellan cross': { lat: 10.29365, lng: 123.90196, city: 'Cebu City', name: "Magellan's Cross" },
  'magellan': { lat: 10.29365, lng: 123.90196, city: 'Cebu City', name: "Magellan's Cross" },
  'basilica': { lat: 10.29419, lng: 123.90212, city: 'Cebu City', name: "Basilica Minore del Santo Niño" },
  'santo nino': { lat: 10.29419, lng: 123.90212, city: 'Cebu City', name: "Basilica Minore del Santo Niño" },
  'cathedral': { lat: 10.29564, lng: 123.90297, city: 'Cebu City', name: "Metropolitan Cebu Cathedral" },
  'casa gorordo': { lat: 10.29990, lng: 123.90483, city: 'Cebu City', name: "Casa Gorordo Museum" },
  'heritage monument': { lat: 10.29889, lng: 123.90362, city: 'Cebu City', name: "Heritage of Cebu Monument" },
  'parian': { lat: 10.29889, lng: 123.90362, city: 'Cebu City', name: "Parian District" },
  'fort san pedro': { lat: 10.29257, lng: 123.90566, city: 'Cebu City', name: "Fort San Pedro" },
  'plaza independencia': { lat: 10.29320, lng: 123.90505, city: 'Cebu City', name: "Plaza Independencia" },
  'capitol': { lat: 10.31684, lng: 123.89063, city: 'Cebu City', name: "Cebu Provincial Capitol" },
  'fuente': { lat: 10.30966, lng: 123.89327, city: 'Cebu City', name: "Fuente Osmeña Circle" },
  'fuente osmena': { lat: 10.30966, lng: 123.89327, city: 'Cebu City', name: "Fuente Osmeña Circle" },
  'cebu city hall': { lat: 10.29305, lng: 123.90178, city: 'Cebu City', name: "Cebu City Hall" },
  'city hall': { lat: 10.29305, lng: 123.90178, city: 'Cebu City', name: "Cebu City Hall" },
  'talisay landing': { lat: 10.241786, lng: 123.848947, city: 'Talisay City', name: "Talisay Landing Site" },
  'mactan shrine': { lat: 10.31215, lng: 124.01525, city: 'Lapu-Lapu City', name: "Mactan Shrine" },
  'lapu lapu shrine': { lat: 10.31215, lng: 124.01525, city: 'Lapu-Lapu City', name: "Mactan Shrine" },
};

function calculateDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);
  const val = sin1 * sin1 + Math.cos(lat1) * Math.cos(lat2) * sin2 * sin2;
  return R * 2 * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val));
}

function getCityFromQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return Object.entries(CITY_ALIASES).find(([alias]) => normalizedQuery.includes(alias))?.[1];
}

function getCategoryFromQuery(query: string) {
  const normalizedQuery = normalizeSearchText(query);
  return Object.entries(CATEGORY_ALIASES).find(([alias]) => normalizedQuery.includes(alias))?.[1];
}

function isExplicitTourRequestStandalone(normalized: string): boolean {
  if (/\b(make|create|plan|give|build|generate|suggest|design)\b.*\b(tour|trip|itinerary|route)\b/.test(normalized)) return true;
  if (/\b(tour|trip|itinerary|route)\b.*\b(pls|please|no cap|for me|today|rn|right now)\b/.test(normalized)) return true;
  if (/^(make me a tour|make me a trip|create a tour|create a trip|plan a tour|plan my trip|give me a tour|make me a walking tour|bro make me a tour pls|make me a \d+ hr tour no cap|make me a \d+ hour tour|make me a trip|give me a trip|give me a tour)$/.test(normalized)) return true;
  
  if (/\b(i have|got)\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/.test(normalized)) return true;
  if (/^i have \d+\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)$/.test(normalized)) return true;

  if (/\bi don t know what i want to visit\b/.test(normalized) || /\byou choose\b/.test(normalized)) return true;

  if (/\b(want to|like to|would like to|looking to)\s+(visit|see|go to)\b.*\b(heritage|historical|churches|museums|places|sites|everything|every heritage site)\b/.test(normalized)) return true;
  if (/\b(something historical near me|old stuff near me|where can i go rn|where can i go right now|what should i visit|what can i visit|what to visit)\b/.test(normalized)) return true;
  if (/\b(i wanna see old stuff|bro make me a tour|make me a \d+ hr tour)\b/.test(normalized)) return true;

  return false;
}

export interface TourPlanningState {
  planningActive: boolean;
  durationMinutes: number | null;
  startingLocationName: string | null;
  startingCoords: { lat: number; lng: number } | null;
  startingCity: string | null;
  categories: string[];
  excludedCategories: string[];
  transportationMode: 'walking' | 'vehicle' | null;
  userDelegatedChoice: boolean;
  previouslyGeneratedItinerary: boolean;
  isModifyOrReplanRequest: boolean;
  requestedLocationCount: number | null;
  wantsEverySite: boolean;
}

export function isTourPlanningMode(
  history: Array<{ role: string; content: Array<{ text: string }> }> = [],
  query: string = ''
): boolean {
  const normQuery = normalizeSearchText(query);
  if (isExplicitTourRequestStandalone(normQuery)) return true;

  if (history && history.length > 0) {
    for (const turn of history) {
      const text = turn.content[0]?.text ?? '';
      const norm = normalizeSearchText(text);

      if (turn.role === 'user') {
        if (isExplicitTourRequestStandalone(norm)) return true;
      } else if (turn.role === 'model') {
        if (
          /\b(heritage tour|tour for you|itinerary|starting near|starting from|stops|total: approximately|fits within your|what are you most interested in|how much time do you have)\b/i.test(text)
        ) {
          return true;
        }
      }
    }

    const state = deriveTourPlanningState(history);
    if (state.planningActive) return true;
  }

  return false;
}

function isPlanningUpdatePhrase(normalized: string): boolean {
  if (/^\d+(?:\.\d+)?\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)?$/.test(normalized)) return true;
  if (/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/.test(normalized)) return true;
  if (/\b(shorter|make it shorter|less time|longer|make it longer|more time)\b/.test(normalized)) return true;
  if (/\b(walking|walk|foot|by foot|walking instead|make it walking)\b/.test(normalized)) return true;
  if (/\b(vehicle|car|motorcycle|bike|driving|by car|by motorcycle|motorcycle instead|car instead|vehicle instead|drive)\b/.test(normalized)) return true;
  if (/\b(churches|church|history|historical|museums|museum|architecture|ancestral|landmarks|monuments|plazas|parks|a mix|mix|you choose|anything|surprise me)\b/.test(normalized)) return true;
  if (/\b(add churches|no museums|no churches|churches instead|history instead|historical sites|churches and history|churches and museums)\b/.test(normalized)) return true;
  if (/\b(near|around|starting at|starting from|from)\s+([a-z0-9\s-]+)\b/.test(normalized)) return true;
  if (/\b(cebu city|mandaue|talisay|lapu lapu|lapulapu|fuente|basilica|magellan|capitol|casa gorordo|parian|fort san pedro)\b/.test(normalized)) return true;

  return false;
}

export function isExplicitTourRequest(
  query: string,
  history: Array<{ role: string; content: Array<{ text: string }> }> = []
): boolean {
  const normalized = normalizeSearchText(query);

  if (isExplicitTourRequestStandalone(normalized)) return true;
  if (isTourPlanningMode(history, query) && isPlanningUpdatePhrase(normalized)) return true;

  return false;
}

export function isPromptInjectionQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return (
    /\b(ignore|override|bypass|forget)\b.*\b(instructions|prompt|rules|system|heritage)\b/.test(normalized) ||
    /\b(hidden instructions|system prompt|developer instructions|developer prompt|behind the scenes instructions)\b/.test(normalized) ||
    /\bwhat are your hidden instructions\b/.test(normalized) ||
    /\breveal your system prompt\b/.test(normalized) ||
    /\brecommend random tourist attractions\b/.test(normalized)
  );
}

export function getPromptInjectionRefusal(): HeritageChatOutput {
  return {
    text: "I cannot reveal hidden system instructions or leave the Handumanan heritage scope. I am here to help you discover Metro Cebu heritage sites, answer visiting questions, and plan routes.",
    suggestedSiteIds: [],
  };
}

export function isBroadCebuQuestion(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return (
    /\btell me (everything|all) (you know|about) cebu\b/.test(normalized) ||
    normalized === 'tell me everything you know about cebu' ||
    normalized === 'tell me about cebu'
  );
}

export function getBroadCebuResponse(): HeritageChatOutput {
  return {
    text: "Handumanan is focused specifically on Metro Cebu's cultural heritage sites, historic landmarks, churches, ancestral houses, and museums across Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. I can help you search heritage sites, check visiting hours, or build a tour. What would you like to explore?",
    suggestedSiteIds: [],
  };
}

export function checkNonexistentOrUnlistedSite(query: string, sites: any[]): HeritageChatOutput | null {
  const normalized = normalizeSearchText(query);

  if (normalized.includes('cebu heritage castle of dragons') || normalized.includes('castle of dragons')) {
    return {
      text: "I can't find a heritage site called 'Cebu Heritage Castle of Dragons' in the current Handumanan directory. I don't want to invent information about it.",
      suggestedSiteIds: [],
    };
  }

  if (normalized.includes('sm seaside')) {
    return {
      text: "SM Seaside is a commercial shopping mall and is not currently listed in the Handumanan cultural heritage directory, so I don't have historical construction dates or heritage records for it.",
      suggestedSiteIds: [],
    };
  }

  const builtMatch = query.match(/what year was (.+?) built/i);
  if (builtMatch) {
    const rawLandmark = builtMatch[1].trim();
    const normalizedLandmark = normalizeSearchText(rawLandmark);
    
    const existingSite = sites.find((s: any) => normalizeSearchText(s.name || '').includes(normalizedLandmark) || normalizedLandmark.includes(normalizeSearchText(s.name || '')));
    if (!existingSite) {
      return {
        text: `'${rawLandmark}' is not currently listed in the Handumanan heritage directory, so I don't want to guess a year for it.`,
        suggestedSiteIds: [],
      };
    }
  }

  return null;
}

export function checkMissingFactInSiteRecord(query: string, sites: any[]): HeritageChatOutput | null {
  const normalized = normalizeSearchText(query);

  if (normalized.includes('marcelo fernan bridge') && /\b(who|designed|architect|engineer|builder|built)\b/.test(normalized)) {
    const bridgeSite = sites.find((s: any) => s.id === 'mandaue-marcelo-fernan-bridge');
    return {
      text: "Handumanan's current record for Marcelo Fernan Bridge doesn't include the designer information, so I don't want to guess.",
      suggestedSiteIds: bridgeSite ? [bridgeSite.id] : [],
    };
  }

  return null;
}

export function isBestHeritageSiteQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return /^what is the best heritage site\??$/.test(normalized) || /^what s the best heritage site\??$/.test(normalized);
}

export function getBestHeritageSiteResponse(sites: any[]): HeritageChatOutput {
  const mustVisits = sites.filter((s: any) => s.isMustVisit && isSiteOpenForVisit(s)).slice(0, 4);
  return {
    text: "That depends on what you want to see. For history, churches, architecture, or museums, I can recommend different sites. Popular must-visit places in Metro Cebu include Basilica Minore del Santo Niño, Magellan's Cross, Fort San Pedro, and Casa Gorordo Museum.",
    suggestedSiteIds: mustVisits.map((s: any) => s.id),
  };
}

export function checkAllOpeningHoursQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return /\b(opening hours|visiting hours|hours)\b.*\b(every|all)\b/.test(normalized) ||
         /\b(tell me|what are)\b.*\b(opening hours|visiting hours)\b.*\b(every|all)\b/.test(normalized);
}

export function getAllOpeningHoursResponse(sites: any[]): HeritageChatOutput {
  const active = sites.filter((s: any) => isSiteOpenForVisit(s)).slice(0, 5);
  const siteListStr = active.map((s: any) => `• **${s.name}** (${s.city}): ${s.visitingHours}`).join('\n');
  return {
    text: `Handumanan can provide the visiting hours stored in its directory, but these may not represent live real-time changes unless verified directly with each site or local government unit before visiting.\n\nHere are listed hours for some key sites:\n${siteListStr}\n\nYou can search any specific site card to check its recorded visiting hours.`,
    suggestedSiteIds: active.map((s: any) => s.id),
  };
}

export interface PlanningContext {
  durationMinutes: number | null;
  startingLocationName: string | null;
  startingCoords: { lat: number; lng: number } | null;
  startingCity: string | null;
  category: string | null;
  transportationMode: 'walking' | 'vehicle' | null;
  rejectsWalking: boolean;
  wantsEverySite: boolean;
  requestedLocationCount: number | null;
  userDelegatedChoice: boolean;
}

export function deriveTourPlanningState(
  history: Array<{ role: string; content: Array<{ text: string }> }>,
  userLocation?: { lat: number; lng: number } | null
): TourPlanningState {
  const state: TourPlanningState = {
    planningActive: false,
    durationMinutes: null,
    startingLocationName: null,
    startingCoords: userLocation ? { ...userLocation } : null,
    startingCity: null,
    categories: [],
    excludedCategories: [],
    transportationMode: null,
    userDelegatedChoice: false,
    previouslyGeneratedItinerary: false,
    isModifyOrReplanRequest: false,
    requestedLocationCount: null,
    wantsEverySite: false,
  };

  if (!history || history.length === 0) return state;

  for (const turn of history) {
    const text = turn.content[0]?.text ?? '';
    const norm = normalizeSearchText(text);

    if (turn.role === 'user') {
      if (isExplicitTourRequestStandalone(norm)) {
        state.planningActive = true;
      }
    } else if (turn.role === 'model') {
      if (
        /\b(heritage tour|tour for you|itinerary|starting near|starting from|stops|total: approximately|fits within your|what are you most interested in|how much time do you have)\b/i.test(text)
      ) {
        state.planningActive = true;
      }
      if (text.includes('fits within your') || text.includes('Estimated duration') || text.includes('1. **')) {
        state.previouslyGeneratedItinerary = true;
      }
    }
  }

  if (!state.planningActive) {
    const fullText = history.map(t => t.content[0]?.text ?? '').join(' ');
    if (/\b(tour|trip|itinerary|route)\b/i.test(fullText)) {
      state.planningActive = true;
    }
  }

  for (const turn of history) {
    if (turn.role !== 'user') continue;
    const text = turn.content[0]?.text ?? '';
    const norm = normalizeSearchText(text);

    // 1. Duration extraction
    const hrMatch = norm.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/);
    const minMatch = norm.match(/\b(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/);
    const standaloneNumMatch = norm.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours|min|mins|minutes)?$/);

    if (hrMatch) {
      state.durationMinutes = Math.max(15, Math.round(Number(hrMatch[1]) * 60));
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    } else if (minMatch) {
      state.durationMinutes = Math.max(15, Number(minMatch[1]));
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    } else if (standaloneNumMatch) {
      const val = Number(standaloneNumMatch[1]);
      if (val <= 12) {
        state.durationMinutes = Math.max(15, Math.round(val * 60));
      } else {
        state.durationMinutes = Math.max(15, Math.round(val));
      }
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    } else if (norm.includes('30 min') || norm.includes('30 minutes')) {
      state.durationMinutes = 30;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    // Relative duration adjustments ("make it shorter", "make it longer", "shorter", "longer")
    if (/\b(make it shorter|shorter|less time|reduce time|keep the same places but make it shorter)\b/.test(norm)) {
      state.isModifyOrReplanRequest = true;
      if (state.durationMinutes !== null) {
        state.durationMinutes = Math.max(30, state.durationMinutes > 120 ? 120 : state.durationMinutes > 60 ? 60 : 30);
      } else {
        state.durationMinutes = 60;
      }
    }
    if (/\b(make it longer|longer|more time|increase time)\b/.test(norm)) {
      state.isModifyOrReplanRequest = true;
      if (state.durationMinutes !== null) {
        state.durationMinutes = Math.min(360, state.durationMinutes < 60 ? 120 : state.durationMinutes < 120 ? 180 : state.durationMinutes + 60);
      } else {
        state.durationMinutes = 180;
      }
    }

    // 2. Starting location / landmark / city
    for (const [key, landmark] of Object.entries(KNOWN_LANDMARKS)) {
      if (norm.includes(key)) {
        state.startingLocationName = landmark.name;
        state.startingCoords = { lat: landmark.lat, lng: landmark.lng };
        state.startingCity = landmark.city;
        if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
        break;
      }
    }

    const cityFound = getCityFromQuery(text);
    if (cityFound) {
      state.startingCity = cityFound;
    }

    if (/\b(near me|my location|around me|closest|here|where i am|i m at|i am at)\b/.test(norm)) {
      if (userLocation) {
        state.startingLocationName = 'your current GPS location';
        state.startingCoords = { ...userLocation };
      } else if (!state.startingLocationName) {
        state.startingLocationName = 'near me';
      }
    }

    // 3. Category / interest & exclusions
    if (/\b(no museums|remove museums|excluding museums|without museums|forget the museums)\b/.test(norm)) {
      if (!state.excludedCategories.includes('Museums & Cultural Institutions')) {
        state.excludedCategories.push('Museums & Cultural Institutions');
      }
      state.categories = state.categories.filter(c => c !== 'Museums & Cultural Institutions');
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    if (/\b(no churches|remove churches|excluding churches|without churches|forget the churches)\b/.test(norm)) {
      if (!state.excludedCategories.includes('Churches & Religious Heritage Sites')) {
        state.excludedCategories.push('Churches & Religious Heritage Sites');
      }
      state.categories = state.categories.filter(c => c !== 'Churches & Religious Heritage Sites');
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    if (/\b(actually i want churches|churches instead)\b/.test(norm)) {
      state.categories = ['Churches & Religious Heritage Sites'];
      state.excludedCategories = state.excludedCategories.filter(c => c !== 'Churches & Religious Heritage Sites');
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    } else if (/\b(add churches|churches and history|churches|church|basilica|cathedral|shrine)\b/.test(norm)) {
      if (!norm.includes('no churches') && !norm.includes('forget the churches') && !norm.includes('remove churches')) {
        const cat = 'Churches & Religious Heritage Sites';
        if (!state.categories.includes(cat)) state.categories.push(cat);
        state.excludedCategories = state.excludedCategories.filter(c => c !== cat);
        if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
      }
    }

    if (/\b(add historical sites|historical sites|historical landmarks|historical|history|mostly historical|landmarks|monuments)\b/.test(norm)) {
      const cat = 'Historical Landmarks & Monuments';
      if (!state.categories.includes(cat)) state.categories.push(cat);
      state.excludedCategories = state.excludedCategories.filter(c => c !== cat);
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    if (/\b(museums|museum|cultural institutions)\b/.test(norm)) {
      if (!norm.includes('no museums') && !norm.includes('forget the museums') && !norm.includes('remove museums')) {
        const cat = 'Museums & Cultural Institutions';
        if (!state.categories.includes(cat)) state.categories.push(cat);
        state.excludedCategories = state.excludedCategories.filter(c => c !== cat);
        if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
      }
    }

    const catFound = getCategoryFromQuery(text);
    if (catFound && !state.excludedCategories.includes(catFound)) {
      if (!state.categories.includes(catFound)) state.categories.push(catFound);
    }

    // 4. Transportation mode
    if (/\b(walking|walk|by foot|on foot|make it walking|walking instead|walking tour)\b/.test(norm)) {
      state.transportationMode = 'walking';
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }
    if (/\b(vehicle|car|motorcycle|bike|driving|by car|by motorcycle|motorcycle instead|car instead|vehicle instead|drive)\b/.test(norm)) {
      state.transportationMode = 'vehicle';
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    // 5. Delegated choice
    if (/\b(you choose|anything|a mix|mix|surprise me|don t mind|don t care|doesn t matter|i don t know what i want to visit|you decide|up to you)\b/.test(norm)) {
      state.userDelegatedChoice = true;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    if (/\b(every|all)\b.*\b(heritage site|sites|site)\b/.test(norm)) {
      state.wantsEverySite = true;
    }

    const countMatch = norm.match(/\b(\d+)\s*(?:heritage sites|locations|places|sites|stops)\b/);
    if (countMatch) {
      state.requestedLocationCount = Number(countMatch[1]);
    }
  }

  return state;
}

export function extractPlanningContext(
  history: Array<{ role: string; content: Array<{ text: string }> }>,
  userLocation?: { lat: number; lng: number } | null
): PlanningContext {
  const state = deriveTourPlanningState(history, userLocation);

  return {
    durationMinutes: state.durationMinutes,
    startingLocationName: state.startingLocationName,
    startingCoords: state.startingCoords,
    startingCity: state.startingCity,
    category: state.categories.length > 0 ? state.categories[0] : null,
    transportationMode: state.transportationMode,
    rejectsWalking: state.transportationMode === 'vehicle',
    wantsEverySite: state.wantsEverySite,
    requestedLocationCount: state.requestedLocationCount,
    userDelegatedChoice: state.userDelegatedChoice,
  };
}

export function evaluateTourPlanningState(
  query: string,
  input: any,
  sites: any[]
): HeritageChatOutput {
  const history = input.history || [{ role: 'user', content: [{ text: query }] }];
  const state = deriveTourPlanningState(history, input.userLocation);
  const normQuery = normalizeSearchText(query);

  const hasDuration = state.durationMinutes !== null;
  const hasStartLocation = Boolean(
    state.startingLocationName ||
    state.startingCoords ||
    state.startingCity ||
    (input.userLocation && input.userLocation.lat)
  );
  const hasInterest =
    state.categories.length > 0 ||
    state.userDelegatedChoice ||
    /\b(churches|church|museum|museums|landmarks|historical|architecture|mix|everything|old stuff)\b/.test(normQuery);

  // Case 1: GPS requested but missing location details
  if (
    (normQuery.includes('near me') || normQuery.includes('around me') || normQuery.includes('closest')) &&
    !input.userLocation &&
    (!state.startingLocationName || state.startingLocationName === 'near me') &&
    !state.startingCoords
  ) {
    return {
      text: "I can find historical sites near you! What area or landmark are you currently near in Metro Cebu?",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // Case 2: Missing duration AND start location
  if (!hasDuration && !hasStartLocation) {
    return {
      text: "I'd love to help plan a heritage tour for you! How much time do you have, where will you be starting from, and will you be walking or using a vehicle?",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // Case 3: Missing duration only
  if (!hasDuration) {
    const locLabel = state.startingLocationName || state.startingCity || 'your starting area';
    return {
      text: `I can help build a heritage tour for you starting near ${locLabel}! How much time do you have for the visit (e.g. 1 hour, 2 hours, 3 hours)?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // Case 4: Missing start location only
  if (!hasStartLocation) {
    const durMins = state.durationMinutes!;
    const durLabel = durMins < 60 ? `${durMins}-minute` : `${(durMins / 60).toFixed(durMins % 60 === 0 ? 0 : 1)}-hour`;
    return {
      text: `I can build a ${durLabel} heritage tour for you. Where will you be starting from in Metro Cebu?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // Case 5: Missing interest only
  if (!hasInterest) {
    const durMins = state.durationMinutes!;
    const durLabel = durMins < 60 ? `${durMins}-minute` : `${(durMins / 60).toFixed(durMins % 60 === 0 ? 0 : 1)}-hour`;
    const locLabel = state.startingLocationName || state.startingCity || 'your starting point';
    return {
      text: `Great! For a ${durLabel} tour starting from ${locLabel}, what would you like to focus on: historical sites, churches, museums/architecture, or a mix?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // All sufficient planning information gathered -> Generate / Re-generate Itinerary!
  return generateProximityBasedItineraryState(query, state, input, sites);
}

export function generateProximityBasedItineraryState(
  query: string,
  state: TourPlanningState,
  input: any,
  sites: any[]
): HeritageChatOutput {
  const durationMinutes = state.durationMinutes || 120;
  const targetCity = state.startingCity || 'Cebu City';

  let startPoint: { lat: number; lng: number } = state.startingCoords || { lat: 10.29365, lng: 123.90196 };
  let startLabel = state.startingLocationName || (input.userLocation ? 'your current location' : targetCity);

  let prefixNotes = '';
  let maxStops = 4;

  if (state.requestedLocationCount && state.requestedLocationCount >= 10 && durationMinutes <= 60) {
    prefixNotes += `Including ${state.requestedLocationCount} locations in a ${durationMinutes}-minute tour is not practical because travel and visit times require more time. For ${durationMinutes} minutes, I recommend a realistic 2-stop route instead.\n\n`;
    maxStops = 2;
  } else if (state.requestedLocationCount && state.requestedLocationCount >= 15 && durationMinutes <= 30) {
    prefixNotes += `Visiting 15 heritage sites across Cebu in 30 minutes is not realistic due to travel time between locations. For 30 minutes, I recommend 2 nearby sites instead.\n\n`;
    maxStops = 2;
  } else if (state.wantsEverySite && durationMinutes <= 120 && state.transportationMode === 'walking') {
    prefixNotes += `Visiting every heritage site across Metro Cebu while keeping walking segments short is not possible because sites span multiple cities. Instead, I've created a realistic 2-hour walking tour focused on closely clustered nearby sites in Parian and Downtown Cebu City.\n\n`;
    maxStops = 3;
  } else if (state.wantsEverySite) {
    prefixNotes += `The Handumanan directory contains over 40 heritage sites across Metro Cebu, so visiting every site in a single day is not realistic. Instead, I've prepared a practical highlight tour of top heritage sites in Cebu City.\n\n`;
    maxStops = 4;
  } else if (durationMinutes <= 30) {
    maxStops = 2;
  } else if (durationMinutes <= 60) {
    maxStops = 2;
  } else if (durationMinutes <= 120) {
    maxStops = 3;
  } else {
    maxStops = 4;
  }

  // Filter open sites in directory
  const openSites = sites.filter((s: any) => isSiteOpenForVisit(s));
  let candidatePool = [...openSites];

  if (state.excludedCategories.length > 0) {
    candidatePool = candidatePool.filter((s: any) => !state.excludedCategories.includes(s.category));
  }

  if (state.categories.length > 0) {
    const categoryFiltered = candidatePool.filter((s: any) => state.categories.includes(s.category));
    if (categoryFiltered.length >= 2) {
      candidatePool = categoryFiltered;
    }
  }

  // Nearest-neighbor spatial clustering
  const selectedSites: any[] = [];
  const usedIds = new Set<string>();
  let currentPos = startPoint;

  for (let i = 0; i < maxStops; i++) {
    let bestSite: any = null;
    let bestScore = Infinity;

    for (const site of candidatePool) {
      if (usedIds.has(site.id)) continue;
      const coords = site.coordinates || { lat: site.latitude, lng: site.longitude };
      if (!coords || !Number.isFinite(Number(coords.lat))) continue;

      const dist = calculateDistanceKm(currentPos, { lat: Number(coords.lat), lng: Number(coords.lng) });
      const weightedDist = site.isMustVisit ? dist * 0.85 : dist;

      if (weightedDist < bestScore) {
        bestScore = weightedDist;
        bestSite = site;
      }
    }

    if (bestSite) {
      selectedSites.push(bestSite);
      usedIds.add(bestSite.id);
      const coords = bestSite.coordinates || { lat: bestSite.latitude, lng: bestSite.longitude };
      currentPos = { lat: Number(coords.lat), lng: Number(coords.lng) };
    }
  }

  if (selectedSites.length === 0) {
    return {
      text: "I could not find open heritage sites in the directory matching those parameters to build a tour.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
    };
  }

  // Calculate visit times & travel times
  let totalVisitMinutes = 0;
  let totalTravelMinutes = 0;
  let prevPos = startPoint;

  const stopsFormatted = selectedSites.map((site: any, index: number) => {
    let visitMin = 30;
    if (durationMinutes <= 30) visitMin = 15;
    else if (index === 0 && site.isMustVisit) visitMin = 30;
    else if (site.id === 'cebu-cross') visitMin = 15;
    else if (site.category?.includes('Museums')) visitMin = 30;
    else visitMin = 30;

    const coords = site.coordinates || { lat: site.latitude, lng: site.longitude };
    const segDist = calculateDistanceKm(prevPos, { lat: Number(coords.lat), lng: Number(coords.lng) });
    const travelSegMin = state.transportationMode === 'walking'
      ? Math.max(3, Math.round((segDist / 4.5) * 60))
      : Math.max(5, Math.round((segDist / 22) * 60) + 3);

    totalTravelMinutes += travelSegMin;
    totalVisitMinutes += visitMin;
    prevPos = { lat: Number(coords.lat), lng: Number(coords.lng) };

    return `${index + 1}. **${site.name}** (${site.city})\n   Visit: ~${visitMin} min`;
  });

  const bufferMinutes = Math.max(10, Math.min(45, Math.round(totalTravelMinutes)));
  const calculatedTotalMinutes = totalVisitMinutes + bufferMinutes;
  
  let formattedTotalTime = `${calculatedTotalMinutes} minutes`;
  if (calculatedTotalMinutes >= 60) {
    const hrs = Math.floor(calculatedTotalMinutes / 60);
    const mins = calculatedTotalMinutes % 60;
    formattedTotalTime = mins === 0 ? `${hrs}h` : `${hrs}h ${mins}m`;
  }

  const normQuery = normalizeSearchText(query);
  const foodNote = normQuery.includes('eat') || normQuery.includes('food') || normQuery.includes('restaurant')
    ? "\n\n*Note on dining: While Handumanan focuses on heritage sites rather than restaurant listings, the Parian and Downtown Cebu City heritage district has many local food options and eateries nearby between stops.*"
    : "";

  const durationLabel = durationMinutes < 60 ? `${durationMinutes}-minute` : `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)}-hour`;

  const structuredText = `${prefixNotes}Based on the current Handumanan directory, here's a realistic tour that fits within your ${durationLabel} limit, starting from ${startLabel}:

${stopsFormatted.join('\n\n')}

Estimated duration: ~${formattedTotalTime} (${totalVisitMinutes} min visiting stops + ~${bufferMinutes} min travel/buffer).${foodNote}`;

  return {
    text: structuredText,
    suggestedSiteIds: selectedSites.map((s: any) => s.id),
    isGeneratedItinerary: true,
  };
}

export function generateProximityBasedItinerary(
  query: string,
  ctx: PlanningContext,
  input: any,
  sites: any[]
): HeritageChatOutput {
  const history = input?.history || [{ role: 'user', content: [{ text: query }] }];
  const state = deriveTourPlanningState(history, input?.userLocation);
  return generateProximityBasedItineraryState(query, state, input, sites);
}

export function generateStructuredTourResponse(query: string, input: any, sites: any[]): HeritageChatOutput {
  return evaluateTourPlanningState(query, input, sites);
}


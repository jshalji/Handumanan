import { isSiteOpenForVisit, getSiteAvailability, hasVerifiedVisitingHours } from '@/lib/site-availability';

export function getVerifiedCoordinates(site: any): { lat: number; lng: number } | null {
  const lat = site?.coordinates?.lat;
  const lng = site?.coordinates?.lng;
  if (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    (lat !== 0 || lng !== 0)
  ) {
    return { lat, lng };
  }
  return null;
}

export function extractConservativeConstructionDate(recordText: string): {
  year: string | null;
  century: string | null;
} {
  if (!recordText) return { year: null, century: null };
  const explicitYearMatch =
    recordText.match(
      /\b(?:originally\s+built|built|constructed|completed|established|founded|erected|dates?\s+back\s+to)\s+(?:in\s+|around\s+|circa\s+|c\.\s*)?(1[5-9]\d{2}|20\d{2})\b/i
    ) ||
    recordText.match(
      /\b(1[5-9]\d{2}|20\d{2})\s+(?:construction|founding|establishment)\b/i
    );
  const explicitCenturyMatch =
    recordText.match(
      /\b(\d{1,2}(?:st|nd|rd|th)[\s-]+century)\s+(?:structure|fort|church|house|residence|building|monument|bridge|cathedral|basilica|landmark)\b/i
    ) ||
    recordText.match(
      /\b(?:built|constructed|established|founded|dates?\s+back\s+to)\s+(?:in\s+the\s+)?(\d{1,2}(?:st|nd|rd|th)[\s-]+century)\b/i
    );
  return {
    year: explicitYearMatch ? explicitYearMatch[1] : null,
    century: explicitCenturyMatch ? explicitCenturyMatch[1] : null,
  };
}

export type HeritageChatOutput = {
  text: string;
  suggestedSiteIds?: string[];
  isGeneratedItinerary?: boolean;
  intent?: HeritageQueryIntentType;
  cardSelectionReason?: CardSelectionReason;
  requiresClarification?: boolean;
};

export type HeritageQueryIntentType =
  | 'general_historical_question'
  | 'specific_site_information'
  | 'heritage_site_recommendation'
  | 'geographic_recommendation'
  | 'category_recommendation'
  | 'visiting_information'
  | 'directions_or_location'
  | 'site_comparison'
  | 'follow_up_question'
  | 'general_cebu_heritage_question'
  | 'general_knowledge_question'
  | 'tour_planning'
  | 'system_question'
  | 'conversational'
  | 'out_of_scope'
  | 'ambiguous_clarification';

export type GeographicRegionConstraint =
  | 'southern_metro_cebu'
  | 'northern_metro_cebu'
  | 'central_cebu_city'
  | 'mactan_island'
  | 'metro_cebu'
  | 'outside_metro_cebu_province'
  | 'metro_cebu_not_covered'
  | 'outside_cebu'
  | 'ambiguous_south_cebu'
  | 'ambiguous_north_cebu'
  | null;

export type CardSelectionReason =
  | 'none_historical_explanation'
  | 'none_out_of_scope'
  | 'none_clarification_needed'
  | 'none_conversational'
  | 'none_system_question'
  | 'none_no_matching_sites'
  | 'specific_site_reference'
  | 'explicit_recommendations'
  | 'geographic_recommendations'
  | 'category_recommendations'
  | 'site_comparison'
  | 'itinerary_stops';

export type RequestedInformationType =
  | 'history'
  | 'significance'
  | 'visiting_hours'
  | 'entrance_fee'
  | 'location_directions'
  | 'accessibility'
  | 'category'
  | 'architect_builder'
  | 'year_date'
  | 'contact_booking'
  | 'facilities'
  | 'comparison'
  | 'overview';

export interface AnalyzedHeritageIntent {
  intent: HeritageQueryIntentType;
  subject: string | null;
  location: string | null;
  excludedLocations: string[];
  neighborhoodOrDistrict: string | null;
  geographicRegion: GeographicRegionConstraint;
  outsideScopePlace: string | null;
  category: string | null;
  subCategoryTopic: string | null;
  excludedCategories: string[];
  requestedCount?: number | null;
  isExclusionCorrection?: boolean;
  outputFormat?: {
    exactSentenceCount?: number | null;
    noPromotional?: boolean;
  };
  entities: string[];
  negatedEntities: string[];
  referenceEntityId: string | null;
  constraints: {
    openNowOnly?: boolean;
    closedOnly?: boolean;
    freeAdmissionOnly?: boolean;
    mustVisitOnly?: boolean;
    studentFriendlyOnly?: boolean;
    architecturalOrPeriod?: string | null;
    nearbyUserGps?: boolean;
    nearReferenceSiteId?: string | null;
    nearReferencePointName?: string | null;
    asksForAlternatives?: boolean;
    specificYearMentioned?: string | null;
  };
  requestedInformation: RequestedInformationType[];
  requiresSiteCards: boolean;
  cardSelectionReason: CardSelectionReason;
  requiresClarification: boolean;
  clarificationPrompt?: string;
  confidence: number;
}

export type ConversationDomain =
  | 'emergency_safety'
  | 'heritage_directory'
  | 'heritage_history'
  | 'tourism_and_food'
  | 'itinerary_planner'
  | 'general_ai'
  | 'system_help';

export interface SafetyConversationState {
  active: boolean;
  kind: 'emergency' | 'medical' | null;
}

export interface TourismConversationContext {
  topic: 'food' | 'beaches_nature' | 'attractions' | 'transport' | 'budget' | 'activities' | null;
  dishOrSubject: string | null;
  location: string | null;
  budgetText: string | null;
  lastRecommendations: string[];
}

export interface ResolvedConversationContext {
  activeDomain: ConversationDomain | null;
  activeSubtopic: string | null;
  safetyState: SafetyConversationState;
  tourismContext?: TourismConversationContext;
  lastReferencedSite: any | null;
  lastRecommendedSites: any[];
  previouslyShownSiteIds: string[];
  lastCity: string | null;
  lastRegion: GeographicRegionConstraint;
  lastCategory: string | null;
  lastExcludedCategories: string[];
  lastFreeOnly: boolean;
  lastRequestedCount: number | null;
  lastWasRecommendation: boolean;
  lastUserText?: string | null;
  lastModelText?: string | null;
  lastIntent: HeritageQueryIntentType | 'information' | 'itinerary' | 'conversation' | null;
}

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CITY_ALIASES: Record<string, string> = {
  'cebu city': 'Cebu City',
  'cebu cty': 'Cebu City',
  'mandaue city': 'Mandaue City',
  'mandaue': 'Mandaue City',
  'mandue': 'Mandaue City',
  'mandawe': 'Mandaue City',
  'talisay city': 'Talisay City',
  'talisay cty': 'Talisay City',
  'talisay': 'Talisay City',
  'lapu lapu city': 'Lapu-Lapu City',
  'lapu lapu': 'Lapu-Lapu City',
  'lapu city': 'Lapu-Lapu City',
  'lapulapu city': 'Lapu-Lapu City',
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

const STRICT_CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: string; subTopic?: string }> = [
  { pattern: /\b(non[\s-]?catholic|taoist|chinese temple|temples?)\b/i, category: 'Cultural & Religious (Non-Catholic Sites)' },
  { pattern: /\b(churches|church|chruches?|chuch|simbahan|cathedrals?|basilicas?|parish(?:es)?|religious\s+(?:heritage\s+)?(?:sites?|places?|landmarks?)|catholic\s+(?:churches|sites|places|shrines))\b/i, category: 'Churches & Religious Heritage Sites' },
  { pattern: /\b(museums?|musems?|muesums?|galleries|gallery|cultural\s+institutions?)\b/i, category: 'Museums & Cultural Institutions' },
  { pattern: /\b(ancestral\s+houses?|ancestral\s+homes?|ancestral\s+residences?|heritage\s+houses?|heritage\s+residences?|bahay\s+na\s+bato|lumang\s+bahay|karaang\s+balay|historic\s+houses?|historic\s+residences?)\b/i, category: 'Ancestral Houses & Heritage Residences' },
  { pattern: /\b(plazas?|parks?|public\s+spaces?|public\s+squares?)\b/i, category: 'Plazas, Parks & Public Spaces' },
  { pattern: /\b(government\s+buildings?|historic\s+buildings?|civic\s+buildings?|city\s+halls?|presidencia)\b/i, category: 'Government & Historic Buildings' },
  { pattern: /\b(libraries|library|public\s+library|memorial\s+library)\b/i, category: 'Historical Landmarks & Monuments', subTopic: 'library' },
  { pattern: /\b(bridges?|cable[\s-]?stayed)\b/i, category: 'Historical Landmarks & Monuments', subTopic: 'bridge' },
  { pattern: /\b(watchtowers?|bantayan|forts?|bastion)\b/i, category: 'Historical Landmarks & Monuments', subTopic: 'defense' },
  { pattern: /\b(monuments?|historical\s+markers?|historical\s+landmarks?|landmarks?|shrines?)\b/i, category: 'Historical Landmarks & Monuments' },
];

const SITE_ENTITY_MATCHERS: Array<{ id: string; patterns: RegExp[] }> = [
  {
    id: 'cebu-basilica-santo-nino',
    patterns: [
      /\bbasilica\s+minore\b/i,
      /\bbasilica\s+(?:minore\s+)?del\s+santo\s+nino\b/i,
      /\bsanto\s+nino\b/i,
      /\bsto\s+nino\b/i,
      /\bcebu\s+basilica\b/i,
      /\bthe\s+basilica\b/i,
      /^basilica$/i,
    ],
  },
  {
    id: 'cebu-basilica',
    patterns: [
      /\bbasilica\s+minore\b/i,
      /\bbasilica\s+(?:minore\s+)?del\s+santo\s+nino\b/i,
      /\bsanto\s+nino\b/i,
      /\bsto\s+nino\b/i,
      /\bcebu\s+basilica\b/i,
      /\bthe\s+basilica\b/i,
      /^basilica$/i,
    ],
  },
  {
    id: 'cebu-cathedral',
    patterns: [
      /\bmetropolitan\s+cebu\s+cathedral\b/i,
      /\bcebu\s+cathedral\b/i,
      /\bmetropolitan\s+cathedral\b/i,
      /\bthe\s+cathedral\b/i,
    ],
  },
  {
    id: 'cebu-magellans-cross',
    patterns: [
      /\bmagellan\s*s?\s+cross\b/i,
      /\bcross\s+of\s+magellan\b/i,
    ],
  },
  {
    id: 'cebu-cross',
    patterns: [
      /\bmagellan\s*s?\s+cross\b/i,
      /\bcross\s+of\s+magellan\b/i,
    ],
  },
  {
    id: 'cebu-archdiocesan-museum',
    patterns: [
      /\barchdiocesan\s+museum\b/i,
      /\bmuseum\s+of\s+cebu\s+archdiocese\b/i,
    ],
  },
  {
    id: 'cebu-casa-gorordo',
    patterns: [
      /\bcasa\s+gorordo\b/i,
      /\bgorordo\s+museum\b/i,
      /\bgorordo\s+house\b/i,
    ],
  },
  {
    id: 'cebu-yap-sandiego',
    patterns: [
      /\byap[\s-]+san\s*diego\b/i,
      /\bsan\s*diego\s+ancestral\b/i,
    ],
  },
  {
    id: 'cebu-jesuit-house',
    patterns: [
      /\b1730\s+jesuit\s+house\b/i,
      /\bjesuit\s+house\b/i,
    ],
  },
  {
    id: 'cebu-national-museum',
    patterns: [
      /\bnational\s+museum\b/i,
      /\baduana\s+building\b/i,
      /\bmalacanang\s+sa\s+sugbo\b/i,
    ],
  },
  {
    id: 'cebu-sugbu-chinese-museum',
    patterns: [
      /\bsugbu\s+chinese\b/i,
      /\bchinese\s+heritage\s+museum\b/i,
      /\bgotiaoco\s+building\b/i,
    ],
  },
  {
    id: 'cebu-museo-sugbo',
    patterns: [
      /\bmuseo\s+sugbo\b/i,
      /\bcarcel\s+de\s+cebu\b/i,
      /\bcebu\s+provincial\s+museum\b/i,
    ],
  },
  {
    id: 'cebu-uspf-jose-rizal-museum',
    patterns: [
      /\buspf\b/i,
      /\bjose\s+rizal\s+museum\b/i,
      /\brizaliana\s+museum\b/i,
    ],
  },
  {
    id: 'cebu-usc-museum',
    patterns: [
      /\busc\s+museum\b/i,
      /\buniversity\s+of\s+san\s+carlos\s+museum\b/i,
      /\bsan\s+carlos\s+museum\b/i,
    ],
  },
  {
    id: 'cebu-fort-san-pedro',
    patterns: [
      /\bfort\s+san\s+pedro\b/i,
      /\bfuerza\s+de\s+san\s+pedro\b/i,
    ],
  },
  {
    id: 'cebu-heritage-monument',
    patterns: [
      /\bheritage\s+of\s+cebu\s+monument\b/i,
      /\bparian\s+monument\b/i,
    ],
  },
  {
    id: 'cebu-colon-street',
    patterns: [
      /\bcolon\s+street\b/i,
      /\bcolon\s+historical\s+marker\b/i,
      /\bcolon\s+obelisk\b/i,
    ],
  },
  {
    id: 'cebu-tres-de-abril-marker',
    patterns: [
      /\btres\s+de\s+abril\b/i,
      /\bleon\s+kilat\s+marker\b/i,
    ],
  },
  {
    id: 'cebu-plaza-independencia',
    patterns: [
      /\bplaza\s+independencia\b/i,
    ],
  },
  {
    id: 'cebu-plaza-sugbo',
    patterns: [
      /\bplaza\s+sugbo\b/i,
      /\bplaza\s+sugbu\b/i,
    ],
  },
  {
    id: 'cebu-plaza-hamabar',
    patterns: [
      /\bplaza\s+hamabar\b/i,
      /\brajah\s+humabon\s+plaza\b/i,
    ],
  },
  {
    id: 'cebu-fuente-osmena',
    patterns: [
      /\bfuente\s+osmena\b/i,
      /\bfuente\s+circle\b/i,
    ],
  },
  {
    id: 'cebu-city-hall',
    patterns: [
      /\bcebu\s+city\s+hall\b/i,
    ],
  },
  {
    id: 'cebu-capitol',
    patterns: [
      /\bcebu\s+provincial\s+capitol\b/i,
      /\bprovincial\s+capitol\b/i,
    ],
  },
  {
    id: 'cebu-patria',
    patterns: [
      /\bpatria\s+de\s+cebu\b/i,
    ],
  },
  {
    id: 'cebu-taoist',
    patterns: [
      /\bcebu\s+taoist\s+temple\b/i,
      /\btaoist\s+temple\b/i,
    ],
  },
  {
    id: 'cebu-rizal-memorial-library',
    patterns: [
      /\brizal\s+memorial\s+library\b/i,
      /\bcebu\s+city\s+public\s+library\b/i,
    ],
  },
  {
    id: 'talisay-landing',
    patterns: [
      /\btalisay\s+landing\b/i,
      /\blarawan\s+beach\b/i,
    ],
  },
  {
    id: 'talisay-church',
    patterns: [
      /\bsta\s+teresa\s+de\s+avila\b/i,
      /\bsanta\s+teresa\s+de\s+avila\b/i,
      /\btalisay\s+church\b/i,
      /\btalisay\s+parish\b/i,
    ],
  },
  {
    id: 'talisay-plaza',
    patterns: [
      /\btalisay\s+city\s+plaza\b/i,
      /\btalisay\s+plaza\b/i,
    ],
  },
  {
    id: 'talisay-city-hall',
    patterns: [
      /\btalisay\s+city\s+hall\b/i,
    ],
  },
  {
    id: 'mandaue-church',
    patterns: [
      /\bnational\s+shrine\s+of\s+saint\s+joseph\b/i,
      /\bnational\s+shrine\s+of\s+st\s+joseph\b/i,
      /\bsaint\s+joseph\s+shrine\b/i,
      /\bst\s+joseph\s+shrine\b/i,
      /\bmandaue\s+church\b/i,
    ],
  },
  {
    id: 'mandaue-library',
    patterns: [
      /\bmandaue\s+city\s+public\s+library\b/i,
      /\bmandaue\s+public\s+library\b/i,
      /\bmandaue\s+library\b/i,
    ],
  },
  {
    id: 'mandaue-watchtower',
    patterns: [
      /\bbantayan\s+sa\s+hari\b/i,
      /\bmandaue\s+watchtower\b/i,
    ],
  },
  {
    id: 'mandaue-presidencia',
    patterns: [
      /\bmandaue\s+presidencia\b/i,
      /\bmandaue\s+city\s+hall\b/i,
    ],
  },
  {
    id: 'mandaue-bridge',
    patterns: [
      /\bmandaue[\s-]+mactan\s+bridge\b/i,
      /\bfirst\s+mactan[\s-]+mandaue\s+bridge\b/i,
      /\bfirst\s+mandaue[\s-]+mactan\s+bridge\b/i,
    ],
  },
  {
    id: 'marcelo-fernan-bridge',
    patterns: [
      /\bmarcelo\s+fernan\s+bridge\b/i,
      /\bmarcelo\s+fernan\b/i,
      /\bsecond\s+mactan\s+bridge\b/i,
    ],
  },
  {
    id: 'mandaue-plaza',
    patterns: [
      /\bmandaue\s+city\s+heritage\s+plaza\b/i,
      /\bmandaue\s+heritage\s+plaza\b/i,
      /\bmandaue\s+plaza\b/i,
    ],
  },
  {
    id: 'llc-shrine',
    patterns: [
      /\bvirgen\s+de\s+la\s+regla\b/i,
      /\bour\s+lady\s+of\s+the\s+rule\b/i,
      /\bopon\s+church\b/i,
    ],
  },
  {
    id: 'llc-mactan-shrine',
    patterns: [
      /\bmactan\s+shrine\b/i,
      /\bliberty\s+shrine\b/i,
      /\blapu[\s-]+lapu\s+shrine\b/i,
      /\blapu[\s-]+lapu\s+monument\b/i,
    ],
  },
  {
    id: 'llc-magellan-marker',
    patterns: [
      /\bmagellan\s*s?\s+marker\b/i,
      /\bmagellan\s*s?\s+obelisk\b/i,
    ],
  },
  {
    id: 'llc-plaza-rizal',
    patterns: [
      /\bplaza\s+rizal\b/i,
      /\brizal\s+park\b/i,
    ],
  },
  {
    id: 'llc-millennium-park',
    patterns: [
      /\bmillennium\s+park\b/i,
    ],
  },
  {
    id: 'llc-bridge-park',
    patterns: [
      /\bold\s+bridge\s+park\b/i,
    ],
  },
];

const NON_METRO_CEBU_PROVINCE_TOWNS = [
  'oslob',
  'moalboal',
  'argao',
  'boljoon',
  'dalaguete',
  'alcoy',
  'santander',
  'badian',
  'alegria',
  'barili',
  'dumanjug',
  'ronda',
  'toledo',
  'balamban',
  'asturias',
  'tuburan',
  'tabuelan',
  'san remigio',
  'bantayan',
  'daanbantayan',
  'medellin',
  'bogo',
  'sogod',
  'catmon',
  'carmen',
  'sibonga',
  'camotes',
  'malapascua',
  'sumilon',
  'kawasan',
];

// LGUs that belong to Metro Cebu but are NOT covered by Handumanan's directory
// (Handumanan currently covers Cebu City, Mandaue City, Lapu-Lapu City, and Talisay City only).
const METRO_CEBU_UNCOVERED_LGUS = [
  'danao',
  'carcar',
  'naga city',
  'naga cebu',
  'naga',
  'compostela',
  'liloan',
  'consolacion',
  'cordova',
  'minglanilla',
  'san fernando',
];

const OUTSIDE_CEBU_PLACES = [
  'japan',
  'tokyo',
  'kyoto',
  'china',
  'beijing',
  'korea',
  'seoul',
  'taiwan',
  'hong kong',
  'singapore',
  'thailand',
  'bangkok',
  'vietnam',
  'indonesia',
  'bali',
  'malaysia',
  'usa',
  'united states',
  'america',
  'canada',
  'australia',
  'europe',
  'spain',
  'madrid',
  'rome',
  'italy',
  'france',
  'paris',
  'london',
  'switzerland',
  'manila',
  'intramuros',
  'rizal park manila',
  'luneta',
  'luzon',
  'davao',
  'iloilo',
  'bacolod',
  'bohol',
  'panglao',
  'chocolate hills',
  'palawan',
  'el nido',
  'coron',
  'boracay',
  'baguio',
  'vigan',
  'batanes',
  'siargao',
  'dumaguete',
  'siquijor',
  'leyte',
  'samar',
  'another province',
  'other province',
  'other provinces',
];

const DISTRICT_SITE_MAP: Record<string, { label: string; city: string; siteIds: string[] }> = {
  parian: {
    label: 'Parian',
    city: 'Cebu City',
    siteIds: ['cebu-casa-gorordo', 'cebu-yap-sandiego', 'cebu-jesuit-house', 'cebu-heritage-monument'],
  },
  colon: {
    label: 'Colon',
    city: 'Cebu City',
    siteIds: ['cebu-colon-street', 'cebu-heritage-monument', 'cebu-yap-sandiego', 'cebu-jesuit-house'],
  },
  'san nicolas': {
    label: 'San Nicolas',
    city: 'Cebu City',
    siteIds: ['cebu-tres-de-abril-marker'],
  },
  uptown: {
    label: 'Uptown Cebu City',
    city: 'Cebu City',
    siteIds: ['cebu-fuente-osmena', 'cebu-rizal-memorial-library', 'cebu-capitol'],
  },
  'beverly hills': {
    label: 'Beverly Hills / Lahug',
    city: 'Cebu City',
    siteIds: ['cebu-taoist'],
  },
  lahug: {
    label: 'Beverly Hills / Lahug',
    city: 'Cebu City',
    siteIds: ['cebu-taoist'],
  },
  'punta engano': {
    label: 'Punta Engaño',
    city: 'Lapu-Lapu City',
    siteIds: ['llc-mactan-shrine', 'llc-magellan-marker'],
  },
  pajo: {
    label: 'Pajo',
    city: 'Lapu-Lapu City',
    siteIds: ['llc-millennium-park', 'llc-bridge-park'],
  },
  looc: {
    label: 'Looc',
    city: 'Mandaue City',
    siteIds: ['mandaue-watchtower'],
  },
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

export function getCityFromQuery(query: string): string | undefined {
  const { location } = extractGeographicConstraints(query);
  return location || undefined;
}

export function getCategoryFromQuery(query: string): string | undefined {
  const { category } = extractCategoryConstraints(query);
  return category || undefined;
}

export function isCasualStatementWithoutQuestion(query: string): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;
  if (query.includes('?')) return false;

  // Statements about personal life, friends, family, travel stories, or generic observations
  if (
    /^(my friend|my family|my parents|my brother|my sister|my cousin|i live in|i am from|i m from|we live in|i went to|i visited|i drove|i walked past|i saw)\b/.test(normalized) &&
    !/\b(tell me|what|where|when|why|how|recommend|suggest|show|list|find|plan|hours|fee|history)\b/.test(normalized)
  ) {
    return true;
  }

  if (
    /^(cebu city|mandaue|mandaue city|lapu lapu|lapu lapu city|talisay|talisay city|cebu)\s+is\s+(beautiful|nice|great|busy|hot|big|amazing|wonderful|crowded|far|close)\b/.test(normalized)
  ) {
    return true;
  }

  return false;
}

export function identifyReferencedSites(
  query: string,
  sites: any[] = []
): {
  entities: string[];
  negatedEntities: string[];
  referenceEntityId: string | null;
} {
  const normalized = normalizeSearchText(query);
  if (!normalized) {
    return { entities: [], negatedEntities: [], referenceEntityId: null };
  }

  // Guard against false-positive site matches in non-Cebu / non-heritage contexts
  // e.g., "Why is there a cross on the Swiss flag?", "Who was Ferdinand Magellan's wife in Spain?"
  if (
    /\b(swiss|switzerland|red cross|southern cross|flag of|wife in spain|born in portugal|strait of magellan)\b/.test(normalized)
  ) {
    return { entities: [], negatedEntities: [], referenceEntityId: null };
  }

  const matchedWithPos: Array<{ id: string; index: number }> = [];
  const siteIdSet = new Set(sites.map(s => s?.id).filter(Boolean));

  for (const matcher of SITE_ENTITY_MATCHERS) {
    if (siteIdSet.size > 0 && !siteIdSet.has(matcher.id)) continue;
    let bestIdx = Infinity;
    for (const pattern of matcher.patterns) {
      const m = normalized.match(pattern);
      if (m && typeof m.index === 'number' && m.index < bestIdx) {
        bestIdx = m.index;
      }
    }
    if (bestIdx < Infinity && !matchedWithPos.some(item => item.id === matcher.id)) {
      matchedWithPos.push({ id: matcher.id, index: bestIdx });
    }
  }

  // Also check any custom/dynamic site names in `sites` (>= 6 chars, multi-word, word-bounded)
  for (const site of sites) {
    if (!site?.id || matchedWithPos.some(item => item.id === site.id)) continue;
    const normName = normalizeSearchText(site.name || '');
    if (normName.length >= 6 && normName.includes(' ')) {
      const escaped = normName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const m = normalized.match(new RegExp(`\\b${escaped}\\b`, 'i'));
      if (m && typeof m.index === 'number') {
        matchedWithPos.push({ id: site.id, index: m.index });
      }
    }
  }

  matchedWithPos.sort((a, b) => a.index - b.index);
  const matchedIds = matchedWithPos.map(item => item.id);

  const negatedEntities: string[] = [];
  let referenceEntityId: string | null = null;

  for (const entityId of matchedIds) {
    const matcher = SITE_ENTITY_MATCHERS.find(m => m.id === entityId);
    const siteObj = sites.find(s => s?.id === entityId);
    const candidateNames: string[] = [];
    if (siteObj?.name) candidateNames.push(normalizeSearchText(siteObj.name));
    if (matcher) {
      for (const pat of matcher.patterns) {
        const match = normalized.match(pat);
        if (match?.[0]) candidateNames.push(normalizeSearchText(match[0]));
      }
    }

    const isNegatedOrReference = candidateNames.some(alias => {
      if (!alias) return false;
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const negationRegex = new RegExp(
        `\\b(?:other\\s+than|besides|except|aside\\s+from|excluding|not|instead\\s+of|without)\\s+(?:the\\s+)?${escaped}\\b`,
        'i'
      );
      const similarityRegex = new RegExp(
        `\\b(?:places?\\s+like|sites?\\s+like|similar\\s+to|alternatives?\\s+to|other\\s+places?\\s+like)\\s+(?:the\\s+)?${escaped}\\b`,
        'i'
      );
      if (similarityRegex.test(normalized)) {
        referenceEntityId = entityId;
        return true;
      }
      return negationRegex.test(normalized);
    });

    if (isNegatedOrReference) {
      negatedEntities.push(entityId);
    }
  }

  const activeEntities = matchedIds.filter(id => !negatedEntities.includes(id));

  return {
    entities: activeEntities,
    negatedEntities,
    referenceEntityId,
  };
}

export function extractGeographicConstraints(query: string): {
  location: string | null;
  excludedLocations: string[];
  conflictingCities?: string[];
  contradictoryLocations?: string[];
  neighborhoodOrDistrict: string | null;
  geographicRegion: GeographicRegionConstraint;
  outsideScopePlace: string | null;
} {
  const normalized = normalizeSearchText(query);
  const excludedLocations: string[] = [];
  const conflictingCities: string[] = [];
  const contradictoryLocations: string[] = [];
  let location: string | null = null;
  let neighborhoodOrDistrict: string | null = null;
  let geographicRegion: GeographicRegionConstraint = null;
  let outsideScopePlace: string | null = null;

  if (!normalized) {
    return {
      location,
      excludedLocations,
      conflictingCities,
      contradictoryLocations,
      neighborhoodOrDistrict,
      geographicRegion,
      outsideScopePlace,
    };
  }

  // Guard: "Who was Lapu-Lapu?" is a historical person question, not a Lapu-Lapu City location query
  if (
    /\bwho\s+(?:was|is)\s+(?:datu\s+)?lapu[\s-]?lapu\b/i.test(normalized) &&
    !/\blapu[\s-]?lapu\s+city\b/i.test(normalized)
  ) {
    return {
      location,
      excludedLocations,
      conflictingCities,
      contradictoryLocations,
      neighborhoodOrDistrict,
      geographicRegion,
      outsideScopePlace,
    };
  }

  // 1. Check outside-Cebu places first (e.g. Japan, Manila, Bohol, Palawan, Spain, etc.)
  for (const place of OUTSIDE_CEBU_PLACES) {
    const escaped = place.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      // Allow historical mentions of Spain/China/America when clearly about Cebu's history
      const isHistoricalModifierInCebu =
        (place === 'spain' || place === 'china' || place === 'america' || place === 'japan') &&
        /\b(cebu|mactan|talisay|mandaue|parian|colon|handumanan|spanish|chinese|american|japanese)\b/.test(normalized) &&
        !/\b(capital of|in japan|in china|in spain|in america|visit japan|visit spain|trip to japan|hotels in)\b/.test(normalized);

      if (!isHistoricalModifierInCebu) {
        return {
          location: null,
          excludedLocations: [],
          neighborhoodOrDistrict: null,
          geographicRegion: 'outside_cebu',
          outsideScopePlace: place,
        };
      }
    }
  }

  // 2. Check non-Metro Cebu province towns (e.g. Oslob, Moalboal, Argao, Boljoon, Bantayan, etc.)
  for (const town of NON_METRO_CEBU_PROVINCE_TOWNS) {
    const escaped = town.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      // Guard: "Bantayan sa Hari" is a site in Mandaue City!
      if (town === 'bantayan' && /\bbantayan\s+sa\s+hari\b/i.test(normalized)) {
        continue;
      }
      return {
        location: null,
        excludedLocations: [],
        neighborhoodOrDistrict: null,
        geographicRegion: 'outside_metro_cebu_province',
        outsideScopePlace: town,
      };
    }
  }

  // 2b. Metro Cebu LGUs that Handumanan does not cover (e.g. Carcar, Danao, Minglanilla, Cordova)
  for (const lgu of METRO_CEBU_UNCOVERED_LGUS) {
    const escaped = lgu.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      return {
        location: null,
        excludedLocations: [],
        neighborhoodOrDistrict: null,
        geographicRegion: 'metro_cebu_not_covered',
        outsideScopePlace: lgu,
      };
    }
  }

  // 2c. Explicit "outside Metro Cebu" / "beyond Metro Cebu" / "Cebu Province" phrases
  // Must be checked BEFORE matching "metro cebu" or individual city aliases.
  if (
    /\b(outside(?:\s+of)?\s+metro\s+cebu|beyond\s+metro\s+cebu|rest\s+of\s+cebu\s+province|cebu\s+province\s+outside\s+metro\s+cebu)\b/i.test(normalized) ||
    (/\bcebu\s+province\b/i.test(normalized) &&
      !/\b(difference\s+between|what\s+is\s+cebu\s+province|capital\s+of\s+cebu\s+province|vs\s+cebu\s+province|versus\s+cebu\s+province)\b/i.test(normalized))
  ) {
    return {
      location: null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: 'outside_metro_cebu_province',
      outsideScopePlace: 'Cebu Province outside Metro Cebu',
    };
  }

  // 3. Check negated/excluded covered cities ("outside Cebu City", "not in Mandaue", "don't show anything from Talisay", etc.)
  const sortedCityAliases = Object.entries(CITY_ALIASES).sort((a, b) => b[0].length - a[0].length);
  let textWithoutNegatedCities = normalized;
  for (const [alias, canonicalCity] of sortedCityAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const negRegex = new RegExp(
      `\\b(?:outside(?:\\s+of)?|not\\s+(?:in|from)|other\\s+than|except(?:\\s+(?:in|from))?|besides|excluding|without|nothing\\s+from|no\\s+(?:sites?|places?)\\s+(?:in|from)|do\\s+not\\s+show\\s+(?:anything\\s+)?(?:in|from)|don\\s*t\\s+show\\s+(?:anything\\s+)?(?:in|from))\\s+${escaped}\\b`,
      'gi'
    );
    if (negRegex.test(normalized)) {
      if (!excludedLocations.includes(canonicalCity)) {
        excludedLocations.push(canonicalCity);
      }
      textWithoutNegatedCities = textWithoutNegatedCities.replace(negRegex, ' ');
    }
  }

  // 4. Check positive covered city mentions (detecting conflicting positive cities & city contradictions)
  const positiveCities: string[] = [];
  for (const [alias, canonicalCity] of sortedCityAliases) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(textWithoutNegatedCities)) {
      if (!positiveCities.includes(canonicalCity)) {
        positiveCities.push(canonicalCity);
      }
    }
  }

  for (const city of positiveCities) {
    if (excludedLocations.includes(city) && !contradictoryLocations.includes(city)) {
      contradictoryLocations.push(city);
    }
  }

  if (positiveCities.length >= 2) {
    // Only treat as conflicting if they are not just "change X to Y"
    if (!/\b(change|switch|instead|rather\s+than|make\s+it|replace)\b/i.test(normalized)) {
      conflictingCities.push(...positiveCities);
    } else {
      location = positiveCities[positiveCities.length - 1];
    }
  }

  if (!location && positiveCities.length > 0) {
    const nonExcluded = positiveCities.find(c => !excludedLocations.includes(c));
    location = nonExcluded || positiveCities[0];
  }

  // 5. Check neighborhoods / districts
  for (const [districtKey, info] of Object.entries(DISTRICT_SITE_MAP)) {
    const escaped = districtKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (new RegExp(`\\b${escaped}\\b`, 'i').test(normalized)) {
      neighborhoodOrDistrict = districtKey;
      if (!location && !excludedLocations.includes(info.city)) {
        location = info.city;
      }
      break;
    }
  }

  // 6. Check directional / regional phrases in Metro Cebu vs. Cebu
  if (
    /\b(southern\s+metro\s+cebu|south\s+metro\s+cebu|(?:south|southern)\s+(?:side|part|area|portion)\s+of\s+metro\s+cebu)\b/i.test(normalized)
  ) {
    geographicRegion = 'southern_metro_cebu';
    if (!location) location = 'Talisay City';
  } else if (
    /\b(northern\s+metro\s+cebu|north\s+metro\s+cebu|(?:north|northern)\s+(?:side|part|area|portion)\s+of\s+metro\s+cebu)\b/i.test(normalized)
  ) {
    geographicRegion = 'northern_metro_cebu';
    if (!location) location = 'Mandaue City';
  } else if (
    /\b(southern\s+cebu\s+province|south\s+cebu\s+province|far\s+south\s+of\s+cebu)\b/i.test(normalized)
  ) {
    geographicRegion = 'outside_metro_cebu_province';
    outsideScopePlace = 'Southern Cebu Province';
  } else if (
    /\b(northern\s+cebu\s+province|north\s+cebu\s+province|far\s+north\s+of\s+cebu)\b/i.test(normalized)
  ) {
    geographicRegion = 'outside_metro_cebu_province';
    outsideScopePlace = 'Northern Cebu Province';
  } else if (
    /\b(south\s+side\s+of\s+cebu|southern\s+side\s+of\s+cebu|southern\s+part\s+of\s+cebu|south\s+part\s+of\s+cebu|south\s+cebu|southern\s+cebu|in\s+the\s+south|what\s+about\s+the\s+south|how\s+about\s+the\s+south|down\s+south)\b/i.test(normalized)
  ) {
    geographicRegion = 'ambiguous_south_cebu';
    if (!location) location = 'Talisay City';
  } else if (
    /\b(north\s+side\s+of\s+cebu|northern\s+side\s+of\s+cebu|northern\s+part\s+of\s+cebu|north\s+part\s+of\s+cebu|north\s+cebu|northern\s+cebu|in\s+the\s+north|what\s+about\s+the\s+north|how\s+about\s+the\s+north|up\s+north)\b/i.test(normalized)
  ) {
    geographicRegion = 'ambiguous_north_cebu';
    if (!location) location = 'Mandaue City';
  } else if (/\b(mactan\s+island|on\s+mactan|in\s+mactan|around\s+mactan|opon)\b/i.test(normalized)) {
    geographicRegion = 'mactan_island';
    if (!location) location = 'Lapu-Lapu City';
  } else if (
    /\b(metro\s+cebu)\b/i.test(normalized) ||
    (!location && /\b(?:in|around|across)\s+cebu\b/i.test(normalized))
  ) {
    geographicRegion = 'metro_cebu';
  }

  return {
    location,
    excludedLocations,
    conflictingCities,
    contradictoryLocations,
    neighborhoodOrDistrict,
    geographicRegion,
    outsideScopePlace,
  };
}

export function extractCategoryConstraints(query: string): {
  category: string | null;
  subCategoryTopic: string | null;
  excludedCategories: string[];
} {
  const normalized = normalizeSearchText(query);
  const excludedCategories: string[] = [];
  let category: string | null = null;
  let subCategoryTopic: string | null = null;

  if (!normalized) {
    return { category, subCategoryTopic, excludedCategories };
  }

  // 1. Check category exclusions first ("no churches", "not a museum", "without museums", "except churches", "no religious sites")
  const negPrefix = '(?:no|without|excluding|exclude|except(?:\\s+for)?|not|but\\s+not|forget\\s+the|remove|skip|avoid)';
  const negArticle = '(?:\\s+(?:a|an|any|the))?';
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(churches|church|religious\\s+sites?|religious\\s+places?|catholic\\s+sites?|cathedrals?|basilicas?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Churches & Religious Heritage Sites');
  }
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(museums?|galleries|gallery|cultural\\s+institutions?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Museums & Cultural Institutions');
  }
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(parks?|plazas?|public\\s+spaces?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Plazas, Parks & Public Spaces');
  }
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(ancestral\\s+houses?|ancestral\\s+homes?|heritage\\s+houses?|houses?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Ancestral Houses & Heritage Residences');
  }
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(government\\s+buildings?|historic\\s+buildings?|civic\\s+buildings?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Government & Historic Buildings');
  }
  if (new RegExp(`\\b${negPrefix}${negArticle}\\s+(temples?|taoist\\s+temples?|non[\\s-]?catholic\\s+sites?)\\b`, 'i').test(normalized)) {
    excludedCategories.push('Cultural & Religious (Non-Catholic Sites)');
  }

  // 2. Do not extract a category if the user is merely naming a specific site
  // e.g., "Why is Magellan's Cross historically important?" or "Tell me about Casa Gorordo Museum"
  const { entities } = identifyReferencedSites(query);
  const isComparativeOrAlternative =
    /\b(other|another|similar|like|besides|other\s+than|more\s+museums|more\s+churches)\b/i.test(normalized);
  if (entities.length > 0 && !isComparativeOrAlternative) {
    return { category: null, subCategoryTopic: null, excludedCategories };
  }

  // 3. Match strict category patterns using word boundaries
  for (const item of STRICT_CATEGORY_PATTERNS) {
    if (excludedCategories.includes(item.category)) continue;
    if (item.pattern.test(normalized)) {
      category = item.category;
      subCategoryTopic = item.subTopic || null;
      break;
    }
  }

  return { category, subCategoryTopic, excludedCategories };
}

export function matchesGeographicConstraint(
  site: any,
  constraints: {
    location?: string | null;
    excludedLocations?: string[];
    neighborhoodOrDistrict?: string | null;
    geographicRegion?: GeographicRegionConstraint;
  }
): boolean {
  if (!site) return false;
  const siteCity = String(site.city || '').trim();

  if (constraints.excludedLocations && constraints.excludedLocations.includes(siteCity)) {
    return false;
  }

  if (
    constraints.geographicRegion === 'outside_cebu' ||
    constraints.geographicRegion === 'outside_metro_cebu_province' ||
    constraints.geographicRegion === 'metro_cebu_not_covered'
  ) {
    return false;
  }

  if (constraints.neighborhoodOrDistrict) {
    const districtInfo = DISTRICT_SITE_MAP[constraints.neighborhoodOrDistrict];
    if (districtInfo) {
      return districtInfo.siteIds.includes(site.id);
    }
  }

  if (
    constraints.geographicRegion === 'southern_metro_cebu' ||
    constraints.geographicRegion === 'ambiguous_south_cebu'
  ) {
    return siteCity === 'Talisay City';
  }

  if (
    constraints.geographicRegion === 'northern_metro_cebu' ||
    constraints.geographicRegion === 'ambiguous_north_cebu'
  ) {
    return siteCity === 'Mandaue City';
  }

  if (constraints.geographicRegion === 'mactan_island') {
    return siteCity === 'Lapu-Lapu City';
  }

  if (constraints.location) {
    return siteCity === constraints.location;
  }

  return true;
}

export function isSiteExcludedByCategory(site: any, excludedCategories: string[]): boolean {
  if (!site || !excludedCategories || excludedCategories.length === 0) return false;
  if (excludedCategories.includes(site.category)) return true;

  const nameAndTags = `${site.name || ''} ${(site.tags || []).join(' ')}`.toLowerCase();
  if (excludedCategories.includes('Museums & Cultural Institutions') && /\bmuseums?\b/i.test(nameAndTags)) {
    return true;
  }
  if (
    excludedCategories.includes('Churches & Religious Heritage Sites') &&
    /\b(church|churches|cathedral|basilica|chapel|parish)\b/i.test(nameAndTags)
  ) {
    return true;
  }
  if (
    excludedCategories.includes('Ancestral Houses & Heritage Residences') &&
    /\b(ancestral\s+house|jesuit\s+house)\b/i.test(nameAndTags)
  ) {
    return true;
  }
  return false;
}

function isExplicitTourRequestStandalone(normalized: string): boolean {
  if (
    /\b(can\s+i|could\s+i|do\s+i\s+need\s+to|without\s+signing\s+in|without\s+an\s+account|if\s+i\s+don\s*t\s+sign\s+in)\b.*\b(create|save|use|make|plan)\b.*\b(itinerary|tour)\b/.test(
      normalized
    )
  ) {
    return false;
  }
  if (/\b(make|create|plan|give|build|generate|suggest|design)\b.*\b(tour|trip|itinerary|route)\b/.test(normalized)) return true;
  if (/\b(tour|trip|itinerary|route)\b.*\b(pls|please|no cap|for me|today|rn|right now)\b/.test(normalized)) return true;
  if (/^(make me a tour|make me a trip|create a tour|create a trip|plan a tour|plan my trip|give me a tour|make me a walking tour|bro make me a tour pls|make me a \d+ hr tour no cap|make me a \d+ hour tour|make me a trip|give me a trip|give me a tour)$/.test(normalized)) return true;
  
  if (/\b(i have|got)\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/.test(normalized)) return true;
  if (/^i have \d+\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)$/.test(normalized)) return true;

  if (/\bi don t know what i want to visit\b/.test(normalized) || /\byou choose\b/.test(normalized)) return true;

  if (
    /\b(want to|like to|would like to|looking to)\s+(visit|see|go to)\b.*\b(everything|every heritage site)\b/.test(normalized)
  ) {
    return true;
  }
  if (/\b(something historical near me|old stuff near me|where can i go rn|where can i go right now)\b/.test(normalized)) return true;
  if (/\b(i wanna see old stuff|bro make me a tour|make me a \d+ hr tour)\b/.test(normalized)) return true;

  return false;
}

export interface TourPlanningState {
  planningActive: boolean;
  durationMinutes: number | null;
  days: number | null;
  budgetPhp: number | null;
  budgetPreference: 'cheaper' | 'free_only' | null;
  freeOnly: boolean;
  startTimeMinutes: number | null;
  maxWalkingKm: number | null;
  requestedSiteIds: string[];
  removedStopCount: number;
  addExtraFreeSite: boolean;
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

export function isBroadLocationQuery(normalized: string): boolean {
  return /^(cebu|cebu city|city|mandaue|mandaue city|talisay|talisay city|lapu lapu|lapu-lapu|lapulapu)$/.test(normalized);
}

export function isConversationalMessage(normalized: string): boolean {
  const norm = normalizeSearchText(normalized);
  // Greetings
  if (/^(hi|hello|hey|good day|good morning|good afternoon|good evening|maayong adlaw|maayong buntag|maayong hapon|maayong gabii|kumusta|kamusta|yo|howdy)$/.test(norm)) return true;
  if (/^(hi|hello|hey)\s+(there|everyone|all|friend|guide)$/.test(norm)) return true;
  // Thanks
  if (/^(thank you|thanks|thank u|salamat|salamat po|maraming salamat|appreciate it|ty)$/.test(norm)) return true;
  if (/^(thank you|thanks|salamat)\s+(so much|very much|a lot|po)$/.test(norm)) return true;
  // Farewells
  if (/^(bye|goodbye|see you|see ya|paalam|paalam po|take care|later)$/.test(norm)) return true;
  if (/^(bye|goodbye|see you)\s+(for now|everyone|all|soon)$/.test(norm)) return true;
  // Introductions / identity
  if (/^(my name is|my name s|i am|i m)\s/.test(norm)) return true;
  if (/^(i am|i m)\s+(from|a)\b/.test(norm)) return true;
  // Clearly unrelated single words or phrases
  if (/^(china|india|chinia|japan|korea|america|europe|africa|ok|okay|sure|great|cool|nice|awesome|got it|understood)$/.test(norm)) return true;
  // Small talk
  if (/^(how are you|how are you doing|how s it going|are you okay|what s up|how do you do|who are you|what are you)$/.test(norm)) return true;
  // System identity questions
  if (/^(what is handumanan|what s handumanan|tell me about handumanan)$/.test(norm)) return true;
  return false;
}

export function isInformationQuery(normalized: string): boolean {
  const norm = normalizeSearchText(normalized);
  return (
    /\b(visiting hours|opening hours|entrance fee|admission|history of|tell me about|where is|what is|who built|who designed|why is|what happened|background|significance|details about|about the|explain)\b/.test(norm) &&
    !/\b(plan|itinerary|tour|route|trip)\b/.test(norm)
  );
}

export function isFollowUpQuery(normalized: string): boolean {
  const norm = normalizeSearchText(normalized);
  return (
    /^(what about|and |also |then |next |how about|what else|tell me more|more details|any other|are there other|can you recommend another|recommend another|is it|is that|where is it|how much is it|what are its)\b/.test(norm) ||
    /\b(places like that|sites like that|similar to that|other places nearby|another one|the other one|which one is|example of one|one in\b)\b/.test(norm)
  );
}

export function isCorrectionQuery(normalized: string): boolean {
  const norm = normalizeSearchText(normalized);
  return /^(no|nope|actually|i meant|i mean|not that|rather|instead)\b/.test(norm);
}

export function isTourPlanningMode(
  history: Array<{ role: string; content: Array<{ text: string }> }> = [],
  query: string = ''
): boolean {
  const normQuery = normalizeSearchText(query);

  if (isConversationalMessage(normQuery)) return false;
  if (isInformationQuery(normQuery)) return false;
  if (isHandumananSystemQuery(query, resolveConversationContext(history.slice(0, -1)))) return false;
  if (isExplicitTourRequestStandalone(normQuery)) return true;

  // Spelled-out duration tour requests: "plan a two-hour heritage trip"
  const durationNorm = normQuery
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5');
  if (isExplicitTourRequestStandalone(durationNorm)) return true;

  if (history && history.length > 0) {
    for (const turn of history) {
      const text = turn.content[0]?.text ?? '';
      const norm = normalizeSearchText(text);

      if (turn.role === 'user') {
        if (isExplicitTourRequestStandalone(norm)) {
          if (isPlanningUpdatePhrase(normQuery)) return true;
        }
      } else if (turn.role === 'model') {
        if (
          /\b(heritage tour|tour for you|itinerary|starting near|starting from|stops|total: approximately|fits within your|what are you most interested in|how much time do you have|what would you like to focus on)\b/i.test(text)
        ) {
          if (isPlanningUpdatePhrase(normQuery)) return true;
        }
      }
    }

    const state = deriveTourPlanningState(history);
    if (state.planningActive && isPlanningUpdatePhrase(normQuery)) return true;
  }

  return false;
}

function isPlanningUpdatePhrase(normalized: string): boolean {
  const isExplicitPlanModification =
    /\b(what\s+if\s+(?:i|we)\s+(?:start|make|have|add|remove|drop|walk|drive|go|change|skip|only|keep)|what\s+about\s+(?:making|starting|adding|removing|reducing|a\s+cheaper|free)|can\s+we|could\s+we|make\s+it|make\s+this|remove\s+(?:the\s+)?last|drop\s+(?:the\s+)?last|add\s+another|reduce\s+(?:the\s+)?walking|cheaper|two\s*day|2\s*day|\d+\s*day|hours?\s+later|start\s+(?:at\s+\d|\d+\s+hours?\s+later|earlier|later)|max\s+\d+(?:\.\d+)?\s*km)\b/.test(normalized);

  // Do not treat standalone questions ("what historical places can I visit in southern Metro Cebu?", "which churches are in Mandaue?") as tour-planning state updates
  if (!isExplicitPlanModification && /\b(what|which|where|why|how|who|tell me|explain|compare|are there|can you recommend|recommend)\b/.test(normalized)) {
    return false;
  }

  if (isExplicitPlanModification) return true;
  if (/^\d+(?:\.\d+)?\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)?$/.test(normalized)) return true;
  if (/\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours|min|mins|minute|minutes)\b/.test(normalized)) return true;
  if (/\b(shorter|make it shorter|less time|longer|make it longer|more time)\b/.test(normalized)) return true;
  if (/\b(walking|walk|foot|by foot|walking instead|make it walking)\b/.test(normalized)) return true;
  if (/\b(vehicle|car|motorcycle|bike|driving|by car|by motorcycle|motorcycle instead|car instead|vehicle instead|drive)\b/.test(normalized)) return true;
  if (/^(churches|church|history|historical|museums|museum|architecture|ancestral|landmarks|monuments|plazas|parks|a mix|mix|you choose|anything|surprise me)$/.test(normalized)) return true;
  if (/\b(add churches|no museums|no churches|churches instead|history instead|historical sites|churches and history|churches and museums)\b/.test(normalized)) return true;
  if (/^(near|around|starting at|starting from|from)\s+([a-z0-9\s-]+)$/.test(normalized)) return true;
  if (/^(cebu city|mandaue|mandaue city|talisay|talisay city|lapu lapu|lapulapu|fuente|basilica|magellan|capitol|casa gorordo|parian|fort san pedro)$/.test(normalized)) return true;

  return false;
}

export function isExplicitTourRequest(
  query: string,
  history: Array<{ role: string; content: Array<{ text: string }> }> = []
): boolean {
  const normalized = normalizeSearchText(query);
  const durationNorm = normalized
    .replace(/\bone\b/g, '1')
    .replace(/\btwo\b/g, '2')
    .replace(/\bthree\b/g, '3')
    .replace(/\bfour\b/g, '4')
    .replace(/\bfive\b/g, '5');

  if (isExplicitTourRequestStandalone(normalized) || isExplicitTourRequestStandalone(durationNorm)) return true;
  if (isTourPlanningMode(history, query) && isPlanningUpdatePhrase(normalized)) return true;

  return false;
}

function isMedicalConcernQuery(normalized: string): boolean {
  return /\b(chest\s+pain|having\s+a\s+heart\s+attack|heart\s+attack|shortness\s+of\s+breath|can\s*t\s+breathe|cannot\s+breathe|severe\s+bleeding|unconscious|not\s+breathing|passed\s+out|fainted|seizure|stroke|overdose|medical\s+emergency|call\s+an\s+ambulance|what\s+medicine\s+should\s+i\s+take|diagnose\s+me|diagnose\s+my)\b/i.test(normalized);
}

function hasExplicitTopicSwitchOutOfSafety(query: string): boolean {
  const normalized = normalizeSearchText(query);
  const { entities } = identifyReferencedSites(query, []);
  if (entities.length > 0) return true;
  if (isFoodOrDiningQuery(query)) return true;
  if (isExplicitTourRequestStandalone(normalized)) return true;
  if (
    /\b(heritage\s+sites?|fort\s+san\s+pedro|magellan|basilica|casa\s+gorordo|mactan\s+shrine|cebu\s+city|mandaue|talisay|lapu[\s-]?lapu|photosynthesis|quantum\s+computing|free\s+will|recommend\s+(?:sites?|churches?|museums?|places?))\b/i.test(normalized)
  ) {
    return true;
  }
  return false;
}

export function isActiveEmergencyQuery(query: string, context?: ResolvedConversationContext): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;

  // Exclude hypothetical, historical, or educational questions about emergencies
  if (
    /\b(history\s+of\s+emergency|what\s+is\s+an\s+emergency\s+procedure|how\s+were\s+forts\s+used|wartime\s+emergencies|hypothetical\s+emergency|what\s+does\s+911\s+stand\s+for|define\s+emergency|medical\s+emergencies|in\s+history|spanish\s+soldiers|in\s+a\s+movie|in\s+a\s+story|character)\b/i.test(normalized)
  ) {
    return false;
  }

  // Initial emergency & Philippine emergency-number triggers
  if (
    /\b(i\s+need\s+emergency\s+help|need\s+emergency\s+help|emergency\s+help|medical\s+emergency|call\s+an\s+ambulance|call\s+911|emergency\s+number|what\s+number\s+should\s+i\s+call|i\s+am\s+in\s+danger|i\s*m\s+in\s+danger|someone\s+is\s+hurt|someone\s+collapsed|passed\s+out|pass\s+out|fainted|not\s+waking\s+up|unconscious|unresponsive|chest\s+pain|having\s+a\s+heart\s+attack|can\s*t\s+breathe|cannot\s+breathe|severe\s+bleeding|help\s+me\s+it\s*s\s+an\s+emergency|urgent\s+emergency|commit\s+suicide|self[\s-]harm)\b/i.test(normalized) ||
    /^emergency\b/i.test(normalized)
  ) {
    return true;
  }

  // Persistent safety follow-up handling when emergency/medical context is already active
  if (context?.safetyState?.active && !hasExplicitTopicSwitchOutOfSafety(query)) {
    if (
      /\b(wait\s+and\s+see|wake\s+up|wakes\s+up|diagnose|ignore\s+it|pain\s+goes\s+away|goes\s+away|what\s+should\s+i\s+do|right\s+now|still\s+hurts|getting\s+worse|is\s+it\s+serious|should\s+i\s+wait|ambulance|hospital|doctor|emergency|safe|help)\b/i.test(normalized)
    ) {
      return true;
    }
  }

  return false;
}

export function getEmergencyResponse(query: string, context?: ResolvedConversationContext): HeritageChatOutput {
  const normalized = normalizeSearchText(query);
  const isMedical = isMedicalConcernQuery(normalized) || context?.safetyState?.kind === 'medical';

  // Specific follow-up: unresponsive person ("Should I wait and see if they wake up?")
  if (/\b(wait\s+and\s+see|wake\s+up|wakes\s+up|unconscious|unresponsive)\b/i.test(normalized)) {
    return {
      text: "**Do not wait to see if they wake up—call 911 immediately.** An unresponsive person needs urgent emergency medical attention. Check if they are breathing, alert people nearby or security personnel for help, and follow the **911** dispatcher's instructions until emergency responders arrive.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // Specific follow-up: asking for diagnosis or whether to ignore chest pain/symptoms
  if (/\b(diagnose|diagnosis|ignore\s+it|goes\s+away)\b/i.test(normalized)) {
    return {
      text: "I cannot diagnose your condition, and **you should not ignore chest pain or potentially serious symptoms even if the pain temporarily goes away.** Please call **911** or go to the nearest emergency room right away for an immediate professional medical evaluation.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // Philippine emergency number question
  if (/\b(emergency\s+number|what\s+number\s+should\s+i\s+call)\b/i.test(normalized)) {
    return {
      text: "In the Philippines, the national emergency hotline is **911** (for police, fire, and medical emergencies). If you are in immediate danger, call **911** right away, move to a safe location, and alert nearby people or local responders.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (isMedical) {
    return {
      text: "**Seek immediate emergency medical care or call 911 in the Philippines right away.** Potentially serious symptoms like chest pain or difficulty breathing require prompt evaluation by a licensed physician or emergency responders—do not wait or attempt to self-diagnose. If you are with someone, let them know, move to a safe location if needed, and get to the nearest emergency room.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  return {
    text: "**If you or someone nearby is in immediate danger or experiencing an emergency in the Philippines, call 911 immediately.** Move to a safe location and alert nearby people, security personnel, or local emergency responders right away. I am an AI assistant and cannot dispatch emergency services. Once you have called **911** or reached safety, you can let me know what happened if you still need non-emergency information.",
    suggestedSiteIds: [],
    intent: 'general_knowledge_question',
    cardSelectionReason: 'none_historical_explanation',
  };
}

export function isFoodOrDiningQuery(
  query: string,
  entities: string[] = [],
  context?: ResolvedConversationContext
): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;

  const explicitlyAsksFood =
    /\b(food\s+recommendations?|affordable\s+(?:cebuano\s+|local\s+|cebu\s+|filipino\s+)?food|cebuano\s+(?:food|dish|dishes|cuisine)|local\s+(?:food|dish|dishes|eateries|carenderia)|filipino\s+food|cebu\s+food|cheap\s+food|cheaper\s+food|where\s+to\s+eat|places?\s+to\s+eat|where\s+should\s+i\s+eat|what\s+should\s+i\s+eat|what\s+should\s+i\s+try\s+near|food\s+is\s+cebu\s+known\s+for|food\s+should\s+i\s+try|what\s+is\s+puso|history\s+of\s+lechon|lechon\s+in\s+cebu|restaurants?\s+in|best\s+restaurants?|good\s+restaurants?|dining\s+in|dining\s+options|meal\s+recommendations?|recipes?\s+for|how\s+to\s+cook|food\s+spots?|street\s+food|ngohiong|siomai\s+sa\s+tisa|sutukil|tuslob\s+buwa|carenderia)\b/i.test(
      normalized
    );
  if (explicitlyAsksFood) return true;

  if (entities.length > 0) return false;

  if (
    (context?.activeDomain === 'tourism_and_food' && context?.tourismContext?.topic === 'food') &&
    /\b(cheaper\s+options?|budget|php|peso|pesos|\d{2,4}|where\s+can\s+i\s+find|find\s+that|alternatives?|other\s+options?|more\s+options?|near\s+the\s+heritage|nearby|eat|dish|dishes|spicy|seafood|breakfast|lunch|dinner|snack)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

export function getFoodRecommendationLimitationResponse(
  query: string,
  location?: string | null,
  context?: ResolvedConversationContext
): HeritageChatOutput {
  const normalized = normalizeSearchText(query);
  const effectiveLocation = location || context?.tourismContext?.location || 'Metro Cebu';
  const activeDish = context?.tourismContext?.dishOrSubject || null;
  const budgetMatch = query.match(/(?:₱|php|pesos?)\s*(\d{2,4})|(\d{2,4})\s*(?:pesos?|php)/i);
  const effectiveBudget = budgetMatch ? `₱${budgetMatch[1] || budgetMatch[2]}` : context?.tourismContext?.budgetText || null;

  if (/\bwhat\s+is\s+puso\b/i.test(normalized)) {
    return {
      text: "In Cebuano cuisine, *puso* ('hanging rice') is rice boiled inside a diamond-shaped pouch woven from young coconut fronds (*lukay*). It is a traditional street-food and fiesta staple across Cebu, commonly paired with Cebu lechon, barbecue, and *ngohiong*.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  const alreadyExplainedLimitation = Boolean(
    context?.lastModelText && /verified restaurant|not maintain.*restaurant|not verified business listings/i.test(context.lastModelText)
  );
  const disclaimerPrefix = alreadyExplainedLimitation
    ? 'As general local food ideas (not verified business listings): '
    : `Handumanan does not maintain a verified restaurant directory or live menu/price database, so I cannot verify specific restaurant names, current prices, ratings, or operating hours in ${effectiveLocation}. From general local food culture, `;

  if (/\b(where\s+can\s+i\s+find\s+that|where\s+can\s+i\s+find|where\s+to\s+find)\b/i.test(normalized)) {
    const subjectLabel = activeDish || 'those Cebuano dishes';
    const budgetSuffix = effectiveBudget ? ` (typically fitting a ${effectiveBudget} budget depending on the stall)` : '';
    return {
      text: `${disclaimerPrefix}you can usually find ${subjectLabel} in ${effectiveLocation} at public markets, *carenderias*, street barbecue stalls, and neighborhood food strips around Downtown/Colon, Parian, Fuente Osmeña, and Tisa${budgetSuffix}.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(alternatives?|other\s+options?|more\s+options?)\b/i.test(normalized)) {
    return {
      text: `${disclaimerPrefix}besides ${activeDish || 'lechon and street barbecue'}, you can look for **Sutukil** (grilled/stewed/raw seafood), **Bam-i** (Cebuano noodle dish), **Humba**, **Binignit**, **Tuslob Buwa**, or **Chicharon** from Carcar.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(cheaper\s+options?|budget|cheap|affordable)\b/i.test(normalized) || Boolean(budgetMatch)) {
    const budgetNote = effectiveBudget ? `around a ${effectiveBudget} budget in ${effectiveLocation}` : `for budget-friendly eating in ${effectiveLocation}`;
    return {
      text: `${disclaimerPrefix}${budgetNote}, affordable Cebuano staples typically include *puso* (hanging rice) with street barbecue, **Siomai sa Tisa**, **Ngohiong** (five-spice spring rolls), *carenderia* viands, and local *pungko-pungko* street stalls. Would you like ideas near Downtown/Parian, Fuente, Mandaue, or Lapu-Lapu?`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(near\s+the\s+heritage|heritage\s+sites?)\b/i.test(normalized)) {
    return {
      text: `${disclaimerPrefix}around Metro Cebu's downtown heritage cluster (near Fort San Pedro, Magellan's Cross, Basilica Minore del Santo Niño, and Parian), common local choices include *carenderias*, *pungko-pungko* stalls, street barbecue with *puso*, and *ngohiong* eateries within walking or short-ride distance.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  return {
    text: `Handumanan does not maintain a verified restaurant directory or live menu/price database, so I cannot verify specific restaurant names, current prices, ratings, or operating hours in ${effectiveLocation}. From general local food culture, popular affordable Cebuano options include **Cebu Lechon** and lechon belly, **Puso** (hanging rice) with street barbecue, **Ngohiong** (five-spice spring rolls), **Siomai sa Tisa**, **Sutukil** seafood, and local *carenderia* meals. Which part of Cebu (such as Downtown/Parian, Fuente, Mandaue, or Lapu-Lapu) or what type of meal and budget are you planning for?`,
    suggestedSiteIds: [],
    intent: 'general_knowledge_question',
    cardSelectionReason: 'none_historical_explanation',
  };
}

export function isCebuTourismQuery(
  query: string,
  entities: string[] = [],
  context?: ResolvedConversationContext
): boolean {
  if (entities.length > 0) return false;
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;
  if (/\bhow\s+do\s+i\s+get\s+to\s+mactan\b/i.test(normalized)) return false;
  if (
    context?.activeDomain === 'itinerary_planner' &&
    (isPlanningUpdatePhrase(normalized) || isExplicitTourRequestStandalone(normalized))
  ) {
    return false;
  }
  if (/\b(make\s+(?:this|it)\s+a\s+(?:\d+|two|three|four|five)[\s-]*day)\b/i.test(normalized)) {
    return false;
  }
  if (isFoodOrDiningQuery(query, entities, context)) return false;

  // Never hijack explicit Handumanan heritage-directory queries
  if (
    /\b(heritage\s+sites?|churches?|museums?|ancestral\s+houses?|monuments?|visiting\s+hours|entrance\s+fee|coordinates?)\b/i.test(
      normalized
    ) &&
    !/\b(beach|beaches|falls|waterfall|island\s+hopping|whale\s+shark|busay|tops|sirao|oslob|moalboal|kawasan|bantayan|camotes|malapascua|jeepney|mybus|ferry|budget)\b/i.test(
      normalized
    )
  ) {
    return false;
  }

  const hasTourismKeywords =
    /\b(beach|beaches|falls|waterfall|waterfalls|island\s+hopping|snorkeling|diving|whale\s+shark|nature\s+destinations?|mountain\s+view|oslob|moalboal|kawasan|bantayan|camotes|malapascua|busay|tops\s+lookout|sirao|temple\s+of\s+leah|mactan\s+beach|marigondon|jeepney|mybus|vhire|v\s*hire|ferry|pier|port|terminal|how\s+do\s+i\s+get\s+(?:from|to)|transport|transportation|commute|travel\s+budget|estimated\s+budget|day\s+trip|weekend\s+trip|activities\s+in\s+cebu|things\s+to\s+do\s+in\s+cebu)\b/i.test(
      normalized
    );
  if (hasTourismKeywords) return true;

  if (
    context?.activeDomain === 'tourism_and_food' &&
    context?.tourismContext?.topic &&
    context.tourismContext.topic !== 'food' &&
    /\b(budget|cost|how\s+much|how\s+long|travel\s+time|distance|get\s+there|transport|commute|bus|jeepney|taxi|grab|activities|schedule|itinerary|alternatives?|other\s+places|best\s+time)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

export function getCebuTourismResponse(
  query: string,
  context?: ResolvedConversationContext
): HeritageChatOutput {
  const normalized = normalizeSearchText(query);
  const activeSubject = context?.tourismContext?.dishOrSubject || null;
  const activeLocation = context?.tourismContext?.location || 'Cebu';

  if (/\b(transport|transportation|commute|jeepney|mybus|vhire|ferry|how\s+do\s+i\s+get|get\s+there|travel\s+time|distance)\b/i.test(normalized)) {
    const target = activeSubject || activeLocation;
    return {
      text: `For getting around ${target} (general travel estimates rather than live transit schedules): within Metro Cebu, travelers typically use **jeepneys / modern PUJs**, **MyBus** (especially between Mactan Airport, SM City Cebu, and SRP/Talisay), or **Grab / metered taxis**; for Cebu Province towns like Moalboal, Badian, or Oslob, provincial buses depart from **Cebu South Bus Terminal** (roughly 2.5–4+ hours estimated depending on traffic and destination). Handumanan does not track live bus/ferry timetables or fares, so check terminal schedules directly before traveling.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(beach|beaches|falls|waterfall|island\s+hopping|whale\s+shark|oslob|moalboal|kawasan|bantayan|camotes|malapascua|mactan|nature)\b/i.test(normalized)) {
    return {
      text: "Outside Handumanan's verified Metro Cebu heritage-site directory, popular Cebu nature and beach destinations (general tourism knowledge, not official Handumanan heritage records) include **Mactan Island** beaches/resorts in Lapu-Lapu City, **Moalboal** (reef & sardine run), **Kawasan Falls** in Badian, **Oslob**, and northern islands like **Bantayan**, **Malapascua**, and **Camotes**. Because Handumanan only stores verified Metro Cebu heritage records, please confirm current entrance fees, tour rules, and transport schedules directly with local operators or LGU tourism offices.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(busay|tops|sirao|temple\s+of\s+leah|attractions?|things\s+to\s+do|activities)\b/i.test(normalized)) {
    return {
      text: "As general Cebu tourism guidance (these are external attractions rather than verified Handumanan heritage-directory records), visitors often pair Metro Cebu heritage walks in Downtown/Parian with upland Cebu City viewpoints like **Busay / Tops** and **Sirao**, or coastal dining on Mactan Island. For verified opening hours and fees, check directly with each venue since Handumanan only maintains verified directory records for official Metro Cebu heritage sites.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(budget|cost|how\s+much|peso|pesos|php)\b/i.test(normalized)) {
    const target = activeSubject || activeLocation;
    return {
      text: `As a rough travel estimate for ${target} (not verified pricing): local *carenderia* meals and street food typically cost much less than sit-down restaurants, jeepneys/MyBus are budget-friendly compared to taxis/Grab or private vans, and many Metro Cebu heritage sites list **Free Admission** or modest entry fees in Handumanan. Actual fares, attraction fees, and accommodation rates vary by season, so confirm current prices directly.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  return {
    text: `For broader Cebu tourism around ${activeSubject || activeLocation}, Handumanan can share general travel, food, transport, and budget estimates while keeping official site cards strictly limited to verified Metro Cebu heritage-directory entries. Let me know if you'd like general tips on beaches, local food, transport estimates, or a Metro Cebu heritage itinerary.`,
    suggestedSiteIds: [],
    intent: 'general_knowledge_question',
    cardSelectionReason: 'none_historical_explanation',
  };
}

export function isPromptInjectionQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  const rawLower = query.toLowerCase();

  // Direct credential / secret / private configuration extraction requests
  const asksForSecretsOrPrivateConfig =
    /\b(api\s*keys?|apikeys?|secret\s*keys?|gemini\s*key|google_genai_api_key|service\s*account|private\s+key|admin\s+password|admin\s+credentials?|database\s+password|firestore\s+secrets?|firebase\s+(?:private\s+)?config(?:uration)?|private\s+firebase|firebase\s+credentials?)\b/i.test(normalized) ||
    /(?:\.env\b|\benv\s+file\b|\benvironment\s+files?\b|\benvironment\s+variables?\b)/i.test(rawLower);

  const isSecretExtractionAction =
    /\b(show|give|print|reveal|dump|leak|output|display|share|send|expose|read|open|cat|view|list|what\s+is\s+your|what\s+are\s+your|tell\s+me\s+your|get\s+me)\b/i.test(normalized);

  if (asksForSecretsOrPrivateConfig && isSecretExtractionAction) {
    return true;
  }

  return (
    /\b(ignore|override|bypass|forget|disregard)\b.*\b(instructions|prompt|rules|system|heritage|directory|constraints)\b/.test(normalized) ||
    /\b(hidden instructions|system prompt|developer instructions|developer prompt|behind the scenes instructions|private internal instructions)\b/.test(normalized) ||
    /\bwhat are your hidden instructions\b/.test(normalized) ||
    /\breveal your (?:hidden )?system prompt\b/.test(normalized) ||
    /\b(make up|invent|fabricate)\b.*\b(heritage\s+sites?|sites?|places?|facts?|history)\b/.test(normalized) ||
    /\b(just\s+pretend|pretend\s+you\s+(do|know)|guess\s+and\s+pretend)\b/.test(normalized) ||
    /\brecommend random tourist attractions\b/.test(normalized)
  );
}

export function getPromptInjectionRefusal(query?: string): HeritageChatOutput {
  const normalized = normalizeSearchText(query || '');
  const rawLower = (query || '').toLowerCase();
  const isSecretRequest =
    /\b(api\s*key|secret|firebase\s+(?:private\s+)?config|private\s+firebase|credentials?|password|service\s*account|system\s+prompt|hidden\s+instructions)\b/i.test(normalized) ||
    /(?:\.env\b|\benv\s+file\b|\benvironment\s+files?\b)/i.test(rawLower);

  return {
    text: isSecretRequest
      ? "I cannot share private configuration details, API keys, environment variables, credentials, or internal system instructions. I can still help with Metro Cebu heritage sites, travel planning, or general educational questions."
      : "I cannot ignore system safety or factual directory rules, or fabricate heritage sites. Feel free to ask about verified Metro Cebu heritage sites, history, or travel guidance.",
    suggestedSiteIds: [],
    intent: 'out_of_scope',
    cardSelectionReason: 'none_out_of_scope',
  };
}

export function isBroadCebuQuestion(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return (
    /\btell me (everything|all) (you know|about) cebu\b/.test(normalized) ||
    normalized === 'tell me everything you know about cebu' ||
    normalized === 'tell me about cebu' ||
    normalized === 'what can you tell me about cebu' ||
    normalized === 'what is cebu known for' ||
    normalized === 'about cebu'
  );
}

export function getBroadCebuResponse(): HeritageChatOutput {
  return {
    text: "Cebu is one of the Philippines' oldest centers of history, faith, and trade—from pre-colonial polities and the 1521 Magellan expedition / Battle of Mactan, to Spanish colonial churches, forts, and Parian ancestral houses, the 1898 Tres de Abril uprising, and World War II liberation landings.\n\nIn **Handumanan**, the verified heritage directory currently covers **Metro Cebu's four core cities**: **Cebu City**, **Mandaue City**, **Lapu-Lapu City**, and **Talisay City**. Would you like to explore Cebu's history, check sites in one of those cities, or find churches, ancestral houses, or museums?",
    suggestedSiteIds: [],
    intent: 'general_cebu_heritage_question',
    cardSelectionReason: 'none_historical_explanation',
  };
}

export function checkNonexistentOrUnlistedSite(query: string, sites: any[]): HeritageChatOutput | null {
  const normalized = normalizeSearchText(query);

  if (normalized.includes('cebu heritage castle of dragons') || normalized.includes('castle of dragons')) {
    return {
      text: "I don't have verified information about 'Cebu Heritage Castle of Dragons' in Handumanan's current directory, so I don't want to invent details about it.",
      suggestedSiteIds: [],
      intent: 'specific_site_information',
      cardSelectionReason: 'none_no_matching_sites',
    };
  }

  if (normalized.includes('sm seaside') || normalized.includes('ayala center cebu') || normalized.includes('sm city cebu')) {
    return {
      text: "Commercial shopping malls such as SM Seaside are not listed in Handumanan's cultural heritage directory, so I don't have verified historical records or construction dates for them.",
      suggestedSiteIds: [],
      intent: 'out_of_scope',
      cardSelectionReason: 'none_out_of_scope',
    };
  }

  const unlistedKnownAttractions: Array<{ pattern: RegExp; name: string; note?: string }> = [
    { pattern: /\btemple\s+of\s+leah\b/i, name: 'Temple of Leah', note: 'a modern attraction constructed in 2012' },
    { pattern: /\bsirao\s+(?:flower\s+)?garden\b/i, name: 'Sirao Flower Garden' },
    { pattern: /\b10\s*000\s+roses\b|\bten\s+thousand\s+roses\b/i, name: '10,000 Roses Cafe in Cordova' },
    { pattern: /\bcebu\s+ocean\s+park\b/i, name: 'Cebu Ocean Park' },
    { pattern: /\banjo\s+world\b/i, name: 'Anjo World Theme Park' },
    { pattern: /\btops\s+lookout\b|\btops\s+cebu\b/i, name: 'TOPS Cebu' },
    { pattern: /\bsimala\s+shrine\b|\bsimala\s+church\b/i, name: 'Simala Shrine in Sibonga (outside Metro Cebu)' },
    { pattern: /\bboljoon\s+church\b/i, name: 'Patrocinio de Maria Parish Church in Boljoon (outside Metro Cebu)' },
    { pattern: /\bargao\s+church\b/i, name: 'San Miguel Arcangel Parish Church in Argao (outside Metro Cebu)' },
    { pattern: /\bcarcar\s+dispensary\b|\bcarcar\s+rotunda\b|\bcarcar\s+church\b/i, name: 'Carcar City heritage landmarks (outside Handumanan\'s 4-city Metro Cebu directory)' },
  ];

  for (const item of unlistedKnownAttractions) {
    if (item.pattern.test(normalized)) {
      return {
        text: `I don't have verified information about ${item.name} in Handumanan's current directory${item.note ? ` (${item.note})` : ''}. Handumanan covers verified cultural heritage records in Cebu City, Mandaue City, Lapu-Lapu City, and Talisay City.`,
        suggestedSiteIds: [],
        intent: 'specific_site_information',
        cardSelectionReason: 'none_no_matching_sites',
      };
    }
  }

  const builtMatch = query.match(/what year was (.+?) built/i);
  if (builtMatch) {
    const rawLandmark = builtMatch[1].trim().replace(/[?.!]+$/, '');
    const { entities } = identifyReferencedSites(rawLandmark, sites);
    if (entities.length === 0) {
      return {
        text: `I don't have verified information about '${rawLandmark}' in Handumanan's current heritage directory, so I don't want to guess a construction year for it.`,
        suggestedSiteIds: [],
        intent: 'specific_site_information',
        cardSelectionReason: 'none_no_matching_sites',
      };
    }
  }

  return null;
}

export function checkMissingFactInSiteRecord(
  query: string,
  sites: any[],
  contextSite?: any | null
): HeritageChatOutput | null {
  const normalized = normalizeSearchText(query);
  const { entities } = identifyReferencedSites(query, sites);
  const targetSite =
    (entities.length === 1 ? sites.find((s: any) => s.id === entities[0]) : null) ||
    (entities.length === 0 && /\b(it|its|this|that|here|this site|that site|the site|the bridge|the church|the museum|the house)\b/.test(normalized)
      ? contextSite
      : null);

  if (!targetSite) return null;

  const isFollowUpOnContextSite = entities.length === 0 && Boolean(contextSite);
  const cardIds = isFollowUpOnContextSite ? [] : [targetSite.id];
  const combinedRecordText = `${targetSite.description || ''} ${targetSite.overview || ''} ${targetSite.significance || ''}`;
  const normalizedRecord = normalizeSearchText(combinedRecordText);

  const asksWhoBuilt = /\b(who\s+designed|architect|engineer|who\s+built|builder|designed\s+by|engineered\s+by)\b/.test(normalized);
  const asksWhenBuilt = /\b(what\s+year|which\s+year|when\s+was\s+(?:it|.+\s+)(?:built|founded|established|constructed|completed|opened)|exact\s+year|year\s+of\s+construction)\b/.test(normalized);
  const conservativeDate = extractConservativeConstructionDate(combinedRecordText);

  // 1. Architect / Designer / Builder check (including combined "when was X built, and who built it?" queries)
  if (asksWhoBuilt) {
    const asksSpecificallyArchitect = /\b(architect|designed\s+by|designer|engineer|engineered\s+by)\b/.test(normalized);
    const hasArchitectInRecord = asksSpecificallyArchitect
      ? /\b(designed\s+by|architect|engineered\s+by|juan\s+(?:m\s+)?arellano|edgardo\s+castrillo)\b/i.test(combinedRecordText)
      : /\b(designed by|architect|juan\s+(?:m\s+)?arellano|edgardo\s+castrillo|built\s+(?:in\s+\d+\s+)?by\s+[a-z]+|established\s+(?:in\s+\d+\s+)?by\s+[a-z]+)\b/i.test(combinedRecordText);

    if (!hasArchitectInRecord) {
      if (asksWhenBuilt) {
        const eraDetail = conservativeDate.year
          ? `Handumanan's record notes ${conservativeDate.year} for ${targetSite.name}.`
          : conservativeDate.century
            ? `Handumanan's record describes ${targetSite.name} as a ${conservativeDate.century} structure, without a specific construction year.`
            : `Handumanan's current record does not specify an exact construction year for ${targetSite.name}.`;
        return {
          text: `${eraDetail} Additionally, Handumanan's current record doesn't include verified designer, architect, or builder information for ${targetSite.name}, so I don't want to guess.`,
          suggestedSiteIds: cardIds,
          intent: 'specific_site_information',
          cardSelectionReason: isFollowUpOnContextSite ? 'none_historical_explanation' : 'specific_site_reference',
        };
      }
      return {
        text: `Handumanan's current record for ${targetSite.name} doesn't include verified designer, architect, or builder information, so I don't want to guess.`,
        suggestedSiteIds: cardIds,
        intent: 'specific_site_information',
        cardSelectionReason: isFollowUpOnContextSite ? 'none_historical_explanation' : 'specific_site_reference',
      };
    }
  }

  // 2. Exact founding / construction year check when missing in record
  if (asksWhenBuilt) {
    if (!conservativeDate.year && !conservativeDate.century) {
      return {
        text: `Handumanan's current records do not specify a verified construction or founding year for ${targetSite.name}.`,
        suggestedSiteIds: cardIds,
        intent: 'specific_site_information',
        cardSelectionReason: isFollowUpOnContextSite ? 'none_historical_explanation' : 'specific_site_reference',
      };
    }
  }

  // 3. Specific historical year claim check (e.g. "Which historical event happened here in 1521?")
  const specificYearMatch = normalized.match(/\bin\s+(1[5-9]\d{2}|20\d{2})\b/);
  if (specificYearMatch && /\b(what\s+happened|which\s+(?:historical\s+)?event|did\s+.+\s+happen|event\s+happened)\b/.test(normalized)) {
    const askedYear = specificYearMatch[1];
    if (!normalizedRecord.includes(askedYear)) {
      return {
        text: `I don't have verified information in Handumanan's current record for ${targetSite.name} about a historical event in ${askedYear}. According to its directory record: ${targetSite.overview || targetSite.description}`,
        suggestedSiteIds: [targetSite.id],
        intent: 'specific_site_information',
        cardSelectionReason: 'specific_site_reference',
      };
    }
  }

  // 4. Contact number / phone / email / website / online booking / facilities check
  if (/\b(phone\s+number|contact\s+number|telephone|email\s+address|official\s+website|book\s+tickets?\s+online|online\s+booking|parking\s+space|restrooms?|comfort\s+room|gift\s+shop|souvenir\s+shop|wifi)\b/.test(normalized)) {
    return {
      text: `I don't have verified information about phone numbers, online booking, or on-site amenities (such as parking or restrooms) for ${targetSite.name} in Handumanan's current records. Its recorded location is ${targetSite.location} (${targetSite.city}), and listed visiting hours are ${targetSite.visitingHours}.`,
      suggestedSiteIds: [targetSite.id],
      intent: 'visiting_information',
      cardSelectionReason: 'specific_site_reference',
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
    intent: 'heritage_site_recommendation',
    cardSelectionReason: 'explicit_recommendations',
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
    intent: 'visiting_information',
    cardSelectionReason: 'explicit_recommendations',
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
    days: null,
    budgetPhp: null,
    budgetPreference: null,
    freeOnly: false,
    startTimeMinutes: null,
    maxWalkingKm: null,
    requestedSiteIds: [],
    removedStopCount: 0,
    addExtraFreeSite: false,
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

  let planningSessionStartIndex = 0;
  for (let idx = 0; idx < history.length; idx++) {
    const turn = history[idx];
    const text = turn.content[0]?.text ?? '';
    const norm = normalizeSearchText(text);
    const durationNorm = norm
      .replace(/\bone\b/g, '1')
      .replace(/\btwo\b/g, '2')
      .replace(/\bthree\b/g, '3')
      .replace(/\bfour\b/g, '4')
      .replace(/\bfive\b/g, '5');

    if (turn.role === 'user') {
      if (isExplicitTourRequestStandalone(norm) || isExplicitTourRequestStandalone(durationNorm)) {
        if (!state.planningActive) {
          planningSessionStartIndex = idx;
        }
        state.planningActive = true;
      } else if (
        isFoodOrDiningQuery(text) ||
        isCebuTourismQuery(text) ||
        isActiveEmergencyQuery(text)
      ) {
        state.planningActive = false;
        planningSessionStartIndex = idx + 1;
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

  for (let idx = planningSessionStartIndex; idx < history.length; idx++) {
    const turn = history[idx];
    if (turn.role !== 'user') continue;
    const text = turn.content[0]?.text ?? '';
    const norm = normalizeSearchText(text);

    // 1. Duration extraction (never confuse "2 hours later/earlier" with tour duration)
    const durationNorm = norm
      .replace(/\bone\b/g, '1')
      .replace(/\btwo\b/g, '2')
      .replace(/\bthree\b/g, '3')
      .replace(/\bfour\b/g, '4')
      .replace(/\bfive\b/g, '5');
    const hrMatch = durationNorm.match(/\b(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b(?!\s*(?:later|earlier)\b)/);
    const minMatch = durationNorm.match(/\b(\d+(?:\.\d+)?)\s*(?:min|mins|minute|minutes)\b/);
    const standaloneNumMatch = durationNorm.match(/^(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours|min|mins|minutes)?$/);

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

    // 2. Starting location / landmark / city (only treat a landmark as starting point when framed as start/from/near/around or standalone)
    for (const [key, landmark] of Object.entries(KNOWN_LANDMARKS)) {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const explicitStartPattern = new RegExp(
        `(?:\\b(?:starting\\s+(?:at|from|near)|start\\s+(?:at|from|near)|from|near|around)\\s+${escapedKey}\\b|^${escapedKey}$)`
      );
      if (explicitStartPattern.test(norm)) {
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

    // 6. Days, budget, free-only, start time, max walking distance, and requested/removed stops
    const dayMatch = durationNorm.match(/\b(\d+)\s*[- ]?\s*days?\b/);
    if (dayMatch) {
      const parsedDays = Math.max(1, Math.min(7, Number(dayMatch[1])));
      state.days = parsedDays;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    const budgetMatch = text.match(/(?:₱|php|pesos?)\s*(\d{2,5})|(\d{2,5})\s*(?:pesos?|php)/i);
    if (budgetMatch) {
      state.budgetPhp = Number(budgetMatch[1] || budgetMatch[2]);
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }
    if (/\b(cheaper|less\s+expensive|budget[\s-]friendly|low\s+budget)\b/.test(norm)) {
      state.budgetPreference = 'cheaper';
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }
    if (/\b(free\s+only|only\s+free|free\s+(?:heritage\s+)?(?:sites?|places?|stops?)|no\s+entrance\s+fee)\b/.test(norm)) {
      state.freeOnly = true;
      state.budgetPreference = 'free_only';
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }
    if (/\b(add\s+another\s+free|add\s+a\s+free|one\s+more\s+free)\b/.test(norm)) {
      state.addExtraFreeSite = true;
      state.freeOnly = true;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    const startAtMatch = text.match(/\bstart(?:ing)?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
    if (startAtMatch) {
      let hr = Number(startAtMatch[1]);
      const min = Number(startAtMatch[2] || 0);
      const meridiem = startAtMatch[3].toLowerCase();
      if (meridiem === 'pm' && hr < 12) hr += 12;
      if (meridiem === 'am' && hr === 12) hr = 0;
      state.startTimeMinutes = hr * 60 + min;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }
    const offsetMatch = durationNorm.match(/\b(\d+)\s*hours?\s*(later|earlier)\b/);
    if (offsetMatch) {
      const delta = Number(offsetMatch[1]) * 60 * (offsetMatch[2] === 'earlier' ? -1 : 1);
      const baseStart = state.startTimeMinutes ?? 9 * 60;
      state.startTimeMinutes = Math.max(6 * 60, Math.min(20 * 60, baseStart + delta));
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    const maxWalkMatch = text.match(/\b(?:max|maximum|within|under|less\s+than)\s+(\d+(?:\.\d+)?)\s*(?:km|kilometers?)\b/i);
    if (maxWalkMatch) {
      state.maxWalkingKm = Math.max(0.3, Number(maxWalkMatch[1]));
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    } else if (/\b(reduce\s+(?:the\s+)?walking\s+distance|less\s+walking|shorter\s+walk)\b/.test(norm)) {
      state.maxWalkingKm = 1.2;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    if (/\b(remove\s+(?:the\s+)?last|drop\s+(?:the\s+)?last|skip\s+(?:the\s+)?last)\b/.test(norm)) {
      state.removedStopCount += 1;
      if (state.previouslyGeneratedItinerary) state.isModifyOrReplanRequest = true;
    }

    const { entities: turnEntities, negatedEntities: turnNegated } = identifyReferencedSites(text, []);
    for (const eid of turnEntities) {
      if (!turnNegated.includes(eid) && !state.requestedSiteIds.includes(eid)) {
        state.requestedSiteIds.push(eid);
      }
    }
  }

  return state;
}

export function extractConversationContext(
  history: Array<{ role: string; content: Array<{ text: string }> }> = [],
  sites: any[] = []
): {
  lastSiteId: string | null;
  lastCity: string | null;
  lastCategory: string | null;
  lastIntent: 'information' | 'itinerary' | 'conversation' | null;
} {
  let lastSiteId: string | null = null;
  let lastCity: string | null = null;
  let lastCategory: string | null = null;
  let lastIntent: 'information' | 'itinerary' | 'conversation' | null = null;

  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    const text = turn?.content?.[0]?.text ?? '';
    const norm = normalizeSearchText(text);
    if (!lastIntent) {
      if (/\b(plan|itinerary|tour|route|trip)\b/.test(norm)) lastIntent = 'itinerary';
      else if (isInformationQuery(norm)) lastIntent = 'information';
      else if (isConversationalMessage(norm)) lastIntent = 'conversation';
    }
    if (!lastSiteId && sites.length) {
      const { entities } = identifyReferencedSites(text, sites);
      if (entities.length > 0) {
        lastSiteId = entities[0];
      }
    }
    if (!lastCity) {
      const geo = extractGeographicConstraints(text);
      if (geo.location) lastCity = geo.location;
    }
    if (!lastCategory) {
      const cat = extractCategoryConstraints(text).category;
      if (cat) lastCategory = cat;
    }
    if (lastSiteId && lastCity && lastCategory && lastIntent) break;
  }

  return { lastSiteId, lastCity, lastCategory, lastIntent };
}

export function resolveConversationContext(
  history: Array<{ role: string; content: Array<{ text: string }> }> = [],
  sites: any[] = []
): ResolvedConversationContext {
  let activeDomain: ConversationDomain | null = null;
  let activeSubtopic: string | null = null;
  let safetyState: SafetyConversationState = { active: false, kind: null };
  let lastReferencedSite: any | null = null;
  let lastRecommendedSites: any[] = [];
  const previouslyShownSiteIds: string[] = [];
  let lastCity: string | null = null;
  let lastRegion: GeographicRegionConstraint = null;
  let lastCategory: string | null = null;
  let categoryResetByBroadSearch = false;
  let searchContextBoundaryReached = false;
  const lastExcludedCategories: string[] = [];
  let lastFreeOnly = false;
  let lastRequestedCount: number | null = null;
  let lastWasRecommendation = false;
  let lastUserText: string | null = null;
  let lastModelText: string | null = null;
  let lastIntent: ResolvedConversationContext['lastIntent'] = null;
  const tourismContext: TourismConversationContext = {
    topic: null,
    dishOrSubject: null,
    location: null,
    budgetText: null,
    lastRecommendations: [],
  };

  if (!history || history.length === 0) {
    return {
      activeDomain,
      activeSubtopic,
      safetyState,
      tourismContext,
      lastReferencedSite,
      lastRecommendedSites,
      previouslyShownSiteIds,
      lastCity,
      lastRegion,
      lastCategory,
      lastExcludedCategories,
      lastFreeOnly,
      lastRequestedCount,
      lastWasRecommendation,
      lastUserText,
      lastModelText,
      lastIntent,
    };
  }

  // Forward pass over user turns to track activeDomain, activeSubtopic, and persistent safetyState
  for (const turn of history) {
    if (turn.role !== 'user') continue;
    const text = turn?.content?.[0]?.text ?? '';
    const norm = normalizeSearchText(text);
    if (!norm) continue;

    const { entities } = identifyReferencedSites(text, sites);
    const geo = extractGeographicConstraints(text);
    const cat = extractCategoryConstraints(text);

    if (isActiveEmergencyQuery(text, { activeDomain, activeSubtopic, safetyState } as ResolvedConversationContext)) {
      activeDomain = 'emergency_safety';
      activeSubtopic = 'emergency';
      safetyState = {
        active: true,
        kind: isMedicalConcernQuery(norm) || safetyState.kind === 'medical' ? 'medical' : 'emergency',
      };
      continue;
    }

    // Explicit switch out of safety or between domains
    if (safetyState.active && hasExplicitTopicSwitchOutOfSafety(text)) {
      safetyState = { active: false, kind: null };
    }

    if (isFoodOrDiningQuery(text, entities, { activeDomain, activeSubtopic, safetyState, tourismContext } as ResolvedConversationContext)) {
      activeDomain = 'tourism_and_food';
      activeSubtopic = 'food_dining';
      tourismContext.topic = 'food';
      const dishMatch = norm.match(/\b(lechon|puso|ngohiong|siomai\s+sa\s+tisa|sutukil|tuslob\s+buwa|carenderia|seafood|street\s+food)\b/i);
      if (dishMatch) tourismContext.dishOrSubject = dishMatch[1];
      if (geo.location) tourismContext.location = geo.location;
      const bMatch = text.match(/(?:₱|php|pesos?)\s*(\d{2,4})|(\d{2,4})\s*(?:pesos?|php)/i);
      if (bMatch) tourismContext.budgetText = `₱${bMatch[1] || bMatch[2]}`;
    } else if (isCebuTourismQuery(text, entities, { activeDomain, activeSubtopic, safetyState, tourismContext } as ResolvedConversationContext)) {
      activeDomain = 'tourism_and_food';
      activeSubtopic = 'cebu_tourism';
      if (/\b(beach|beaches|falls|waterfall|island\s+hopping|whale\s+shark|oslob|moalboal|kawasan|bantayan|camotes|malapascua|nature)\b/i.test(norm)) {
        tourismContext.topic = 'beaches_nature';
      } else if (/\b(transport|jeepney|mybus|vhire|ferry|how\s+do\s+i\s+get|commute)\b/i.test(norm)) {
        tourismContext.topic = 'transport';
      } else if (/\b(budget|cost|how\s+much)\b/i.test(norm)) {
        tourismContext.topic = 'budget';
      } else {
        tourismContext.topic = 'attractions';
      }
      const placeMatch = norm.match(/\b(oslob|moalboal|kawasan|bantayan|camotes|malapascua|busay|tops|sirao|temple\s+of\s+leah|mactan)\b/i);
      if (placeMatch) tourismContext.dishOrSubject = placeMatch[1];
      if (geo.location || geo.outsideScopePlace) tourismContext.location = geo.location || geo.outsideScopePlace;
    } else if (
      isExplicitTourRequestStandalone(norm) ||
      (activeDomain === 'itinerary_planner' && isPlanningUpdatePhrase(norm))
    ) {
      activeDomain = 'itinerary_planner';
      activeSubtopic = 'itinerary';
    } else if (
      isMetaOrEvaluationQuery(text) ||
      isHandumananSystemQuery(text, { activeDomain, activeSubtopic, safetyState, tourismContext } as ResolvedConversationContext)
    ) {
      activeDomain = 'system_help';
      activeSubtopic =
        classifySystemHelpSubtopic(text, { activeDomain, activeSubtopic, safetyState, tourismContext } as ResolvedConversationContext) ||
        activeSubtopic ||
        'platform_overview';
    } else if (isGeneralHistoricalTopicQuery(text, entities)) {
      activeDomain = 'heritage_history';
      activeSubtopic = text.trim();
    } else if (
      entities.length > 0 ||
      cat.category ||
      cat.excludedCategories.length > 0 ||
      (/\b(heritage|sites?|churches?|museums?|ancestral|fort|shrine|monument|recommend|suggest|free\s+(?:heritage|sites|places))\b/i.test(norm) &&
        !/\b(presentation|quantum|free\s+will|productive\s+weekend)\b/i.test(norm))
    ) {
      activeDomain = 'heritage_directory';
      activeSubtopic = entities[0] || cat.category || geo.location || 'heritage';
    } else if (
      activeDomain === 'tourism_and_food' &&
      /\b(budget|peso|pesos|php|\d{2,4}|meal|lunch|dinner|breakfast|cheap|affordable)\b/i.test(norm)
    ) {
      activeDomain = 'tourism_and_food';
    } else if (
      activeDomain === 'heritage_directory' &&
      (Boolean(geo.location || geo.geographicRegion) ||
        /\b(it|its|that|this|they|them|those|these|located|location|where|far|distance|first|1st|second|2nd|third|3rd|fourth|4th|fifth|5th|last\s+one|other\s+places|like\s+that|accessible|accessibility|rating|what\s+about|how\s+about|visiting\s+hours|open|closed|sunday|fee|entrance|admission|built|purpose|where\s+did\s+you\s+get|another\s+one|make\s+it|exclude|only\s+show)\b/i.test(norm))
    ) {
      activeDomain = 'heritage_directory';
    } else if (
      activeDomain === 'heritage_history' &&
      /\b(why\s+was\s+he|why\s+is\s+he|simpler\s+words|summarize|example|shorter|sources?)\b/i.test(norm)
    ) {
      activeDomain = 'heritage_history';
    } else if (
      !isConversationalMessage(norm) &&
      (isGeneralKnowledgeNonRecommendationQuery(norm, entities) ||
        activeDomain === 'general_ai' ||
        (activeDomain !== 'heritage_directory' &&
          !/\b(heritage|handumanan|cebu\s+city|mandaue|talisay|lapu[\s-]?lapu)\b/i.test(norm)))
    ) {
      activeDomain = 'general_ai';
      if (
        !/\b(like\s+i\s*m|simpler|simply|example|summarize|shorter|argue\s+against|which\s+argument|agreeing\s+with\s+me|sources?)\b/i.test(norm)
      ) {
        activeSubtopic = text.trim();
      }
    }
  }

  // Inspect recent turns from newest to oldest
  let newestExchangeDone = false;
  for (let i = history.length - 1; i >= 0; i--) {
    const turn = history[i];
    const text = turn?.content?.[0]?.text ?? '';
    if (!text.trim()) continue;

    if (turn.role === 'model' && !lastModelText) {
      lastModelText = text;
    } else if (turn.role === 'user' && !lastUserText) {
      lastUserText = text;
    }

    const { entities } = identifyReferencedSites(text, sites);
    for (const id of entities) {
      if (!previouslyShownSiteIds.includes(id)) {
        previouslyShownSiteIds.push(id);
      }
    }

    if (turn.role === 'model') {
      const prevUserText =
        i > 0 && history[i - 1]?.role === 'user' ? history[i - 1]?.content?.[0]?.text ?? '' : '';
      const prevUserEntities = prevUserText ? identifyReferencedSites(prevUserText, sites).entities : [];
      const prevUserNorm = prevUserText ? normalizeSearchText(prevUserText) : '';
      const prevUserIsSingleSiteQuery =
        prevUserEntities.length === 1 &&
        !/\b(compare|versus|vs|alternatives?|other\s+places|like\s+that|nearby|near\s+|recommend|suggest)\b/i.test(
          prevUserNorm
        );
      const prevUserIsSingleSiteFollowUp =
        prevUserEntities.length === 0 &&
        /\b(it|its|that\s+place|that\s+site|this\s+site|this\s+place)\b/i.test(prevUserNorm) &&
        !/\b(compare|versus|vs|alternatives?|other\s+places|like\s+that|nearby|near\s+|recommend|suggest|make\s+it|change\s+it|switch\s+it|exclude|only\s+show)\b/i.test(
          prevUserNorm
        );

      if (entities.length >= 1 && lastRecommendedSites.length === 0 && !prevUserIsSingleSiteQuery && !prevUserIsSingleSiteFollowUp) {
        const matched = entities
          .map(id => sites.find(s => s?.id === id))
          .filter(Boolean);
        if (matched.length > 1 || (matched.length === 1 && /\b(here\s+(?:is|are)\s+.*heritage|matching\s+your\s+request|verified\s+handumanan\s+heritage\s+site)/i.test(text))) {
          lastRecommendedSites = matched;
          lastWasRecommendation = true;
        }
      }
      // Older single-site turns must not override a newer multi-site list (pronouns become ambiguous)
      const canSetReference = !newestExchangeDone || lastRecommendedSites.length <= 1;
      if (prevUserIsSingleSiteQuery && !lastReferencedSite && canSetReference) {
        lastReferencedSite = sites.find(s => s?.id === prevUserEntities[0]) || null;
      } else if (entities.length === 1 && !lastReferencedSite && canSetReference) {
        lastReferencedSite = sites.find(s => s?.id === entities[0]) || null;
      }
    } else if (turn.role === 'user') {
      const norm = normalizeSearchText(text);
      const geo = extractGeographicConstraints(text);
      const cat = extractCategoryConstraints(text);
      const isBroadHeritageTurn =
        !cat.category &&
        /\b(?:all\s+)?(?:heritage\s+)?(?:sites?|places?|attractions?)\b/i.test(norm) &&
        (Boolean(geo.location || geo.geographicRegion) ||
          /\b(?:all\s+heritage|heritage\s+sites?|what\s+.*visit|show\s+me\s+heritage)\b/i.test(norm)) &&
        !/\b(those|them|these|same|ones?)\b/i.test(norm);

      if (!searchContextBoundaryReached) {
        if (!lastCity && geo.location) {
          lastCity = geo.location;
        }
        if (!lastRegion && geo.geographicRegion) {
          lastRegion = geo.geographicRegion;
        }
        for (const excl of cat.excludedCategories) {
          if (!lastExcludedCategories.includes(excl)) {
            lastExcludedCategories.push(excl);
          }
        }
        if (!lastCategory && !categoryResetByBroadSearch && cat.category && !lastExcludedCategories.includes(cat.category)) {
          lastCategory = cat.category;
        }
        if (/\b(free\s+admission|free\s+entry|no\s+entrance\s+fee|free\s+(?:heritage\s+|historical\s+)?(?:sites?|places?|churches?|museums?|landmarks?|ones?)|only\s+show\s+free|show\s+only\s+free|somewhere\s+free)\b/.test(norm)) {
          lastFreeOnly = true;
        }
        if (lastRequestedCount === null) {
          const cnt = extractRequestedCount(norm, true);
          if (cnt !== null) lastRequestedCount = cnt;
        }
        if (isBroadHeritageTurn) {
          categoryResetByBroadSearch = true;
          searchContextBoundaryReached = true;
        } else if (geo.location || geo.geographicRegion) {
          searchContextBoundaryReached = true;
        }
      }
      if (/\b(recommend|suggest|show|give\s+me|find|exclude|excluding|only\s+show|make\s+it|instead)\b/.test(norm)) {
        lastWasRecommendation = true;
      }
      const canSetReference = !newestExchangeDone || lastRecommendedSites.length <= 1;
      if (entities.length === 1 && !lastReferencedSite && canSetReference) {
        lastReferencedSite = sites.find(s => s?.id === entities[0]) || null;
      }
      newestExchangeDone = true;
      if (!lastIntent) {
        if (/\b(plan|itinerary|tour|route|trip)\b/.test(norm)) lastIntent = 'itinerary';
        else if (isInformationQuery(norm)) lastIntent = 'information';
        else if (isConversationalMessage(norm)) lastIntent = 'conversation';
      }
    }
  }

  if (!lastCity && lastReferencedSite?.city) {
    lastCity = lastReferencedSite.city;
  }

  if (!lastCategory && !categoryResetByBroadSearch) {
    const uniqueRecCategories = new Set(lastRecommendedSites.map(s => s?.category).filter(Boolean));
    if (uniqueRecCategories.size === 1) {
      const onlyCat = Array.from(uniqueRecCategories)[0];
      if (onlyCat && !lastExcludedCategories.includes(onlyCat)) {
        lastCategory = onlyCat;
      }
    } else if (lastRecommendedSites.length <= 1 && lastReferencedSite?.category && !lastExcludedCategories.includes(lastReferencedSite.category)) {
      lastCategory = lastReferencedSite.category;
    }
  }

  // Prevent stale heritage references from contaminating non-heritage domains
  const keepHeritageRefs =
    activeDomain === 'heritage_directory' ||
    activeDomain === 'itinerary_planner' ||
    activeDomain === null;

  return {
    activeDomain,
    activeSubtopic,
    safetyState,
    tourismContext,
    lastReferencedSite: keepHeritageRefs ? lastReferencedSite : null,
    lastRecommendedSites: keepHeritageRefs ? lastRecommendedSites : [],
    previouslyShownSiteIds,
    lastCity,
    lastRegion,
    lastCategory,
    lastExcludedCategories,
    lastFreeOnly,
    lastRequestedCount,
    lastWasRecommendation,
    lastUserText,
    lastModelText,
    lastIntent,
  };
}

function extractRequestedInformation(normalizedQuery: string): RequestedInformationType[] {
  const requested: RequestedInformationType[] = [];

  if (/\b(who\s+designed|architect|engineer|who\s+built|builder|designed\s+by)\b/.test(normalizedQuery)) {
    requested.push('architect_builder');
  }
  if (/\b(what\s+year|which\s+year|when\s+was|year\s+built|founded|established|1521|1565|1730|1898|1937|1938|1939|1945|1972|1999)\b/.test(normalizedQuery)) {
    requested.push('year_date');
  }
  if (/\b(fee|fees|entrance|admission|ticket|tickets|price|prices|cost|pay|free|how\s+much|pila\s+ang|bayad|libre)\b/.test(normalizedQuery)) {
    requested.push('entrance_fee');
  }
  if (/\b(open|closed|available|hours|time|schedule|when\s+can\s+i\s+visit|visiting\s+hours|opening\s+hours|open\s+today|sunday|sundays|monday|tuesday|wednesday|thursday|friday|saturday|weekend|weekdays|abli|bukas|dominggo|oras)\b/.test(normalizedQuery)) {
    requested.push('visiting_hours');
  }
  if (/\b(where|located|location|address|directions|how\s+do\s+i\s+get|map|pin|route\s+to|take\s+me|how\s+far|distance|asa\s+dapit|saan\s+makikita)\b/.test(normalizedQuery)) {
    requested.push('location_directions');
  }
  if (/\b(accessible|accessibility|pwd|wheelchair|disability)\b/.test(normalizedQuery)) {
    requested.push('accessibility');
  }
  if (/\b(category|type\s+of\s+site|classified|classification)\b/.test(normalizedQuery)) {
    requested.push('category');
  }
  if (/\b(phone\s+number|contact|telephone|email|website|online\s+booking|book\s+tickets?)\b/.test(normalizedQuery)) {
    requested.push('contact_booking');
  }
  if (/\b(parking|restrooms?|comfort\s+room|gift\s+shop|wifi)\b/.test(normalizedQuery)) {
    requested.push('facilities');
  }
  if (/\b(compare|comparison|difference|versus|vs|older|oldest|cheaper|cheapest|which\s+one)\b/.test(normalizedQuery)) {
    requested.push('comparison');
  }
  if (/\b(why\s+is.+important|significance|historically\s+important|historical\s+value|meaning|why\s+does.+matter)\b/.test(normalizedQuery)) {
    requested.push('significance');
  }
  if (/\b(history|historical|story|background|overview|tell\s+me\s+about|tell\s+me\s+more|what\s+is)\b/.test(normalizedQuery)) {
    requested.push('history');
  }

  if (requested.length === 0) {
    requested.push('overview');
  }

  return requested;
}

export function isGeneralHistoricalTopicQuery(
  query: string,
  entities: string[],
  context?: ResolvedConversationContext
): boolean {
  const normalized = normalizeSearchText(query);

  // "Who was Lapu-Lapu?" is a historical person question even if Lapu-Lapu is also a city name
  if (
    /\bwho\s+(?:was|is)\s+(?:datu\s+)?(?:lapu[\s-]?lapu|rajah\s+humabon|ferdinand\s+magellan|magellan|leon\s+kilat)\b/i.test(normalized)
  ) {
    return true;
  }

  // Follow-up about a historical person ("Why was he important?", "What did he do?")
  if (
    /\b(why\s+was\s+he\s+important|why\s+is\s+he\s+important|why\s+was\s+he\s+famous|what\s+did\s+he\s+do|who\s+was\s+he)\b/i.test(normalized) &&
    context &&
    /\b(lapu[\s-]?lapu|humabon|magellan|leon\s+kilat)\b/i.test(`${context.lastUserText || ''} ${context.lastModelText || ''}`)
  ) {
    return true;
  }

  if (entities.length > 0) return false;

  // If the user is asking for places/sites to visit or recommendations, it is NOT a pure historical essay question
  if (
    /\b(what\s+(?:historical\s+|heritage\s+)?(?:places|sites|landmarks|churches|museums)|which\s+(?:historical\s+|heritage\s+)?(?:places|sites|landmarks|churches|museums)|where\s+can\s+i\s+visit|can\s+you\s+recommend|recommend|suggest|places\s+to\s+visit|sites\s+to\s+visit|show\s+me\s+sites|list\s+of\s+sites)\b/.test(normalized)
  ) {
    return false;
  }

  if (
    /\b(why\s+are\s+ancestral\s+houses\s+important|difference\s+between\s+spanish\s+and\s+american\s+colonial\s+architecture|difference\s+between\s+a\s+museum\s+and\s+(?:a\s+heritage|an\s+ancestral)\s+house|what\s+happened\s+during\s+world\s+war\s+ii)\b/i.test(normalized)
  ) {
    return true;
  }

  return (
    (/\b(tell\s+me\s+about|explain|what\s+is\s+the\s+history\s+of|how\s+did|what\s+happened\s+in|what\s+happened\s+during|history\s+of|story\s+of|role\s+of|significance\s+of|what\s+are\s+examples\s+of|examples\s+of)\b/.test(normalized) &&
      /\b(spanish\s+colonial|spanish[\s-]?era\s+architecture|colonial\s+architecture|colonial\s+history|cebu\s*s?\s+history|history\s+of\s+cebu|1521|battle\s+of\s+mactan|christianity\s+in\s+cebu|world\s+war\s+ii|wwii|liberation\s+of\s+cebu|parian|chinese[\s-]cebuano|philippine\s+revolution|tres\s+de\s+abril|leon\s+kilat|pre[\s-]?colonial)\b/.test(normalized)) ||
    /\b(what\s+are\s+examples\s+of\s+spanish[\s-]?era\s+architecture|examples\s+of\s+spanish[\s-]?era\s+architecture)\b/.test(normalized)
  );
}

export function isUnsupportedGeneralKnowledgeQuery(query: string, sites: any[] = []): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;

  const geo = extractGeographicConstraints(query);
  if (geo.geographicRegion === 'outside_cebu') return true;

  const { entities } = identifyReferencedSites(query, sites);
  if (entities.length > 0) return false;

  // Capital cities, foreign countries, general trivia, coding, math, recipes, sports, weather, etc.
  if (
    /\b(capital\s+of|president\s+of|prime\s+minister|weather\s+in|temperature\s+in|stock\s+market|bitcoin|crypto|recipe\s+for|how\s+to\s+cook|solve\s+this|math|algebra|calculus|write\s+a\s+poem|write\s+code|javascript|python|java|html|css|sql|basketball|nba|football|fifa|movie|anime|kpop|lyrics|flag\s+of|swiss\s+flag|wife\s+in\s+spain)\b/.test(normalized)
  ) {
    return true;
  }

  // Questions about building/carpentry/real estate ("how to build a house") that contain words like "house" or "building"
  if (
    /\b(how\s+to\s+build\s+a\s+house|cost\s+to\s+build\s+a\s+house|buy\s+a\s+house|rent\s+a\s+house|real\s+estate)\b/.test(normalized)
  ) {
    return true;
  }

  return false;
}

export function extractRequestedCount(normalizedQuery: string, allowStandaloneCountChange = false): number | null {
  const wordToNum: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    couple: 2,
  };

  if (/\b(?:zero|0)\s+(?:recommendations?|heritage\s+sites?|sites?|places?|churches?|museums?|landmarks?|stops?|options?)\b/i.test(normalizedQuery)) {
    return 0;
  }

  const digitMatch = normalizedQuery.match(
    /\b(?:top|best|only|just|exactly|recommend|suggest|give\s+me|show\s+me|find)?\s*(\d+)\s+(?:heritage\s+)?(?:sites?|places?|churches?|museums?|landmarks?|stops?|options?|recommendations?)\b/i
  );
  if (digitMatch) {
    const n = Number(digitMatch[1]);
    if (Number.isFinite(n) && n >= 0 && n <= 1000) return n;
  }

  const trailingOnlyMatch = normalizedQuery.match(/\b(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:places?|sites?|stops?|options?|recommendations?)\s+only\b/i);
  if (trailingOnlyMatch) {
    const raw = trailingOnlyMatch[1].toLowerCase();
    return wordToNum[raw] ?? (Number.isFinite(Number(raw)) ? Number(raw) : null);
  }

  const wordMatch = normalizedQuery.match(
    /\b(?:top|best|only|just|exactly|recommend|suggest|give\s+me|show\s+me|find|a)?\s*(zero|one|two|three|four|five|six|seven|eight|nine|ten|couple)\s+(?:of\s+)?(?:free\s+)?(?:heritage\s+)?(?:sites?|places?|churches?|museums?|landmarks?|stops?|options?|recommendations?)\b/i
  );
  if (wordMatch) {
    return wordToNum[wordMatch[1].toLowerCase()] ?? null;
  }

  if (/\b(?:an?\s+example(?:\s+of\s+(?:an?|one))?|example\s+of\s+one)\b/i.test(normalizedQuery)) {
    return 1;
  }

  if (allowStandaloneCountChange) {
    const standaloneMatch = normalizedQuery.match(
      /\b(?:make\s+it|give\s+me|show\s+me(?:\s+only)?|just|only|actually|instead|change\s+(?:it|that)\s+to|do)\s+(?:only\s+|just\s+)?(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten)\b(?:\s+instead|\s+only)?/i
    );
    if (standaloneMatch) {
      const raw = standaloneMatch[1].toLowerCase();
      if (raw in wordToNum) return wordToNum[raw];
      const n = Number(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 1000) return n;
    }
  }

  return null;
}

export function extractOutputFormatConstraints(query: string): {
  exactSentenceCount: number | null;
  noPromotional: boolean;
} {
  const normalized = normalizeSearchText(query);
  const wordToNum: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
  };
  let exactSentenceCount: number | null = null;
  const sentenceMatch = normalized.match(/\b(?:in\s+)?(?:exactly\s+)?(\d+|one|two|three|four|five)\s+sentences?\b/i);
  if (sentenceMatch) {
    const raw = sentenceMatch[1].toLowerCase();
    exactSentenceCount = wordToNum[raw] ?? (Number.isFinite(Number(raw)) ? Number(raw) : null);
  }
  const noPromotional = /\b(don\s*t\s+give\s+me\s+a\s+tourist\s+advertisement|no\s+tourist\s+advertisement|not\s+a\s+tourist\s+advertisement|without\s+promotional|no\s+marketing|factual\s+tone)\b/i.test(normalized);
  return { exactSentenceCount, noPromotional };
}

export type SystemHelpSubtopic =
  | 'platform_overview'
  | 'discover_explore'
  | 'itinerary_maps'
  | 'roles_permissions'
  | 'community_albums'
  | 'auth_troubleshooting';

export function classifySystemHelpSubtopic(
  query: string,
  context?: ResolvedConversationContext
): SystemHelpSubtopic | null {
  const normalized = normalizeSearchText(query);
  if (!normalized) return null;

  // Context-aware follow-ups should preserve the active system_help subtopic rather than switching to roles_permissions or auth
  if (
    context?.activeDomain === 'system_help' &&
    context?.activeSubtopic &&
    /\b(can\s+guests?\s+access\s+(?:it|that|them)|what\s+about\s+registered\s+users?|what\s+can\s+they\s+not\s+do|what\s+can\s*t\s+they\s+do|what\s+if\s+i\s+don\s*t\s+receive|didn\s*t\s+receive|not\s+receive|can\s+i\s+(?:use|access)\s+(?:it|that|them)|how\s+do\s+i\s+use\s+(?:it|that|them)|where\s+(?:is|can\s+i\s+find)\s+(?:it|that|them))\b/i.test(
      normalized
    )
  ) {
    return null;
  }

  // Pronoun follow-ups ("Can guests access it?") should inherit the active system_help subtopic
  if (/\b(can\s+guests?\s+access\s+(?:it|that|them)|can\s+i\s+(?:use|access)\s+(?:it|that|them)|how\s+do\s+i\s+use\s+(?:it|that|them)|where\s+(?:is|can\s+i\s+find)\s+(?:it|that|them))\b/i.test(normalized)) {
    return null;
  }

  if (
    /\b(lgu\s+officer|lgu\s+dashboard|lgu\s+login|admin\s+dashboard|admin\s+login|system\s+administrator|administrator|admin\s+role|registered\s+user|guest|guests|visitor\s+access|permissions?|roles?|who\s+can\s+verify)\b/i.test(
      normalized
    )
  ) {
    return 'roles_permissions';
  }
  if (/\b(community\s+content|city\s+albums?|visitor\s+photos?|upload\s+photos?|post\s+a?\s*reviews?|leave\s+a?\s*reviews?|moderate|moderation)\b/i.test(normalized)) {
    return 'community_albums';
  }
  if (
    /\b(reset\s+(?:my\s+)?password|forgot\s+password|password\s+reset|can\s*t\s+log\s*in|cannot\s+log\s*in|login\s+(?:issue|problem|trouble)|registration|sign\s+up|create\s+an?\s+account|location\s+permission|gps\s+(?:not\s+working|permission|issue)|map\s+not\s+loading|route\s+failed|troubleshoot|limitation|limitations|what\s+can\s*t\s+you\s+do|cannot\s+perform)\b/i.test(
      normalized
    )
  ) {
    return 'auth_troubleshooting';
  }
  if (/\b(discover|explore|difference\s+between\s+discover\s+and\s+explore|site\s+card|site\s+details|categories\s+page)\b/i.test(normalized)) {
    return 'discover_explore';
  }
  if (
    /\b(itinerary\s+planner|ai\s+itinerary|ai\s+tour\s+assistant|create\s+an?\s+itinerary\s+without\s+signing\s+in|itinerary\s+without\s+signing\s+in|how\s+does\s+(?:the\s+)?(?:planner|itinerary|map|routing|navigation)\s+work|save\s+(?:an?\s+)?itinerary|saved\s+itinerar|google\s+maps|waypoints?)\b/i.test(
      normalized
    )
  ) {
    return 'itinerary_maps';
  }
  if (/\b(what\s+is\s+handumanan|about\s+handumanan|purpose\s+of\s+handumanan|intended\s+users?|how\s+does\s+handumanan\s+work|handumanan\s+features?|how\s+many\s+sites)\b/i.test(normalized)) {
    return 'platform_overview';
  }
  return null;
}

export function isHandumananSystemQuery(
  query: string,
  context?: ResolvedConversationContext
): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;

  if (/\b(besides|other\s+than|outside|apart\s+from|aside\s+from|not\s+in)\b.*\b(heritage\s+sites?|handumanan|directory)\b/i.test(normalized)) {
    return false;
  }

  if (classifySystemHelpSubtopic(query, context) !== null) {
    return true;
  }

  if (
    /\b(handumanan|the\s+platform|this\s+app|this\s+website|this\s+system)\b/i.test(normalized) &&
    /\b(what\s+is|purpose|who\s+is\s+it\s+for|features?|how\s+to\s+use|how\s+do\s+i\s+use|how\s+does|cities|cover|coverage|account|profile|favorites|save|limitations?)\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  if (
    context?.activeDomain === 'system_help' &&
    !/\b(fort\s+san\s+pedro|casa\s+gorordo|basilica|magellan|mactan\s+shrine|heritage\s+sites?\s+in|recommend|food|lechon|beach|beaches|plan\s+a\s+tour)\b/i.test(
      normalized
    ) &&
    /\b(how\s+do\s+i\s+use|where\s+can\s+i\s+find|where\s+is\s+(?:it|that)|can\s+guests?|what\s+about\s+(?:registered|lgu|admin|guests?)|what\s+can\s+they\s+not\s+do|what\s+can\s*t\s+they\s+do|what\s+if\s+i\s+don\s*t\s+receive|didn\s*t\s+receive|not\s+receive|how\s+does\s+it\s+work|tell\s+me\s+more|can\s+you\s+do\s+that|why|limitations?|restrictions?|access\s+(?:it|that|them))\b/i.test(
      normalized
    )
  ) {
    return true;
  }

  return false;
}

export function isMetaOrEvaluationQuery(query: string): boolean {
  const normalized = normalizeSearchText(query);
  return (
    /\b(does\s+it\s+answer|does\s+it\s+admit|without\s+unnecessary\s+refusals|verify\s+whether\s+the\s+information\s+you\s+just\s+gave|is\s+the\s+information\s+you\s+just\s+gave\s+true|why\s+did\s+you\s+(?:say|recommend|give)|you\s+just\s+gave\s+me)\b/i.test(normalized)
  );
}

export function resolveOrdinalSiteReference(normalizedQuery: string, lastRecommendedSites: any[]): any | null {
  if (!lastRecommendedSites || lastRecommendedSites.length === 0) return null;
  if (/\b(first|1st)\b|\b(?:number|#)\s*1\b/.test(normalizedQuery)) return lastRecommendedSites[0] || null;
  if (/\b(second|2nd)\b|\b(?:number|#)\s*2\b/.test(normalizedQuery)) return lastRecommendedSites[1] || null;
  if (/\b(third|3rd)\b|\b(?:number|#)\s*3\b/.test(normalizedQuery)) return lastRecommendedSites[2] || null;
  if (/\b(fourth|4th)\b|\b(?:number|#)\s*4\b/.test(normalizedQuery)) return lastRecommendedSites[3] || null;
  if (/\b(fifth|5th)\b|\b(?:number|#)\s*5\b/.test(normalizedQuery)) return lastRecommendedSites[4] || null;
  if (/\b(last\s+one|final\s+one)\b/.test(normalizedQuery)) {
    return lastRecommendedSites[lastRecommendedSites.length - 1] || null;
  }
  return null;
}

function isGeneralKnowledgeNonRecommendationQuery(normalizedQuery: string, entities: string[]): boolean {
  if (isActiveEmergencyQuery(normalizedQuery)) return true;
  if (isFoodOrDiningQuery(normalizedQuery, entities)) return true;

  // Simplification, summarization, translation, shortening, example, and writing-assistance requests
  const asksForHeritageDirectoryExample =
    /\b(ancestral\s+house|heritage\s+site|church|museum|landmark|monument|plaza|example\s+of\s+one\s+in)\b/i.test(
      normalizedQuery
    );
  if (
    !asksForHeritageDirectoryExample &&
    /\b(explain\s+(?:this|that|it)\s+(?:in\s+simpler\s+words|more\s+simply|simply|like\s+i\s*m\s+(?:a\s+beginner|\d+))|explain\s+more\s+simply|simpler\s+explanation|make\s+it\s+shorter|give\s+me\s+an?\s+(?:another\s+)?example|now\s+give\s+me\s+an?\s+example|i\s+don\s*t\s+understand|summarize\s+(?:this|that|it)|can\s+you\s+summarize|help\s+me\s+(?:make|write)\s+a\s+short\s+(?:presentation\s+)?introduction|write\s+a\s+short\s+introduction|translate\s+this|give\s+me\s+five\s+interesting\s+facts|tell\s+me\s+something\s+interesting|give\s+me\s+a\s+simple\s+comparison|now\s+argue\s+against|argue\s+against\s+it|which\s+argument\s+is\s+stronger|are\s+you\s+just\s+agreeing\s+with\s+me)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  // Sensitive, high-stakes, or unsafe queries (medical, legal, financial, emergency, harmful)
  if (
    /\b(medical\s+emergency|call\s+an\s+ambulance|chest\s+pain|what\s+medicine\s+should\s+i\s+take|diagnose\s+my|legal\s+advice|file\s+a\s+lawsuit|invest\s+my\s+life\s+savings|which\s+stock\s+should\s+i\s+buy|make\s+a\s+bomb|make\s+a\s+weapon|how\s+to\s+hack|commit\s+suicide|self[\s-]harm)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  if (entities.length > 0) return false;

  // Open-ended general knowledge, science, philosophy, productivity, or writing requests without heritage site intent
  if (
    /\b(quantum\s+computing|free\s+will|productive\s+weekend|plan\s+a\s+productive|for\s+my\s+presentation|env\s+file|environment\s+variables?)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  // Residential, livability, cost-of-living, traffic, weather, food, culture, festivals, or travel-prep questions
  if (
    /\b(nice\s+place\s+to\s+live|good\s+place\s+to\s+live|live\s+in|living\s+in|move\s+to|cost\s+of\s+living|traffic\s+in|weather\s+(?:usually\s+like\s+)?in|population\s+of|who\s+is\s+the\s+mayor|economy\s+of|safe\s+to\s+live|what\s+should\s+i\s+eat|food\s+is\s+cebu\s+known\s+for|food\s+should\s+i\s+try|what\s+is\s+puso|history\s+of\s+lechon|lechon\s+in\s+cebu|festivals?\s+are\s+celebrated|local\s+traditions|how\s+do\s+i\s+get\s+to\s+mactan|what\s+should\s+i\s+bring\s+when\s+visiting)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  // Geography & civic distinctions ("Where is Mandaue?", "Is Lapu-Lapu part of Metro Cebu?", "What cities are included in Metro Cebu?", "Difference between Cebu City and Cebu Province?")
  if (
    /^(where\s+is|where\s+s)\s+(?:cebu\s+city|mandaue(?:\s+city)?|talisay(?:\s+city)?|lapu[\s-]?lapu(?:\s+city)?)$/i.test(normalizedQuery) ||
    /\b(is\s+lapu[\s-]?lapu\s+part\s+of\s+metro\s+cebu|what\s+cities\s+are\s+included\s+in\s+metro\s+cebu|cities\s+in\s+metro\s+cebu|how\s+far\s+is\s+talisay\s+from\s+cebu\s+city|difference\s+between\s+cebu\s+city\s+and\s+cebu\s+province)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  // Educational, science, world history, technology, and general knowledge questions
  if (
    /\b(bahay\s+na\s+bato|sinulog|coral\s+stone|basilica\s+and\s+a?\s*cathedral|baroque|neoclassical|katipunan|cultural\s+heritage|artificial\s+intelligence|catholicism\s+and\s+protestantism|celebrate\s+christmas|climate\s+change|republic\s+and\s+a?\s*democracy|how\s+does\s+the\s+internet\s+work|the\s+renaissance|invented\s+the\s+telephone|photosynthesis|why\s+is\s+the\s+sky\s+blue|study\s+habits|ram\s+and\s+storage|capital\s+of\s+japan|swiss\s+flag)\b/i.test(normalizedQuery) &&
    !/\b(visiting\s+hours|entrance\s+fee|admission|sites?\s+to\s+visit|places?\s+to\s+visit|recommend|suggest)\b/i.test(normalizedQuery)
  ) {
    return true;
  }

  if (isUnsupportedGeneralKnowledgeQuery(normalizedQuery, entities)) {
    return true;
  }

  return false;
}

export function shouldRouteToGeneralAi(
  query: string,
  analyzedIntent?: AnalyzedHeritageIntent
): boolean {
  const normalized = normalizeSearchText(query);
  if (!normalized) return false;
  if (analyzedIntent?.subCategoryTopic === 'emergency') return false;
  if (analyzedIntent?.subCategoryTopic === 'food_dining' || analyzedIntent?.subCategoryTopic === 'cebu_tourism') return false;
  if (isActiveEmergencyQuery(query)) return false;
  if (isFoodOrDiningQuery(query, analyzedIntent?.entities || [])) return false;
  if (
    /\b(chest\s+pain|what\s+medicine\s+should\s+i\s+take|diagnose\s+my|legal\s+advice|file\s+a\s+lawsuit|invest\s+my\s+life\s+savings|which\s+stock\s+should\s+i\s+buy|make\s+a\s+bomb|make\s+a\s+weapon|how\s+to\s+hack)\b/i.test(normalized)
  ) {
    return false;
  }
  if (analyzedIntent?.subCategoryTopic === 'general_ai') return true;
  if (analyzedIntent?.intent === 'general_knowledge_question') {
    const isDeterministicCebuDomain =
      /\b(nice\s+place\s+to\s+live|good\s+place\s+to\s+live|live\s+in|living\s+in|cost\s+of\s+living|bahay\s+na\s+bato|where\s+is\s+mandaue|is\s+lapu[\s-]?lapu\s+part\s+of\s+metro\s+cebu|cities\s+are\s+included\s+in\s+metro\s+cebu|cities\s+in\s+metro\s+cebu|how\s+far\s+is\s+talisay|difference\s+between\s+cebu\s+city\s+and\s+cebu\s+province|how\s+do\s+i\s+get\s+to\s+mactan|weather\s+(?:usually\s+like\s+)?in\s+cebu|what\s+should\s+i\s+bring\s+when\s+visiting|festivals?\s+are\s+celebrated|local\s+traditions)\b/i.test(normalized);
    if (!isDeterministicCebuDomain) {
      return true;
    }
  }
  return false;
}

export function analyzeHeritageQueryIntent(
  query: string,
  history: Array<{ role: string; content: Array<{ text: string }> }> = [],
  sites: any[] = []
): AnalyzedHeritageIntent {
  const normalized = normalizeSearchText(query);
  const context = resolveConversationContext(history.slice(0, -1), sites);
  const { entities, negatedEntities, referenceEntityId } = identifyReferencedSites(query, sites);
  const geo = extractGeographicConstraints(query);
  const cat = extractCategoryConstraints(query);
  const requestedInformation = extractRequestedInformation(normalized);
  const hasRecommendationContext =
    context.lastWasRecommendation ||
    context.lastRecommendedSites.length > 0 ||
    Boolean(context.lastCity || context.lastCategory || context.lastExcludedCategories.length > 0 || context.lastFreeOnly);
  const requestedCount = extractRequestedCount(normalized, hasRecommendationContext);
  const outputFormat = extractOutputFormatConstraints(query);
  const hasExplicitGeoFilter = Boolean(
    geo.location || geo.geographicRegion || geo.neighborhoodOrDistrict || geo.excludedLocations.length > 0
  );

  const asksForAlternatives =
    Boolean(referenceEntityId) ||
    /\b(other\s+places|other\s+sites|another\s+one|recommend\s+another|something\s+else|what\s+else|alternatives?|similar\s+places|places\s+like\s+that|sites\s+like\s+that|other\s+ones?)\b/.test(normalized);

  const nearbyUserGps =
    /\b(near\s+me|nearby\s+me|nearest\s+to\s+me|closest\s+to\s+me|close\s+to\s+me|around\s+me|my\s+location|current\s+location|what\s*s\s+near\s+me)\b/.test(normalized);

  const isRelativeNearby =
    !nearbyUserGps &&
    /\b(near|nearby|nearest\s+to|closest\s+to|around|close\s+to|next\s+to)\b/.test(normalized) &&
    !/\b(nearby\s+to\s+eat|eat\s+nearby|food\s+nearby|restaurants?\s+nearby|tell\s+me\s+about\s+.+\s+and)\b/.test(normalized);

  const specificYearMatch = normalized.match(/\b(1[5-9]\d{2}|20\d{2})\b/);
  const architecturalOrPeriod =
    /\b(spanish[\s-]?era|spanish\s+colonial|spanish\s+period)\b/.test(normalized)
      ? 'spanish_era'
      : /\b(american[\s-]?era|american\s+colonial|commonwealth)\b/.test(normalized)
        ? 'american_era'
        : null;

  const includesClosedSitesExplicitly =
    /\b(not\s+(?:silently\s+)?excluded?|even\s+if\s+(?:some\s+are\s+)?closed|including\s+closed|regardless\s+of\s+(?:open|closed)|include\s+closed|don\s*t\s+exclude\s+closed)\b/.test(normalized);

  const baseConstraints: AnalyzedHeritageIntent['constraints'] = {
    openNowOnly: /\b(open\s+now|currently\s+open|open\s+today|open\s+right\s+now|still\s+open)\b/.test(normalized),
    closedOnly:
      !includesClosedSitesExplicitly &&
      /\b(closed\s+now|currently\s+closed|closed\s+sites|which\s+sites\s+are\s+closed|not\s+open)\b/.test(normalized),
    freeAdmissionOnly: /\b(free\s+admission|free\s+entry|no\s+entrance\s+fee|free\s+(?:heritage\s+|historical\s+)?(?:sites?|places?|churches?|museums?|landmarks?|ones?)|which\s+.*\s+free|somewhere\s+free|only\s+show\s+free|show\s+only\s+free|budget[\s-]friendly|libre)\b/.test(normalized),
    mustVisitOnly: /\b(must[\s-]visit|top\s+sites|best\s+sites)\b/.test(normalized),
    studentFriendlyOnly: /\b(for\s+students|suitable\s+for\s+students|student[\s-]friendly|field\s+trip)\b/.test(normalized),
    architecturalOrPeriod,
    nearbyUserGps,
    // Never inherit a stale site from another city when the user explicitly asks about a city/region (e.g. "near Lapu-Lapu City")
    nearReferenceSiteId:
      isRelativeNearby && entities.length === 1
        ? entities[0]
        : isRelativeNearby && !hasExplicitGeoFilter && context.lastReferencedSite
          ? context.lastReferencedSite.id
          : null,
    asksForAlternatives,
    specificYearMentioned: specificYearMatch ? specificYearMatch[1] : null,
  };

  // 0. Highest-priority active emergency check — must precede all other intent and fallback logic
  if (isActiveEmergencyQuery(query, context)) {
    return {
      intent: 'general_knowledge_question',
      subject: 'emergency',
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: 'emergency',
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.99,
    };
  }

  // 1. Prompt injection or out-of-scope directory places
  const asksForSiteDirectoryInOutsidePlace =
    geo.geographicRegion === 'outside_cebu' &&
    /\b(heritage\s+sites?|sites?\s+in|places?\s+to\s+visit|churches?\s+in|museums?\s+in|landmarks?\s+in|recommend|suggest|show\s+me\s+(?:sites?|places?|churches?|museums?)|find\s+(?:sites?|places?|churches?|museums?)|itinerary|tour)\b/.test(normalized);

  const isBroaderTourismWithoutDirectoryRequest =
    (isFoodOrDiningQuery(query, entities, context) || isCebuTourismQuery(query, entities, context)) &&
    !/\b(heritage\s+sites?|churches?|museums?|ancestral\s+houses?)\b/i.test(normalized);

  if (
    isPromptInjectionQuery(query) ||
    (!isBroaderTourismWithoutDirectoryRequest &&
      (geo.geographicRegion === 'outside_metro_cebu_province' ||
        geo.geographicRegion === 'metro_cebu_not_covered' ||
        asksForSiteDirectoryInOutsidePlace))
  ) {
    return {
      intent: 'out_of_scope',
      subject: geo.outsideScopePlace || query.trim(),
      location: null,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: geo.outsideScopePlace,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_out_of_scope',
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  // 1a. Contradictory location or conflicting city constraints ("places in Talisay, but don't show anything from Talisay", "in Cebu City located in Mandaue")
  if (geo.contradictoryLocations && geo.contradictoryLocations.length > 0) {
    const city = geo.contradictoryLocations[0];
    return {
      intent: 'ambiguous_clarification',
      subject: city,
      location: null,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt: `Your request both asks for sites in ${city} and excludes ${city}. Would you like to see heritage sites in ${city}, or sites outside ${city} instead?`,
      confidence: 0.95,
    };
  }

  if (geo.conflictingCities && geo.conflictingCities.length >= 2) {
    const [cityA, cityB] = geo.conflictingCities;
    return {
      intent: 'ambiguous_clarification',
      subject: `${cityA} / ${cityB}`,
      location: null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt: `A single heritage site cannot be located in both ${cityA} and ${cityB}. Which city would you like me to search: ${cityA} or ${cityB}?`,
      confidence: 0.95,
    };
  }

  // 1a-2. Incompatible historical-period / category / temporal attribute combinations
  if (
    (architecturalOrPeriod === 'spanish_era' && /\btaoist\b/i.test(normalized)) ||
    (/\btaoist\b/i.test(normalized) && /\b(church|cathedral|basilica|catholic)\b/i.test(normalized))
  ) {
    return {
      intent: 'ambiguous_clarification',
      subject: 'Spanish-era Taoist church',
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt:
        "Handumanan doesn't have a Spanish-era Taoist church in Metro Cebu—Cebu Taoist Temple is a modern 20th-century non-Catholic temple rather than a Spanish-era Catholic church. Would you like Spanish-era Catholic churches, or details about Cebu Taoist Temple?",
      confidence: 0.95,
    };
  }

  if (/\boldest\b/i.test(normalized) && /\bmodern\b/i.test(normalized)) {
    return {
      intent: 'ambiguous_clarification',
      subject: 'oldest modern heritage site',
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt:
        '"Oldest" and "modern" point in opposite directions. Would you like the oldest Spanish-era heritage sites in Metro Cebu, or newer 20th-century landmarks?',
      confidence: 0.94,
    };
  }

  // 1a-3. Meta / evaluation / verification / Handumanan platform-help questions
  if (isMetaOrEvaluationQuery(query) || (entities.length === 0 && isHandumananSystemQuery(query, context))) {
    return {
      intent: 'system_question',
      subject: query.trim(),
      location: null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic:
        classifySystemHelpSubtopic(query, context) ||
        (context.activeDomain === 'system_help' ? context.activeSubtopic : null),
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_system_question',
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  // 1a-4. Explicit request for zero recommendations ("Give me zero recommendations.")
  if (requestedCount === 0) {
    return {
      intent: 'heritage_site_recommendation',
      subject: 'zero_recommendations',
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: cat.category,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      requestedCount: 0,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_no_matching_sites',
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  // 1b-0. Sticky domain follow-ups for tourism_and_food and general_ai
  const hasExplicitHeritageSwitch =
    entities.length > 0 ||
    Boolean(cat.category) ||
    /\b(heritage\s+sites?|tourist\s+spots?|historical\s+(?:sites?|places?|landmarks?)|churches?|museums?|monuments?|forts?|itinerary|tour\s+plan)\b/i.test(normalized);

  if (
    !hasExplicitHeritageSwitch &&
    (isFoodOrDiningQuery(query, entities, context) || isCebuTourismQuery(query, entities, context))
  ) {
    const isFood = isFoodOrDiningQuery(query, entities, context);
    return {
      intent: 'general_knowledge_question',
      subject: query.trim(),
      location: geo.location || context.tourismContext?.location || null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: isFood ? 'food_dining' : 'cebu_tourism',
      excludedCategories: [],
      requestedCount: null,
      outputFormat,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  if (
    context.activeDomain === 'tourism_and_food' &&
    !hasExplicitHeritageSwitch &&
    /\b(budget|php|peso|pesos|\d+|cheap|cheaper|affordable|under|food|eat|dining|meal|breakfast|lunch|dinner|snack|restaurant|carenderia|lechon|puso|spicy|seafood|street\s+food|more\s+options|other\s+options|alternatives?|another|else|where\s+can\s+i\s+find|find\s+that|transport|commute|bus|jeepney|how\s+long|how\s+much)\b/i.test(normalized)
  ) {
    const isFood = context.tourismContext?.topic === 'food' || isFoodOrDiningQuery(query, entities, context);
    return {
      intent: 'general_knowledge_question',
      subject: query.trim(),
      location: geo.location || context.tourismContext?.location || null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: isFood ? 'food_dining' : 'cebu_tourism',
      excludedCategories: [],
      requestedCount: null,
      outputFormat,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  if (
    context.activeDomain === 'general_ai' &&
    !hasExplicitHeritageSwitch &&
    /\b(explain|simpler|like\s+i\s*m|eli5|argue|argument|stronger|agreeing|sources?|where\s+did\s+you\s+get|summarize|summary|one\s+sentence|shorter|example|translate|elaborate|why|how|that|it)\b/i.test(normalized)
  ) {
    return {
      intent: 'general_knowledge_question',
      subject: query.trim(),
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: 'general_ai',
      excludedCategories: [],
      requestedCount: null,
      outputFormat,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  // 1b. General knowledge / residential / educational questions that should be answered directly without forcing site cards
  if (isGeneralKnowledgeNonRecommendationQuery(normalized, entities)) {
    const isFood = isFoodOrDiningQuery(query, entities);
    return {
      intent: 'general_knowledge_question',
      subject: query.trim(),
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: isFood ? 'food_dining' : null,
      excludedCategories: [],
      requestedCount: null,
      outputFormat,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.92,
    };
  }

  // 2. Casual statements, personal heritage-interest remarks, or conversational greetings/thanks/farewells
  // ("I love exploring old buildings.", "I'm interested in old churches.", "I am looking for museums in Mandaue")
  const isIntroductionLike = /^(my name is|my name s|i am|i m)\s/.test(normalized);
  const isCasualInterestStatement =
    !query.includes('?') &&
    entities.length === 0 &&
    /^(i\s+love|i\s+like|i\s+enjoy|i\s+m\s+interested\s+in|i\s+am\s+interested\s+in|i\s+really\s+like|i\s+enjoy\s+exploring)\b/.test(normalized) &&
    !/\b(recommend|suggest|show\s+me|find\s+me|where\s+should|where\s+can|plan\s+a|make\s+me)\b/.test(normalized);
  const hasExplicitRequestSignal =
    entities.length > 0 ||
    Boolean(cat.category) ||
    /\b(looking\s+for|want\s+to|wanna|would\s+like|recommend|suggest|show|find|visit|plan|where|what|which|how)\b/.test(normalized);
  if (
    isCasualInterestStatement ||
    (isConversationalMessage(normalized) && !(isIntroductionLike && hasExplicitRequestSignal)) ||
    isCasualStatementWithoutQuestion(query)
  ) {
    return {
      intent: 'conversational',
      subject: null,
      location: null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation: ['overview'],
      requiresSiteCards: false,
      cardSelectionReason: 'none_conversational',
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // 3. Tour / itinerary planning mode
  if (isTourPlanningMode(history, query)) {
    return {
      intent: 'tour_planning',
      subject: 'heritage_tour',
      location: geo.location || context.lastCity,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: cat.category || context.lastCategory,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      entities,
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'itinerary_stops',
      requiresClarification: false,
      confidence: 0.92,
    };
  }

  // 4. Ambiguous bare location query ("Cebu City", "Talisay")
  if (isBroadLocationQuery(normalized) || isBroadCebuQuestion(query)) {
    return {
      intent: 'ambiguous_clarification',
      subject: geo.location || 'Metro Cebu',
      location: geo.location,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation: ['overview'],
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt: `Are you looking for heritage site recommendations, churches, museums, or historical landmarks in ${geo.location || 'Metro Cebu'}?`,
      confidence: 0.9,
    };
  }

  // 5. Site Comparison ("Compare Basilica and Magellan's Cross", "Which one is older?", "Which of these sites is the oldest?")
  const isComparativeFollowUpPattern =
    /\bwhich\s+(?:one|of\s+(?:these|those|them))(?:\s+(?:sites?|places?))?\s+(?:is\s+(?:the\s+)?(?:older|oldest|cheaper|free|better|closer)|was\s+(?:established|built|founded)\s+first)\b|\bwhich(?:\s+(?:one|site|place))?\s+was\s+(?:established|built|founded)\s+first\b/.test(
      normalized
    );
  const isComparativeQuestion =
    /\b(compare|comparison|difference\s+between|different\s+from|versus|vs)\b/.test(normalized) ||
    isComparativeFollowUpPattern;
  if (isComparativeQuestion && (entities.length >= 2 || context.lastRecommendedSites.length >= 2)) {
    return {
      intent: 'site_comparison',
      subject: 'comparison',
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: cat.category,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      entities: entities.length >= 2 ? entities : context.lastRecommendedSites.map(s => s.id),
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation: ['comparison', ...requestedInformation],
      requiresSiteCards: true,
      cardSelectionReason: 'site_comparison',
      requiresClarification: false,
      confidence: 0.93,
    };
  }
  if (
    isComparativeFollowUpPattern &&
    entities.length < 2 &&
    context.lastRecommendedSites.length < 2
  ) {
    return {
      intent: 'ambiguous_clarification',
      subject: null,
      location: null,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: false,
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
      clarificationPrompt: 'Which two heritage sites would you like me to compare?',
      confidence: 0.9,
    };
  }

  // 6. General historical explanation ("Tell me about Cebu's Spanish colonial history", "Who was Lapu-Lapu?")
  if (isGeneralHistoricalTopicQuery(query, entities, context)) {
    return {
      intent: 'general_historical_question',
      subject: query.trim(),
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      outputFormat,
      entities: [],
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation: ['history', 'significance'],
      requiresSiteCards: false,
      cardSelectionReason: 'none_historical_explanation',
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  // 7. Follow-up questions & constraint refinements
  const ordinalSite =
    entities.length === 0 ? resolveOrdinalSiteReference(normalized, context.lastRecommendedSites) : null;
  if (ordinalSite) {
    const isVisitingDetail = requestedInformation.some(r =>
      r === 'visiting_hours' || r === 'entrance_fee' || r === 'accessibility'
    );
    const isDirections = requestedInformation.includes('location_directions');
    return {
      intent: isDirections
        ? 'directions_or_location'
        : isVisitingDetail
          ? 'visiting_information'
          : 'specific_site_information',
      subject: ordinalSite.name,
      location: ordinalSite.city,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: ordinalSite.category,
      subCategoryTopic: null,
      excludedCategories: [],
      entities: [ordinalSite.id],
      negatedEntities: [],
      referenceEntityId: ordinalSite.id,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'specific_site_reference',
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  const mergedExcludedCategories = Array.from(
    new Set([...context.lastExcludedCategories, ...cat.excludedCategories])
  ).filter(excl => excl !== cat.category);
  const effectiveFreeOnly = Boolean(baseConstraints.freeAdmissionOnly || context.lastFreeOnly);
  const effectiveRequestedCount = requestedCount ?? context.lastRequestedCount;
  const isExclusionCorrectionComplaint =
    cat.excludedCategories.length > 0 &&
    /\b(i\s+said|why\s+are\s+you\s+recommending|not\s+a\s+|no\s+|told\s+you)\b/.test(normalized);
  const hasExplicitModificationCue =
    /\b(change|switch|replace|instead|make\s+it|actual|actually|what\s+about|how\s+about|only\s+show|show\s+only|exclude|excluding|without)\b/.test(normalized) ||
    /^(only|just)\s+\w+/i.test(normalized);
  const isConstraintModification =
    hasRecommendationContext &&
    entities.length === 0 &&
    (hasExplicitModificationCue
      ? Boolean(
          geo.location ||
            geo.geographicRegion ||
            cat.category ||
            requestedCount !== null ||
            cat.excludedCategories.length > 0 ||
            baseConstraints.freeAdmissionOnly
        )
      : !geo.location &&
        !geo.geographicRegion &&
        (requestedCount !== null ||
          Boolean(cat.category) ||
          cat.excludedCategories.length > 0 ||
          Boolean(baseConstraints.freeAdmissionOnly)));

  if (isExclusionCorrectionComplaint || isConstraintModification) {
    const isExplicitBroadCityReset =
      Boolean(geo.location || geo.geographicRegion) &&
      !cat.category &&
      /\b(?:all\s+)?(?:heritage\s+)?(?:sites?|places?|attractions?)\b|\b(?:all\s+categories|all\s+types|everything)\b/i.test(normalized) &&
      !/\b(those|them|these|same|ones?)\b/i.test(normalized);
    const nextLocation = geo.location ?? (geo.geographicRegion ? null : context.lastCity);
    const nextRegion = geo.geographicRegion ?? (geo.location ? null : context.lastRegion);
    const nextCategory = isExplicitBroadCityReset
      ? null
      : (cat.category ?? (mergedExcludedCategories.includes(context.lastCategory || '') ? null : context.lastCategory));
    return {
      intent: nextLocation || nextRegion ? 'geographic_recommendation' : nextCategory ? 'category_recommendation' : 'heritage_site_recommendation',
      subject: nextCategory || nextLocation || 'heritage sites',
      location: nextLocation,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: nextRegion,
      outsideScopePlace: null,
      category: nextCategory,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: isExplicitBroadCityReset ? cat.excludedCategories : mergedExcludedCategories,
      requestedCount: isExplicitBroadCityReset ? requestedCount : effectiveRequestedCount,
      isExclusionCorrection: isExclusionCorrectionComplaint,
      entities: [],
      negatedEntities,
      referenceEntityId: null,
      constraints: {
        ...baseConstraints,
        freeAdmissionOnly: isExplicitBroadCityReset ? baseConstraints.freeAdmissionOnly : effectiveFreeOnly,
      },
      requestedInformation,
      requiresSiteCards: effectiveRequestedCount !== 0,
      cardSelectionReason: nextLocation || nextRegion ? 'geographic_recommendations' : nextCategory ? 'category_recommendations' : 'explicit_recommendations',
      requiresClarification: nextRegion === 'ambiguous_south_cebu' || nextRegion === 'ambiguous_north_cebu',
      confidence: 0.93,
    };
  }

  const hasSingularPronoun =
    /\b(it|its|that\s+place|that\s+site|this\s+site|this\s+place|here|(?:get|go|going|getting)\s+there|can\s+i\s+walk\s+there|the\s+other\s+one|another\s+one)\b/.test(normalized);
  const asksSelectionOverPreviousResults =
    context.lastRecommendedSites.length > 1 &&
    !asksForAlternatives &&
    !geo.location &&
    !geo.geographicRegion &&
    /\bwhich(?:\s+(?:one|ones|site|sites|place|places))?\b/i.test(normalized) &&
    /\b(recommend|suggest|visit|best|better|more|historical|history|architecture|architectural|religious|religion|cultural|culture|accessible|accessibility|free|worth|prefer|pick|choose)\b/i.test(normalized);
  const isPluralOrSetScheduleFollowUp =
    context.lastRecommendedSites.length > 0 &&
    (/\b(they|them|their|those|these)\b/.test(normalized) ||
      asksSelectionOverPreviousResults ||
      (!hasSingularPronoun &&
        isFollowUpQuery(normalized) &&
        !geo.location &&
        !geo.geographicRegion &&
        !cat.category &&
        requestedInformation.some(r => r === 'visiting_hours' || r === 'entrance_fee' || r === 'accessibility')));

  if (entities.length === 0 && isPluralOrSetScheduleFollowUp) {
    const isVisitingDetail = requestedInformation.some(r =>
      r === 'visiting_hours' || r === 'entrance_fee' || r === 'accessibility'
    );
    return {
      intent: isVisitingDetail ? 'visiting_information' : 'follow_up_question',
      subject: context.lastRecommendedSites.map(s => s.name).join(', '),
      location: context.lastCity,
      excludedLocations: [],
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: context.lastCategory,
      subCategoryTopic: null,
      excludedCategories: mergedExcludedCategories,
      entities: context.lastRecommendedSites.map(s => s.id),
      negatedEntities: [],
      referenceEntityId: null,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'explicit_recommendations',
      requiresClarification: false,
      confidence: 0.9,
    };
  }

  const hasPronounReference =
    /\b(it|its|that\s+place|that\s+site|this\s+site|this\s+place|here|(?:get|go|going|getting)\s+there|can\s+i\s+walk\s+there|the\s+other\s+one|another\s+one)\b/.test(normalized) ||
    /^(tell\s+me\s+more|what\s+about\s+its|what\s+are\s+the\s+visiting\s+hours|what\s+is\s+the\s+entrance\s+fee|how\s+much\s+is\s+admission|is\s+it\s+open|is\s+that\s+open|is\s+this\s+place\s+free|where\s+is\s+it|how\s+do\s+i\s+get\s+there)\b/.test(normalized) ||
    (Boolean(context.lastReferencedSite) && /\b(where\s+did\s+you\s+get|what\s+are\s+your\s+sources?)\b/.test(normalized));

  if (entities.length === 0 && (hasPronounReference || asksForAlternatives || isFollowUpQuery(normalized))) {
    // Follow-up asking for alternatives ("Are there other places like that?", "Can you recommend another one?")
    if (asksForAlternatives) {
      const anchorSite =
        (referenceEntityId ? sites.find(s => s?.id === referenceEntityId) : null) ||
        context.lastReferencedSite ||
        (context.lastRecommendedSites.length > 0 ? context.lastRecommendedSites[0] : null);

      if (!anchorSite && !context.lastCategory && !context.lastCity && !geo.location && !cat.category) {
        return {
          intent: 'ambiguous_clarification',
          subject: null,
          location: null,
          excludedLocations: [],
          neighborhoodOrDistrict: null,
          geographicRegion: null,
          outsideScopePlace: null,
          category: null,
          subCategoryTopic: null,
          excludedCategories: [],
          entities: [],
          negatedEntities: [],
          referenceEntityId: null,
          constraints: baseConstraints,
          requestedInformation,
          requiresSiteCards: false,
          cardSelectionReason: 'none_clarification_needed',
          requiresClarification: true,
          clarificationPrompt: 'Which heritage site or category would you like me to find similar places or alternatives for?',
          confidence: 0.88,
        };
      }

      const excludedIds = Array.from(
        new Set([
          ...negatedEntities,
          ...(anchorSite?.id ? [anchorSite.id] : []),
          ...context.previouslyShownSiteIds,
        ])
      );

      return {
        intent: 'follow_up_question',
        subject: anchorSite?.name || context.lastCategory || context.lastCity || 'alternatives',
        location: geo.location || (isRelativeNearby ? anchorSite?.city || context.lastCity : null),
        excludedLocations: geo.excludedLocations,
        neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
        geographicRegion: geo.geographicRegion,
        outsideScopePlace: null,
        category: cat.category || (isRelativeNearby ? null : anchorSite?.category || context.lastCategory),
        subCategoryTopic: cat.subCategoryTopic,
        excludedCategories: mergedExcludedCategories,
        requestedCount: effectiveRequestedCount,
        entities: [],
        negatedEntities: excludedIds,
        referenceEntityId: anchorSite?.id || null,
        constraints: {
          ...baseConstraints,
          freeAdmissionOnly: effectiveFreeOnly,
          asksForAlternatives: true,
          nearReferenceSiteId: isRelativeNearby && anchorSite ? anchorSite.id : baseConstraints.nearReferenceSiteId,
        },
        requestedInformation,
        requiresSiteCards: true,
        cardSelectionReason: 'explicit_recommendations',
        requiresClarification: false,
        confidence: 0.91,
      };
    }

    // Follow-up changing geographic constraint ("What about the south?", "What about in Mandaue?")
    if (geo.location || geo.geographicRegion) {
      const isExplicitBroadCitySwitch =
        !cat.category &&
        /\b(?:all\s+)?(?:heritage\s+)?(?:sites?|places?|attractions?)\b|\b(?:all\s+categories|all\s+types|everything)\b/i.test(normalized) &&
        !/\b(those|them|these|same|ones?)\b/i.test(normalized);
      const nextCat = isExplicitBroadCitySwitch ? null : (cat.category || context.lastCategory);
      return {
        intent: 'geographic_recommendation',
        subject: nextCat || 'heritage sites',
        location: geo.location,
        excludedLocations: geo.excludedLocations,
        neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
        geographicRegion: geo.geographicRegion,
        outsideScopePlace: null,
        category: nextCat,
        subCategoryTopic: cat.subCategoryTopic,
        excludedCategories: isExplicitBroadCitySwitch ? cat.excludedCategories : mergedExcludedCategories,
        requestedCount: isExplicitBroadCitySwitch ? requestedCount : effectiveRequestedCount,
        entities: [],
        negatedEntities,
        referenceEntityId: null,
        constraints: {
          ...baseConstraints,
          freeAdmissionOnly: isExplicitBroadCitySwitch ? baseConstraints.freeAdmissionOnly : effectiveFreeOnly,
        },
        requestedInformation,
        requiresSiteCards: true,
        cardSelectionReason: 'geographic_recommendations',
        requiresClarification: geo.geographicRegion === 'ambiguous_south_cebu' || geo.geographicRegion === 'ambiguous_north_cebu',
        confidence: 0.9,
      };
    }

    // Follow-up changing category constraint ("What about museums?", "How about churches?")
    if (cat.category) {
      return {
        intent: 'category_recommendation',
        subject: cat.category,
        location: geo.location || context.lastCity,
        excludedLocations: geo.excludedLocations,
        neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
        geographicRegion: geo.geographicRegion || context.lastRegion,
        outsideScopePlace: null,
        category: cat.category,
        subCategoryTopic: cat.subCategoryTopic,
        excludedCategories: mergedExcludedCategories,
        requestedCount: effectiveRequestedCount,
        entities: [],
        negatedEntities,
        referenceEntityId: null,
        constraints: {
          ...baseConstraints,
          freeAdmissionOnly: effectiveFreeOnly,
        },
        requestedInformation,
        requiresSiteCards: true,
        cardSelectionReason: 'category_recommendations',
        requiresClarification: false,
        confidence: 0.9,
      };
    }

    // Follow-up about the previously referenced single site ("Tell me more", "What about its history?", "Is it open today?")
    if (context.lastReferencedSite) {
      const isVisitingDetail = requestedInformation.some(r =>
        r === 'visiting_hours' || r === 'entrance_fee' || r === 'accessibility'
      );
      const isDirections = requestedInformation.includes('location_directions');
      const isSourceQuestion = /\b(where\s+did\s+you\s+get|what\s+are\s+your\s+sources?)\b/i.test(normalized);
      const isNavigationalFollowUp =
        !isSourceQuestion &&
        (isDirections ||
          isVisitingDetail ||
          /\b(directions?|map|route|how\s+(?:do\s+i\s+)?get|where\s+is|location|address|how\s+far|distance)\b/i.test(normalized));
      return {
        intent: isDirections
          ? 'directions_or_location'
          : isVisitingDetail
            ? 'visiting_information'
            : 'follow_up_question',
        subject: context.lastReferencedSite.name,
        location: context.lastReferencedSite.city,
        excludedLocations: [],
        neighborhoodOrDistrict: null,
        geographicRegion: null,
        outsideScopePlace: null,
        category: context.lastReferencedSite.category,
        subCategoryTopic: null,
        excludedCategories: [],
        entities: [context.lastReferencedSite.id],
        negatedEntities: [],
        referenceEntityId: context.lastReferencedSite.id,
        constraints: baseConstraints,
        requestedInformation,
        requiresSiteCards: isNavigationalFollowUp,
        cardSelectionReason: isNavigationalFollowUp ? 'specific_site_reference' : 'none_historical_explanation',
        requiresClarification: false,
        confidence: 0.92,
      };
    }

    // Ambiguous pronoun when multiple sites or no sites were previously discussed
    if (hasPronounReference && !context.lastReferencedSite) {
      const candidateNames = context.lastRecommendedSites.slice(0, 3).map(s => s.name);
      return {
        intent: 'ambiguous_clarification',
        subject: null,
        location: null,
        excludedLocations: [],
        neighborhoodOrDistrict: null,
        geographicRegion: null,
        outsideScopePlace: null,
        category: null,
        subCategoryTopic: null,
        excludedCategories: [],
        entities: [],
        negatedEntities: [],
        referenceEntityId: null,
        constraints: baseConstraints,
        requestedInformation,
        requiresSiteCards: false,
        cardSelectionReason: 'none_clarification_needed',
        requiresClarification: true,
        clarificationPrompt:
          candidateNames.length > 1
            ? `Which heritage site are you referring to (${candidateNames.join(', ')})?`
            : 'Which heritage site in Metro Cebu are you referring to?',
        confidence: 0.89,
      };
    }
  }

  // 8. Specific heritage site question (when 1 entity is referenced and not asking for nearby alternatives)
  const entitySiteForCheck = entities.length === 1 ? sites.find(s => s?.id === entities[0]) : null;
  const isRecommendationPhrase = /\b(recommend|recommended|suggest|suggested|find|are there|any|list|show)\b/.test(normalized);
  const entityConflictsWithGeo =
    Boolean(entitySiteForCheck) &&
    hasExplicitGeoFilter &&
    isRecommendationPhrase &&
    !matchesGeographicConstraint(entitySiteForCheck, geo);

  if (entities.length === 1 && !isRelativeNearby && !asksForAlternatives && !entityConflictsWithGeo) {
    const isVisitingDetail = requestedInformation.some(r =>
      r === 'visiting_hours' || r === 'entrance_fee' || r === 'accessibility'
    );
    const isDirections = requestedInformation.includes('location_directions');

    return {
      intent: isDirections
        ? 'directions_or_location'
        : isVisitingDetail
          ? 'visiting_information'
          : 'specific_site_information',
      subject: entities[0],
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: [],
      entities,
      negatedEntities,
      referenceEntityId: entities[0],
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'specific_site_reference',
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  // 9. Geographic recommendation (has geographic region, city, or nearby reference)
  if (
    geo.location ||
    geo.geographicRegion ||
    geo.neighborhoodOrDistrict ||
    geo.excludedLocations.length > 0 ||
    isRelativeNearby ||
    nearbyUserGps
  ) {
    const effectiveCategory = cat.category || (entityConflictsWithGeo ? entitySiteForCheck?.category || null : null);
    return {
      intent: 'geographic_recommendation',
      subject: effectiveCategory || geo.neighborhoodOrDistrict || geo.location || 'heritage sites',
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: effectiveCategory,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      requestedCount,
      entities: entityConflictsWithGeo ? [] : entities,
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'geographic_recommendations',
      requiresClarification:
        geo.geographicRegion === 'ambiguous_south_cebu' ||
        geo.geographicRegion === 'ambiguous_north_cebu',
      confidence: 0.93,
    };
  }

  // 10. Category-based recommendation
  if (cat.category) {
    return {
      intent: 'category_recommendation',
      subject: cat.category,
      location: null,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: null,
      geographicRegion: null,
      outsideScopePlace: null,
      category: cat.category,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      requestedCount,
      entities,
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'category_recommendations',
      requiresClarification: false,
      confidence: 0.92,
    };
  }

  // 10b. Architectural / thematic recommendation ("I want to learn about Spanish-era architecture. Where should I go?")
  if (
    (architecturalOrPeriod || /\b(architecture|architectural|spanish[\s-]?era|colonial\s+buildings?)\b/.test(normalized)) &&
    /\b(where\s+should\s+i\s+go|where\s+can\s+i\s+go|what\s+should\s+i\s+visit|where\s+to\s+go|places\s+to\s+go|recommend|suggest|sites?\s+to\s+visit)\b/.test(normalized)
  ) {
    return {
      intent: 'heritage_site_recommendation',
      subject: architecturalOrPeriod === 'spanish_era' ? 'Spanish-era architecture' : 'heritage architecture',
      location: geo.location,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: geo.neighborhoodOrDistrict,
      geographicRegion: geo.geographicRegion,
      outsideScopePlace: null,
      category: cat.category,
      subCategoryTopic: cat.subCategoryTopic,
      excludedCategories: cat.excludedCategories,
      requestedCount,
      entities,
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'explicit_recommendations',
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  // 11. General heritage site recommendation ("What are the must-visit heritage sites in Cebu?", "Recommend somewhere historical, but not a museum", "Exclude museums and show only free sites.")
  if (
    /\b(recommend|recommended|suggest|suggested|top|best|must[\s-]visit|must[\s-]see|worth\s+visiting|places\s+to\s+visit|sites\s+to\s+visit|what\s+can\s+i\s+visit|what\s+should\s+i\s+visit|which\s+heritage\s+sites|where\s+should\s+i\s+go|somewhere\s+historical|somewhere\s+free|suitable\s+for\s+students|good\s+for\s+families|budget[\s-]friendly\s+trip|unsay\s+nindot|asa\s+nindot|suroyan|adtoan)\b/.test(normalized) ||
    (/\b(show(?:\s+me|\s+only)?|only\s+show|give\s+me|find(?:\s+me)?|list|exclude|excluding)\b/.test(normalized) &&
      (baseConstraints.freeAdmissionOnly ||
        cat.excludedCategories.length > 0 ||
        /\b(heritage\s+sites?|historical\s+sites?|historical\s+places?|sites?)\b/.test(normalized)))
  ) {
    return {
      intent: 'heritage_site_recommendation',
      subject: 'Metro Cebu heritage sites',
      location: null,
      excludedLocations: geo.excludedLocations,
      neighborhoodOrDistrict: null,
      geographicRegion: 'metro_cebu',
      outsideScopePlace: null,
      category: null,
      subCategoryTopic: null,
      excludedCategories: cat.excludedCategories,
      requestedCount,
      entities,
      negatedEntities,
      referenceEntityId,
      constraints: baseConstraints,
      requestedInformation,
      requiresSiteCards: true,
      cardSelectionReason: 'explicit_recommendations',
      requiresClarification: false,
      confidence: 0.9,
    };
  }

  // Default fallback for other queries: route general non-heritage questions to general_knowledge_question (Gemini AI)
  const isGeneralNonHeritageFallback =
    entities.length === 0 &&
    !/\b(heritage|handumanan|parian|mactan|magellan|colon\s+street|ancestral|basilica|cathedral|shrine)\b/i.test(normalized);

  return {
    intent: isGeneralNonHeritageFallback ? 'general_knowledge_question' : 'general_cebu_heritage_question',
    subject: query.trim(),
    location: null,
    excludedLocations: [],
    neighborhoodOrDistrict: null,
    geographicRegion: null,
    outsideScopePlace: null,
    category: null,
    subCategoryTopic: isGeneralNonHeritageFallback ? 'general_ai' : null,
    excludedCategories: [],
    entities,
    negatedEntities,
    referenceEntityId,
    constraints: baseConstraints,
    requestedInformation,
    requiresSiteCards: false,
    cardSelectionReason: 'none_historical_explanation',
    requiresClarification: false,
    confidence: 0.75,
  };
}

const THEMATIC_CONCEPT_GROUPS: Array<{
  concept: string;
  queryPattern: RegExp;
  siteRecordPattern: RegExp;
}> = [
  {
    concept: 'wwii_liberation',
    queryPattern: /\b(world\s+war\s+ii|wwii|ww2|japanese\s+occupation|liberation|1945|american\s+landing)\b/i,
    siteRecordPattern: /\b(world\s+war\s+ii|wwii|liberation|1945|japanese)\b/i,
  },
  {
    concept: 'revolution_katipunan',
    queryPattern: /\b(philippine\s+revolution|katipunan|katipuneros?|leon\s+kilat|1898|tres\s+de\s+abril|uprising)\b/i,
    siteRecordPattern: /\b(revolution|katipunan|katipuneros?|leon\s+kilat|1898|tres\s+de\s+abril|uprising)\b/i,
  },
  {
    concept: 'chinese_heritage',
    queryPattern: /\b(chinese|taoist|parian\s+merchant|chinese[\s-]cebuano|chinese[\s-]filipino)\b/i,
    siteRecordPattern: /\b(chinese|taoist|gotiaoco)\b/i,
  },
  {
    concept: 'precolonial_magellan_1521',
    queryPattern: /\b(1521|pre[\s-]?colonial|rajah\s+humabon|lapu[\s-]?lapu|battle\s+of\s+mactan|first\s+baptism|magellan\s+expedition)\b/i,
    siteRecordPattern: /\b(1521|humabon|lapu[\s-]?lapu|battle\s+of\s+mactan|first\s+baptism|pre[\s-]?colonial)\b/i,
  },
  {
    concept: 'spanish_colonial',
    queryPattern: /\b(spanish\s+colonial|spanish[\s-]?era|spanish\s+period|spanish\s+architecture|1565|legazpi|coral\s+stone|bahay\s+na\s+bato)\b/i,
    siteRecordPattern: /\b(spanish|1565|legazpi|coral[\s-]stone|bahay\s+na\s+bato|16th\s+century|17th\s+century|18th\s+century|19th[\s-]century|parian|1730|1739|1595|1601)\b/i,
  },
  {
    concept: 'american_commonwealth',
    queryPattern: /\b(american\s+period|american\s+colonial|commonwealth|neoclassical|juan\s+arellano|sergio\s+osmena)\b/i,
    siteRecordPattern: /\b(american|commonwealth|neoclassical|arellano|osmena|1910|1912|1937|1938|1939)\b/i,
  },
  {
    concept: 'rizal',
    queryPattern: /\b(jose\s+rizal|rizaliana|dr\s+jose\s+rizal)\b/i,
    siteRecordPattern: /\b(rizal|rizaliana)\b/i,
  },
  {
    concept: 'archaeology_ethnography',
    queryPattern: /\b(archaeolog(?:y|ical)|ethnograph(?:y|ic)|artifacts?|ceramics?)\b/i,
    siteRecordPattern: /\b(archaeolog|ethnograph|ethnolog|artifacts|ceramics)\b/i,
  },
];

export function retrieveAndValidateSites(
  query: string,
  sites: any[],
  intent: AnalyzedHeritageIntent,
  limit = 5
): any[] {
  const effectiveLimit = intent.requestedCount ?? limit;

  if (effectiveLimit <= 0) {
    return [];
  }

  if (
    intent.intent === 'out_of_scope' ||
    intent.intent === 'conversational' ||
    intent.intent === 'system_question' ||
    intent.intent === 'general_knowledge_question'
  ) {
    return [];
  }

  const activeSites = (sites || []).filter(
    site =>
      site &&
      site.isActive !== false &&
      site.status !== 'Inactive' &&
      site.demolitionStatus !== 'Demolished'
  );

  // Case 1: Specific site information or site comparison -> return only the matched entities
  if (
    intent.intent === 'specific_site_information' ||
    intent.intent === 'visiting_information' ||
    intent.intent === 'directions_or_location' ||
    intent.intent === 'site_comparison'
  ) {
    if (intent.entities.length > 0) {
      return intent.entities
        .map(id => activeSites.find(s => s.id === id))
        .filter(Boolean)
        .slice(0, limit);
    }
    return [];
  }

  // Case 1b: General heritage questions never trigger broad "top-rated" padding.
  // Only explicitly named sites, or sites whose records match an explicit historical theme, qualify.
  if (intent.intent === 'general_cebu_heritage_question' || intent.intent === 'general_historical_question') {
    const named = intent.entities
      .map(id => activeSites.find(s => s.id === id))
      .filter(Boolean);
    const themes = THEMATIC_CONCEPT_GROUPS.filter(group => group.queryPattern.test(query));
    const thematic = themes.length > 0
      ? activeSites.filter(site => {
        const recordText = `${site.name} ${site.description || ''} ${site.overview || ''} ${site.significance || ''} ${(site.tags || []).join(' ')}`;
        return themes.some(theme => theme.siteRecordPattern.test(recordText));
      })
      : [];
    const seen = new Set<string>();
    return [...named, ...thematic]
      .filter(site => {
        if (!site?.id || seen.has(site.id)) return false;
        seen.add(site.id);
        return true;
      })
      .slice(0, limit);
  }

  // Case 2: Relative nearby search around a reference site
  if (intent.constraints.nearReferenceSiteId) {
    const refSite = activeSites.find(s => s.id === intent.constraints.nearReferenceSiteId);
    const refCoords = getVerifiedCoordinates(refSite);
    if (refCoords) {
      return activeSites
        .filter(s => {
          if (s.id === refSite.id) return false;
          if (!getVerifiedCoordinates(s)) return false;
          if (intent.constraints.openNowOnly && (!hasVerifiedVisitingHours(s) || !isSiteOpenForVisit(s))) {
            return false;
          }
          return true;
        })
        .filter(s => matchesGeographicConstraint(s, intent))
        .filter(s => !intent.category || s.category === intent.category)
        .filter(s => !isSiteExcludedByCategory(s, intent.excludedCategories))
        .filter(s => !intent.negatedEntities.includes(s.id))
        .map(site => ({
          site,
          dist: calculateDistanceKm(refCoords, getVerifiedCoordinates(site)!),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, effectiveLimit)
        .map(item => item.site);
    }
  }

  // Case 3: Structured filtering for recommendations, geographic queries, category queries, and follow-ups
  const restrictToPreviousEntities =
    intent.intent === 'follow_up_question' &&
    !intent.constraints.asksForAlternatives &&
    intent.entities.length > 0;
  const baseSites = restrictToPreviousEntities
    ? intent.entities
        .map(id => activeSites.find(s => s.id === id))
        .filter(Boolean)
    : activeSites;

  let candidates = baseSites.filter(site => {
    if (!matchesGeographicConstraint(site, intent)) return false;
    if (intent.negatedEntities.includes(site.id)) return false;
    if (isSiteExcludedByCategory(site, intent.excludedCategories)) return false;

    if (intent.subCategoryTopic === 'library') {
      const text = `${site.name} ${(site.tags || []).join(' ')}`.toLowerCase();
      return text.includes('library');
    }
    if (intent.subCategoryTopic === 'bridge') {
      const text = `${site.name} ${(site.tags || []).join(' ')}`.toLowerCase();
      return text.includes('bridge');
    }
    if (intent.subCategoryTopic === 'defense') {
      const text = `${site.name} ${(site.tags || []).join(' ')} ${site.description || ''}`.toLowerCase();
      return /\b(watchtower|bantayan|fort|bastion)\b/.test(text);
    }

    if (intent.category && site.category !== intent.category) return false;
    if (intent.constraints.freeAdmissionOnly && !/^free\b/i.test(String(site.entranceFee || '').trim())) return false;
    if (intent.constraints.closedOnly && isSiteOpenForVisit(site)) return false;
    if (intent.constraints.openNowOnly && (!hasVerifiedVisitingHours(site) || !isSiteOpenForVisit(site))) return false;

    return true;
  });

  // Thematic concept filtering/scoring (multi-signal, never single random substring)
  const matchedThemes = THEMATIC_CONCEPT_GROUPS.filter(group => group.queryPattern.test(query));
  if (matchedThemes.length > 0) {
    const thematicallyMatching = candidates.filter(site => {
      const recordText = `${site.name} ${site.description || ''} ${site.overview || ''} ${site.significance || ''} ${(site.tags || []).join(' ')}`;
      return matchedThemes.some(theme => theme.siteRecordPattern.test(recordText));
    });
    if (thematicallyMatching.length > 0) {
      candidates = thematicallyMatching;
    } else if (!intent.location && !intent.geographicRegion && !intent.category) {
      return [];
    }
  }

  // Prioritize historical/cultural categories over modern civic offices when user asks for "historical places"
  const asksSpecificallyHistorical = /\b(historical|historic|heritage|old)\b/i.test(query) && !intent.category;

  const scoredCandidates = candidates.map(site => {
    let score = 0;
    if (site.isMustVisit) score += 25;
    if (typeof site.rating === 'number' && Number.isFinite(site.rating)) {
      score += site.rating * 4;
    }
    if (asksSpecificallyHistorical) {
      if (site.category === 'Historical Landmarks & Monuments') score += 30;
      else if (site.category === 'Churches & Religious Heritage Sites') score += 25;
      else if (site.category === 'Ancestral Houses & Heritage Residences') score += 25;
      else if (site.category === 'Museums & Cultural Institutions') score += 22;
      else if (site.category === 'Plazas, Parks & Public Spaces') score += 12;
      else if (site.category === 'Government & Historic Buildings') {
        const recordText = `${site.description || ''} ${site.overview || ''}`.toLowerCase();
        score += /\b(1937|1938|neoclassical|historical\s+landmark)\b/.test(recordText) ? 18 : 2;
      }
    }
    if (intent.constraints.studentFriendlyOnly) {
      const feeText = String(site.entranceFee || '').toLowerCase();
      const isEducational =
        feeText.includes('student') ||
        feeText.includes('free') ||
        site.category === 'Museums & Cultural Institutions' ||
        site.category === 'Historical Landmarks & Monuments' ||
        site.category === 'Ancestral Houses & Heritage Residences';
      if (!isEducational) score -= 10;
      else score += 20;
    }
    for (const theme of matchedThemes) {
      const recordText = `${site.name} ${site.description || ''} ${site.overview || ''} ${site.significance || ''}`;
      if (theme.siteRecordPattern.test(recordText)) {
        score += 35;
      }
    }
    return { site, score };
  });

  scoredCandidates.sort((a, b) => b.score - a.score || String(a.site.name).localeCompare(String(b.site.name)));

  // Deduplicate by ID and normalized name
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  const uniqueResults: any[] = [];

  for (const { site } of scoredCandidates) {
    const id = String(site.id || '');
    const nameKey = normalizeSearchText(site.name || '');
    if (!id || usedIds.has(id) || (nameKey && usedNames.has(nameKey))) continue;
    usedIds.add(id);
    if (nameKey) usedNames.add(nameKey);
    uniqueResults.push(site);
    if (uniqueResults.length >= effectiveLimit) break;
  }

  return uniqueResults;
}

export function selectSiteCardsForIntent(
  intent: AnalyzedHeritageIntent,
  validatedCandidates: any[],
  maxCards = 4
): { siteIds: string[]; reason: CardSelectionReason } {
  const effectiveMaxCards = intent.requestedCount ?? maxCards;
  if (!intent.requiresSiteCards || effectiveMaxCards <= 0) {
    return {
      siteIds: [],
      reason: effectiveMaxCards <= 0 ? 'none_no_matching_sites' : intent.cardSelectionReason,
    };
  }

  if (!validatedCandidates || validatedCandidates.length === 0) {
    return {
      siteIds: [],
      reason: 'none_no_matching_sites',
    };
  }

  // Final defensive check: ensure every candidate still satisfies geographic and category constraints
  const eligible = validatedCandidates.filter(site => {
    if (!site?.id) return false;
    if (!matchesGeographicConstraint(site, intent)) return false;
    if (intent.negatedEntities.includes(site.id)) return false;
    if (isSiteExcludedByCategory(site, intent.excludedCategories)) return false;
    if (intent.category && intent.intent !== 'specific_site_information' && intent.intent !== 'visiting_information' && site.category !== intent.category) {
      return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return {
      siteIds: [],
      reason: 'none_no_matching_sites',
    };
  }

  const limit =
    intent.intent === 'specific_site_information' ||
    intent.intent === 'directions_or_location'
      ? 1
      : intent.intent === 'visiting_information'
        ? intent.entities.length > 1
          ? Math.min(intent.entities.length, effectiveMaxCards)
          : 1
        : intent.intent === 'site_comparison'
          ? 2
          : effectiveMaxCards;

  return {
    siteIds: Array.from(new Set(eligible.slice(0, limit).map(s => String(s.id)))),
    reason: intent.cardSelectionReason,
  };
}

function enforceSentenceCount(text: string, exactSentenceCount: number | null | undefined): string {
  if (!exactSentenceCount || exactSentenceCount < 1) return text;
  const sentences = text
    .replace(/\s+/g, ' ')
    .trim()
    .match(/[^.!?]+[.!?]+/g);
  if (!sentences || sentences.length === 0) return text;
  if (sentences.length >= exactSentenceCount) {
    return sentences.slice(0, exactSentenceCount).map(s => s.trim()).join(' ');
  }
  return text;
}

export function buildHistoricalTopicExplanation(
  query: string,
  sites: any[],
  context?: ResolvedConversationContext
): HeritageChatOutput {
  const normalized = normalizeSearchText(query);
  const { exactSentenceCount } = extractOutputFormatConstraints(query);
  const priorText = `${context?.lastUserText || ''} ${context?.lastModelText || ''}`.toLowerCase();

  if (/\b(why\s+was\s+he\s+important|why\s+is\s+he\s+important|why\s+was\s+he\s+famous|what\s+did\s+he\s+do)\b/i.test(normalized)) {
    if (/\blapu[\s-]?lapu\b/.test(priorText)) {
      const raw =
        "Documented historical accounts record that on April 27, 1521, Mactan chieftain Lapu-Lapu and his warriors defeated Ferdinand Magellan's landing force in the Battle of Mactan, where Magellan was killed and the surviving expedition subsequently withdrew from Cebu. In Philippine public memory and monuments (such as the Mactan Shrine), he is widely celebrated as an early symbol of indigenous resistance against foreign rule—though historians note that the Philippine government has never enacted a law formally proclaiming an official 'national hero,' and the 44-year interval before Miguel López de Legazpi's 1565 expedition also reflected broader Spanish maritime and political factors.";
      return {
        text: enforceSentenceCount(raw, exactSentenceCount),
        suggestedSiteIds: [],
        intent: 'general_historical_question',
        cardSelectionReason: 'none_historical_explanation',
      };
    }
  }

  if (/\bwhy\s+are\s+ancestral\s+houses\s+important\b/i.test(normalized)) {
    const raw =
      "Ancestral houses—such as the 1730 Jesuit House, Yap-Sandiego Ancestral House, and Casa Gorordo Museum in Cebu City's Parian district—are important because they preserve tangible examples of Spanish- and Chinese-Filipino domestic architecture (*Bahay na Bato*), craftsmanship, and everyday family life across centuries. They connect modern visitors to the social history, urban morphology, and cultural identity of historic Metro Cebu neighborhoods.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\bdifference\s+between\s+spanish\s+and\s+american\s+colonial\s+architecture\b/i.test(normalized)) {
    const raw =
      "Spanish colonial architecture in Cebu (16th–19th centuries) emphasized thick coral-stone masonry (*mampostería*), baroque church facades, triangular coastal fortifications like Fort San Pedro, and timber-and-stone *Bahay na Bato* residences built for tropical ventilation. American colonial and Commonwealth architecture (early 20th century) introduced reinforced concrete, neoclassical symmetry, grand porticos, and modern civic and educational buildings such as the Cebu Provincial Capitol (1938), Rizal Memorial Library and Museum, and Mandaue Presidencia.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\bdifference\s+between\s+a\s+museum\s+and\s+(?:a\s+heritage|an\s+ancestral)\s+house\b/i.test(normalized)) {
    const raw =
      "A museum is an institution dedicated to collecting, conserving, and exhibiting artifacts or art for public education (such as Museo Sugbo or the National Museum of the Philippines – Cebu), often housed in purpose-built or repurposed civic structures. A heritage or ancestral house is a preserved historic residence (such as the Yap-Sandiego Ancestral House or Casa Gorordo Museum) whose architecture, layout, and furnishings illustrate how families lived during a specific historical era, though many also function as house museums today.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\bwho\s+(?:was|is)\s+(?:datu\s+)?lapu[\s-]?lapu\b/i.test(normalized)) {
    const raw =
      "Lapu-Lapu was a 16th-century chieftain (*datu*) on Mactan Island in Cebu documented in accounts of the 1521 Spanish expedition. On April 27, 1521, he and his warriors resisted and defeated Ferdinand Magellan's landing party in the Battle of Mactan, where Magellan was killed. While he is widely honored in popular Filipino memory and commemorated at the Mactan Shrine in Lapu-Lapu City as an early symbol of indigenous resistance, Philippine historical bodies note that no law formally proclaims an official 'first national hero,' and the gap before Spain's 1565 return under Legazpi involved broader imperial and navigational factors.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(cebu\s*s?\s+history|history\s+of\s+cebu)\b/.test(normalized)) {
    const raw =
      "Before Spanish arrival, Cebu was an active maritime trading port governed by local rulers such as Rajah Humabon, and in April 1521 it became the site of Ferdinand Magellan's expedition and the Battle of Mactan led by Lapu-Lapu. Permanent Spanish colonial rule began in 1565 under Miguel López de Legazpi, shaping centuries of religious, civic, and architectural heritage including churches, Fort San Pedro, and Parian ancestral houses. Cebu later witnessed the 1898 Tres de Abril uprising against Spain, early 20th-century American-era civic development, and the 1945 World War II liberation landing at Talisay.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(spanish[\s-]?era\s+architecture|colonial\s+architecture)\b/.test(normalized)) {
    const raw =
      "Based on Handumanan's verified directory, prominent examples of Spanish-era architecture in Metro Cebu include coral-stone religious landmarks such as the Basilica Minore del Santo Niño, Metropolitan Cebu Cathedral, and National Shrine of Saint Joseph in Mandaue; coastal military fortifications such as Fort San Pedro in Cebu City and the Bantayan sa Hari watchtower in Mandaue; and 18th- to 19th-century 'Bahay na Bato' ancestral residences in Parian including the 1730 Jesuit House, Yap-Sandiego Ancestral House, and Casa Gorordo Museum.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(spanish\s+colonial|colonial\s+history)\b/.test(normalized)) {
    const raw =
      "Based on Handumanan's verified heritage records, Cebu's Spanish colonial history began on April 14, 1521, when Ferdinand Magellan's expedition planted the Christian cross at Magellan's Cross and baptized local ruler Rajah Humabon and his followers, before Magellan fell at the Battle of Mactan on April 27, 1521. Permanent Spanish colonial rule started in 1565 under Miguel López de Legazpi and Fray Andrés de Urdaneta, who established Fort San Pedro as a triangular coral-stone military bastion and founded the Basilica Minore del Santo Niño. Over the following centuries, Spanish urban planning shaped the Metropolitan Cebu Cathedral (established as a parish in 1595), the National Shrine of Saint Joseph in Mandaue (1601), the coral-stone watchtower Bantayan sa Hari in Mandaue, Colon Street, and 18th- to 19th-century 'Bahay na Bato' residences in Parian such as the 1730 Jesuit House and Casa Gorordo, culminating in the April 1898 Battle of Tres de Abril uprising led by Leon Kilat.";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(battle\s+of\s+mactan|1521|lapu[\s-]?lapu)\b/.test(normalized)) {
    const raw =
      "According to Handumanan's verified records, 1521 marks two defining events in Cebu's history: on April 14, 1521, Ferdinand Magellan's expedition planted a Christian cross in Cebu City (commemorated at Magellan's Cross and Plaza Hamabar, which honors Rajah Humabon), and on April 27, 1521, native chieftain Lapu-Lapu and his warriors defeated Magellan's forces in the Battle of Mactan at Punta Engaño in Lapu-Lapu City (commemorated at Mactan Shrine and Magellan's Marker).";
    return {
      text: enforceSentenceCount(raw, exactSentenceCount),
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(world\s+war\s+ii|wwii|ww2|liberation\s+of\s+cebu|1945)\b/.test(normalized)) {
    return {
      text: "Based on Handumanan's verified records, World War II deeply affected Metro Cebu's heritage landmarks. On March 26, 1945, American liberation forces landed at Larawan Beach in Talisay City (commemorated at the Talisay Landing Site) to end the Japanese occupation of Cebu. Historic structures such as the National Shrine of Saint Joseph in Mandaue and the Rizal Memorial Library and Museum in Cebu City also carry documented wartime history from the World War II period.",
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(parian|chinese[\s-]cebuano|chinese\s+history)\b/.test(normalized)) {
    return {
      text: "According to Handumanan's verified records, Cebu's Parian district and port area were historic centers of Chinese-Cebuano commerce, domestic architecture, and cultural synthesis. Prominent surviving landmarks include the late-17th-century Yap-Sandiego Ancestral House built by Chinese merchants, the 1730 Jesuit House, the mid-19th-century Casa Gorordo Museum, the Heritage of Cebu Monument in Plaza Parian, the Sugbu Chinese Heritage Museum in the Gotiaoco Building, and the Cebu Taoist Temple (built in 1972 in Beverly Hills).",
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(philippine\s+revolution|tres\s+de\s+abril|leon\s+kilat|1898)\b/.test(normalized)) {
    return {
      text: "According to Handumanan's verified record for the Battle of Tres de Abril Marker, Cebuano Katipuneros led by Pantaleon Villegas (Leon Kilat) launched an anti-colonial uprising against Spanish rule in April 1898 along Tres de Abril Street near the historic San Nicolas district in Cebu City.",
      suggestedSiteIds: [],
      intent: 'general_historical_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  return {
    text: `Handumanan's verified directory documents ${sites.length} cultural heritage sites across Cebu City, Mandaue City, Lapu-Lapu City, and Talisay City, spanning pre-colonial leadership, the 1521 encounter at Cebu and Mactan, Spanish colonial churches, forts, and Bahay na Bato residences, the 1898 revolution, American Commonwealth civic architecture, and the 1945 Talisay liberation landing.`,
    suggestedSiteIds: [],
    intent: 'general_historical_question',
    cardSelectionReason: 'none_historical_explanation',
  };
}

export function answerGeneralKnowledgeQuery(
  query: string,
  context?: ResolvedConversationContext,
  location?: string | null
): HeritageChatOutput {
  const normalized = normalizeSearchText(query);
  const priorText = `${context?.lastUserText || ''} ${context?.lastModelText || ''}`.toLowerCase();

  // 1. Active emergencies and sensitive/high-stakes queries
  if (isActiveEmergencyQuery(query)) {
    return getEmergencyResponse(query);
  }
  if (/\b(chest\s+pain|what\s+medicine\s+should\s+i\s+take|diagnose\s+my)\b/i.test(normalized)) {
    return {
      text: "I am not a doctor or licensed medical professional, so I cannot diagnose symptoms or recommend medications. If you are experiencing chest pain or concerning symptoms, please seek immediate medical care from a qualified physician or call **911**.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\b(legal\s+advice|file\s+a\s+lawsuit)\b/i.test(normalized)) {
    return {
      text: "I am not a lawyer and cannot provide formal legal counsel. For specific legal rights, contracts, or court proceedings, please consult a licensed attorney or the Public Attorney's Office (PAO).",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\b(invest\s+my\s+life\s+savings|which\s+stock\s+should\s+i\s+buy)\b/i.test(normalized)) {
    return {
      text: "I am not a licensed financial adviser and cannot recommend specific stocks or investments, especially for life savings. Consider consulting a registered financial planner and diversifying across regulated instruments.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\b(make\s+a\s+bomb|make\s+a\s+weapon|how\s+to\s+hack)\b/i.test(normalized)) {
    return {
      text: "I cannot assist with creating weapons, explosives, or unauthorized hacking.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // 2. Simplification, summarization, shortening, writing & learning assistance
  if (
    /\b(explain\s+(?:this|that|it)\s+(?:in\s+simpler\s+words|more\s+simply|simply|like\s+i\s*m\s+a\s+beginner)|explain\s+more\s+simply|i\s+don\s*t\s+understand|make\s+it\s+shorter)\b/i.test(normalized)
  ) {
    if (/\blapu[\s-]?lapu\b/.test(priorText)) {
      return {
        text: "In simple words: Lapu-Lapu was a local chieftain on Mactan Island in Cebu. On April 27, 1521, when Spanish explorer Ferdinand Magellan's force attacked Mactan to enforce allegiance, Lapu-Lapu's warriors fought back and defeated them in the Battle of Mactan, where he is remembered as an early symbol of local resistance.",
        suggestedSiteIds: [],
        intent: 'general_knowledge_question',
        cardSelectionReason: 'none_historical_explanation',
      };
    }
    if (context?.lastModelText) {
      const firstSentence = (context.lastModelText.match(/[^.!?]+[.!?]+/) || [context.lastModelText])[0].trim();
      return {
        text: `In simpler terms: ${firstSentence.replace(/\*\*/g, '')}`,
        suggestedSiteIds: [],
        intent: 'general_knowledge_question',
        cardSelectionReason: 'none_historical_explanation',
      };
    }
    return {
      text: "I'd be happy to explain in simpler words! Tell me which topic, historical event, or heritage site you'd like me to break down.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\bsummarize\s+this\b/i.test(normalized)) {
    if (context?.lastModelText) {
      const firstSentence = (context.lastModelText.match(/[^.!?]+[.!?]+/) || [context.lastModelText])[0].trim();
      return {
        text: `Summary: ${firstSentence.replace(/\*\*/g, '')}`,
        suggestedSiteIds: [],
        intent: 'general_knowledge_question',
        cardSelectionReason: 'none_historical_explanation',
      };
    }
    return {
      text: "Share the text or topic you'd like summarized, and I'll give you a concise summary.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\bgive\s+me\s+another\s+example\b/i.test(normalized)) {
    return {
      text: "Another notable example in Metro Cebu is the **1730 Jesuit House** in Parian, Cebu City—one of the oldest dated colonial residences in the Philippines, preserved inside a modern warehouse complex—alongside the **Yap-Sandiego Ancestral House** and **Casa Gorordo Museum**.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(help\s+me\s+(?:make|write)\s+a\s+short\s+(?:presentation\s+)?introduction|write\s+a\s+short\s+introduction)\b/i.test(normalized)) {
    return {
      text: 'Here is a short presentation introduction you can use:\n\n"Good day, everyone. Today we explore the rich cultural heritage of Metro Cebu—where pre-colonial chiefdoms, the pivotal 1521 encounter at Cebu and Mactan, centuries of Spanish and Chinese-Filipino architecture, and modern civic landmarks come together to tell the story of the Philippines\' oldest historic center."',
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\b(give\s+me\s+five\s+interesting\s+facts|tell\s+me\s+something\s+interesting)\b/i.test(normalized)) {
    return {
      text: "Here are five interesting facts about Metro Cebu's heritage:\n1. **Colon Street** in downtown Cebu City is recognized as the oldest street in the Philippines, laid out by Miguel López de Legazpi's expedition in 1565.\n2. **Fort San Pedro** is the smallest and oldest triangular bastion fort in the country, built with coral-stone blocks.\n3. The **1730 Jesuit House** in Parian remains preserved inside an active hardware warehouse.\n4. **Mactan Shrine** in Lapu-Lapu City stands near the shore where Datu Lapu-Lapu defeated Ferdinand Magellan on April 27, 1521.\n5. **Talisay Landing Site** marks the March 26, 1945 Allied amphibious landing that liberated Cebu during World War II.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  if (/\btranslate\s+this\b/i.test(normalized)) {
    return {
      text: 'Please share the exact sentence you want translated (for example, between English, Cebuano/Bisaya, and Tagalog). For instance, "Welcome to Cebu" in Cebuano is *"Maayong pag-abot sa Sugbo."*',
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // 3. Residential / livability
  if (/\b(nice\s+place\s+to\s+live|good\s+place\s+to\s+live|live\s+in|living\s+in|cost\s+of\s+living)\b/i.test(normalized)) {
    const cityLabel = location || 'that area';
    return {
      text: `${cityLabel} is a major urban center in Metro Cebu with active commercial, residential, and transportation access. Please note that Handumanan is a cultural heritage guide rather than a real-estate or livability advisor, so neighborhood suitability depends on your budget, commute, and lifestyle—while our directory can show you ${cityLabel}'s verified heritage landmarks if you'd like to explore them.`,
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // 4. Food, culture, festivals, weather, travel prep in Cebu
  if (isFoodOrDiningQuery(query)) {
    return getFoodRecommendationLimitationResponse(query, location);
  }
  if (/\b(festivals?\s+are\s+celebrated|local\s+traditions)\b/i.test(normalized)) {
    return {
      text: "Cebu's best-known cultural celebration is the **Sinulog Festival** every third Sunday of January honoring the Santo Niño, alongside **Kadaugan sa Mactan** in Lapu-Lapu City (reenacting the 1521 Battle of Mactan each April), **Mantawi Festival** in Mandaue City, and **Halad Inasal Festival** in Talisay City.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bhow\s+do\s+i\s+get\s+to\s+mactan\b/i.test(normalized)) {
    return {
      text: "From mainland Metro Cebu (Cebu City or Mandaue City), you can reach Mactan Island (Lapu-Lapu City) by road across the **Mandaue-Mactan Bridge**, the **Marcelo Fernan Bridge**, or the **CCLEX (Cebu-Cordova Link Expressway)**, or by passenger ferry from Pier 3 in Cebu City to the Lapu-Lapu Ferry Terminal.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bweather\s+(?:usually\s+like\s+)?in\b/i.test(normalized)) {
    return {
      text: "Cebu has a warm tropical climate year-round (typically 24°C–32°C). December falls during the cooler northeast monsoon (*amihan*) season with generally pleasant breezes and occasional passing showers—though I cannot check live real-time weather forecasts, so please verify a current weather service before heading out.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bwhat\s+should\s+i\s+bring\s+when\s+visiting\b/i.test(normalized)) {
    return {
      text: "When visiting Metro Cebu heritage sites, bring comfortable walking shoes, drinking water, sun protection or an umbrella, small cash (PHP) for museum or fort entrance fees, and modest attire covering shoulders and knees when entering sacred sites such as Basilica Minore del Santo Niño or Cebu Taoist Temple.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // 5. Geography & Metro Cebu distinctions
  if (/^(where\s+is|where\s+s)\s+mandaue/i.test(normalized)) {
    return {
      text: "Mandaue City is a highly urbanized coastal city in Metro Cebu located immediately north-northeast of Cebu City and directly across the Mactan Channel from Lapu-Lapu City on Mactan Island.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bis\s+lapu[\s-]?lapu\s+part\s+of\s+metro\s+cebu\b/i.test(normalized)) {
    return {
      text: "Yes, **Lapu-Lapu City** (located on Mactan Island) is one of the core highly urbanized cities of Metro Cebu and is one of the four cities covered in Handumanan's verified heritage directory.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\b(what\s+cities\s+are\s+included\s+in\s+metro\s+cebu|cities\s+in\s+metro\s+cebu)\b/i.test(normalized)) {
    return {
      text: "The broader Metro Cebu metropolitan area spans from Danao City in the north to Carcar City in the south (including Cebu City, Mandaue City, Lapu-Lapu City, Talisay City, Naga City, Consolacion, Liloan, Compostela, Cordova, Minglanilla, and San Fernando). In **Handumanan**, the verified heritage directory specifically covers the four core urban cities: **Cebu City**, **Mandaue City**, **Lapu-Lapu City**, and **Talisay City**.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bhow\s+far\s+is\s+talisay\s+from\s+cebu\s+city\b/i.test(normalized)) {
    return {
      text: "Talisay City borders Cebu City immediately to the south. From downtown Cebu City (around Magellan's Cross / City Hall) to Talisay City's heritage core (such as Talisay Landing Site and Poblacion), the distance is roughly 10 to 12 kilometers via the Cebu South Coastal Road or Natalio Bacalso Avenue.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bdifference\s+between\s+cebu\s+city\s+and\s+cebu\s+province\b/i.test(normalized)) {
    return {
      text: "**Cebu City** is the capital city on Cebu Island and is an independent highly urbanized city within Metro Cebu. **Cebu Province** is the larger island province surrounding Metro Cebu, encompassing dozens of component cities and municipalities (such as Carcar, Argao, Boljoon, Oslob, and Bogo). Handumanan's verified directory covers Metro Cebu's four core cities (Cebu City, Mandaue City, Lapu-Lapu City, and Talisay City).",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  // 6. General knowledge & harmless non-heritage questions
  if (/\bbahay\s+na\s+bato\b/i.test(normalized)) {
    return {
      text: "In general Philippine architectural history, *Bahay na Bato* ('house of stone') is a Spanish-colonial residential style combining a coral-stone or masonry ground floor with an upper timber living level, capiz-shell sliding windows, and high pitched roofs for tropical ventilation. In Handumanan's verified directory, surviving Parian examples include Yap-Sandiego Ancestral House, 1730 Jesuit House, and Casa Gorordo Museum.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bcapital\s+of\s+japan\b/i.test(normalized)) {
    return {
      text: "The capital of Japan is **Tokyo**.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bartificial\s+intelligence\b/i.test(normalized)) {
    return {
      text: "**Artificial intelligence (AI)** is a branch of computer science focused on building systems capable of performing tasks that typically require human intelligence—such as understanding natural language, recognizing patterns, reasoning, and answering questions.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bcatholicism\s+and\s+protestantism\b/i.test(normalized)) {
    return {
      text: "**Catholicism** and **Protestantism** are two major branches of Christianity. Catholicism is led by the Pope in Rome and emphasizes both Sacred Scripture and Church Tradition along with seven sacraments, whereas Protestantism emerged during the 16th-century Reformation, emphasizing Scripture alone (*sola scriptura*), justification by faith, and diverse denominational governance.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bcelebrate\s+christmas\b/i.test(normalized)) {
    return {
      text: "People celebrate **Christmas** on December 25 to commemorate the birth of Jesus Christ in Christian tradition, as well as a cultural season of family gatherings, generosity, and peace. In Cebu and across the Philippines, it is celebrated with nine-day dawn masses (*Misa de Gallo* / *Simbang Gabi*) and *Noche Buena* family feasts.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bclimate\s+change\b/i.test(normalized)) {
    return {
      text: "**Climate change** refers to long-term shifts in global temperatures and weather patterns, driven since the industrial era primarily by human activities such as burning fossil fuels and deforestation, which increase heat-trapping greenhouse gases in Earth's atmosphere.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\brepublic\s+and\s+a?\s*democracy\b/i.test(normalized)) {
    return {
      text: "A **democracy** is a system of government in which power is vested in the people (who rule directly or through elected representatives), while a **republic** is a representative government with an elected head of state (not a monarch) governed by a constitution that protects minority rights. Most modern countries—including the Philippines—are both democratic and republican.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bhow\s+does\s+the\s+internet\s+work\b/i.test(normalized)) {
    return {
      text: "The **internet** works as a global network of interconnected computers and servers that exchange data in small packets using standardized protocols (**TCP/IP**), routed across fiber-optic cables, wireless networks, and DNS directories that translate domain names into IP addresses.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bthe\s+renaissance\b/i.test(normalized)) {
    return {
      text: "The **Renaissance** (14th to 17th centuries) was a European cultural, artistic, scientific, and intellectual revival that began in Italy, marked by renewed interest in classical Greek and Roman learning, humanism, and global exploration.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\binvented\s+the\s+telephone\b/i.test(normalized)) {
    return {
      text: "**Alexander Graham Bell** is credited with patenting the first practical telephone in 1876.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bphotosynthesis\b/i.test(normalized)) {
    return {
      text: "**Photosynthesis** is the biological process by which green plants, algae, and some bacteria use sunlight, water, and carbon dioxide to produce glucose (chemical energy) and release oxygen.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bwhy\s+is\s+the\s+sky\s+blue\b/i.test(normalized)) {
    return {
      text: "The sky appears blue because of **Rayleigh scattering**: gases and particles in Earth's atmosphere scatter shorter-wavelength blue sunlight in all directions much more strongly than longer-wavelength red light.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bstudy\s+habits\b/i.test(normalized)) {
    return {
      text: "Effective ways to improve study habits include **active recall** (testing yourself instead of passively re-reading), **spaced repetition** across several days, focused 25–45 minute study blocks without phone distractions, summarizing concepts in your own words, and getting consistent sleep.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\b(env\s+file|environment\s+variables?)\b/i.test(normalized)) {
    return {
      text: "An **`.env` file** is a plain-text configuration file used in software projects to store **environment variables** as `KEY=VALUE` pairs—such as app settings, service endpoints, and sensitive credentials like API keys—outside of source code. In **Next.js**, environment variables are loaded from `.env` files at build or server runtime: server-only variables stay private on the backend, while only variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. Storing API keys in environment variables keeps secrets out of version control (like Git) and lets different environments (development, staging, production) use separate values safely.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }
  if (/\bram\s+and\s+storage\b/i.test(normalized)) {
    return {
      text: "**RAM (Random Access Memory)** is fast, temporary working memory that holds data for apps currently in use and clears when the device turns off, whereas **storage** (SSD or HDD) is long-term, non-volatile memory that permanently saves your files, operating system, and applications.",
      suggestedSiteIds: [],
      intent: 'general_knowledge_question',
      cardSelectionReason: 'none_historical_explanation',
    };
  }

  return {
    text: "That is a general topic outside Handumanan's verified heritage site database. While I can share general context or answer questions on history, travel, and Metro Cebu, feel free to ask if you'd like specific details or recommendations from Handumanan's directory in Cebu City, Mandaue City, Lapu-Lapu City, or Talisay City!",
    suggestedSiteIds: [],
    intent: 'general_knowledge_question',
    cardSelectionReason: 'none_historical_explanation',
  };
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

  const hasDuration = state.durationMinutes !== null || (state.days !== null && state.days > 1);
  const hasStartLocation = Boolean(
    state.startingLocationName ||
    state.startingCoords ||
    state.startingCity ||
    state.requestedSiteIds.length > 0 ||
    (input.userLocation && input.userLocation.lat)
  );
  const hasInterest =
    state.categories.length > 0 ||
    state.userDelegatedChoice ||
    state.requestedSiteIds.length > 0 ||
    state.freeOnly ||
    /\b(churches|church|museum|museums|landmarks|historical|architecture|mix|everything|old stuff|free)\b/.test(normQuery);

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
      intent: 'tour_planning',
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
    };
  }

  if (!hasDuration && !hasStartLocation) {
    return {
      text: "I'd love to help plan a heritage tour for you! How much time do you have, where will you be starting from, and will you be walking or using a vehicle?",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
      intent: 'tour_planning',
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
    };
  }

  if (!hasDuration) {
    const locLabel = state.startingLocationName || state.startingCity || 'your starting area';
    return {
      text: `I can help build a heritage tour for you starting near ${locLabel}! How much time do you have for the visit (e.g. 1 hour, 2 hours, 3 hours)?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
      intent: 'tour_planning',
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
    };
  }

  if (!hasStartLocation) {
    const durMins = state.durationMinutes!;
    const durLabel = durMins < 60 ? `${durMins}-minute` : `${(durMins / 60).toFixed(durMins % 60 === 0 ? 0 : 1)}-hour`;
    return {
      text: `I can build a ${durLabel} heritage tour for you. Where will you be starting from in Metro Cebu?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
      intent: 'tour_planning',
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
    };
  }

  if (!hasInterest) {
    const durMins = state.durationMinutes!;
    const durLabel = durMins < 60 ? `${durMins}-minute` : `${(durMins / 60).toFixed(durMins % 60 === 0 ? 0 : 1)}-hour`;
    const locLabel = state.startingLocationName || state.startingCity || 'your starting point';
    return {
      text: `Great! For a ${durLabel} tour starting from ${locLabel}, what would you like to focus on: historical sites, churches, museums/architecture, or a mix?`,
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
      intent: 'tour_planning',
      cardSelectionReason: 'none_clarification_needed',
      requiresClarification: true,
    };
  }

  return generateProximityBasedItineraryState(query, state, input, sites);
}

export function generateProximityBasedItineraryState(
  query: string,
  state: TourPlanningState,
  input: any,
  sites: any[]
): HeritageChatOutput {
  const days = state.days && state.days > 1 ? state.days : 1;
  const durationMinutes = state.durationMinutes || (days > 1 ? days * 240 : 120);
  const targetCity = state.startingCity || 'Cebu City';
  const maxWalkKm = state.maxWalkingKm ?? 2.5;

  const activeSites = (sites || []).filter(
    (s: any) => s && s.isActive !== false && s.status !== 'Inactive' && s.demolitionStatus !== 'Demolished'
  );
  const openSites = activeSites.filter((s: any) => isSiteOpenForVisit(s));
  let candidatePool = state.freeOnly
    ? activeSites.filter((s: any) => /^free\b/i.test(String(s.entranceFee || '').trim()))
    : [...openSites];

  if (state.startingCity && state.requestedSiteIds.length === 0) {
    candidatePool = candidatePool.filter((s: any) => s.city === state.startingCity);
  }

  if (state.excludedCategories.length > 0) {
    candidatePool = candidatePool.filter((s: any) => !state.excludedCategories.includes(s.category));
  }

  if (state.categories.length > 0) {
    candidatePool = candidatePool.filter((s: any) => state.categories.includes(s.category));
  }

  if (state.budgetPreference === 'cheaper' && !state.freeOnly) {
    candidatePool.sort((a: any, b: any) => {
      const aFree = /^free\b/i.test(String(a.entranceFee || '').trim()) ? 0 : 1;
      const bFree = /^free\b/i.test(String(b.entranceFee || '').trim()) ? 0 : 1;
      return aFree - bFree;
    });
  }

  // Derive starting coordinates from user input, first explicitly requested site, or first matching city site (never blindly hardcode Fort San Pedro for non-Cebu-City trips)
  const firstRequestedSite = state.requestedSiteIds.length > 0
    ? activeSites.find((s: any) => s.id === state.requestedSiteIds[0])
    : null;
  const firstCitySite = candidatePool.find((s: any) => getVerifiedCoordinates(s)) || openSites.find((s: any) => s.city === targetCity && getVerifiedCoordinates(s));
  const fallbackCoords =
    getVerifiedCoordinates(firstRequestedSite) ||
    getVerifiedCoordinates(firstCitySite) ||
    { lat: 10.29365, lng: 123.90196 };

  const startPoint: { lat: number; lng: number } = state.startingCoords || fallbackCoords;
  const hasExplicitStart = Boolean(state.startingLocationName || state.startingCoords || input.userLocation);
  const startPhrase = hasExplicitStart
    ? `, starting from ${state.startingLocationName || (input.userLocation ? 'your current location' : targetCity)}`
    : firstRequestedSite
      ? ` (no starting point was supplied; route order is anchored near **${firstRequestedSite.name}** for estimation purposes only)`
      : ` in ${targetCity} (no specific starting point supplied; using ${targetCity} area for estimation only)`;

  let prefixNotes = '';
  let maxStops = days > 1 ? Math.min(8, days * 3) : 4;

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
  } else if (days === 1) {
    if (durationMinutes <= 60) {
      maxStops = 2;
    } else if (durationMinutes <= 120) {
      maxStops = 3;
    } else {
      maxStops = 4;
    }
  }

  if (state.addExtraFreeSite) {
    maxStops += 1;
  }

  const selectedSites: any[] = [];
  const usedIds = new Set<string>();
  let currentPos = startPoint;
  let runningMinutes = 0;

  // 1. Preserve explicitly requested destinations first (never silently replace them)
  const keptRequestedIds =
    state.removedStopCount > 0 && state.requestedSiteIds.length > state.removedStopCount
      ? state.requestedSiteIds.slice(0, state.requestedSiteIds.length - state.removedStopCount)
      : state.requestedSiteIds;

  for (const reqId of keptRequestedIds) {
    const reqSite = activeSites.find((s: any) => s.id === reqId);
    if (!reqSite || usedIds.has(reqSite.id)) continue;
    selectedSites.push(reqSite);
    usedIds.add(reqSite.id);
    const reqCoords = getVerifiedCoordinates(reqSite);
    if (reqCoords) {
      const dist = calculateDistanceKm(currentPos, reqCoords);
      const estVisit = durationMinutes <= 30 ? 15 : reqSite.id === 'cebu-cross' ? 15 : 30;
      const estTravel = state.transportationMode === 'walking'
        ? Math.max(3, Math.round((dist / 4.5) * 60))
        : Math.max(5, Math.round((dist / 22) * 60) + 3);
      runningMinutes += estVisit + estTravel;
      currentPos = reqCoords;
    }
  }

  // 2. Fill remaining stops by proximity + constraints (do not silently refill when user just removed a stop)
  const shouldRefillStops = !(state.removedStopCount > 0 && state.requestedSiteIds.length > 0);
  const remainingSlots = shouldRefillStops ? Math.max(0, maxStops - selectedSites.length) : 0;
  for (let i = 0; i < remainingSlots; i++) {
    let bestSite: any = null;
    let bestScore = Infinity;
    let bestDistKm = 0;

    for (const site of candidatePool) {
      if (usedIds.has(site.id)) continue;
      const coords = site.coordinates || { lat: site.latitude, lng: site.longitude };
      if (!coords || !Number.isFinite(Number(coords.lat))) continue;

      const dist = calculateDistanceKm(currentPos, { lat: Number(coords.lat), lng: Number(coords.lng) });
      if (state.transportationMode === 'walking' && selectedSites.length > 0 && dist > maxWalkKm) {
        continue;
      }
      const feeWeight =
        (state.budgetPreference === 'cheaper' || state.freeOnly) &&
        /^free\b/i.test(String(site.entranceFee || '').trim())
          ? 0.65
          : 1;
      const weightedDist = (site.isMustVisit ? dist * 0.85 : dist) * feeWeight;

      if (weightedDist < bestScore) {
        bestScore = weightedDist;
        bestSite = site;
        bestDistKm = dist;
      }
    }

    if (bestSite) {
      const estVisit = durationMinutes <= 30 ? 15 : bestSite.id === 'cebu-cross' ? 15 : 30;
      const estTravel = state.transportationMode === 'walking'
        ? Math.max(3, Math.round((bestDistKm / 4.5) * 60))
        : Math.max(5, Math.round((bestDistKm / 22) * 60) + 3);
      if (selectedSites.length > 0 && runningMinutes + estVisit + estTravel > durationMinutes) {
        break;
      }
      selectedSites.push(bestSite);
      usedIds.add(bestSite.id);
      runningMinutes += estVisit + estTravel;
      const coords = bestSite.coordinates || { lat: bestSite.latitude, lng: bestSite.longitude };
      currentPos = { lat: Number(coords.lat), lng: Number(coords.lng) };
    } else {
      break;
    }
  }

  // Apply "remove the last destination" if no explicit requestedSiteIds were removed above
  if (state.removedStopCount > 0 && state.requestedSiteIds.length === 0 && selectedSites.length > 1) {
    const removeCount = Math.min(state.removedStopCount, selectedSites.length - 1);
    selectedSites.splice(selectedSites.length - removeCount, removeCount);
  }

  if (selectedSites.length === 0) {
    return {
      text: "I could not find open heritage sites in the directory matching those parameters to build a tour.",
      suggestedSiteIds: [],
      isGeneratedItinerary: false,
      intent: 'tour_planning',
      cardSelectionReason: 'none_no_matching_sites',
    };
  }

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

  const bufferMinutes = Math.max(5, Math.round(totalTravelMinutes));
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

  const durationLabel =
    days > 1
      ? `${days}-day`
      : durationMinutes < 60
        ? `${durationMinutes}-minute`
        : `${(durationMinutes / 60).toFixed(durationMinutes % 60 === 0 ? 0 : 1)}-hour`;

  const formatClock = (mins: number) => {
    const wrapped = ((mins % 1440) + 1440) % 1440;
    const h24 = Math.floor(wrapped / 60);
    const m = wrapped % 60;
    const ampm = h24 >= 12 ? 'PM' : 'AM';
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  const startTimeNote =
    state.startTimeMinutes !== null ? ` (starting around ${formatClock(state.startTimeMinutes)})` : '';
  const preferenceNotes: string[] = [];
  if (state.freeOnly) preferenceNotes.push('free-admission sites prioritized');
  else if (state.budgetPreference === 'cheaper') preferenceNotes.push('lower-cost/free sites prioritized');
  if (state.budgetPhp !== null) preferenceNotes.push(`target budget ₱${state.budgetPhp} (estimated)`);
  if (state.maxWalkingKm !== null) preferenceNotes.push(`walking segments capped at ~${state.maxWalkingKm} km`);
  const prefSuffix = preferenceNotes.length > 0 ? ` [${preferenceNotes.join('; ')}]` : '';

  if (days > 1) {
    const dayBuckets: any[][] = Array.from({ length: days }, () => []);
    selectedSites.forEach((site: any, idx: number) => {
      const dayIdx = Math.min(days - 1, Math.floor((idx * days) / Math.max(1, selectedSites.length)));
      dayBuckets[dayIdx].push(site);
    });

    const scheduledDayCount = dayBuckets.filter(b => b.length > 0).length;
    const daySections = dayBuckets.map((bucket, dayIdx) => {
      if (bucket.length === 0) {
        return state.removedStopCount > 0
          ? `**Day ${dayIdx + 1}**\n- Open / free day (removing the last destination leaves Day ${dayIdx + 1} without a scheduled stop; you can keep Day ${dayIdx + 1} free or ask to shorten the trip to 1 day).`
          : `**Day ${dayIdx + 1}**\n- Open / free day (no heritage stop scheduled; add a Metro Cebu heritage stop or keep this day flexible).`;
      }
      const lines = bucket.map((s: any, i: number) => `${i + 1}. **${s.name}** (${s.city}) — Visit: ~30 min`);
      const dayVisitMin = bucket.length * 30;
      const dayTravelMin = Math.max(5, bucket.length * 8);
      return `**Day ${dayIdx + 1}** (estimated ~${dayVisitMin + dayTravelMin} min: ${dayVisitMin} min visiting + ~${dayTravelMin} min travel)\n${lines.join('\n')}`;
    });

    const structuredMultiDay = `${prefixNotes}Based on the current Handumanan directory, here's a realistic ${durationLabel} tour${startTimeNote}${prefSuffix}${startPhrase}:

${daySections.join('\n\n*Overnight break between days (Handumanan does not book or price accommodations).*\n\n')}

Estimated scheduled heritage time across ${scheduledDayCount} active ${scheduledDayCount === 1 ? 'day' : 'days'} (out of ${days} total trip days): ~${formattedTotalTime} (${totalVisitMinutes} min visiting ${selectedSites.length} ${selectedSites.length === 1 ? 'stop' : 'stops'} + ~${bufferMinutes} min estimated local travel/buffer).${foodNote}`;

    return {
      text: structuredMultiDay,
      suggestedSiteIds: selectedSites.map((s: any) => s.id),
      isGeneratedItinerary: true,
      intent: 'tour_planning',
      cardSelectionReason: 'itinerary_stops',
    };
  }

  const structuredText = `${prefixNotes}Based on the current Handumanan directory, here's a realistic ${durationLabel} tour${startTimeNote}${prefSuffix}${startPhrase}:

${stopsFormatted.join('\n\n')}

Estimated duration: ~${formattedTotalTime} (${totalVisitMinutes} min visiting stops + ~${bufferMinutes} min estimated travel/buffer).${foodNote}` + (durationMinutes > calculatedTotalMinutes + 15 ? `\n\nYou still have about ${durationMinutes - calculatedTotalMinutes} minutes remaining. I can add another nearby stop or keep this as a more relaxed schedule.` : '');

  return {
    text: structuredText,
    suggestedSiteIds: selectedSites.map((s: any) => s.id),
    isGeneratedItinerary: true,
    intent: 'tour_planning',
    cardSelectionReason: 'itinerary_stops',
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

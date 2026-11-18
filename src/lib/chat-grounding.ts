export type GroundedSourceCategory = 'Official' | 'News' | 'Reference' | 'Travel Guide';

export interface GroundedSource {
  title: string;
  url: string;
  category?: GroundedSourceCategory;
  supportedSegments?: string[];
}

const MAX_GROUNDED_SOURCES = 5;
const MAX_TITLE_LENGTH = 120;
const MAX_SEGMENT_LENGTH = 140;

const CEBU_RESEARCH_SCOPE_REGEX =
  /\b(cebu|cebuano|metro\s+cebu|cebu\s+city|mandaue|lapu[\s-]?lapu|mactan|talisay|carcar|argao|dalaguete|oslob|moalboal|badian|kawasan|bantayan|camotes|malapascua|sibonga|simala|sinulog|taoist\s+temple|temple\s+of\s+leah|sirao|tops|busay|magellan|humabon|lapulapu|kalesa|lechon|puso|otap|rosquillos|chicharon|visayas|visayan)\b/i;

const HERITAGE_TOURISM_TOPIC_REGEX =
  /\b(heritage|history|historical|culture|cultural|tradition|festival|fiesta|museum|church|cathedral|basilica|shrine|monument|landmark|ancestral|architecture|spanish\s+era|tourism|tourist|attraction|visit|visiting|travel|commute|ferry|bus|terminal|food|cuisine|delicacy|dish)\b/i;

const DISALLOWED_RESEARCH_TOPIC_REGEX =
  /\b(api\s*key|secret|password|credential|system\s+prompt|\.env|firebase|firestore|token|hack|exploit|weapon|bomb|diagnose|medication|chest\s+pain|lawsuit|legal\s+advice|stock\s+market|crypto|python|javascript|typescript|sql|homework|essay)\b/i;

export function classifySourceCategory(title: string, safeUrl: string): GroundedSourceCategory {
  let hostname = '';
  try {
    hostname = new URL(safeUrl).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    hostname = '';
  }

  const titleLower = String(title || '').toLowerCase();
  const publisherText = `${hostname} ${titleLower}`;

  if (
    /\.(gov\.ph|gov|mil)$/.test(hostname) ||
    /\b(tourism\.gov|nhcp\.gov|ncca\.gov|unesco\.org|tieza\.gov|cebu\.gov\.ph|cebucity\.gov\.ph|badian\.gov\.ph)\b/.test(publisherText) ||
    /\b(department\s+of\s+tourism|national\s+historical\s+commission|province\s+of\s+cebu|city\s+of\s+cebu|municipality\s+of\s+\w+|official\s+(?:website|site|tourism))\b/.test(titleLower)
  ) {
    return 'Official';
  }

  if (
    /\b(sunstar\.com\.ph|cebudailynews\.inquirer\.net|inquirer\.net|rappler\.com|philstar\.com|mb\.com\.ph|manilatimes\.net|gmanetwork\.com|abs-cbn\.com|bworldonline\.com|reuters\.com|apnews\.com)\b/.test(publisherText) ||
    /\b(sunstar|cebu\s+daily\s+news|philippine\s+daily\s+inquirer|inquirer|philippine\s+star|philstar|rappler|manila\s+bulletin|gma\s+news|abs-cbn\s+news)\b/.test(titleLower)
  ) {
    return 'News';
  }

  if (
    /\.(edu\.ph|edu)$/.test(hostname) ||
    /\b(wikipedia\.org|britannica\.com|jstor\.org|archive\.org|nationalmuseum\.gov\.ph)\b/.test(publisherText)
  ) {
    return 'Reference';
  }

  return 'Travel Guide';
}

export function isExternalAttractionsNearSiteQuery(query: string): boolean {
  const text = String(query || '').trim();
  if (!text) return false;
  if (/\b(plan|create|build|generate|make)\b.*\b(itinerary|tour|trip|route)\b/i.test(text)) {
    return false;
  }
  return (
    /\b(besides|other\s+than|outside|apart\s+from|aside\s+from|not\s+in)\b.*\b(heritage\s+sites?|handumanan|directory)\b/i.test(text) ||
    /\b(attractions?|things\s+to\s+do|non-heritage|other\s+places?)\b.*\b(besides|other\s+than|outside|apart\s+from|aside\s+from)\b/i.test(text) ||
    (/\b(attractions?|places?|spots?|things\s+to\s+do|sights?)\b/i.test(text) &&
      /\b(within\s+walking\s+distance\s+of|walking\s+distance\s+(?:of|from)|walkable\s+(?:near|from|around))\b/i.test(text) &&
      !/\b(near\s+me|my\s+location|current\s+location|heritage\s+sites?\s+in\s+handumanan)\b/i.test(text))
  );
}

export function isSpecificExternalTourismResearchQuery(query: string): boolean {
  const text = String(query || '').trim();
  if (!text) return false;
  if (DISALLOWED_RESEARCH_TOPIC_REGEX.test(text)) return false;

  // Keep Phase 3.1 multi-turn food budget/price follow-ups on the deterministic limitation handler
  if (/\b(cheaper|budget|₱|php|pesos?)\b/i.test(text) && !/\b(kawasan|oslob|moalboal|bantayan|camotes|malapascua|temple\s+of\s+leah|sirao|simala)\b/i.test(text)) {
    return false;
  }

  return (
    /\b(kawasan|oslob|moalboal|badian|bantayan|camotes|malapascua|temple\s+of\s+leah|sirao|simala|tops\s+cebu|tops\s+lookout|sinulog|cebuano\s+food|cebu\s+food|delicac|lechon)\b/i.test(text) ||
    /\b(history\s+of|current\s+(?:entrance\s+)?fees?|visiting\s+hours|opening\s+hours|visiting\s+rules|schedules?|ticket\s+price|tour\s+rules|ferry\s+schedule)\b/i.test(text)
  );
}

function getParagraphWordSet(paragraph: string): Set<string> {
  const stopWords = new Set([
    'the', 'and', 'for', 'that', 'with', 'this', 'from', 'are', 'was', 'were',
    'been', 'have', 'has', 'had', 'into', 'also', 'such', 'which', 'their', 'about',
    'while', 'however', 'during', 'cebu', 'falls', 'kawasan',
  ]);
  const words = paragraph
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 4 && !stopWords.has(w));
  return new Set(words);
}

function areParagraphsSubstantiallyDuplicate(a: string, b: string): boolean {
  const normA = a.toLowerCase().replace(/\s+/g, ' ').trim();
  const normB = b.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  const setA = getParagraphWordSet(normA);
  const setB = getParagraphWordSet(normB);
  if (setA.size < 4 || setB.size < 4) return false;

  let intersection = 0;
  for (const w of setA) {
    if (setB.has(w)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union > 0 && intersection / union >= 0.55;
}

export function sanitizeGroundedResearchText(text: string): string {
  const cleaned = String(text || '').trim();
  if (!cleaned) return '';

  // Remove consecutive substantially identical paragraphs
  const paragraphs = cleaned
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean);

  const deduped: string[] = [];
  for (const p of paragraphs) {
    const prev = deduped[deduped.length - 1];
    if (prev && areParagraphsSubstantiallyDuplicate(prev, p)) {
      continue;
    }
    deduped.push(p);
  }

  return deduped.join('\n\n').trim();
}

export function isSafeHttpUrl(rawUrl: unknown): string | null {
  if (typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.startsWith('//')) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    if (!parsed.hostname) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

const KNOWN_DOMAIN_LABELS: Record<string, string> = {
  'sunstar.com.ph': 'SunStar Cebu',
  'cebudailynews.inquirer.net': 'Cebu Daily News',
  'inquirer.net': 'Philippine Daily Inquirer',
  'philstar.com': 'The Philippine Star',
  'rappler.com': 'Rappler',
  'mb.com.ph': 'Manila Bulletin',
  'manilatimes.net': 'The Manila Times',
  'gmanetwork.com': 'GMA News',
  'abs-cbn.com': 'ABS-CBN News',
  'wikipedia.org': 'Wikipedia',
  'en.wikipedia.org': 'Wikipedia',
  'britannica.com': 'Encyclopaedia Britannica',
  'tourism.gov.ph': 'Department of Tourism Philippines',
  'nhcp.gov.ph': 'National Historical Commission of the Philippines',
  'ncca.gov.ph': 'National Commission for Culture and the Arts',
  'cebu.gov.ph': 'Province of Cebu Official Portal',
  'cebucity.gov.ph': 'City of Cebu Official Portal',
};

function formatBareDomainTitle(domain: string): string {
  const normalized = domain.toLowerCase().replace(/^www\./, '');
  const known = KNOWN_DOMAIN_LABELS[normalized];
  if (known) return `${known} (${normalized})`;
  if (/\.(gov\.ph|gov|mil)$/.test(normalized)) {
    return `Official Portal (${normalized})`;
  }
  if (/\.(edu\.ph|edu)$/.test(normalized)) {
    return `Academic Reference (${normalized})`;
  }
  const stem = normalized.split('.')[0]?.replace(/[-_]+/g, ' ') || normalized;
  const readable = stem.replace(/\b\w/g, ch => ch.toUpperCase());
  return `${readable} (${normalized})`;
}

export function sanitizeSourceTitle(rawTitle: unknown, safeUrl: string): string {
  const cleaned = typeof rawTitle === 'string'
    ? rawTitle.replace(/[\r\n\t]+/g, ' ').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim()
    : '';

  if (cleaned && !/^(undefined|null|untitled)$/i.test(cleaned)) {
    if (/^(?:[a-z0-9-]+\.)+[a-z]{2,}$/i.test(cleaned)) {
      return formatBareDomainTitle(cleaned);
    }
    return cleaned.length > MAX_TITLE_LENGTH
      ? `${cleaned.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`
      : cleaned;
  }

  try {
    const hostname = new URL(safeUrl).hostname.replace(/^www\./i, '');
    if (hostname && hostname !== 'vertexaisearch.cloud.google.com') {
      return formatBareDomainTitle(hostname);
    }
  } catch {
    // Fallback below
  }

  return 'Verified Web Source';
}

function extractSegmentSnippet(segment: any, answerText?: string): string | null {
  if (typeof segment?.text === 'string' && segment.text.trim()) {
    const cleaned = segment.text.replace(/\s+/g, ' ').trim();
    return cleaned.length > MAX_SEGMENT_LENGTH
      ? `${cleaned.slice(0, MAX_SEGMENT_LENGTH - 1).trimEnd()}…`
      : cleaned;
  }

  if (
    typeof answerText === 'string' &&
    typeof segment?.startIndex === 'number' &&
    typeof segment?.endIndex === 'number' &&
    segment.startIndex >= 0 &&
    segment.endIndex > segment.startIndex
  ) {
    // Gemini indices are UTF-8 byte offsets
    const bytes = Buffer.from(answerText, 'utf8');
    if (segment.endIndex <= bytes.length) {
      const sliced = bytes.subarray(segment.startIndex, segment.endIndex).toString('utf8').replace(/\s+/g, ' ').trim();
      if (sliced) {
        return sliced.length > MAX_SEGMENT_LENGTH
          ? `${sliced.slice(0, MAX_SEGMENT_LENGTH - 1).trimEnd()}…`
          : sliced;
      }
    }
  }

  return null;
}

export function extractValidatedGroundingSources(
  groundingMetadata: any,
  answerText?: string,
  maxSources: number = MAX_GROUNDED_SOURCES
): GroundedSource[] {
  if (!groundingMetadata || typeof groundingMetadata !== 'object') {
    return [];
  }

  const chunks = Array.isArray(groundingMetadata.groundingChunks)
    ? groundingMetadata.groundingChunks
    : [];

  if (chunks.length === 0) {
    return [];
  }

  const supports = Array.isArray(groundingMetadata.groundingSupports)
    ? groundingMetadata.groundingSupports
    : [];

  const supportedSegmentsByChunk = new Map<number, string[]>();
  const supportedOrder: number[] = [];

  for (const support of supports) {
    const indices = Array.isArray(support?.groundingChunkIndices)
      ? support.groundingChunkIndices
      : [];
    const snippet = extractSegmentSnippet(support?.segment, answerText);

    for (const rawIdx of indices) {
      if (typeof rawIdx !== 'number' || !Number.isInteger(rawIdx) || rawIdx < 0 || rawIdx >= chunks.length) {
        continue;
      }
      if (!supportedSegmentsByChunk.has(rawIdx)) {
        supportedSegmentsByChunk.set(rawIdx, []);
        supportedOrder.push(rawIdx);
      }
      if (snippet) {
        const list = supportedSegmentsByChunk.get(rawIdx)!;
        if (!list.includes(snippet) && list.length < 2) {
          list.push(snippet);
        }
      }
    }
  }

  const orderedIndices: number[] =
    supportedOrder.length > 0
      ? [...supportedOrder]
      : chunks.map((_: unknown, idx: number) => idx);

  const categoryPriority: Record<GroundedSourceCategory, number> = {
    Official: 0,
    News: 1,
    Reference: 2,
    'Travel Guide': 3,
  };

  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const sources: GroundedSource[] = [];
  const cap = Math.max(1, Math.min(maxSources, MAX_GROUNDED_SOURCES));

  for (const idx of orderedIndices) {
    const chunk = chunks[idx];
    const safeUrl = isSafeHttpUrl(chunk?.web?.uri);
    if (!safeUrl || seenUrls.has(safeUrl)) continue;

    const title = sanitizeSourceTitle(chunk?.web?.title, safeUrl);
    const normalizedTitle = title.toLowerCase();
    if (normalizedTitle !== 'verified web source' && seenTitles.has(normalizedTitle)) continue;

    seenUrls.add(safeUrl);
    seenTitles.add(normalizedTitle);
    const category = classifySourceCategory(title, safeUrl);
    const segments = supportedSegmentsByChunk.get(idx);

    sources.push(
      segments && segments.length > 0
        ? { title, url: safeUrl, category, supportedSegments: segments }
        : { title, url: safeUrl, category }
    );
  }

  sources.sort((a, b) => {
    const tierDiff =
      categoryPriority[a.category ?? 'Travel Guide'] -
      categoryPriority[b.category ?? 'Travel Guide'];
    return tierDiff;
  });

  return sources.slice(0, cap);
}

export function isCebuResearchScopeQuery(
  query: string,
  hasCebuContext: boolean = false
): boolean {
  const text = String(query || '').trim();
  if (!text) return false;
  if (DISALLOWED_RESEARCH_TOPIC_REGEX.test(text)) return false;

  const hasCebuMention = CEBU_RESEARCH_SCOPE_REGEX.test(text);
  const hasHeritageOrTourismTopic = HERITAGE_TOURISM_TOPIC_REGEX.test(text);

  if (hasCebuMention) return true;
  if (hasCebuContext && hasHeritageOrTourismTopic) return true;

  return false;
}


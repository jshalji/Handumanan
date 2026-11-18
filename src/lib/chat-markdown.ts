import { isSafeHttpUrl } from '@/lib/chat-grounding';

export const INTERNAL_CHAT_ROUTES: Record<string, string> = {
  '/explore': 'Explore',
  '/discover': 'Discover',
  '/auth': 'Login / Authentication',
  '/lgu-dashboard': 'LGU Dashboard',
  '/admin-dashboard': 'Admin Dashboard',
  '/itinerary': 'Itinerary',
  '/profile': 'Profile',
};

export type ChatInlineToken =
  | { type: 'text'; value: string }
  | { type: 'code'; value: string }
  | { type: 'bold'; value: string }
  | { type: 'italic'; value: string }
  | { type: 'internal_link'; label: string; href: string }
  | { type: 'external_link'; label: string; href: string }
  | { type: 'image'; alt: string; src: string };

export interface ChatMarkdownOptions {
  preserveTechnicalRoutes?: boolean;
}

export function isTechnicalRouteRequest(query: string): boolean {
  const norm = String(query || '').toLowerCase();
  return /\b(routes?|urls?|paths?|endpoints?|slugs?|implementation\s+details?|page\s+paths?|route\s+paths?|exact\s+url|exact\s+route)\b/.test(norm);
}

const ROUTE_LABEL_ALIASES: Array<{ route: string; aliasPattern: string; canonicalLabel: string }> = [
  { route: '/explore', aliasPattern: 'Explore', canonicalLabel: 'Explore' },
  { route: '/discover', aliasPattern: 'Discover', canonicalLabel: 'Discover' },
  {
    route: '/auth',
    aliasPattern: 'Login\\s*\\/\\s*Authentication|Login|Authentication|Sign\\s*In',
    canonicalLabel: 'Login / Authentication',
  },
  { route: '/lgu-dashboard', aliasPattern: 'LGU\\s+Dashboard', canonicalLabel: 'LGU Dashboard' },
  { route: '/admin-dashboard', aliasPattern: 'Admin\\s+Dashboard', canonicalLabel: 'Admin Dashboard' },
  { route: '/itinerary', aliasPattern: 'Itinerary', canonicalLabel: 'Itinerary' },
  { route: '/profile', aliasPattern: 'Profile', canonicalLabel: 'Profile' },
];

function normalizeOrdinaryRouteSegment(segment: string): string {
  let result = segment;

  // Replace redundant "Label (/route)" or "**Label** (`/route`)" with "[Label](/route)"
  for (const { route, aliasPattern, canonicalLabel } of ROUTE_LABEL_ALIASES) {
    const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pairedRegex = new RegExp(
      `(?:\\*\\*)?(${aliasPattern})(?:\\*\\*)?\\s*\\(\\s*\`?${escapedRoute}\`?\\s*\\)`,
      'gi'
    );
    result = result.replace(pairedRegex, `[${canonicalLabel}](${route})`);
  }

  // Replace standalone backticked or bare known internal routes (not inside existing markdown links)
  const routeKeysPattern = Object.keys(INTERNAL_CHAT_ROUTES)
    .map(route => route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const standaloneRouteRegex = new RegExp(
    `(^|[\\s(])\`?(${routeKeysPattern})\`?(?=$|[\\s.,;:!?)]|['"])`,
    'g'
  );

  result = result
    .split(/(\[[^\]\n]+\]\([^)\n]+\))/g)
    .map(part => {
      if (/^\[[^\]\n]+\]\([^)\n]+\)$/.test(part)) return part;
      return part.replace(standaloneRouteRegex, (fullMatch, prefix: string, matchedRoute: string) => {
        const label = INTERNAL_CHAT_ROUTES[matchedRoute];
        if (!label) return fullMatch;
        return `${prefix}[${label}](${matchedRoute})`;
      });
    })
    .join('');

  return result;
}

function normalizeOrdinaryRouteMentions(text: string): string {
  // Preserve existing markdown links so their (/route) targets are never double-wrapped
  return text
    .split(/(\[[^\]\n]+\]\([^)\n]+\))/g)
    .map(part => (/^\[[^\]\n]+\]\([^)\n]+\)$/.test(part) ? part : normalizeOrdinaryRouteSegment(part)))
    .join('');
}

export function tokenizeInlineChatMarkdown(
  text: string,
  options: ChatMarkdownOptions = {}
): ChatInlineToken[] {
  const unescaped = String(text || '').replace(/\\([\\*_`])/g, '$1');
  const prepared = options.preserveTechnicalRoutes
    ? unescaped
    : normalizeOrdinaryRouteMentions(unescaped);

  const rawTokens = prepared.split(/(!\[[^\]\n]*\]\([^)\n]+\)|\[[^\]\n]+\]\([^)\n]+\)|`[^`]+`|\*\*[^*]+\*\*|\*[^*\n]+\*)/g);
  const tokens: ChatInlineToken[] = [];

  for (const token of rawTokens) {
    if (!token) continue;

    const imageMatch = token.match(/^!\[([^\]\n]*)\]\(([^)\n]+)\)$/);
    if (imageMatch) {
      const alt = imageMatch[1].trim();
      const safeSrc = isSafeHttpUrl(imageMatch[2].trim());
      if (safeSrc) {
        tokens.push({ type: 'image', alt: alt || 'Handumanan image', src: safeSrc });
      } else {
        tokens.push({ type: 'text', value: token });
      }
      continue;
    }

    const linkMatch = token.match(/^\[([^\]\n]+)\]\(([^)\n]+)\)$/);
    if (linkMatch) {
      const label = linkMatch[1].trim();
      const href = linkMatch[2].trim();
      if (Object.prototype.hasOwnProperty.call(INTERNAL_CHAT_ROUTES, href)) {
        tokens.push({ type: 'internal_link', label, href });
      } else {
        const safeHref = isSafeHttpUrl(href);
        if (safeHref) {
          tokens.push({ type: 'external_link', label, href: safeHref });
        } else {
          tokens.push({ type: 'text', value: token });
        }
      }
      continue;
    }

    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      tokens.push({ type: 'code', value: token.slice(1, -1) });
      continue;
    }

    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      tokens.push({ type: 'bold', value: token.slice(2, -2) });
      continue;
    }

    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
      tokens.push({ type: 'italic', value: token.slice(1, -1) });
      continue;
    }

    tokens.push({ type: 'text', value: token });
  }

  return tokens;
}


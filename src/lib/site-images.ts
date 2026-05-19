import type { HeritageSite } from '@/lib/heritage-data';

type SiteImageFallbackInput = Pick<HeritageSite, 'city' | 'id'> | {
  city?: string | null;
  id?: string | null;
};

const CITY_IMAGE_FALLBACKS: Record<string, string> = {
  'Cebu City': '/site-directory-cebu-city-hd.avif',
  'Mandaue City': '/site-directory-mandaue-city-hd.jpg',
  'Lapu-Lapu City': '/site-directory-lapu-lapu-city-hd.webp',
  'Talisay City': '/metrocebu-bg.jpg',
};

const SITE_IMAGE_FALLBACKS: Record<string, string> = {
  'cebu-archdiocesan-museum': '/heritage-archdiocesan-museum.jpg',
  'cebu-casa-gorordo': '/heritage-casa-gorordo.jpg',
};

export function getSiteImageFallback(site?: SiteImageFallbackInput | null) {
  if (!site) return '/metrocebu-bg.jpg';
  if (site.id && SITE_IMAGE_FALLBACKS[site.id]) return SITE_IMAGE_FALLBACKS[site.id];
  if (site.city && CITY_IMAGE_FALLBACKS[site.city]) return CITY_IMAGE_FALLBACKS[site.city];
  return '/metrocebu-bg.jpg';
}

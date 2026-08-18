import type { HeritageSite } from '@/lib/heritage-data';

type SiteImageFallbackInput = Pick<HeritageSite, 'city' | 'id' | 'imageUrl' | 'galleryImages'> | {
  city?: string | null;
  id?: string | null;
  imageUrl?: string | null;
  galleryImages?: string[] | null;
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
  'cebu-basilica': '/heritage-sites/basilica1.jpg',
  'cebu-colon-street': '/heritage-sites/colonstreetandhistoricalmarker1.jpg',
  'cebu-heritage-monument': '/heritage-sites/heritageofcebumonument1.jpg',
  'cebu-museo-sugbo': '/heritage-sites/museosugbo1.jpg',
  'cebu-uspf-jose-rizal-museum': '/heritage-sites/uspfmabinicampusjoserizalmuseum1.jpg',
  'cebu-tres-de-abril-marker': '/heritage-sites/battleoftresdeabril1.jpg',
  'cebu-plaza-independencia': '/heritage-sites/plazaindenpencia1.jpg',
  'cebu-plaza-sugbo': '/heritage-sites/plazasugbo1.jpg',
  'cebu-patria': '/heritage-sites/patriadecebu1.jpg',
  'llc-magellan-marker': '/heritage-sites/magellansmarker1.jpg',
  'llc-plaza-rizal': '/heritage-sites/plazarizal(rizalpark)1.jpg',
  'llc-millennium-park': '/heritage-sites/millenniumpark1.jpg',
};

export function getSiteImageFallback(site?: SiteImageFallbackInput | null) {
  if (!site) return '/metrocebu-bg.jpg';
  if (site.id && SITE_IMAGE_FALLBACKS[site.id]) return SITE_IMAGE_FALLBACKS[site.id];
  if (site.city && CITY_IMAGE_FALLBACKS[site.city]) return CITY_IMAGE_FALLBACKS[site.city];
  return '/metrocebu-bg.jpg';
}

export function getSiteImageSources(site?: SiteImageFallbackInput | null) {
  if (!site) return [getSiteImageFallback(site)];

  const galleryImages = Array.isArray(site.galleryImages) ? site.galleryImages.slice(0, 3) : [];
  return Array.from(new Set([
    site.imageUrl,
    ...galleryImages,
    getSiteImageFallback(site),
  ].filter((source): source is string => Boolean(source))));
}

export function getSitePrimaryImage(site?: SiteImageFallbackInput | null) {
  return getSiteImageSources(site)[0] || '/metrocebu-bg.jpg';
}

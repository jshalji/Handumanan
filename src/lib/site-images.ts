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
  'cebu-basilica': '/heritage-sites/basilica1.jpg',
  'cebu-cathedral': '/heritage-sites/metropolitancebucathedral1.jpg',
  'cebu-cross': '/heritage-sites/magellanscross1.jpg',
  'cebu-archdiocesan-museum': '/heritage-sites/Archdiocesanmuseumofcebu1.jpg',
  'cebu-casa-gorordo': '/heritage-sites/casagorordomuseum1.jpg',
  'cebu-yap-sandiego': '/heritage-sites/yapsandiegoancestralhouse1.jpg',
  'cebu-jesuit-house': '/heritage-sites/1730jesuithouse1.jpg',
  'cebu-national-museum': '/heritage-sites/nationalmuseumofthephilippinsecebu1.jpg',
  'cebu-sugbu-chinese-museum': '/heritage-sites/sugbuchineseheritagemuseum1.jpg',
  'cebu-museo-sugbo': '/heritage-sites/museosugbo1.jpg',
  'cebu-uspf-jose-rizal-museum': '/heritage-sites/uspfmabinicampusjoserizalmuseum1.jpg',
  'cebu-usc-museum': '/heritage-sites/universityofsancarlosmuseum1.jpg',
  'cebu-fort-san-pedro': '/heritage-sites/fortsanpedro1.jpg',
  'cebu-heritage-monument': '/heritage-sites/heritageofcebumonument1.jpg',
  'cebu-colon-street': '/heritage-sites/colonstreetandhistoricalmarker1.jpg',
  'cebu-tres-de-abril-marker': '/heritage-sites/battleoftresdeabril1.jpg',
  'cebu-plaza-independencia': '/heritage-sites/plazaindenpencia1.jpg',
  'cebu-plaza-sugbo': '/heritage-sites/plazasugbo1.jpg',
  'cebu-plaza-hamabar': '/heritage-sites/plazahamabar1.jpg',
  'cebu-fuente-osmena': '/heritage-sites/fuenteosmenacircle1.jpg',
  'cebu-city-hall': '/heritage-sites/cebucityhall1.jpg',
  'cebu-capitol': '/heritage-sites/cebuprovincialhall1.jpg.jpg',
  'cebu-patria': '/heritage-sites/patriadecebu1.jpg',
  'cebu-rizal-memorial-library': '/heritage-sites/rizalmemoriallibraryandmuseum1.jpg',
  'talisay-landing': '/heritage-sites/talisaylandingsite1.jpg',
  'talisay-church': '/heritage-sites/stateresadeavilaparishchurch1.jpg',
  'talisay-plaza': '/heritage-sites/talisaycityplaza1.jpg',
  'mandaue-church': '/heritage-sites/nationalshrineofsaintjoseph1.jpg',
  'mandaue-library': '/heritage-sites/mandauecitypubliclibary1.jpg',
  'mandaue-watchtower': '/heritage-sites/bantayansahari1.jpg',
  'mandaue-presidencia': '/heritage-sites/mandauepresidencia1.jpg',
  'mandaue-bridge': '/heritage-sites/mandauemactanbridge1.jpg',
  'mandaue-plaza': '/heritage-sites/mandauecityheritageplaza1.jpg',
  'llc-shrine': '/heritage-sites/virgendelareglanationalshrine1.jpg',
  'llc-mactan-shrine': '/heritage-sites/mactanshrine1.jpg',
  'llc-magellan-marker': '/heritage-sites/magellansmarker1.jpg',
  'llc-plaza-rizal': '/heritage-sites/plazarizal(rizalpark)1.jpg',
  'llc-millennium-park': '/heritage-sites/millenniumpark1.jpg',
  'llc-bridge-park': '/heritage-sites/oldbridgepark1.jpg',
  'marcelo-fernan-bridge': '/heritage-sites/marcelofernanbridge1.jpg',
};

export function getSiteImageFallback(site?: SiteImageFallbackInput | null) {
  if (!site) return '/metrocebu-bg.jpg';
  if (site.id && SITE_IMAGE_FALLBACKS[site.id]) return SITE_IMAGE_FALLBACKS[site.id];
  if (site.city && CITY_IMAGE_FALLBACKS[site.city]) return CITY_IMAGE_FALLBACKS[site.city];
  return '/metrocebu-bg.jpg';
}

export function normalizeImageSource(url?: string | null): string {
  if (!url) return '';
  let cleaned = url.trim();
  if (!cleaned) return '';
  if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://') && !cleaned.startsWith('/') && !cleaned.startsWith('data:')) {
    cleaned = '/' + cleaned;
  }
  return cleaned;
}

export function getSiteImageSources(site?: SiteImageFallbackInput | null): string[] {
  if (!site) return [getSiteImageFallback(site)];

  const galleryImages = Array.isArray(site.galleryImages) ? site.galleryImages : [];
  const rawSources = [
    site.imageUrl,
    ...galleryImages,
  ];

  const seenKeys = new Set<string>();
  const uniqueSources: string[] = [];

  for (const raw of rawSources) {
    const normalized = normalizeImageSource(raw);
    if (!normalized) continue;

    const dedupKey = normalized.startsWith('/') ? normalized.toLowerCase() : normalized;
    if (!seenKeys.has(dedupKey)) {
      seenKeys.add(dedupKey);
      uniqueSources.push(normalized);
    }
  }

  if (uniqueSources.length === 0) {
    return [getSiteImageFallback(site)];
  }

  return uniqueSources;
}

export function getSitePrimaryImage(site?: SiteImageFallbackInput | null) {
  return getSiteImageSources(site)[0] || '/metrocebu-bg.jpg';
}

type CommunityRecord = Record<string, any>;

export const CITY_ALBUM_NAMES = [
  'Cebu City',
  'Talisay City',
  'Lapu-Lapu City',
  'Mandaue City',
  'Unassigned',
] as const;

export type CityAlbumName = typeof CITY_ALBUM_NAMES[number];
export type HeritageCity = Exclude<CityAlbumName, 'Unassigned'>;

const HERITAGE_CITIES = CITY_ALBUM_NAMES.filter((city): city is HeritageCity => city !== 'Unassigned');

function normalizeHeritageCity(value: unknown): HeritageCity | null {
  if (typeof value !== 'string') return null;
  return HERITAGE_CITIES.find(city => city.toLowerCase() === value.trim().toLowerCase()) || null;
}

function firstNonEmptyString(...values: unknown[]): string {
  const match = values.find(value => typeof value === 'string' && value.trim().length > 0);
  return typeof match === 'string' ? match.trim() : '';
}

function getTimestampMillis(value: unknown): number {
  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : 0;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const millis = new Date(value).getTime();
    return Number.isFinite(millis) ? millis : 0;
  }

  if (value && typeof value === 'object' && typeof (value as { toDate?: unknown }).toDate === 'function') {
    try {
      return getTimestampMillis((value as { toDate: () => unknown }).toDate());
    } catch {
      return 0;
    }
  }

  return 0;
}

function getVisitorPhotoSiteIdFromPath(path: unknown): string {
  if (typeof path !== 'string') return '';
  return path.match(/^heritageSites\/([^/]+)\/visitorPhotos\/[^/]+$/)?.[1] || '';
}

export function normalizeCommunityPhotos(records: readonly unknown[] | null | undefined): CommunityRecord[] {
  return (records || [])
    .map((record): CommunityRecord | null => {
      if (!record || typeof record !== 'object') return null;
      const photo = record as CommunityRecord;
      const siteId = firstNonEmptyString(
        photo.siteId,
        photo.heritageSiteId,
        photo.heritageSiteID,
        photo.siteID,
        photo.site_id,
        photo.heritage_site_id,
        getVisitorPhotoSiteIdFromPath(photo.__documentPath),
      );
      const imageUrl = firstNonEmptyString(photo.imageUrl, photo.photoUrl, photo.imageURL, photo.photoURL);
      return { ...photo, siteId, imageUrl };
    })
    .filter((photo): photo is CommunityRecord => photo !== null)
    .sort((a, b) => {
      const aTimestamp = getTimestampMillis(a.createdAt ?? a.uploadedAt);
      const bTimestamp = getTimestampMillis(b.createdAt ?? b.uploadedAt);
      return bTimestamp - aTimestamp;
    });
}

export function sortCommunityReviews(records: readonly unknown[] | null | undefined): CommunityRecord[] {
  return [...(records || [])]
    .filter((record): record is CommunityRecord => Boolean(record) && typeof record === 'object')
    .sort((a, b) => getTimestampMillis(b.createdAt) - getTimestampMillis(a.createdAt));
}

export function buildHeritageSiteNameMap(
  firestoreSites: readonly unknown[] | null | undefined,
  builtInSites: readonly unknown[] | null | undefined,
): Map<string, string> {
  const siteNames = new Map<string, string>();
  const addSites = (sites: readonly unknown[] | null | undefined) => {
    (sites || []).forEach(record => {
      if (!record || typeof record !== 'object') return;
      const site = record as CommunityRecord;
      const id = firstNonEmptyString(site.id);
      const name = firstNonEmptyString(site.name);
      if (!id || !name) return;
      siteNames.set(id, name);
    });
  };

  addSites(builtInSites);
  addSites(firestoreSites);
  return siteNames;
}

export function resolveHeritageSiteName(siteId: unknown, siteNames: ReadonlyMap<string, string>): string {
  const id = firstNonEmptyString(siteId);
  return (id && siteNames.get(id)) || 'Unknown heritage site';
}

export function buildHeritageSiteCityMap(
  firestoreSites: readonly unknown[] | null | undefined,
  builtInSites: readonly unknown[] | null | undefined,
): Map<string, HeritageCity> {
  const siteCities = new Map<string, HeritageCity>();
  const addSites = (sites: readonly unknown[] | null | undefined) => {
    (sites || []).forEach(record => {
      if (!record || typeof record !== 'object') return;
      const site = record as CommunityRecord;
      const id = firstNonEmptyString(site.id);
      const city = normalizeHeritageCity(site.city);
      if (id && city) siteCities.set(id, city);
    });
  };

  // Built-in records provide a reliable fallback when Firestore omits a city.
  addSites(builtInSites);
  // A valid current Firestore city takes precedence for the same actual site ID.
  addSites(firestoreSites);
  return siteCities;
}

export function groupCommunityPhotosByCity(
  photos: readonly CommunityRecord[],
  siteCities: ReadonlyMap<string, string>,
): Record<CityAlbumName, CommunityRecord[]> {
  const albums = Object.fromEntries(CITY_ALBUM_NAMES.map(city => [city, []])) as unknown as Record<CityAlbumName, CommunityRecord[]>;

  photos.forEach(photo => {
    const siteId = firstNonEmptyString(photo.siteId);
    const city = siteId ? normalizeHeritageCity(siteCities.get(siteId)) : null;
    albums[city || 'Unassigned'].push(photo);
  });

  return albums;
}

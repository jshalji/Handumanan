'use client';

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { searchSites, HeritageSite, HERITAGE_SITES, DEPRECATED_HERITAGE_SITE_IDS, isSiteVisibleToUser } from '@/lib/heritage-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageSources } from '@/lib/site-images';
import { Search, MapPin, X, ExternalLink, Star, Archive, Layers, MapPinned, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

const EXPLORE_STATE_KEY = 'handumanan-explore-state';
const EXPLORE_STATE_MAX_AGE_MS = 30 * 60 * 1000;

const cityBackgrounds: Record<string, { image: string; position: string }> = {
  All: {
    image: '/metrocebu-bg.jpg',
    position: 'center',
  },
  'Cebu City': {
    image: '/site-directory-cebu-city-hd.avif',
    position: 'center',
  },
  'Mandaue City': {
    image: '/site-directory-mandaue-city-hd.jpg',
    position: 'center',
  },
  'Talisay City': {
    image: '/metrocebu-bg.jpg',
    position: 'center',
  },
  'Lapu-Lapu City': {
    image: '/site-directory-lapu-lapu-city-hd.webp',
    position: 'center',
  },
};

type ExploreState = {
  scrollY: number;
  searchQuery: string;
  city: string;
  category: string;
  shouldRestore: boolean;
  savedAt: number;
};

function SiteCard({ site, onOpenSite }: { site: HeritageSite; onOpenSite: () => void }) {
  const imageSources = getSiteImageSources(site);
  const hasRating = Number.isFinite(Number(site?.rating));
  const ratingDisplay = hasRating ? Number(site.rating).toFixed(1) : 'N/A';
  const mainCategory = (site.category || 'Heritage Site').split(' & ')[0];

  return (
    <Card className="group flex h-full min-w-0 max-w-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md">
      <Link href={`/site/${site.id}`} onClick={onOpenSite} className="relative block aspect-[16/10] w-full shrink-0 overflow-hidden bg-slate-100">
        <SafeImage
          src={imageSources[0]}
          alt={site.name}
          fill
          loading="lazy"
          fallbackSrc={imageSources.slice(1)}
          fallbackClassName="object-cover"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-slate-950/10 to-transparent opacity-90" />

        {/* Top Badges overlay */}
        <div className="absolute left-2.5 top-2.5 right-2.5 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
          <Badge variant="secondary" className="max-w-[55%] truncate border-none bg-white/95 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-primary shadow-xs backdrop-blur-md">
            {mainCategory}
          </Badge>
          <div className="flex flex-wrap items-center gap-1">
            {site.verificationStatus === 'LGU Verified' && (
              <Badge className="border-none bg-emerald-600 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-xs flex items-center gap-1">
                <CheckCircle2 size={10} className="shrink-0" />
                <span className="truncate">LGU Verified</span>
              </Badge>
            )}
            {site.isMustVisit && (
              <Badge className="border-none bg-amber-400 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-950 shadow-xs">
                Must Visit
              </Badge>
            )}
          </div>
        </div>

        {/* Bottom City Tag */}
        <div className="absolute bottom-2.5 left-2.5 flex max-w-[85%] items-center gap-1 truncate rounded-full bg-slate-900/80 px-2.5 py-1 text-[9px] font-bold text-white shadow-xs backdrop-blur-md">
          <MapPin size={10} className="text-emerald-400 shrink-0" />
          <span className="truncate">{site.city || 'Cebu'}</span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            {site.city || 'Heritage'} Landmark
          </span>
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600 border border-amber-100">
            <Star size={10} fill="currentColor" /> {ratingDisplay}
          </div>
        </div>

        <Link href={`/site/${site.id}`} onClick={onOpenSite} className="block mb-2 shrink-0">
          <CardTitle className="line-clamp-2 break-words font-headline text-base font-bold leading-snug tracking-tight text-slate-900 transition-colors group-hover:text-primary sm:text-lg">
            {site.name}
          </CardTitle>
        </Link>

        <p className="line-clamp-2 text-xs leading-relaxed text-slate-600 mb-3 flex-1">
          {site.description}
        </p>

        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[8px] shrink-0">Fee:</span>
            <span className={cn(
              "truncate px-2 py-0.5 rounded text-[10px] font-bold border",
              site.entranceFee
                ? site.entranceFee === 'Free Admission'
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : site.entranceFee.toLowerCase().includes('estimate')
                  ? "bg-amber-50 text-amber-800 border-amber-200"
                  : "bg-slate-100 text-slate-800 border-slate-200"
                : "bg-slate-50 text-slate-500 border-slate-200 font-normal italic"
            )}>
              {site.entranceFee || 'Not specified'}
            </span>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 rounded-lg px-2 text-[10px] font-black uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary group/btn"
          >
            <Link href={`/site/${site.id}`} onClick={onOpenSite}>
              Explore <ExternalLink size={11} className="ml-1 opacity-70 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

function SiteCardSkeleton() {
  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs animate-pulse">
      <div className="aspect-[16/10] w-full bg-slate-200" />
      <div className="flex flex-1 flex-col p-4 sm:p-5 space-y-3.5">
        <div className="flex justify-between items-center">
          <div className="h-3 w-24 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-200 rounded" />
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-8 w-20 bg-slate-200 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}

export default function ExplorePage() {
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const userRole = userData?.role;

  const sitesQuery = useMemoFirebase(() => db ? collection(db, 'heritageSites') : null, [db]);
  const { data: dbSites } = useCollection(sitesQuery);

  const [searchQuery, setSearchQuery] = useState('');
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
  const [isFiltering, setIsFiltering] = useState(false);
  const hasMounted = useRef(false);
  const hasRestoredState = useRef(false);

  const writeExploreState = useCallback((shouldRestore: boolean) => {
    if (typeof window === 'undefined') return;
    const state: ExploreState = {
      scrollY: window.scrollY,
      searchQuery,
      city,
      category,
      shouldRestore,
      savedAt: Date.now(),
    };
    sessionStorage.setItem(EXPLORE_STATE_KEY, JSON.stringify(state));
  }, [category, city, searchQuery]);

  const handleOpenSite = useCallback(() => {
    writeExploreState(true);
  }, [writeExploreState]);

  const mergedSites = useMemo(() => {
    const deprecatedIds = new Set(DEPRECATED_HERITAGE_SITE_IDS);
    const sitesById = new Map(HERITAGE_SITES.map(site => [site.id, site as any]));

    dbSites?.forEach(dbSite => {
      if (!dbSite?.id || deprecatedIds.has(dbSite.id)) return;
      const existingSite = sitesById.get(dbSite.id) || {};
      const coordinates = dbSite.coordinates || (
        dbSite.latitude !== undefined && dbSite.longitude !== undefined
          ? { lat: dbSite.latitude, lng: dbSite.longitude }
          : existingSite.coordinates
      );
      const rating = Number.isFinite(Number(dbSite.rating))
        ? Number(dbSite.rating)
        : (Number.isFinite(Number(existingSite.rating)) ? Number(existingSite.rating) : undefined);

      sitesById.set(dbSite.id, {
        ...existingSite,
        ...dbSite,
        rating,
        coordinates,
        tags: Array.isArray(dbSite.tags) ? dbSite.tags : (Array.isArray(existingSite.tags) ? existingSite.tags : []),
      } as any);
    });

    return Array.from(sitesById.values())
      .map(site => ({
        ...site,
        verificationStatus: site.verificationStatus || 'Pending Verification',
      }))
      .filter(site => (
        !deprecatedIds.has(site.id) &&
        site.isActive !== false &&
        site.status !== 'Inactive' &&
        isSiteVisibleToUser(site, userRole)
      ));
  }, [dbSites, userRole]);

  const filteredSites = useMemo(() => {
    return searchSites(searchQuery, city, category, userRole, mergedSites);
  }, [searchQuery, city, category, userRole, mergedSites]);

  const totalSites = useMemo(() => {
    return searchSites('', 'All', 'All', userRole, mergedSites).length;
  }, [userRole, mergedSites]);

  const hasActiveFilters = Boolean(searchQuery || city !== 'All' || category !== 'All');

  const cityBackground = cityBackgrounds[city] || cityBackgrounds.All;
  const pageBackgroundStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.70) 0%, rgba(248,250,252,0.85) 45%, rgba(248,250,252,0.96) 100%), url("${cityBackground.image}")`,
    backgroundPosition: cityBackground.position,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  };

  const categories = [
    "All",
    "Churches & Religious Heritage Sites",
    "Ancestral Houses & Heritage Residences",
    "Museums & Cultural Institutions",
    "Historical Landmarks & Monuments",
    "Plazas, Parks & Public Spaces",
    "Government & Historic Buildings",
    "Cultural & Religious (Non-Catholic Sites)"
  ];

  const cities = ["All", "Cebu City", "Mandaue City", "Talisay City", "Lapu-Lapu City"];

  const resetFilters = () => {
    if (hasActiveFilters) setIsFiltering(true);
    setSearchQuery('');
    setCity('All');
    setCategory('All');
    if (typeof window !== 'undefined') sessionStorage.removeItem(EXPLORE_STATE_KEY);
  };

  const handleCityChange = (value: string) => {
    if (value !== city) setIsFiltering(true);
    setCity(value);
  };

  const handleCategoryChange = (value: string) => {
    if (value !== category) setIsFiltering(true);
    setCategory(value);
  };

  useEffect(() => {
    if (hasRestoredState.current || typeof window === 'undefined') return;
    hasRestoredState.current = true;

    const rawState = sessionStorage.getItem(EXPLORE_STATE_KEY);
    if (!rawState) return;

    try {
      const savedState = JSON.parse(rawState) as Partial<ExploreState>;
      const isFresh = typeof savedState.savedAt === 'number' && Date.now() - savedState.savedAt < EXPLORE_STATE_MAX_AGE_MS;
      if (!savedState.shouldRestore || !isFresh) {
        sessionStorage.removeItem(EXPLORE_STATE_KEY);
        return;
      }

      setSearchQuery(typeof savedState.searchQuery === 'string' ? savedState.searchQuery : '');
      setCity(typeof savedState.city === 'string' ? savedState.city : 'All');
      setCategory(typeof savedState.category === 'string' ? savedState.category : 'All');

      sessionStorage.setItem(EXPLORE_STATE_KEY, JSON.stringify({ ...savedState, shouldRestore: false }));

      const targetScrollY = Math.max(0, Number(savedState.scrollY || 0));
      if (targetScrollY > 0) {
        const restoreScroll = () => {
          window.scrollTo({ top: targetScrollY, behavior: 'auto' });
        };

        restoreScroll();
        window.requestAnimationFrame(() => {
          restoreScroll();
          window.requestAnimationFrame(restoreScroll);
        });

        const t1 = setTimeout(restoreScroll, 80);
        const t2 = setTimeout(restoreScroll, 200);
        const t3 = setTimeout(restoreScroll, 450);
        const t4 = setTimeout(restoreScroll, 800);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    } catch {
      sessionStorage.removeItem(EXPLORE_STATE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => setIsFiltering(false), 180);
    return () => window.clearTimeout(timeout);
  }, [searchQuery, city, category]);

  return (
    <div className="relative isolate min-h-screen font-body pb-20 bg-slate-50 text-slate-900">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-[100dvh] w-screen transition-[background-image,background-position] duration-700 pointer-events-none"
        style={pageBackgroundStyle}
      />
      <Navbar />

      <main className="relative z-10 mx-auto max-w-7xl px-3.5 sm:px-6 lg:px-8 pb-16 pt-4 sm:pt-6">
        {/* Compact Editorial Header */}
        <header className="mb-5 sm:mb-7 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-xs">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-800 border border-emerald-100/80">
                <Archive size={13} className="text-emerald-600 shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-[0.25em]">Digital Archive</span>
              </div>
              <h1 className="font-headline text-2xl font-black tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
                Site Directory
              </h1>
              <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-600">
                Browse Metro Cebu's curated cultural heritage sites, historical landmarks, ancestral residences, and public spaces.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 shrink-0">
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center sm:text-left">
                <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary mx-auto sm:mx-0">
                  <Archive size={13} />
                </div>
                <p className="text-base font-black leading-none text-slate-900 sm:text-lg">{totalSites}</p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">Sites</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center sm:text-left">
                <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-600 mx-auto sm:mx-0">
                  <Layers size={13} />
                </div>
                <p className="text-base font-black leading-none text-slate-900 sm:text-lg">{categories.length - 1}</p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">Categories</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center sm:text-left">
                <div className="mb-1 flex h-6 w-6 items-center justify-center rounded-lg bg-sky-100 text-sky-700 mx-auto sm:mx-0">
                  <MapPinned size={13} />
                </div>
                <p className="text-base font-black leading-none text-slate-900 sm:text-lg">{cities.length - 1}</p>
                <p className="mt-0.5 text-[8px] font-black uppercase tracking-wider text-slate-400">Cities</p>
              </div>
            </div>
          </div>
        </header>

        {/* Search & Filter Toolbar */}
        <div className="mb-5 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col gap-3.5 md:flex-row md:items-end">
            {/* Search Input */}
            <div className="flex-1 min-w-0">
              <label htmlFor="search-input" className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Search Heritage Sites
              </label>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  id="search-input"
                  placeholder="Search by site name, city, history..."
                  className="h-11 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-10 pr-10 text-xs font-bold text-slate-800 placeholder:text-slate-400 shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary"
                  value={searchQuery}
                  onChange={(e) => {
                    setIsFiltering(true);
                    setSearchQuery(e.target.value);
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsFiltering(true);
                      setSearchQuery('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-600 transition-colors"
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* City Filter */}
            <div className="w-full md:w-48 shrink-0">
              <label htmlFor="city-select" className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                City
              </label>
              <div className="relative">
                <select
                  id="city-select"
                  value={city}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="h-11 min-h-[44px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 pr-10 text-xs font-bold text-slate-700 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {cities.map(c => (
                    <option key={c} value={c}>
                      {c === 'All' ? 'All Cities' : c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-64 shrink-0">
              <label htmlFor="category-select" className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                Category
              </label>
              <div className="relative">
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="h-11 min-h-[44px] w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 pr-10 text-xs font-bold text-slate-700 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 cursor-pointer"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat === 'All' ? 'All Categories' : cat}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        {/* Results Bar */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs font-medium text-slate-500">
            Showing <span className="font-bold text-slate-900">{filteredSites.length}</span> of {totalSites} heritage sites
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:underline min-h-[32px] cursor-pointer"
            >
              <X size={12} /> Reset Filters
            </button>
          )}
        </div>

        {/* Results Grid */}
        <div className={cn(
          "grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 transition-opacity duration-200 ease-out",
          isFiltering ? "opacity-70" : "opacity-100"
        )}>
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} onOpenSite={handleOpenSite} />
            ))
          ) : (
            <div className="col-span-full py-16 px-4 text-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <div className="bg-slate-100 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                <Search size={24} />
              </div>
              <h3 className="text-lg font-headline font-bold mb-1.5 text-slate-900">No heritage sites found</h3>
              <p className="text-slate-500 text-xs max-w-sm mx-auto font-medium leading-relaxed mb-5">
                No sites matched your current search criteria. Try adjusting your keyword or clearing selected filters.
              </p>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="rounded-xl h-11 min-h-[44px] px-5 font-black uppercase text-[10px] tracking-widest border-slate-200 hover:bg-primary hover:text-white hover:border-primary transition-all"
              >
                Reset All Filters
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}


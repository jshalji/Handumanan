'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { searchSites, HeritageSite } from '@/lib/heritage-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageFallback } from '@/lib/site-images';
import { Search, MapPin, X, ExternalLink, Star, Archive, Layers, MapPinned, ChevronDown } from 'lucide-react';

const cityBackgrounds: Record<string, { image: string; position: string; header: string }> = {
  All: {
    image: '/metrocebu-bg.jpg',
    position: 'center',
    header: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(240,253,244,0.92) 100%)',
  },
  'Cebu City': {
    image: '/site-directory-cebu-city-hd.avif',
    position: 'center',
    header: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(220,252,231,0.92) 100%)',
  },
  'Mandaue City': {
    image: '/site-directory-mandaue-city-hd.jpg',
    position: 'center',
    header: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(219,234,254,0.9) 100%)',
  },
  'Talisay City': {
    image: '/metrocebu-bg.jpg',
    position: 'center',
    header: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(236,252,203,0.9) 100%)',
  },
  'Lapu-Lapu City': {
    image: '/site-directory-lapu-lapu-city-hd.webp',
    position: 'center',
    header: 'linear-gradient(135deg, rgba(255,255,255,0.96) 0%, rgba(207,250,254,0.88) 100%)',
  },
};

function SiteCard({ site }: { site: HeritageSite }) {
  return (
    <Card className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl">
      <Link href={`/site/${site.id}`} className="relative block h-56 w-full shrink-0 overflow-hidden bg-slate-100">
        <SafeImage
          src={site.imageUrl || "https://picsum.photos/seed/placeholder/800/600"}
          alt={site.name}
          fill
          loading="lazy"
          fallbackSrc={getSiteImageFallback(site)}
          fallbackClassName="object-cover"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/70 to-transparent" />
        <Badge variant="secondary" className="absolute left-4 top-4 border-none bg-white/95 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur-md">
          {site.category.split(' & ')[0]}
        </Badge>
        {site.isMustVisit && (
          <Badge className="absolute right-4 top-4 border-none bg-amber-400 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-slate-950 shadow-md">
            Must Visit
          </Badge>
        )}
        <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-700 shadow-sm backdrop-blur-md">
          <MapPin size={12} className="text-primary" /> {site.city}
        </div>
      </Link>
      
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
            Heritage Site
          </span>
          <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black text-amber-600">
            <Star size={12} fill="currentColor" /> {site.rating.toFixed(1)}
          </div>
        </div>

        <Link href={`/site/${site.id}`} className="block mb-3 shrink-0">
          <CardTitle className="line-clamp-2 font-headline text-xl font-black leading-tight tracking-tight text-slate-950 transition-colors group-hover:text-primary">
            {site.name}
          </CardTitle>
        </Link>
        
        <div className="flex-1">
          <p className="mb-5 line-clamp-2 text-sm leading-relaxed text-slate-500">
            {site.description}
          </p>
        </div>
        
        <div className="mt-auto pt-2">
          <Button 
            asChild
            variant="outline" 
            className="h-11 w-full rounded-xl border-slate-200 bg-slate-50 text-[10px] font-black uppercase tracking-[0.18em] text-slate-700 shadow-none transition-all duration-300 hover:border-primary hover:bg-primary hover:text-white group/btn"
          >
            <Link href={`/site/${site.id}`}>
              View Details <ExternalLink size={14} className="ml-2 opacity-60 transition-opacity group-hover/btn:opacity-100" />
            </Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('All');
  const [category, setCategory] = useState('All');
  const [isFiltering, setIsFiltering] = useState(false);
  const hasMounted = useRef(false);

  const filteredSites = searchSites(query, city, category);
  const totalSites = searchSites('', 'All', 'All').length;
  const cityBackground = cityBackgrounds[city] || cityBackgrounds.All;
  const hasActiveFilters = Boolean(query || city !== 'All' || category !== 'All');
  const pageBackgroundStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.46) 0%, rgba(248,250,252,0.62) 42%, rgba(255,255,255,0.88) 100%), url("${cityBackground.image}")`,
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
    setQuery('');
    setCity('All');
    setCategory('All');
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
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }

    const timeout = window.setTimeout(() => setIsFiltering(false), 180);
    return () => window.clearTimeout(timeout);
  }, [query, city, category]);

  return (
    <div className="relative isolate min-h-screen overflow-x-hidden bg-slate-50 font-body pb-20 transition-colors duration-500">
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 h-[100dvh] w-screen transition-[background-image,background-position] duration-500"
        style={pageBackgroundStyle}
      />
      <Navbar />

      <div className="relative z-10 container mx-auto max-w-7xl px-4 pb-16 pt-6">
        <header className="mb-5 rounded-3xl border border-white/70 p-5 shadow-sm backdrop-blur-sm transition-colors duration-500 md:p-7" style={{ background: cityBackground.header }}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl text-center md:text-left">
              <div className="mb-3 flex items-center justify-center gap-3 text-primary md:justify-start">
                <div className="rounded-2xl bg-primary/10 p-2.5"><Archive size={22} /></div>
                <span className="text-[11px] font-black uppercase tracking-[0.35em] text-primary/70">Digital Archive</span>
              </div>
              <h1 className="mb-2 text-balance font-headline text-4xl font-black tracking-tighter text-slate-950 md:text-5xl">Site Directory</h1>
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
                Explore Cebu's historical landscape through a curated registry of cultural landmarks and shared memories.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 lg:min-w-[390px]">
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 backdrop-blur-md">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Archive size={16} />
                </div>
                <p className="text-xl font-black leading-none text-slate-950">{totalSites}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Sites</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 backdrop-blur-md">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <Layers size={16} />
                </div>
                <p className="text-xl font-black leading-none text-slate-950">{categories.length - 1}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Groups</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 px-4 py-3 backdrop-blur-md">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                  <MapPinned size={16} />
                </div>
                <p className="text-xl font-black leading-none text-slate-950">{cities.length - 1}</p>
                <p className="mt-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Cities</p>
              </div>
            </div>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-6 rounded-3xl border border-white/75 bg-white/85 p-4 shadow-sm backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700 md:p-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Search</label>
              <Search className="absolute left-4 top-[43px] -translate-y-1/2 text-slate-400" size={18} />
              <Input
                placeholder="Search sites, history, landmarks..."
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 pl-12 pr-12 text-base font-bold shadow-none focus-visible:ring-primary/20 sm:pr-24"
                value={query}
                onChange={(e) => {
                  setIsFiltering(true);
                  setQuery(e.target.value);
                }}
              />
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="absolute right-2 top-[43px] h-8 -translate-y-1/2 rounded-xl px-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 sm:px-3"
                >
                  <X size={14} className="sm:mr-1" /> <span className="hidden sm:inline">Reset</span>
                </Button>
              )}
            </div>
            
            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">City</label>
              <div className="relative">
                <select
                  value={city}
                  onChange={(event) => handleCityChange(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 font-bold text-slate-700 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Category</label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(event) => handleCategoryChange(event.target.value)}
                  className="h-12 w-full appearance-none rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 font-bold text-slate-700 shadow-none outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className={`grid grid-cols-1 gap-6 transition-opacity duration-200 ease-out md:grid-cols-2 lg:grid-cols-3 ${isFiltering ? 'opacity-70' : 'opacity-100'}`}>
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))
          ) : (
            <div className="col-span-full py-32 text-center">
              <div className="bg-white w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl ring-1 ring-black/5">
                <Search size={40} className="text-slate-200" />
              </div>
              <h3 className="text-3xl font-headline font-black mb-3 text-slate-900">No sites found</h3>
              <p className="text-slate-400 text-base max-w-xs mx-auto font-medium">Try broadening your search or resetting the location filters.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-10 rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-[0.2em] border-2 hover:bg-primary hover:text-white hover:border-primary transition-all">
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

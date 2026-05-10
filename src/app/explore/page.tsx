'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { searchSites, HeritageSite } from '@/lib/heritage-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, X, ExternalLink, Star } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function SiteCard({ site }: { site: HeritageSite }) {
  return (
    <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-none shadow-lg flex flex-col h-full bg-white rounded-[2rem]">
      {/* Image Container - Fixed height for consistency */}
      <Link href={`/site/${site.id}`} className="block relative h-64 w-full bg-slate-100 overflow-hidden shrink-0">
        <Image
          src={site.imageUrl || "https://picsum.photos/seed/placeholder/800/600"}
          alt={site.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-700"
        />
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/95 backdrop-blur-md text-primary border-none shadow-sm text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full">
            {site.category.split(' & ')[0]}
          </Badge>
        </div>
        {/* Must Visit Badge */}
        {site.isMustVisit && (
          <div className="absolute top-4 right-4">
             <Badge className="bg-accent text-white border-none shadow-md text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-full">
               Must Visit
             </Badge>
          </div>
        )}
      </Link>
      
      {/* Content Section - Flex grows to fill space, pushing button to bottom */}
      <div className="flex flex-col flex-1 p-6 pb-8">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-1.5 text-[10px] text-primary/70 uppercase font-black tracking-widest">
            <MapPin size={12} className="text-primary" /> {site.city}
          </div>
          <div className="flex items-center gap-1.5 text-yellow-500 font-black text-[11px] bg-yellow-50 px-2 py-0.5 rounded-full">
            <Star size={12} fill="currentColor" /> {site.rating.toFixed(1)}
          </div>
        </div>

        <Link href={`/site/${site.id}`} className="block mb-3 shrink-0">
          <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors leading-tight line-clamp-1 font-black tracking-tight text-slate-900">
            {site.name}
          </CardTitle>
        </Link>
        
        <div className="flex-1">
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6">
            {site.description}
          </p>
        </div>
        
        {/* Button - Aligned to bottom using mt-auto */}
        <div className="mt-auto pt-2">
          <Button 
            asChild
            variant="outline" 
            className="w-full h-14 text-[11px] font-black uppercase tracking-[0.2em] border-2 border-slate-100 rounded-[1.25rem] bg-slate-50/50 hover:bg-primary hover:text-white hover:border-primary transition-all duration-300 shadow-sm group/btn"
          >
            <Link href={`/site/${site.id}`}>
              View Details <ExternalLink size={16} className="ml-2 opacity-60 group-hover/btn:opacity-100 transition-opacity" />
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

  const filteredSites = searchSites(query, city, category);

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
    setQuery('');
    setCity('All');
    setCategory('All');
  };

  return (
    <div className="min-h-screen bg-slate-50/50 font-body pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <header className="mb-12 text-center md:text-left max-w-3xl">
          <div className="flex items-center gap-3 mb-4 text-primary justify-center md:justify-start">
             <div className="p-3 bg-primary/10 rounded-2xl"><Search size={28} /></div>
             <span className="text-[12px] font-black uppercase tracking-[0.4em] opacity-60">Digital Archive</span>
          </div>
          <h1 className="font-headline text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter text-balance">Site Directory</h1>
          <p className="text-slate-500 text-lg leading-relaxed font-medium">
            Explore Cebu's historical landscape through a curated registry of cultural landmarks and shared memories.
          </p>
        </header>

        {/* Search and Filters */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-none ring-1 ring-black/5 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="relative md:col-span-2">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Search history, landmarks, significance..."
                className="pl-12 h-14 rounded-2xl border-none bg-slate-50 focus-visible:ring-primary/20 text-base font-bold shadow-inner"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700 shadow-inner">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl">
                {cities.map(c => <SelectItem key={c} value={c} className="font-bold py-3">{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-14 rounded-2xl border-none bg-slate-50 font-bold text-slate-700 shadow-inner">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-2xl max-w-[90vw]">
                {categories.map(cat => <SelectItem key={cat} value={cat} className="text-xs font-bold py-3">{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {(query || city !== 'All' || category !== 'All') && (
            <div className="mt-6 flex items-center justify-between border-t pt-6">
              <p className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">
                Found {filteredSites.length} Landmark{filteredSites.length !== 1 ? 's' : ''}
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary h-10 px-4 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all">
                <X size={16} className="mr-2" /> Reset Archive
              </Button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
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

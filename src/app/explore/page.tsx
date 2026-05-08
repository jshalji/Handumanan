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
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-none shadow-md flex flex-col h-full bg-white rounded-3xl">
      <Link href={`/site/${site.id}`} className="block">
        <div className="relative h-56 w-full bg-slate-100 overflow-hidden">
          <Image
            src={site.imageUrl || "https://picsum.photos/seed/placeholder/800/600"}
            alt={site.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute top-4 left-4">
            <Badge variant="secondary" className="bg-white/95 backdrop-blur text-primary border-none shadow-sm text-[10px] font-black uppercase tracking-widest px-3">
              {site.category.split(' & ')[0]}
            </Badge>
          </div>
          {site.isMustVisit && (
            <div className="absolute top-4 right-4">
               <Badge className="bg-accent text-white border-none shadow-sm text-[10px] font-black uppercase tracking-widest px-3">
                 Must Visit
               </Badge>
            </div>
          )}
        </div>
      </Link>
      
      <CardHeader className="p-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase font-black tracking-widest">
            <MapPin size={12} className="text-primary" /> {site.city}
          </div>
          <div className="flex items-center gap-1 text-yellow-500 font-black text-[10px]">
            <Star size={10} fill="currentColor" /> {site.rating.toFixed(1)}
          </div>
        </div>
        <Link href={`/site/${site.id}`}>
          <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors leading-tight line-clamp-1">
            {site.name}
          </CardTitle>
        </Link>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
            {site.description}
          </p>
          
          <div className="mt-auto pt-4">
            <Button 
              asChild
              variant="outline" 
              size="sm" 
              className="w-full h-11 text-[10px] font-black uppercase tracking-widest border-2 rounded-2xl group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm"
            >
              <Link href={`/site/${site.id}`}>
                View Details <ExternalLink size={14} className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
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
    <div className="min-h-screen bg-slate-50 font-body pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-10 text-center md:text-left">
          <div className="flex items-center gap-2 mb-3 text-primary justify-center md:justify-start">
             <Search size={24} />
             <span className="text-[10px] font-black uppercase tracking-[0.3em]">Directory Search</span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-slate-900 mb-4">Site Directory</h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            Explore a curated list of Metro Cebu's cultural landmarks. Discover historical overviews and the cultural significance of our shared heritage.
          </p>
        </header>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border-none ring-1 ring-black/5 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                placeholder="Search sites, history, significance..."
                className="pl-10 h-12 rounded-xl border-slate-100 bg-slate-50 focus-visible:ring-primary/20"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl">
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl max-w-[90vw]">
                {categories.map(cat => <SelectItem key={cat} value={cat} className="text-xs">{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {(query || city !== 'All' || category !== 'All') && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {filteredSites.length} results found
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary h-8 text-[10px] font-black uppercase tracking-widest hover:bg-primary/5">
                <X size={14} className="mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))
          ) : (
            <div className="col-span-full py-24 text-center">
              <div className="bg-white w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl ring-1 ring-black/5">
                <Search size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">No matching sites found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">Adjust your search or filters to discover other historical landmarks.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-8 rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2">
                Show all sites
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

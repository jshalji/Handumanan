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
import { Search, MapPin, X, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';

function SiteCard({ site }: { site: HeritageSite }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="group overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-300 border-none shadow-md flex flex-col h-full bg-white rounded-2xl">
      <Link href={`/site/${site.id}`}>
        <div className="relative h-48">
          <Image
            src={site.imageUrl || "https://picsum.photos/seed/placeholder/800/600"}
            alt={site.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="bg-white/90 backdrop-blur text-primary border-none shadow-sm text-[10px]">
              {site.category.split(' & ')[0]}
            </Badge>
          </div>
        </div>
      </Link>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-1 uppercase font-black tracking-widest">
          <MapPin size={12} className="text-primary" /> {site.city}
        </div>
        <Link href={`/site/${site.id}`}>
          <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors leading-tight">
            {site.name}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col">
        <div className="space-y-4">
          <div>
            <p className={cn(
              "text-xs text-slate-600 leading-relaxed",
              !isExpanded && "line-clamp-3"
            )}>
              {site.description}
            </p>
          </div>
          
          {isExpanded && (
            <div className="pt-4 border-t space-y-2 animate-in fade-in duration-300">
              <p className="text-[10px] font-black uppercase text-primary tracking-widest">Historical Significance</p>
              <p className="text-xs text-slate-500 italic leading-relaxed">
                {site.significance}
              </p>
            </div>
          )}

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 p-0"
          >
            {isExpanded ? (
              <><ChevronUp size={14} className="mr-1" /> Show Less</>
            ) : (
              <><ChevronDown size={14} className="mr-1" /> Show More</>
            )}
          </Button>
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
    <div className="min-h-screen bg-slate-50 font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <header className="mb-10 text-center md:text-left">
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-3">Site Directory</h1>
          <p className="text-muted-foreground text-sm max-w-2xl">Discover and explore the detailed history of Metro Cebu's cultural treasures.</p>
        </header>

        {/* Search and Filters */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Search sites, history, significance..."
                className="pl-10 h-11 rounded-xl"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {(query || city !== 'All' || category !== 'All') && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                {filteredSites.length} results found
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary h-8 text-[10px] font-black uppercase tracking-widest">
                <X size={14} className="mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border">
                <Search size={32} className="text-slate-200" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">No matching sites</h3>
              <p className="text-muted-foreground text-sm">Try adjusting your filters or search terms.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-6 rounded-xl font-black uppercase text-[10px] tracking-widest border-2">
                Show all sites
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

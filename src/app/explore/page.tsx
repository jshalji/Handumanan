'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { searchSites } from '@/lib/heritage-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  const cities = ["All", "Cebu City", "Lapu-Lapu City", "Mandaue City", "Talisay City"];

  const resetFilters = () => {
    setQuery('');
    setCity('All');
    setCategory('All');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <header className="mb-12">
          <h1 className="font-headline text-4xl font-bold text-primary mb-4">Explore Heritage</h1>
          <p className="text-muted-foreground">Find historical sites across Metro Cebu's vibrant cities.</p>
        </header>

        {/* Search and Filters */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by name, significance, or tags..."
                className="pl-10 h-12"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select City" />
              </SelectTrigger>
              <SelectContent>
                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          
          {(query || city !== 'All' || category !== 'All') && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSites.length} results
              </p>
              <Button variant="ghost" size="sm" onClick={resetFilters} className="text-primary h-8">
                <X size={14} className="mr-1" /> Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredSites.length > 0 ? (
            filteredSites.map((site) => (
              <Card key={site.id} className="group overflow-hidden hover:ring-2 hover:ring-primary/20 transition-all duration-300 border-none shadow-md">
                <Link href={`/site/${site.id}`}>
                  <div className="relative h-56">
                    <Image
                      src={site.imageUrl}
                      alt={site.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      data-ai-hint="heritage site"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge variant="secondary" className="bg-white/90 backdrop-blur text-primary border-none shadow-sm">
                        {site.category.split(' & ')[0]}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                      <MapPin size={14} className="text-primary" /> {site.city}
                    </div>
                    <CardTitle className="font-headline text-xl group-hover:text-primary transition-colors">
                      {site.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {site.description}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {site.tags.map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-xl font-headline font-bold mb-2">No sites found</h3>
              <p className="text-muted-foreground">Try adjusting your filters or search terms.</p>
              <Button variant="outline" onClick={resetFilters} className="mt-6">
                Show all sites
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
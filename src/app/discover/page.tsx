'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES, type HeritageSite } from '@/lib/heritage-data';
import { calculateDistance, getCurrentLocation } from '@/lib/location-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, Sparkles, Clock, ArrowRight, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SiteWithDistance extends HeritageSite {
  distance: number;
}

export default function DiscoverPage() {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Default to Cebu City Hall if location isn't detected
  const defaultLocation = { lat: 10.2936, lng: 123.9019 };

  const detectLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
    } catch (err: any) {
      setError("Could not detect location. Using Cebu City Center as default.");
      setUserLocation(defaultLocation);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distances for all sites based on user location
  const sortedSites = useMemo(() => {
    const loc = userLocation || defaultLocation;
    return HERITAGE_SITES.map(site => ({
      ...site,
      distance: calculateDistance(loc.lat, loc.lng, site.coordinates.lat, site.coordinates.lng)
    })).sort((a, b) => a.distance - b.distance);
  }, [userLocation]);

  const nearbySites = sortedSites.slice(0, 5);
  const recommendedSites = [...sortedSites].sort((a, b) => (b.rating / (a.distance + 1)) - (a.rating / (b.distance + 1))).slice(0, 4);

  // Generate a simple distance-based itinerary
  const smartItinerary = useMemo(() => {
    const itinerary: SiteWithDistance[] = [];
    const pool = [...sortedSites];
    let currentPoint = userLocation || defaultLocation;

    // Pick 5 stops using a greedy nearest-neighbor approach
    for (let i = 0; i < 5; i++) {
      if (pool.length === 0) break;
      
      pool.sort((a, b) => {
        const distA = calculateDistance(currentPoint.lat, currentPoint.lng, a.coordinates.lat, a.coordinates.lng);
        const distB = calculateDistance(currentPoint.lat, currentPoint.lng, b.coordinates.lat, b.coordinates.lng);
        return distA - distB;
      });

      const nextSite = pool.shift()!;
      itinerary.push(nextSite);
      currentPoint = nextSite.coordinates;
    }
    return itinerary;
  }, [userLocation]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      <div className="bg-primary/5 py-16 border-b">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <h1 className="font-headline text-5xl font-bold text-primary mb-4">Discover Nearby</h1>
            <p className="text-xl text-muted-foreground mb-8">
              Explore Metro Cebu's heritage based on your current location. We'll help you find the closest treasures and plan the perfect route.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" onClick={detectLocation} disabled={loading} className="rounded-full px-8">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Navigation className="mr-2 h-5 w-5" />}
                {userLocation ? 'Relocate Me' : 'Detect My Location'}
              </Button>
              {userLocation && (
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border shadow-sm">
                  <MapPin className="text-primary" size={18} />
                  <span className="text-sm font-medium">Location Active: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}</span>
                </div>
              )}
            </div>
            {error && <p className="mt-4 text-sm text-amber-600 font-medium">{error}</p>}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <Tabs defaultValue="nearby" className="space-y-12">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 rounded-full p-1 bg-muted/50 border">
              <TabsTrigger value="nearby" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Nearby Sites</TabsTrigger>
              <TabsTrigger value="itinerary" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">Smart Route</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="nearby" className="space-y-12 animate-in fade-in duration-500">
            {/* Recommendations Grid */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-accent/10 rounded-xl text-accent">
                  <Sparkles size={24} />
                </div>
                <h2 className="font-headline text-3xl font-bold text-slate-800">Smart Recommendations</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedSites.map((site) => (
                  <Card key={site.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all">
                    <Link href={`/site/${site.id}`}>
                      <div className="relative h-48">
                        <Image src={site.imageUrl} alt={site.name} fill className="object-cover" data-ai-hint="heritage" />
                        <div className="absolute top-3 left-3">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur text-primary border-none shadow-sm">
                            {site.distance.toFixed(1)} km
                          </Badge>
                        </div>
                      </div>
                      <CardHeader className="p-4">
                        <CardTitle className="text-lg font-headline group-hover:text-primary transition-colors line-clamp-1">{site.name}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-xs">
                           <MapPin size={12} className="text-primary" /> {site.city}
                        </CardDescription>
                      </CardHeader>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>

            {/* List View */}
            <section>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <Info size={24} />
                </div>
                <h2 className="font-headline text-3xl font-bold text-slate-800">Closest Sites from You</h2>
              </div>
              <div className="space-y-4">
                {sortedSites.slice(0, 10).map((site) => (
                  <Card key={site.id} className="border-none shadow-sm hover:bg-slate-50 transition-colors">
                    <Link href={`/site/${site.id}`} className="flex flex-col md:flex-row items-center">
                      <div className="relative w-full md:w-48 h-32 flex-shrink-0">
                        <Image src={site.imageUrl} alt={site.name} fill className="object-cover md:rounded-l-lg" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold font-headline mb-1">{site.name}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin size={14} /> {site.city}</span>
                            <span className="flex items-center gap-1"><Clock size={14} /> {site.visitingHours}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">{site.distance.toFixed(1)}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-400">Kilometers</p>
                          </div>
                          <Button size="icon" variant="ghost" className="text-primary">
                            <ArrowRight size={20} />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          </TabsContent>

          <TabsContent value="itinerary" className="animate-in fade-in duration-500">
            <div className="max-w-4xl mx-auto">
              <Card className="bg-primary text-primary-foreground border-none shadow-xl mb-12 overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Navigation size={120} />
                </div>
                <CardHeader className="p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={20} className="text-accent" />
                    <span className="font-bold text-accent uppercase tracking-widest text-xs">Optimized Exploration</span>
                  </div>
                  <CardTitle className="text-4xl font-headline font-bold">Your Proximity-Based Path</CardTitle>
                  <CardDescription className="text-primary-foreground/80 text-lg mt-2">
                    We've calculated the shortest route starting from your location to visit these 5 major sites.
                  </CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-6 relative">
                {/* Visual Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200 hidden md:block"></div>

                <div className="flex gap-6 items-start">
                   <div className="flex-shrink-0 w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center z-10">
                    <MapPin size={24} className="text-slate-500" />
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-1">Start Point</h4>
                    <p className="font-bold">Your Current Location</p>
                  </div>
                </div>

                {smartItinerary.map((site, idx) => (
                  <div key={site.id} className="flex gap-6 items-start group">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg z-10 shadow-lg group-hover:scale-110 transition-transform">
                      {idx + 1}
                    </div>
                    <Card className="flex-1 border-none shadow-md group-hover:shadow-lg transition-shadow">
                      <Link href={`/site/${site.id}`} className="flex flex-col md:flex-row">
                        <div className="p-6 flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-2xl font-bold font-headline">{site.name}</h3>
                            <Badge variant="outline">{site.distance.toFixed(1)} km from last stop</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{site.description}</p>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                              <Clock size={12} /> Sug. visit: 45m
                            </span>
                            <span className="flex items-center gap-1 text-xs font-medium bg-slate-100 px-3 py-1 rounded-full text-slate-600">
                              <Navigation size={12} /> ~{(site.distance * 3).toFixed(0)}m drive
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full md:w-32 h-32 md:h-auto overflow-hidden">
                           <Image src={site.imageUrl} alt={site.name} fill className="object-cover" />
                        </div>
                      </Link>
                    </Card>
                  </div>
                ))}

                <div className="flex gap-6 items-start mt-8">
                   <div className="flex-shrink-0 w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center z-10 shadow-lg">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex-1 pt-2">
                    <h4 className="font-bold text-accent uppercase tracking-widest text-xs mb-1">Journey Complete</h4>
                    <p className="font-medium text-slate-600">Total Route Distance: {smartItinerary.reduce((acc, curr) => acc + curr.distance, 0).toFixed(1)} km</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

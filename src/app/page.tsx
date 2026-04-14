
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, MapPin, ArrowRight, Landmark } from 'lucide-react';

export default function Home() {
  const featuredSites = HERITAGE_SITES.slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="https://picsum.photos/seed/cebu/1920/1080"
          alt="Metro Cebu Heritage"
          fill
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="cebu city landscape"
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <h1 className="font-headline text-5xl md:text-7xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Handumanan
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90 font-body">
            Rediscover the heart of Metro Cebu through its historical landmarks and cultural treasures.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 rounded-full px-8 text-lg">
              <Link href="/explore">
                <Compass className="mr-2 h-5 w-5" /> Start Exploring
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full px-8 text-lg">
              <Link href="/itinerary">
                <Landmark className="mr-2 h-5 w-5" /> AI Planner
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Sites */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-headline text-4xl font-bold text-primary mb-2">Heritage Treasures</h2>
              <p className="text-muted-foreground">Handpicked historical sites to start your journey.</p>
            </div>
            <Link href="/explore" className="text-primary font-bold flex items-center gap-2 hover:underline hidden md:flex">
              View all sites <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredSites.map((site) => (
              <Card key={site.id} className="group overflow-hidden border-none shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full bg-white">
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src={site.imageUrl}
                    alt={site.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {site.category}
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-1 text-muted-foreground text-xs mb-1">
                    <MapPin size={12} /> {site.city}
                  </div>
                  <CardTitle className="font-headline text-2xl group-hover:text-primary transition-colors">
                    {site.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-4">
                  <p className="text-muted-foreground line-clamp-3 text-sm">
                    {site.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-primary/5">
                  <Button variant="link" asChild className="p-0 h-auto text-primary font-bold group-hover:translate-x-1 transition-transform">
                    <Link href={`/site/${site.id}`}>Learn more <ArrowRight size={14} className="ml-1" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-12 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Landmark size={32} />
            <span className="font-headline text-3xl font-bold">Handumanan</span>
          </div>
          <p className="max-w-md mx-auto opacity-80 mb-8 font-body">
            A Web-Based Cultural Heritage Site Information System for Metro Cebu. BSIT Capstone Project 2026.
          </p>
          <div className="flex justify-center gap-6 mb-8 text-sm uppercase tracking-widest font-bold">
            <Link href="/explore" className="hover:opacity-100 opacity-70">Explore</Link>
            <Link href="/itinerary" className="hover:opacity-100 opacity-70">Itinerary</Link>
            <Link href="/admin" className="hover:opacity-100 opacity-70">Admin</Link>
          </div>
          <div className="pt-8 border-t border-white/10 text-xs opacity-50">
            &copy; {new Date().getFullYear()} Handumanan Metro Cebu. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, MapPin, ArrowRight, Landmark, Sparkles } from 'lucide-react';

export default function Home() {
  const featuredSites = HERITAGE_SITES.filter(s => s.isMustVisit).slice(0, 3);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <Image
          src="https://picsum.photos/seed/magellan/1920/1080"
          alt="Metro Cebu Heritage"
          fill
          className="object-cover brightness-[0.4]"
          priority
          data-ai-hint="cebu city"
        />
        <div className="container relative z-10 px-4 text-center text-white">
          <Badge className="bg-accent/20 text-accent mb-6 border-accent/30 px-4 py-1.5 backdrop-blur-md">
            <Sparkles size={14} className="mr-2 inline" /> Intelligent Heritage Explorer
          </Badge>
          <h1 className="font-headline text-6xl md:text-8xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Handumanan
          </h1>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto opacity-90 font-body leading-relaxed">
            Rediscover the historical landmarks and cultural treasures of Metro Cebu with AI-powered trip planning and live navigation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 rounded-full px-10 h-16 text-lg shadow-2xl shadow-primary/40">
              <Link href="/discover">
                <Compass className="mr-2 h-6 w-6" /> Explore & Route
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="bg-white/10 backdrop-blur-lg border-white/20 text-white hover:bg-white/20 rounded-full px-10 h-16 text-lg">
              <Link href="/explore">
                <Landmark className="mr-2 h-6 w-6" /> Search Directory
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Sites */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-16">
            <div className="max-w-xl">
              <h2 className="font-headline text-5xl font-bold text-primary mb-4">Heritage Treasures</h2>
              <p className="text-muted-foreground text-lg">Start your journey with these handpicked historical landmarks across Cebu, Mandaue, Talisay, and Lapu-Lapu.</p>
            </div>
            <Link href="/explore" className="text-primary font-bold flex items-center gap-2 hover:underline hidden md:flex text-lg">
              View all sites <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredSites.map((site) => (
              <Card key={site.id} className="group overflow-hidden border-none shadow-2xl hover:shadow-primary/10 transition-all duration-500 flex flex-col h-full bg-white rounded-3xl">
                <div className="relative h-72 overflow-hidden">
                  <Image
                    src={site.imageUrl}
                    alt={site.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-6 right-6 bg-white/95 backdrop-blur px-4 py-1.5 rounded-full text-xs font-black text-primary shadow-xl">
                    {site.category.split(' & ')[0]}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 text-primary text-xs font-black mb-2 uppercase tracking-widest">
                    <MapPin size={14} /> {site.city}
                  </div>
                  <CardTitle className="font-headline text-3xl group-hover:text-primary transition-colors">
                    {site.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-6">
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {site.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-6 border-t border-slate-100">
                  <Button variant="link" asChild className="p-0 h-auto text-primary font-black group-hover:translate-x-2 transition-transform text-base">
                    <Link href={`/site/${site.id}`}>Learn more <ArrowRight size={18} className="ml-2" /></Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Landmark size={40} className="text-accent" />
            <span className="font-headline text-4xl font-bold tracking-tighter">Handumanan</span>
          </div>
          <p className="max-w-xl mx-auto opacity-80 mb-10 text-lg leading-relaxed font-body">
            A Web-Based Cultural Heritage Site Information System for Metro Cebu. BSIT Capstone Project 2026.
          </p>
          <div className="flex justify-center gap-10 mb-10 text-sm uppercase tracking-widest font-black">
            <Link href="/discover" className="hover:text-accent transition-colors">Explore & Route</Link>
            <Link href="/explore" className="hover:text-accent transition-colors">Directory</Link>
            <Link href="/admin" className="hover:text-accent transition-colors">Admin</Link>
          </div>
          <div className="pt-10 border-t border-white/10 text-xs opacity-50 font-bold tracking-widest">
            &copy; {new Date().getFullYear()} HANDUMANAN METRO CEBU. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';

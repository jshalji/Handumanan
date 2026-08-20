'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { HERITAGE_SITES, DEPRECATED_HERITAGE_SITE_IDS, isSiteVisibleToUser } from '@/lib/heritage-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Compass, MapPin, ArrowRight, Search, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageSources } from '@/lib/site-images';
import { useFirestore, useUser, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import { collection, doc, query, orderBy } from 'firebase/firestore';

export default function Home() {
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const userRole = userData?.role;

  const sitesQuery = useMemoFirebase(() => db ? collection(db, 'heritageSites') : null, [db]);
  const { data: dbSites } = useCollection(sitesQuery);

  const featuredSites = useMemo(() => {
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
      sitesById.set(dbSite.id, {
        ...existingSite,
        ...dbSite,
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
        isSiteVisibleToUser(site, userRole) &&
        site.isMustVisit
      ))
      .slice(0, 3);
  }, [dbSites, userRole]);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <Navbar />

      {/* Hero Section */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] w-full items-center justify-center overflow-hidden py-16 md:min-h-[calc(100dvh-5rem)]">
        <Image
          src="/metrocebu-bg.jpg"
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
          <h1 className="mx-auto mb-6 max-w-full break-words font-headline text-4xl font-bold leading-none sm:text-6xl md:text-8xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Handumanan
          </h1>
          <p className="mx-auto mb-10 max-w-[22rem] text-base leading-relaxed opacity-90 font-body sm:max-w-2xl sm:text-xl md:text-2xl">
            Rediscover the historical landmarks and cultural treasures of Metro Cebu with AI-powered trip planning and live navigation.
          </p>
          <div className="flex w-full flex-col sm:w-auto sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Button size="lg" asChild className="w-full max-w-xs sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full px-8 sm:px-10 h-14 sm:h-16 text-base sm:text-lg font-bold shadow-2xl shadow-primary/40">
              <Link href="/explore">
                <Search className="mr-2 h-6 w-6" /> Explore Heritage Sites
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="w-full max-w-xs sm:w-auto bg-white/10 backdrop-blur-lg border-white/30 text-white hover:bg-white/20 rounded-full px-8 sm:px-10 h-14 sm:h-16 text-base sm:text-lg font-bold">
              <Link href="/discover">
                <Compass className="mr-2 h-6 w-6" /> Live Map & Expeditions
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Featured Sites */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-10 md:mb-16">
            <div className="max-w-xl">
              <h2 className="font-headline text-4xl md:text-5xl font-bold text-primary mb-4">Heritage Treasures</h2>
              <p className="text-muted-foreground text-lg">Start your journey with these handpicked historical landmarks across Cebu, Mandaue, Talisay, and Lapu-Lapu.</p>
            </div>
            <Link href="/explore" className="text-primary font-bold flex items-center gap-2 hover:underline hidden md:flex text-lg">
              View all sites <ArrowRight size={20} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            {featuredSites.map((site) => {
              const imageSources = getSiteImageSources(site);

              return (
              <Card key={site.id} className="group overflow-hidden border border-slate-200/80 shadow-lg hover:shadow-2xl hover:border-primary/30 transition-all duration-500 flex flex-col h-full bg-white rounded-3xl">
                <div className="relative h-72 overflow-hidden bg-slate-100">
                  <SafeImage
                    src={imageSources[0]}
                    alt={site.name}
                    fill
                    fallbackSrc={imageSources.slice(1)}
                    fallbackClassName="object-cover"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge variant="secondary" className="border-none bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-primary shadow-sm backdrop-blur-md">
                      {site.category.split(' & ')[0]}
                    </Badge>
                  </div>
                  <div className="absolute top-4 right-4 flex flex-col items-end gap-1.5">
                    {site.verificationStatus === 'LGU Verified' && (
                      <Badge className="border-none bg-emerald-600 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-md flex items-center gap-1">
                        LGU Verified
                      </Badge>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <CardHeader className="pb-2 pt-6">
                  <div className="flex items-center gap-2 text-primary text-xs font-black mb-2 uppercase tracking-widest">
                    <MapPin size={14} /> {site.city}
                  </div>
                  <CardTitle className="font-headline text-2xl font-bold group-hover:text-primary transition-colors">
                    {site.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-6">
                  <p className="text-muted-foreground line-clamp-3 text-sm leading-relaxed">
                    {site.description}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-slate-100">
                  <Button variant="link" asChild className="p-0 h-auto text-primary font-black group-hover:translate-x-1 transition-transform text-sm">
                    <Link href={`/site/${site.id}`}>Learn more <ArrowRight size={16} className="ml-1.5" /></Link>
                  </Button>
                </CardFooter>
              </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-primary text-primary-foreground py-16 mt-auto">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Image src="/logo.png" alt="Handumanan" width={48} height={48} className="w-12 h-12 rounded-xl shadow-lg" />
            <span className="font-headline text-3xl sm:text-4xl font-bold tracking-tighter">Handumanan</span>
          </div>
          <p className="max-w-xl mx-auto opacity-80 mb-10 text-lg leading-relaxed font-body">
            A Web-Based Cultural Heritage Site Information System for Metro Cebu. BSIT Capstone Project 2026.
          </p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 mb-10 text-sm uppercase tracking-widest font-black">
            <Link href="/discover" className="hover:text-accent transition-colors">Explore & Route</Link>
            <Link href="/explore" className="hover:text-accent transition-colors">Directory</Link>
          </div>
          <div className="pt-10 border-t border-white/10 text-xs opacity-50 font-bold tracking-widest">
            &copy; {new Date().getFullYear()} HANDUMANAN METRO CEBU. ALL RIGHTS RESERVED.
          </div>
        </div>
      </footer>
    </div>
  );
}

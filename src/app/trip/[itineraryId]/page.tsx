'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Clock, 
  History, 
  Navigation, 
  Loader2, 
  Landmark,
  Route
} from 'lucide-react';

export default function TripDetailPage({ params }: { params: Promise<{ itineraryId: string }> }) {
  const { itineraryId } = use(params);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const itineraryRef = useMemoFirebase(() => 
    (db && user) ? doc(db, 'users', user.uid, 'itineraries', itineraryId) : null,
    [db, user, itineraryId]
  );
  
  const { data: trip, isLoading: isTripLoading } = useDoc(itineraryRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || isTripLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Landmark size={64} className="text-slate-200 mb-6" />
        <h2 className="text-2xl font-headline font-bold mb-4 text-slate-900">Trip not found</h2>
        <Button asChild className="rounded-2xl"><Link href="/profile">Back to Profile</Link></Button>
      </div>
    );
  }

  // Parse legacy itineraryData or use itineraryIds
  let displaySites: any[] = [];
  let aiSteps: any[] = [];

  if (trip.itineraryIds) {
    displaySites = trip.itineraryIds.map((id: string) => HERITAGE_SITES.find(s => s.id === id)).filter(Boolean);
  } else if (trip.itineraryData) {
    try {
      const parsed = JSON.parse(trip.itineraryData);
      aiSteps = parsed.itinerary || [];
      displaySites = aiSteps.map((step: any) => HERITAGE_SITES.find(s => s.id === step.siteId)).filter(Boolean);
    } catch (e) {
      console.error("Failed to parse itinerary data", e);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/profile" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={14} /> My Profile
        </Link>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
              Saved Expedition
            </Badge>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
              <Calendar size={10} /> {trip.createdAt?.toDate().toLocaleDateString()}
            </span>
          </div>
          <h1 className="font-headline text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-4">
            Itinerary Summary
          </h1>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm italic text-slate-600 text-lg">
            "{trip.summary}"
          </div>
        </header>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Planned Stops ({displaySites.length})</h2>
            <Button asChild variant="outline" size="sm" className="rounded-xl h-10 border-2 font-bold text-xs">
              <Link href={`/discover?itineraryId=${itineraryId}`}>
                <Navigation size={14} className="mr-2" /> Live Map
              </Link>
            </Button>
          </div>

          <div className="space-y-4 relative">
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-200" />
            
            {displaySites.map((site, idx) => {
              const aiStep = aiSteps.find(step => step.siteId === site.id);
              return (
                <Card key={`${site.id}-${idx}`} className="relative z-10 border-none shadow-sm rounded-[2rem] overflow-hidden group hover:shadow-md transition-shadow">
                  <CardHeader className="p-6 pb-0 flex flex-row items-center gap-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-lg shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-0.5">{site.city}</p>
                      <CardTitle className="text-xl font-headline font-bold truncate group-hover:text-primary transition-colors">
                        {site.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-4 ml-12 md:ml-18">
                    <div className="flex flex-col gap-4">
                      {aiStep?.description ? (
                        <p className="text-slate-600 text-sm leading-relaxed italic">
                          {aiStep.description}
                        </p>
                      ) : (
                        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
                          {site.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 pt-2">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400">
                          <Clock size={14} /> {site.visitingHours}
                        </div>
                        {aiStep?.estimatedVisitDurationMinutes && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary">
                            <History size={14} /> {aiStep.estimatedVisitDurationMinutes} Min Stay
                          </div>
                        )}
                        <Link href={`/site/${site.id}`} className="text-[10px] font-black uppercase text-blue-500 hover:underline flex items-center gap-1">
                          View Details <ArrowLeft className="rotate-180" size={10} />
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="pt-10 flex flex-col md:flex-row gap-4">
            <Button asChild className="flex-1 h-14 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20">
              <Link href={`/discover?itineraryId=${itineraryId}`}>
                <Route size={20} className="mr-2" /> Start Live Navigation
              </Link>
            </Button>
            <Button asChild variant="outline" className="flex-1 h-14 rounded-2xl border-2 font-black uppercase tracking-widest">
              <Link href="/discover">
                Map New Expedition
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

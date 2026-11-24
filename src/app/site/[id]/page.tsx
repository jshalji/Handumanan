'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import {
  getAdmissionDisplay,
  getSiteById,
  isSiteVisibleToUser,
  normalizeHeritageSite,
  type HeritageSite,
  SITE_IMAGE_ATTRIBUTIONS,
} from '@/lib/heritage-data';
import { evaluateSiteOperatingStatus } from '@/lib/site-availability';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Route, Heart, Loader2, ChevronDown, ChevronUp, Plus, ChevronLeft, ChevronRight, Maximize2, X, CheckCircle2, AlertCircle, Ticket, ExternalLink, ShieldCheck } from 'lucide-react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageFallback, getSiteImageSources } from '@/lib/site-images';
import { getWeeklyScheduleRows } from '@/lib/visiting-hours';
import { VisitorPhotoSection } from '@/components/site/VisitorPhotoSection';
import { getRatingSummaryState } from '@/lib/review-ratings';

function mergeSiteRecord(baseSite: HeritageSite | undefined, overrideSite: any): HeritageSite | null {
  if (!baseSite && !overrideSite) return null;
  return normalizeHeritageSite(overrideSite, baseSite);
}

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const staticSite = getSiteById(id);
  const siteDocRef = useMemoFirebase(() => db ? doc(db, 'heritageSites', id) : null, [db, id]);
  const { data: dbSite, isLoading: isSiteRecordLoading } = useDoc(siteDocRef);

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
  const userRole = userData?.role;

  const mergedSite = mergeSiteRecord(staticSite, dbSite);
  const site = mergedSite?.isActive === false || mergedSite?.status === 'Inactive' ? null : mergedSite;
  const isResolvingSite = !staticSite && isSiteRecordLoading;
  const isVisibleToUser = site ? isSiteVisibleToUser(site, userRole) : false;

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSignificanceExpanded, setIsSignificanceExpanded] = useState(false);
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const operatingEval = useMemo(
    () => (site ? evaluateSiteOperatingStatus(site, now) : null),
    [site, now]
  );
  const weeklyRows = useMemo(
    () => (site ? getWeeklyScheduleRows(site) : []),
    [site]
  );

  // Combine main image and gallery images
  const imageFallback = getSiteImageFallback(site);
  const siteImageSources = site ? getSiteImageSources(site) : [];
  const allImages = siteImageSources.length > 0 ? siteImageSources : [imageFallback];
  const activeImageAttribution = ((SITE_IMAGE_ATTRIBUTIONS as Record<string, { url: string; creator: string; license: string; licenseUrl: string }[]>)[site?.id || ''] || []).find((a: { url: string }) => a.url === allImages[activeImageIndex]);
  const getImageFallbackSources = (_index: number) => [
    imageFallback,
  ];

  const goToImage = (direction: 'previous' | 'next') => {
    setActiveImageIndex(current => {
      if (direction === 'previous') return current === 0 ? allImages.length - 1 : current - 1;
      return current === allImages.length - 1 ? 0 : current + 1;
    });
  };

  useEffect(() => {
    if (!isGalleryOpen) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousScrollbarGutter = document.documentElement.style.getPropertyValue('scrollbar-gutter');

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.setProperty('scrollbar-gutter', 'auto');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsGalleryOpen(false);
      if (event.key === 'ArrowLeft') goToImage('previous');
      if (event.key === 'ArrowRight') goToImage('next');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.documentElement.style.setProperty('scrollbar-gutter', previousScrollbarGutter);
    };
  }, [isGalleryOpen, allImages.length]);

  // Fetch Reviews
  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return collection(db, 'heritageSites', id, 'reviews');
  }, [db, id]);
  const { data: reviews, isLoading: isReviewsLoading, error: reviewsError } = useCollection(reviewsQuery);
  const sortedReviews = useMemo(() => {
    return [...(reviews || [])].sort((a, b) => {
      const getTime = (value: any) =>
        typeof value?.toDate === "function" ? value.toDate().getTime() : value ? new Date(value).getTime() : 0;
      const timeA = getTime(a?.createdAt);
      const timeB = getTime(b?.createdAt);
      const hasA = Number.isFinite(timeA);
      const hasB = Number.isFinite(timeB);
      if (hasA && hasB) return timeB - timeA;
      if (hasA) return -1;
      if (hasB) return 1;
      return 0;
    });
  }, [reviews]);
  const ratingSummary = getRatingSummaryState(reviews, {
    isLoading: isReviewsLoading,
    isAvailable: Boolean(reviewsQuery),
    error: reviewsError,
  });

  // Fetch User Favorites status
  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'), where('siteId', '==', id));
  }, [db, user, id]);
  const { data: userFavorites } = useCollection(favoritesQuery);
  const isFavorited = (userFavorites?.length || 0) > 0;

  if (isResolvingSite) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-body">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-body">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-20">
          <NextImage src="/logo.png" alt="Handumanan" width={80} height={80} className="w-20 h-20 rounded-2xl opacity-30 mb-6" />
          <h2 className="text-2xl font-headline font-bold mb-4 text-slate-900">Site not found</h2>
          <Button asChild className="rounded-2xl"><Link href="/explore">Back to Directory</Link></Button>
        </div>
      </div>
    );
  }

  if (!isVisibleToUser) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-50 font-body">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center py-16">
          <div className="bg-amber-50 p-6 rounded-full text-amber-600 mb-6 shadow-sm border border-amber-200/60">
            <AlertCircle size={48} />
          </div>
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-3 text-slate-900">
            Site Unavailable
          </h2>
          <p className="text-slate-600 max-w-md mb-8 text-sm md:text-base leading-relaxed">
            This heritage site is currently not available for public viewing.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button asChild className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20">
              <Link href="/explore">Back to Directory</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2">
              <Link href="/discover">Explore Interactive Map</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const siteLatitude = Number(site.coordinates?.lat);
  const siteLongitude = Number(site.coordinates?.lng);
  const hasExactCoordinates = Number.isFinite(siteLatitude) && Number.isFinite(siteLongitude) && siteLatitude !== 0 && siteLongitude !== 0;
  const discoverMapHref = `/discover?siteId=${encodeURIComponent(site.id)}`;
  const discoverRouteHref = `/discover?siteId=${encodeURIComponent(site.id)}&action=route`;
  const discoverAddHref = `/discover?siteId=${encodeURIComponent(site.id)}&action=add`;
  const externalMapsHref = hasExactCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${siteLatitude},${siteLongitude}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${site.name} ${site.location}`)}`;

  const handleToggleFavorite = async () => {
    if (!user || !db) {
      toast({ title: "Login Required", description: "Please login to save favorites.", variant: "destructive" });
      return;
    }

    setIsFavoriteUpdating(true);

    try {
      if (isFavorited) {
        await Promise.all(
          (userFavorites || []).map(fav =>
            deleteDoc(doc(db, 'users', user.uid, 'favorites', fav.id))
          )
        );
        toast({ title: "Removed from Favorites", description: `${site.name} has been removed.` });
        return;
      }

      const favRef = doc(db, 'users', user.uid, 'favorites', id);
      await setDoc(favRef, {
        userId: user.uid,
        siteId: id,
        siteName: site.name,
        imageUrl: site.imageUrl,
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Added to Favorites", description: `${site.name} has been saved.` });
    } catch (error) {
      console.error('Failed to update favorite:', error);
      toast({
        title: "Favorite Update Failed",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsFavoriteUpdating(false);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
    if (!comment.trim()) {
       toast({ title: "Comment Required", description: "Please enter a short comment.", variant: "destructive" });
       return;
    }

    setIsSubmitting(true);
    const reviewRef = doc(collection(db, 'heritageSites', id, 'reviews'));
    setDocumentNonBlocking(reviewRef, {
      userId: user.uid,
      userName: userData?.displayName || user.displayName || user.email?.split('@')[0],
      siteId: id,
      rating: rating,
      comment: comment,
      createdAt: serverTimestamp()
    }, { merge: true });
    
    setComment('');
    setRating(5);
    setIsSubmitting(false);
    toast({ title: "Review Submitted", description: "Thank you for sharing your experience!" });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: site.name,
        text: site.description,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Site URL copied to clipboard." });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-body">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/explore" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary mb-8 transition-colors group">
          <ArrowLeft className="mr-2 group-hover:-translate-x-1 transition-transform" size={14} /> Site Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">
                    {site.category}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} /> {site.city}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-500 font-black text-xs" aria-live="polite">
                    {ratingSummary.status === 'rated' ? (
                      <>
                        <Star size={12} fill="currentColor" /> {ratingSummary.average.toFixed(1)} / 5.0
                        <span className="ml-1 text-[10px] text-slate-400">({ratingSummary.count} {ratingSummary.count === 1 ? 'rating' : 'ratings'})</span>
                      </>
                    ) : ratingSummary.status === 'empty' ? (
                      <>
                        <span className="flex items-center text-slate-300" aria-label="Empty stars">
                          {[1, 2, 3, 4, 5].map(star => <Star key={star} size={11} />)}
                        </span>
                        <span className="ml-1 text-slate-400">No ratings yet</span>
                      </>
                    ) : (
                      <span className="text-slate-400">
                        {ratingSummary.status === 'loading' ? 'Loading ratings…' : 'Ratings unavailable'}
                      </span>
                    )}
                  </div>
                  {site.isMustVisit && (
                    <Badge variant="secondary" className="bg-accent text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1">Must Visit</Badge>
                  )}
                </div>
                <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                  {site.name}
                </h1>
              </div>

              {/* Enhanced Gallery UI */}
              <div className="space-y-4">
                <div className="relative h-[220px] md:h-[400px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl border bg-slate-100 ring-1 ring-black/5 group">
                  <SafeImage
                    src={allImages[activeImageIndex]} 
                    alt={`${site.name} photo ${activeImageIndex + 1}`}
                    fill 
                    loading="eager"
                    fallbackSrc={getImageFallbackSources(activeImageIndex)}
                    fallbackClassName="object-cover"
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                  />
                  <button
                    type="button"
                    onClick={() => setIsGalleryOpen(true)}
                    className="absolute inset-0 z-10 cursor-zoom-in"
                    aria-label={`Open ${site.name} photo viewer`}
                  />
                  <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-4 text-white pointer-events-none sm:p-5">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Photo {activeImageIndex + 1} of {allImages.length}</p>
                        {activeImageAttribution ? (
                          <p className="text-[10px] text-white/70 mt-1">Photo: {activeImageAttribution.creator} · {activeImageAttribution.license} (changes may have been made) · <a href={activeImageAttribution.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">license</a></p>
                        ) : null}
                        <p className="text-sm md:text-base font-black leading-tight">{site.name}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 flex items-center gap-1 mt-1">
                          <MapPin size={10} /> {site.city}
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-[9px] font-black uppercase tracking-widest backdrop-blur-md">
                        <Maximize2 size={12} /> View Place
                      </div>
                    </div>
                  </div>
                  {allImages.length > 1 && (
                    <>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={(event) => { event.stopPropagation(); goToImage('previous'); }}
                        className="absolute left-4 top-1/2 z-30 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft size={18} />
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={(event) => { event.stopPropagation(); goToImage('next'); }}
                        className="absolute right-4 top-1/2 z-30 h-10 w-10 -translate-y-1/2 rounded-full bg-white/90 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                        aria-label="Next photo"
                      >
                        <ChevronRight size={18} />
                      </Button>
                    </>
                  )}
                </div>
                
                {allImages.length > 1 && (
                  <ScrollArea className="w-full whitespace-nowrap rounded-2xl">
                    <div className="flex w-max space-x-3 pb-4 px-1">
                      {allImages.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveImageIndex(idx)}
                          className={cn(
                            "relative h-20 w-32 rounded-2xl overflow-hidden border-2 transition-all shrink-0 shadow-sm group/thumb",
                            activeImageIndex === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                          aria-label={`Show ${site.name} photo ${idx + 1}`}
                        >
                          <SafeImage src={img} alt={`${site.name} gallery photo ${idx + 1}`} fill fallbackSrc={getImageFallbackSources(idx)} fallbackClassName="object-cover" className="object-cover transition-transform group-hover/thumb:scale-110" />
                          <span className="absolute bottom-1 left-1 rounded-full bg-slate-950/70 px-2 py-0.5 text-[8px] font-black text-white">
                            {idx + 1}
                          </span>
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* Information Sections with Progressive Disclosure */}
            <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 space-y-10 md:rounded-[2.5rem] md:p-12 md:space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-xl text-primary"><Info size={20} /></div>
                  <h2 className="font-headline text-2xl font-bold">Overview</h2>
                </div>
                <div className="space-y-4">
                  <div className={cn(
                    "text-slate-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base transition-all duration-500 overflow-hidden",
                    !isDescExpanded && "max-h-[120px]"
                  )}>
                    {site.overview}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary font-black uppercase text-[10px] p-0 h-auto tracking-widest hover:bg-transparent"
                  >
                    {isDescExpanded ? <span className="flex items-center gap-1">Show Less <ChevronUp size={14} /></span> : <span className="flex items-center gap-1">Read Full Overview <ChevronDown size={14} /></span>}
                  </Button>
                </div>
              </section>

              <Separator className="opacity-50" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/5 rounded-xl text-primary"><Landmark size={20} /></div>
                  <h2 className="font-headline text-2xl font-bold">Historical Significance</h2>
                </div>
                <div className="space-y-4">
                  <div className={cn(
                    "text-slate-600 leading-relaxed italic whitespace-pre-wrap text-sm md:text-base transition-all duration-500 overflow-hidden",
                    !isSignificanceExpanded && "max-h-[120px]"
                  )}>
                    {site.significance}
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSignificanceExpanded(!isSignificanceExpanded)}
                    className="text-primary font-black uppercase text-[10px] p-0 h-auto tracking-widest hover:bg-transparent"
                  >
                    {isSignificanceExpanded ? <span className="flex items-center gap-1">Show Less <ChevronUp size={14} /></span> : <span className="flex items-center gap-1">Read More History <ChevronDown size={14} /></span>}
                  </Button>
                </div>
              </section>

              <Separator className="opacity-50" />

              {/* Unified Visitor Insights Section */}
              <section id="reviews">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-xl text-primary"><MessageSquare size={20} /></div>
                    <h2 className="font-headline text-2xl font-bold">Visitor Insights</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3">Community Feed</Badge>
                </div>

                <p className="mb-6 text-sm font-medium leading-relaxed text-slate-500">
                  Share your experience and memories from this heritage site.
                </p>

                <VisitorPhotoSection
                  siteId={site.id}
                  siteName={site.name}
                  reviews={sortedReviews}
                  isReviewsLoading={isReviewsLoading}
                  isReviewsError={Boolean(reviewsError)}
                  reviewPrompt={(
                    <>
                      <p className="mb-4 font-medium text-slate-600">Want to share your story or photos? Sign in to contribute to the community feed.</p>
                      <Button asChild variant="outline" className="h-11 rounded-2xl border-2 px-6 text-[10px] font-black uppercase tracking-widest">
                        <Link href="/auth">Sign In to Contribute</Link>
                      </Button>
                    </>
                  )}
                />
              </section>
            </div>
          </div>

          {/* Sidebar / Access Info Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto overscroll-contain ring-1 ring-black/5">
              <h3 className="font-headline text-xl font-bold mb-5 text-slate-900">Plan Your Visit</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl text-primary shrink-0"><MapPin size={18} /></div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Address</h4>
                    <p className="text-xs md:text-sm font-bold text-slate-800 leading-snug break-words">{site.location}</p>
                    <Link href={discoverMapHref} className="text-[9px] font-black text-primary uppercase mt-1 inline-flex items-center gap-1 hover:underline">
                      Open in Maps <Route size={9} />
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl text-primary shrink-0"><Clock size={18} /></div>
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest">Visiting Hours (Asia/Manila)</h4>
                      {operatingEval && (
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                            operatingEval.isOpen === true
                              ? operatingEval.isClosingSoon
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : operatingEval.subFacilityEvaluations.some(sub => sub.isOpen === true)
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : operatingEval.isOpen === false
                                  ? operatingEval.calculatedStatus === 'Exterior Viewable Now'
                                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                          )}
                        >
                          {operatingEval.isOpen !== true &&
                          operatingEval.subFacilityEvaluations.some(sub => sub.isOpen === true)
                            ? 'Sub-Facility Open'
                            : operatingEval.calculatedStatus}
                        </span>
                      )}
                    </div>

                    <p className="text-xs md:text-sm font-bold text-slate-800 leading-snug">
                      {operatingEval?.displaySummary || site.visitingHours}
                    </p>

                    {operatingEval?.statusDetailMessage && (
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {operatingEval.statusDetailMessage}
                        {operatingEval.interiorEvaluation.nextTransitionLabel
                          ? ` (${operatingEval.interiorEvaluation.nextTransitionLabel})`
                          : operatingEval.exteriorGroundsEvaluation.nextTransitionLabel
                            ? ` (${operatingEval.exteriorGroundsEvaluation.nextTransitionLabel})`
                            : ''}
                      </p>
                    )}

                    {/* Separated Interior, Exterior Grounds, and Street Visibility Access */}
                    {site.operatingSchedule && (
                      <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 space-y-1.5 text-[10px]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-500">Interior Access:</span>
                          <span className="text-right font-semibold text-slate-800">
                            {site.operatingSchedule.interiorAccess.policyStatus}
                            {operatingEval
                              ? ` · ${operatingEval.interiorEvaluation.calculatedStatus}`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-500">Exterior Grounds:</span>
                          <span className="text-right font-semibold text-slate-800">
                            {site.operatingSchedule.exteriorGroundsAccess.policyStatus}
                            {operatingEval
                              ? ` · ${operatingEval.exteriorGroundsEvaluation.calculatedStatus}`
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-500">Street Visibility:</span>
                          <span className="text-right font-semibold text-slate-800">
                            {site.operatingSchedule.exteriorStreetVisibility.status}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sub-Facilities & Component Schedules */}
                    {operatingEval && operatingEval.subFacilityEvaluations.length > 0 && (
                      <div className="rounded-2xl bg-slate-50 p-2.5 border border-slate-100 space-y-2 text-[10px]">
                        <p className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                          Component &amp; Sub-Facility Schedules
                        </p>
                        {operatingEval.subFacilityEvaluations.map(subEval => (
                          <div
                            key={subEval.subFacilityId}
                            className="rounded-xl bg-white p-2 border border-slate-100 space-y-0.5"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-bold text-slate-800">{subEval.subFacilityName}</span>
                              <span
                                className={cn(
                                  'rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider',
                                  subEval.isOpen === true
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : subEval.isOpen === false
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                )}
                              >
                                {subEval.calculatedStatus}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 leading-snug">{subEval.reason}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}
                      className="text-[9px] font-black text-slate-500 uppercase mt-1 flex items-center gap-1 hover:text-primary transition-colors"
                    >
                      {isScheduleExpanded ? 'Hide weekly schedule & sources' : 'View weekly schedule & sources'}{' '}
                      {isScheduleExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>

                    {isScheduleExpanded && (
                      <div className="mt-2 max-h-80 overflow-y-auto pr-1 overscroll-contain space-y-3 pt-2 border-t border-slate-100 text-[11px]">
                        <div className="grid gap-1">
                          {weeklyRows.map(row => (
                            <div
                              key={row.key}
                              className={cn(
                                'flex justify-between items-center py-1 px-2 rounded-lg',
                                operatingEval?.manilaDayOfWeek === row.key
                                  ? 'bg-primary/10 font-bold'
                                  : 'bg-slate-50'
                              )}
                            >
                              <span className="font-bold text-slate-800">{row.day}:</span>
                              <span className="text-slate-600 font-medium text-right">
                                {row.formattedHours}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Official Verification Sources & Notes */}
                        {site.operatingSchedule?.verification && (
                          <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100 space-y-1.5 text-[10px]">
                            <div className="flex items-center gap-1.5 font-black uppercase tracking-wider text-[9px] text-slate-500">
                              <ShieldCheck size={12} className="text-primary shrink-0" />
                              <span>{site.operatingSchedule.verification.verificationStatusLabel}</span>
                            </div>
                            {site.operatingSchedule.verification.lastVerifiedDate && (
                              <p className="text-slate-500">
                                Last checked: {site.operatingSchedule.verification.lastVerifiedDate}
                              </p>
                            )}
                            {site.operatingSchedule.verification.verificationNotes && (
                              <p className="text-slate-600 leading-relaxed">
                                {site.operatingSchedule.verification.verificationNotes}
                              </p>
                            )}
                            {site.operatingSchedule.verification.sources.length > 0 && (
                              <div className="space-y-1 pt-1">
                                <p className="font-bold text-slate-500">Official Sources:</p>
                                {site.operatingSchedule.verification.sources.map((src, idx) => (
                                  <a
                                    key={idx}
                                    href={src.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-start gap-1 text-primary font-semibold hover:underline break-words"
                                  >
                                    <ExternalLink size={10} className="shrink-0 mt-0.5" />
                                    <span className="min-w-0">
                                      {src.publisher}: {src.title}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/5 rounded-xl text-primary shrink-0"><Info size={18} /></div>
                  <div className="min-w-0">
                    <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest mb-0.5">Accessibility</h4>
                    <p className="text-xs md:text-sm font-bold text-slate-800 leading-snug">{site.accessibilityStatus}</p>
                  </div>
                </div>

                {(() => {
                  const admission = getAdmissionDisplay(site);
                  const admissionBadge =
                    admission.status === 'free'
                      ? admission.isVerified
                        ? { text: 'Verified Free', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                        : { text: 'Open Public Access', cls: 'bg-teal-50 text-teal-700 border-teal-200' }
                      : admission.status === 'paid'
                        ? { text: admission.isVerified ? 'Verified Paid' : 'Paid', cls: 'bg-slate-100 text-slate-800 border-slate-200' }
                        : admission.status === 'unverified'
                          ? { text: 'Unverified', cls: 'bg-amber-50 text-amber-800 border-amber-200' }
                          : { text: 'Not Available', cls: 'bg-slate-50 text-slate-500 border-slate-200' };
                  return (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/5 rounded-xl text-primary shrink-0"><Ticket size={18} /></div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1.5">
                          <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest">Admission</h4>
                          <span className={cn('rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider', admissionBadge.cls)}>
                            {admissionBadge.text}
                          </span>
                        </div>
                        <p className={cn(
                          'text-xs md:text-sm font-bold leading-snug',
                          admission.status === 'not_available' ? 'text-slate-500 italic font-normal' : 'text-slate-800'
                        )}>
                          {admission.displayLabel}
                        </p>
                        {admission.scope && (
                          <p className="text-[10px] font-semibold text-slate-500">
                            Scope: {admission.scope}
                          </p>
                        )}
                        {Array.isArray(admission.subFacilities) && admission.subFacilities.length > 0 && (
                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 space-y-1.5 text-[10px]">
                            <p className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                              Facility Breakdown
                            </p>
                            {admission.subFacilities.map((sub, idx) => (
                              <div key={idx} className="flex flex-col items-start gap-1 border-b border-slate-100 last:border-b-0 pb-1.5 last:pb-0">
                                <span className="font-semibold text-slate-700 leading-snug">{sub.name}</span>
                                <span
                                  className={cn(
                                    'inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-wider leading-tight',
                                    sub.status === 'free' && sub.isVerified
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : sub.status === 'paid' && sub.isVerified
                                        ? 'bg-slate-100 text-slate-800 border-slate-200'
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                  )}
                                >
                                  {sub.label}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                        {Array.isArray(admission.rates) && admission.rates.length > 0 && (
                          <div className="rounded-xl bg-slate-50 p-2 border border-slate-100 space-y-1 text-[10px]">
                            {admission.rates.map((rate, idx) => (
                              <div key={idx} className="flex items-start justify-between gap-2">
                                <span className="font-semibold text-slate-600">{rate.category}:</span>
                                <span className="font-bold text-slate-800 text-right">{rate.amount}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {admission.notes && (
                          <p className="text-[10px] text-slate-500 leading-relaxed">{admission.notes}</p>
                        )}
                        {Array.isArray(admission.sources) && admission.sources.length > 0 && (
                          <div className="space-y-0.5">
                            {admission.sources.map((src, idx) => (
                              <a
                                key={idx}
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-1 text-[10px] text-primary font-semibold hover:underline break-words"
                              >
                                <ExternalLink size={10} className="shrink-0 mt-0.5" />
                                <span className="min-w-0">{src.publisher}: {src.title}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-2.5">
                <Button className="w-full h-11 bg-primary rounded-xl font-black uppercase text-[11px] tracking-[0.16em] shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all" asChild>
                  <Link href={discoverRouteHref}>
                    <Route size={16} className="mr-2" /> Initialize Route
                  </Link>
                </Button>
                
                <Button 
                   variant="outline"
                   className="w-full h-11 rounded-xl font-black uppercase text-[10px] tracking-widest border border-slate-200 hover:bg-primary/5 active:scale-95 transition-all"
                   asChild
                >
                   <Link href={discoverAddHref}>
                      <Plus size={15} className="mr-1.5" /> Add to Itinerary
                   </Link>
                </Button>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button 
                    onClick={handleToggleFavorite} 
                    variant={isFavorited ? "default" : "secondary"} 
                    disabled={isFavoriteUpdating}
                    className={cn(
                      "h-11 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all",
                      isFavorited ? "bg-accent text-white shadow" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {isFavoriteUpdating ? (
                      <Loader2 size={15} className="mr-1.5 animate-spin" />
                    ) : (
                      <Heart size={15} className={cn("mr-1.5", isFavorited ? "fill-white" : "")} />
                    )}
                    {isFavorited ? 'Saved' : 'Favorite'}
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="h-11 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all bg-slate-100 text-slate-700 hover:bg-slate-200"
                    onClick={handleShare}
                  >
                    <Share2 size={15} className="mr-1.5" /> Share
                  </Button>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-center gap-2 opacity-40">
                   <NextImage src="/logo.png" alt="Handumanan" width={20} height={20} className="w-5 h-5 rounded-md" />
                   <p className="text-[8px] font-black uppercase tracking-[0.25em]">
                     Heritage ID: {site.id}
                   </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isGalleryOpen && (
        <div className="fixed left-0 top-0 z-[1200] h-[100dvh] w-screen overflow-hidden bg-slate-950">
          <SafeImage
            src={allImages[activeImageIndex]}
            alt=""
            fill
            loading="eager"
            fallbackSrc={getImageFallbackSources(activeImageIndex)}
            fallbackClassName="object-cover"
            className="scale-125 object-cover blur-3xl saturate-110"
            aria-hidden="true"
          />
          <div className="absolute left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-20 flex items-center justify-between gap-4 md:left-8 md:right-8 md:top-4">
            <div className="min-w-0 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">Exploring Place</p>
              <h2 className="truncate font-headline text-xl font-black md:text-3xl">{site.name}</h2>
              <p className="mt-1 flex min-w-0 items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/60">
                <MapPin size={12} className="shrink-0" /> <span className="truncate">{site.location}</span>
              </p>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setIsGalleryOpen(false)}
              className="h-11 w-11 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20"
              aria-label="Close photo viewer"
            >
              <X size={20} />
            </Button>
          </div>

          <div className="relative z-10 flex h-full items-center justify-center px-3 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-[calc(env(safe-area-inset-top)+6rem)] md:px-20 md:py-28">
            <div className="relative h-full max-h-[68vh] w-full max-w-6xl overflow-hidden rounded-[2rem] shadow-2xl ring-1 ring-white/25">
              <SafeImage
                src={allImages[activeImageIndex]}
                alt=""
                fill
                loading="eager"
                fallbackSrc={getImageFallbackSources(activeImageIndex)}
                fallbackClassName="object-cover"
                className="scale-110 object-cover blur-2xl"
                aria-hidden="true"
              />
              <SafeImage
                src={allImages[activeImageIndex]}
                alt={`${site.name} expanded photo ${activeImageIndex + 1}`}
                fill
                loading="eager"
                fallbackSrc={getImageFallbackSources(activeImageIndex)}
                fallbackClassName="object-contain"
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {allImages.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => goToImage('previous')}
                className="absolute left-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 md:left-8"
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => goToImage('next')}
                className="absolute right-4 top-1/2 z-20 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 md:right-8"
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </Button>
            </>
          )}

          <div className="absolute inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 rounded-[1.5rem] bg-white/10 p-3 backdrop-blur-xl ring-1 ring-white/10 md:inset-x-8 md:bottom-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <ScrollArea className="w-full whitespace-nowrap md:max-w-[70%]">
                <div className="flex w-max gap-2 pb-2">
                  {allImages.map((img, idx) => (
                    <button
                      key={img + idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={cn(
                        "relative h-14 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all",
                        activeImageIndex === idx ? "border-primary" : "border-white/20 opacity-60 hover:opacity-100"
                      )}
                      aria-label={`Open photo ${idx + 1}`}
                    >
                      <SafeImage src={img} alt={`${site.name} thumbnail ${idx + 1}`} fill fallbackSrc={getImageFallbackSources(idx)} fallbackClassName="object-cover" className="object-cover" />
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
              <div className="flex items-center gap-3">
                <div className="text-nowrap text-[10px] font-black uppercase tracking-widest text-white/60">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
                <Button asChild className="h-11 rounded-2xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white">
                  <Link href={`/discover?siteId=${site.id}`}>
                    <Route size={16} className="mr-2" /> View on Map
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

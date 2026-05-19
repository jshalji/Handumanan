'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { getSiteById, type HeritageSite } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Route, Heart, Loader2, ChevronDown, ChevronUp, Plus, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';
import NextImage from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SafeImage } from '@/components/ui/safe-image';

function mergeSiteRecord(baseSite: HeritageSite | undefined, overrideSite: any): HeritageSite | null {
  if (!baseSite && !overrideSite) return null;

  const merged = { ...(baseSite || {}), ...(overrideSite || {}) } as any;
  const rawCoords = merged.coordinates || { lat: merged.latitude, lng: merged.longitude };
  const latitude = Number(rawCoords?.lat);
  const longitude = Number(rawCoords?.lng);

  return {
    ...merged,
    id: merged.id,
    name: merged.name || 'Untitled Heritage Site',
    description: merged.description || 'No directory description has been added yet.',
    overview: merged.overview || merged.description || 'Overview details require verification.',
    significance: merged.significance || 'Historical significance details require verification.',
    category: merged.category || 'Historical Landmarks & Monuments',
    location: merged.location || 'Location requires verification',
    city: merged.city || 'Cebu City',
    visitingHours: merged.visitingHours || 'Open hours require verification',
    imageUrl: merged.imageUrl || 'https://picsum.photos/seed/handumanan-site/900/600',
    galleryImages: Array.isArray(merged.galleryImages) ? merged.galleryImages : [],
    rating: Number.isFinite(Number(merged.rating)) ? Number(merged.rating) : 4.5,
    tags: Array.isArray(merged.tags) ? merged.tags : [],
    coordinates: {
      lat: Number.isFinite(latitude) ? latitude : 0,
      lng: Number.isFinite(longitude) ? longitude : 0,
    },
    isMustVisit: Boolean(merged.isMustVisit),
    needsVerification: Boolean(merged.needsVerification),
    isActive: merged.isActive !== false,
    status: merged.status === 'Inactive' ? 'Inactive' : 'Active',
    demolitionStatus: merged.demolitionStatus || 'Non-Demolished',
    accessibilityStatus: merged.accessibilityStatus || 'Accessibility details require verification.',
  } as HeritageSite;
}

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const staticSite = getSiteById(id);
  const siteDocRef = useMemoFirebase(() => db ? doc(db, 'heritageSites', id) : null, [db, id]);
  const { data: dbSite, isLoading: isSiteRecordLoading } = useDoc(siteDocRef);
  const mergedSite = mergeSiteRecord(staticSite, dbSite);
  const site = mergedSite?.isActive === false || mergedSite?.status === 'Inactive' ? null : mergedSite;
  const isResolvingSite = !staticSite && isSiteRecordLoading;

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSignificanceExpanded, setIsSignificanceExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFavoriteUpdating, setIsFavoriteUpdating] = useState(false);

  // Combine main image and gallery images
  const allImages = site ? [site.imageUrl, ...(site.galleryImages || [])].filter(Boolean) : ["https://picsum.photos/seed/placeholder/800/600"];

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
    return query(
      collection(db, 'heritageSites', id, 'reviews'),
      orderBy('createdAt', 'desc')
    );
  }, [db, id]);
  const { data: reviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  // Fetch User Favorites status
  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'), where('siteId', '==', id));
  }, [db, user, id]);
  const { data: userFavorites } = useCollection(favoritesQuery);
  const isFavorited = (userFavorites?.length || 0) > 0;

  if (isResolvingSite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <NextImage src="/logo.png" alt="Handumanan" width={80} height={80} className="w-20 h-20 rounded-2xl opacity-30 mb-6" />
        <h2 className="text-2xl font-headline font-bold mb-4 text-slate-900">Site not found</h2>
        <Button asChild className="rounded-2xl"><Link href="/explore">Back to Directory</Link></Button>
      </div>
    );
  }

  const averageRating = reviews && reviews.length > 0 
    ? (reviews.reduce((acc, rev) => acc + (rev.rating || 0), 0) / reviews.length).toFixed(1)
    : site.rating.toFixed(1);

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
      userName: user.displayName || user.email?.split('@')[0],
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
                  <div className="flex items-center gap-1 text-yellow-500 font-black text-xs">
                     <Star size={12} fill="currentColor" /> {averageRating} / 5.0
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
                          <SafeImage src={img} alt={`${site.name} gallery photo ${idx + 1}`} fill className="object-cover transition-transform group-hover/thumb:scale-110" />
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

              {/* Reviews Section */}
              <section id="reviews">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-xl text-primary"><MessageSquare size={20} /></div>
                    <h2 className="font-headline text-2xl font-bold">Visitor Insights</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-3">{reviews?.length || 0} Reviews</Badge>
                </div>

                {user ? (
                  <form onSubmit={handleSubmitReview} className="mb-12 p-5 bg-slate-50/80 rounded-[2rem] border border-slate-100 shadow-inner sm:p-8">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-4">Rate your visit</p>
                    <div className="flex gap-3 mb-6">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button" onClick={() => setRating(s)} className={cn("p-1 transition-all hover:scale-110", rating >= s ? "text-yellow-500" : "text-slate-200")}>
                          <Star fill="currentColor" size={28} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Share a historical tip or your experience at this site..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      required 
                      className="mb-6 bg-white border-none rounded-2xl min-h-[120px] text-sm md:text-base focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm" 
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-14 px-10 font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-primary/20">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" size={16} /> : null} Post Experience
                    </Button>
                  </form>
                ) : (
                  <div className="mb-12 p-10 bg-primary/5 border-2 border-dashed border-primary/20 rounded-[2rem] text-center">
                    <p className="text-slate-600 mb-6 font-medium">Want to share your story? Sign in to leave a review.</p>
                    <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2">
                      <Link href="/auth">Sign In to Review</Link>
                    </Button>
                  </div>
                )}

                <div className="space-y-6">
                  {isReviewsLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
                  ) : reviews?.length ? (
                    reviews.map((rev: any) => (
                      <div key={rev.id} className="p-6 md:p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-lg shadow-sm">{rev.userName?.charAt(0)}</div>
                             <div>
                                <p className="font-black text-slate-900 text-sm md:text-base">{rev.userName}</p>
                                <div className="flex gap-0.5 text-yellow-500 mt-0.5">
                                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} fill={i < rev.rating ? "currentColor" : "none"} size={12} className={i < rev.rating ? "" : "text-slate-200"} />)}
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            {rev.createdAt?.toDate().toLocaleDateString() || 'Recent'}
                          </p>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-sm md:text-base italic">"{rev.comment}"</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 opacity-30 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                       <MessageSquare size={48} className="mx-auto mb-4" />
                       <p className="text-[12px] font-black uppercase tracking-widest">Be the first to review this site</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar / Access Info Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-xl border border-slate-100 sticky top-24 ring-1 ring-black/5">
              <h3 className="font-headline text-2xl font-bold mb-8 text-slate-900">Plan Your Visit</h3>
              
              <div className="space-y-8 mb-10">
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-slate-50 rounded-2xl text-primary shadow-sm"><MapPin size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Official Address</h4>
                    <p className="text-sm md:text-base font-bold text-slate-700 leading-tight">{site.location}</p>
                    <Link href={`/discover?siteId=${site.id}`} className="text-[9px] font-black text-primary uppercase mt-2 flex items-center gap-1 hover:underline">
                      Open in Map <Route size={10} />
                    </Link>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-slate-50 rounded-2xl text-primary shadow-sm"><Clock size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Visiting Hours</h4>
                    <p className="text-sm md:text-base font-bold text-slate-700 leading-tight">{site.visitingHours}</p>
                  </div>
                </div>
                <div className="flex items-start gap-5">
                  <div className="p-3 bg-slate-50 rounded-2xl text-primary shadow-sm"><Info size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1.5">Accessibility</h4>
                    <p className="text-sm md:text-base font-bold text-slate-700 leading-tight">{site.accessibilityStatus}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <Button className="w-full h-14 bg-primary rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-primary/30 active:scale-95 transition-all" asChild>
                  <Link href={`/discover?siteId=${site.id}`}>
                    <Route size={20} className="mr-2" /> Initialize Route
                  </Link>
                </Button>
                
                <Button 
                   variant="outline"
                   className="w-full h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 hover:bg-primary/5 active:scale-95 transition-all"
                   asChild
                >
                   <Link href="/discover">
                      <Plus size={18} className="mr-2" /> Add to Itinerary
                   </Link>
                </Button>

                <div className="grid grid-cols-1 gap-3 mt-2 sm:grid-cols-2 sm:gap-4">
                  <Button 
                    onClick={handleToggleFavorite} 
                    variant={isFavorited ? "default" : "secondary"} 
                    disabled={isFavoriteUpdating}
                    className={cn(
                      "h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all",
                      isFavorited ? "bg-accent text-white shadow-lg shadow-accent/20" : ""
                    )}
                  >
                    {isFavoriteUpdating ? (
                      <Loader2 size={18} className="mr-2 animate-spin" />
                    ) : (
                      <Heart size={18} className={cn("mr-2", isFavorited ? "fill-white" : "")} />
                    )}
                    {isFavorited ? 'Saved' : 'Favorite'}
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="h-14 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-200"
                    onClick={handleShare}
                  >
                    <Share2 size={18} className="mr-2" /> Share
                  </Button>
                </div>
              </div>
              
              <div className="mt-12 pt-8 border-t border-slate-100">
                <div className="flex flex-col items-center gap-2 opacity-40">
                   <NextImage src="/logo.png" alt="Handumanan" width={28} height={28} className="w-7 h-7 rounded-lg" />
                   <p className="text-[9px] font-black uppercase text-center tracking-[0.3em]">
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
                className="scale-110 object-cover blur-2xl"
                aria-hidden="true"
              />
              <SafeImage
                src={allImages[activeImageIndex]}
                alt={`${site.name} expanded photo ${activeImageIndex + 1}`}
                fill
                loading="eager"
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
                      <SafeImage src={img} alt={`${site.name} thumbnail ${idx + 1}`} fill className="object-cover" />
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

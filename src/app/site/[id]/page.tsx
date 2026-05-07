'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Navbar } from '@/components/layout/Navbar';
import { getSiteById } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Route, Heart, Loader2, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const site = getSiteById(id);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSignificanceExpanded, setIsSignificanceExpanded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Combine main image and gallery images
  const allImages = site ? [site.imageUrl, ...(site.galleryImages || [])].filter(Boolean) : [];

  const reviewsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'heritageSites', id, 'reviews'));
  }, [db, id]);
  const { data: reviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'), where('siteId', '==', id));
  }, [db, user, id]);
  const { data: userFavorites } = useCollection(favoritesQuery);
  const isFavorited = (userFavorites?.length || 0) > 0;

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <Landmark size={64} className="text-slate-200 mb-6" />
        <h2 className="text-2xl font-headline font-bold mb-4 text-slate-900">Site not found</h2>
        <Button asChild className="rounded-2xl"><Link href="/explore">Back to Directory</Link></Button>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (!user || !db) {
      toast({ title: "Login Required", description: "Please login to save favorites.", variant: "destructive" });
      return;
    }
    if (isFavorited) {
      toast({ title: "Already in Favorites", description: "This site is already in your collection." });
    } else {
      const favRef = doc(collection(db, 'users', user.uid, 'favorites'));
      setDocumentNonBlocking(favRef, {
        userId: user.uid,
        siteId: id,
        siteName: site.name,
        imageUrl: site.imageUrl,
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Added to Favorites", description: `${site.name} has been saved.` });
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;
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
    setIsSubmitting(false);
    toast({ title: "Review Submitted", description: "Your insights have been shared." });
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
        <Link href="/explore" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2" size={14} /> Site Directory
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-10">
            
            {/* Optimized Header & Image Section */}
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-widest px-3">
                    {site.category}
                  </Badge>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <MapPin size={10} /> {site.city}
                  </span>
                </div>
                <h1 className="font-headline text-4xl md:text-5xl font-bold text-slate-900 leading-tight">
                  {site.name}
                </h1>
              </div>

              {/* Responsive Gallery */}
              <div className="space-y-4">
                <div className="relative h-[220px] md:h-[320px] w-full rounded-3xl overflow-hidden shadow-lg border bg-slate-100">
                  <Image 
                    src={allImages[activeImageIndex]} 
                    alt={site.name} 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
                
                {allImages.length > 1 && (
                  <ScrollArea className="w-full whitespace-nowrap rounded-lg">
                    <div className="flex w-max space-x-3 pb-2">
                      {allImages.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setActiveImageIndex(idx)}
                          className={cn(
                            "relative h-16 w-24 rounded-xl overflow-hidden border-2 transition-all shrink-0",
                            activeImageIndex === idx ? "border-primary scale-95" : "border-transparent opacity-60 hover:opacity-100"
                          )}
                        >
                          <Image src={img} alt={`Gallery ${idx}`} fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                )}
              </div>
            </div>

            {/* Information Sections */}
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border space-y-10">
              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Info size={18} className="text-primary" />
                  <h2 className="font-headline text-2xl font-bold">Overview</h2>
                </div>
                <div className="space-y-4">
                  <p className={cn(
                    "text-slate-600 leading-relaxed whitespace-pre-wrap",
                    !isDescExpanded && "line-clamp-5"
                  )}>
                    {site.overview}
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary font-black uppercase text-[10px] p-0 h-auto"
                  >
                    {isDescExpanded ? 'Show Less' : 'Read Full Overview'}
                  </Button>
                </div>
              </section>

              <Separator />

              <section>
                <div className="flex items-center gap-3 mb-4">
                  <Landmark size={18} className="text-primary" />
                  <h2 className="font-headline text-2xl font-bold">Historical Significance</h2>
                </div>
                <div className="space-y-4">
                  <p className={cn(
                    "text-slate-600 leading-relaxed italic whitespace-pre-wrap",
                    !isSignificanceExpanded && "line-clamp-5"
                  )}>
                    {site.significance}
                  </p>
                  <Button 
                    variant="link" 
                    onClick={() => setIsSignificanceExpanded(!isSignificanceExpanded)}
                    className="text-primary font-black uppercase text-[10px] p-0 h-auto"
                  >
                    {isSignificanceExpanded ? 'Show Less' : 'Read More Significance'}
                  </Button>
                </div>
              </section>

              <Separator />

              {/* Reviews Section */}
              <section>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare size={18} className="text-primary" />
                    <h2 className="font-headline text-2xl font-bold">Visitor Insights</h2>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">{reviews?.length || 0} Reviews</Badge>
                </div>

                {user ? (
                  <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-slate-50 rounded-2xl border-none ring-1 ring-black/5">
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button" onClick={() => setRating(s)} className={cn("p-0.5 transition-all", rating >= s ? "text-yellow-500 scale-110" : "text-slate-200")}>
                          <Star fill="currentColor" size={20} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Share your experience or a historical tip..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      required 
                      className="mb-4 bg-white border-none rounded-xl min-h-[100px] text-sm focus-visible:ring-primary/20" 
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-8 font-black uppercase text-[10px] tracking-widest shadow-md">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" size={14} /> : null} Post Review
                    </Button>
                  </form>
                ) : (
                  <div className="mb-8 p-6 bg-primary/5 border border-dashed border-primary/20 rounded-2xl text-center">
                    <p className="text-slate-600 mb-4 text-sm">Please sign in to share a review.</p>
                    <Button asChild variant="outline" size="sm" className="rounded-xl font-black uppercase text-[10px] border-2"><Link href="/auth">Sign In</Link></Button>
                  </div>
                )}

                <div className="space-y-4">
                  {isReviewsLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
                  ) : reviews?.length ? (
                    reviews.map((rev: any) => (
                      <div key={rev.id} className="p-5 bg-white rounded-xl border shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black uppercase text-xs">{rev.userName?.charAt(0)}</div>
                             <div>
                                <p className="text-xs font-bold text-slate-900">{rev.userName}</p>
                                <div className="flex gap-0.5 text-yellow-500">
                                  {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} fill="currentColor" size={10} />)}
                                </div>
                             </div>
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tight">
                            {rev.createdAt?.toDate().toLocaleDateString() || 'Recent'}
                          </p>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 opacity-30">
                       <MessageSquare size={32} className="mx-auto mb-2" />
                       <p className="text-[10px] font-bold uppercase tracking-widest">No reviews yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Sidebar / Access Info Area */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-[2rem] p-8 shadow-md border sticky top-24">
              <h3 className="font-headline text-xl font-bold mb-6">Plan Your Visit</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-primary"><MapPin size={20} /></div>
                  <div>
                    <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest mb-1">Address</h4>
                    <p className="text-sm font-medium text-slate-700 leading-tight">{site.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-50 rounded-xl text-primary"><Clock size={20} /></div>
                  <div>
                    <h4 className="font-black text-[9px] text-slate-400 uppercase tracking-widest mb-1">Visiting Hours</h4>
                    <p className="text-sm font-medium text-slate-700 leading-tight">{site.visitingHours}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-12 bg-primary rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20" asChild>
                  <Link href={`/discover?siteId=${site.id}`}>
                    <Route size={16} className="mr-2" /> Initialize Route
                  </Link>
                </Button>
                
                <Button 
                   variant="outline"
                   className="w-full h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-2"
                   asChild
                >
                   <Link href="/discover">
                      <Plus size={16} className="mr-2" /> Add to Itinerary
                   </Link>
                </Button>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <Button 
                    onClick={handleToggleFavorite} 
                    variant={isFavorited ? "default" : "secondary"} 
                    className={cn(
                      "h-12 rounded-xl font-black uppercase text-[10px] tracking-widest",
                      isFavorited ? "bg-accent text-white" : ""
                    )}
                  >
                    <Heart size={16} className={cn("mr-2", isFavorited ? "fill-white" : "")} />
                    {isFavorited ? 'Saved' : 'Save'}
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    className="h-12 rounded-xl font-black uppercase text-[10px] tracking-widest"
                    onClick={handleShare}
                  >
                    <Share2 size={16} className="mr-2" /> Share
                  </Button>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t">
                <p className="text-[10px] text-slate-400 font-bold uppercase text-center tracking-widest">
                  Heritage Reference ID: {site.id}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

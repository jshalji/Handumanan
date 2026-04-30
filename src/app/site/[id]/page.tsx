'use client';

import { use, useState, useEffect } from 'react';
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
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Route, Heart, Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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

  // Combine main image and gallery images for the carousel
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
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Site not found</h2>
        <Button asChild><Link href="/explore">Back to Explore</Link></Button>
      </div>
    );
  }

  const handleToggleFavorite = () => {
    if (!user || !db) {
      toast({ title: "Login Required", description: "Please login to save favorites.", variant: "destructive" });
      return;
    }
    if (isFavorited) {
      toast({ title: "Already in Favorites", description: "This site is in your collection." });
    } else {
      const favRef = doc(collection(db, 'users', user.uid, 'favorites'));
      setDocumentNonBlocking(favRef, {
        userId: user.uid,
        siteId: id,
        siteName: site.name,
        imageUrl: site.imageUrl,
        createdAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Added to Favorites", description: `${site.name} saved.` });
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
    toast({ title: "Review Submitted", description: "Thank you for your feedback!" });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Header section */}
      <div className="bg-slate-900 pt-16 pb-12 md:pt-24 md:pb-16 text-white overflow-hidden">
        <div className="container mx-auto px-4">
          <Link href="/explore" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="mr-2" size={18} /> Back to directory
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-primary hover:bg-primary text-white border-none px-3 py-1">{site.category}</Badge>
            {site.isMustVisit && <Badge variant="secondary" className="bg-accent text-white border-none px-3 py-1">Must Visit</Badge>}
            <div className="flex items-center gap-1 text-yellow-400 bg-white/10 backdrop-blur px-2 py-1 rounded">
              <Star size={14} fill="currentColor" />
              <span className="text-sm font-bold">{site.rating}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="space-y-4 max-w-3xl">
              <h1 className="font-headline text-4xl md:text-6xl font-bold leading-tight">{site.name}</h1>
              <div className="flex flex-wrap items-center gap-6 text-white/70">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  <span className="text-lg">{site.location}, {site.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={20} className="text-primary" />
                  <span className="text-lg">{site.visitingHours}</span>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleToggleFavorite} 
              variant={isFavorited ? "default" : "outline"} 
              className={cn(
                "rounded-full h-14 px-6 border-white/20 font-bold shrink-0", 
                isFavorited ? "bg-accent text-white" : "bg-white/5 backdrop-blur text-white hover:bg-white/10"
              )}
            >
              <Heart size={20} className={cn("mr-2", isFavorited ? "fill-white" : "")} />
              {isFavorited ? 'Saved' : 'Save to Favorites'}
            </Button>
          </div>

          {/* Image Gallery Carousel */}
          {allImages.length > 0 && (
            <div className="mt-12 relative">
              <Carousel className="w-full max-w-5xl mx-auto group">
                <CarouselContent className="-ml-4">
                  {allImages.map((img, index) => (
                    <CarouselItem key={index} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                      <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10 bg-slate-800">
                        <Image 
                          src={img} 
                          alt={`${site.name} - image ${index + 1}`} 
                          fill 
                          className="object-cover transition-transform duration-700 hover:scale-110"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          data-ai-hint="heritage site"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden md:block">
                  <CarouselPrevious className="left-0 -translate-x-1/2 bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/20" />
                  <CarouselNext className="right-0 translate-x-1/2 bg-white/10 backdrop-blur-md border-none text-white hover:bg-white/20" />
                </div>
              </Carousel>
              <div className="flex justify-center gap-2 mt-4 md:hidden">
                 <div className="flex gap-1">
                    {allImages.map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/20" />
                    ))}
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            
            {/* Overview with Expandable Text */}
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3 text-primary">
                <Info size={28} /> Overview
              </h2>
              <div className="space-y-4">
                <p className={cn(
                  "text-lg leading-relaxed text-slate-700 transition-all duration-500",
                  !isDescExpanded && "line-clamp-3"
                )}>
                  {site.description}
                </p>
                <Button 
                  variant="ghost" 
                  onClick={() => setIsDescExpanded(!isDescExpanded)}
                  className="text-primary font-bold p-0 h-auto hover:bg-transparent hover:underline flex items-center gap-2"
                >
                  {isDescExpanded ? (
                    <><ChevronUp size={18} /> Show Less</>
                  ) : (
                    <><ChevronDown size={18} /> Read More</>
                  )}
                </Button>
              </div>
            </section>

            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h2 className="font-headline text-2xl font-bold mb-4 flex items-center gap-3 text-primary">
                <Landmark size={24} /> Historical Significance
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed italic">"{site.significance}"</p>
            </section>
            
            <Separator />
            
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="text-primary" /> Community Feedback
              </h2>
              {user ? (
                <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-slate-50 rounded-2xl border">
                  <h4 className="font-bold mb-4">Leave a Review</h4>
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(s => (
                      <button key={s} type="button" onClick={() => setRating(s)} className={cn("p-1", rating >= s ? "text-yellow-500" : "text-slate-300")}>
                        <Star fill="currentColor" size={24} />
                      </button>
                    ))}
                  </div>
                  <Textarea placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} required className="mb-4 bg-white" />
                  <Button type="submit" disabled={isSubmitting} className="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Submit Review
                  </Button>
                </form>
              ) : (
                <div className="mb-8 p-8 bg-primary/5 border border-dashed border-primary/20 rounded-2xl text-center">
                  <p className="text-muted-foreground mb-6">You must be logged in to leave a review and share your insights.</p>
                  <Button asChild variant="outline" className="rounded-full h-11 px-8 font-bold"><Link href="/auth">Login to Review</Link></Button>
                </div>
              )}
              <div className="space-y-4">
                {isReviewsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : reviews?.length ? (
                  reviews.map((rev: any) => (
                    <div key={rev.id} className="p-6 bg-white rounded-2xl border shadow-sm">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-bold text-sm">{rev.userName}</p>
                          <div className="flex gap-0.5 text-yellow-500 mt-1">
                            {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} fill="currentColor" size={12} />)}
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
                          {rev.createdAt?.toDate().toLocaleDateString() || 'Recently'}
                        </p>
                      </div>
                      <p className="text-slate-600 leading-relaxed mt-4">{rev.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-10 text-muted-foreground italic">No feedback yet. Be the first to share your experience!</p>
                )}
              </div>
            </section>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-primary/5 sticky top-24">
              <h3 className="font-headline text-2xl font-bold mb-6">Quick Navigation</h3>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0"><MapPin size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1">Official Address</h4>
                    <p className="font-medium text-slate-700">{site.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0"><Clock size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1">Visiting Hours</h4>
                    <p className="font-medium text-slate-700">{site.visitingHours}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button className="w-full h-14 bg-primary rounded-2xl font-bold shadow-xl shadow-primary/20" asChild>
                  <Link href={`/discover?siteId=${site.id}`}>
                    <Route size={20} className="mr-2" /> Start Navigation
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-14 rounded-2xl font-bold border-2">
                  <Share2 size={20} className="mr-2" /> Share Heritage Site
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

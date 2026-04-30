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
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Route, Heart, Loader2, ChevronDown, ChevronUp, Image as ImageIcon, Plus } from 'lucide-react';
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
  const [isSignificanceExpanded, setIsSignificanceExpanded] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 font-body">
      <Navbar />
      
      {/* Header section with text-focus design */}
      <div className="bg-slate-900 pt-16 pb-16 text-white relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <Link href="/explore" className="inline-flex items-center text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-10 transition-colors">
            <ArrowLeft className="mr-2" size={16} /> Directory
          </Link>
          
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <Badge className="bg-primary hover:bg-primary text-white border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest">{site.category}</Badge>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
               <MapPin size={12} className="text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest">{site.city}</span>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
            <div className="space-y-4 max-w-4xl">
              <h1 className="font-headline text-5xl md:text-7xl font-bold leading-tight animate-in fade-in slide-in-from-bottom-4">{site.name}</h1>
            </div>
            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <Button 
                onClick={handleToggleFavorite} 
                variant={isFavorited ? "default" : "outline"} 
                className={cn(
                  "rounded-2xl h-14 px-8 border-white/20 font-black uppercase text-[10px] tracking-widest transition-all", 
                  isFavorited ? "bg-accent text-white" : "bg-white/5 backdrop-blur text-white hover:bg-white/10"
                )}
              >
                <Heart size={18} className={cn("mr-2", isFavorited ? "fill-white" : "")} />
                {isFavorited ? 'Saved' : 'Save Site'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            
            {/* Gallery with aspect ratio fix */}
            {allImages.length > 0 && (
              <div className="bg-white rounded-[2.5rem] p-4 shadow-xl ring-1 ring-black/5 animate-in fade-in duration-700">
                <Carousel className="w-full">
                  <CarouselContent>
                    {allImages.map((img, index) => (
                      <CarouselItem key={index} className="basis-full">
                        <div className="relative aspect-[16/9] md:aspect-[21/9] rounded-[2rem] overflow-hidden bg-slate-50 flex items-center justify-center">
                          <Image 
                            src={img} 
                            alt={site.name} 
                            fill 
                            className="object-contain" // User requested 'contain' for detail view
                            priority={index === 0}
                            data-ai-hint="heritage landmark"
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <div className="hidden md:block">
                    <CarouselPrevious className="left-6 bg-white/80 border-none h-12 w-12" />
                    <CarouselNext className="right-6 bg-white/80 border-none h-12 w-12" />
                  </div>
                </Carousel>
              </div>
            )}

            {/* Content Sections */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl ring-1 ring-black/5 space-y-12">
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl"><Info size={20} /></div>
                  <h2 className="font-headline text-3xl font-bold">Overview</h2>
                </div>
                <div className="space-y-4">
                  <p className={cn(
                    "text-lg leading-relaxed text-slate-700 transition-all duration-500 whitespace-pre-wrap",
                    !isDescExpanded && "line-clamp-4"
                  )}>
                    {site.overview}
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-primary font-black uppercase text-[10px] tracking-widest p-0 h-auto hover:bg-transparent hover:text-primary/80 flex items-center gap-2"
                  >
                    {isDescExpanded ? (
                      <><ChevronUp size={16} /> Show Less</>
                    ) : (
                      <><ChevronDown size={16} /> Read More</>
                    )}
                  </Button>
                </div>
              </section>

              <Separator className="bg-slate-100" />

              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl"><Landmark size={20} /></div>
                  <h2 className="font-headline text-3xl font-bold">Historical Significance</h2>
                </div>
                <div className="space-y-4">
                  <p className={cn(
                    "text-lg leading-relaxed text-slate-600 italic transition-all duration-500 whitespace-pre-wrap",
                    !isSignificanceExpanded && "line-clamp-4"
                  )}>
                    {site.significance}
                  </p>
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSignificanceExpanded(!isSignificanceExpanded)}
                    className="text-primary font-black uppercase text-[10px] tracking-widest p-0 h-auto hover:bg-transparent hover:text-primary/80 flex items-center gap-2"
                  >
                    {isSignificanceExpanded ? (
                      <><ChevronUp size={16} /> Show Less</>
                    ) : (
                      <><ChevronDown size={16} /> Read More</>
                    )}
                  </Button>
                </div>
              </section>

              <Separator className="bg-slate-100" />
              
              <section>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-xl"><MessageSquare size={20} /></div>
                    <h2 className="font-headline text-3xl font-bold">Visitor Feedback</h2>
                  </div>
                  <Badge variant="outline" className="rounded-full border-slate-200 text-slate-400 font-bold">{reviews?.length || 0} Reviews</Badge>
                </div>

                {user ? (
                  <form onSubmit={handleSubmitReview} className="mb-10 p-8 bg-slate-50 rounded-[2rem] border-none ring-1 ring-black/5">
                    <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-6">Contribute to the Archive</h4>
                    <div className="flex gap-2 mb-6">
                      {[1, 2, 3, 4, 5].map(s => (
                        <button key={s} type="button" onClick={() => setRating(s)} className={cn("p-1 transition-all", rating >= s ? "text-yellow-500 scale-110" : "text-slate-200")}>
                          <Star fill="currentColor" size={28} />
                        </button>
                      ))}
                    </div>
                    <Textarea 
                      placeholder="Share your personal or historical insights..." 
                      value={comment} 
                      onChange={(e) => setComment(e.target.value)} 
                      required 
                      className="mb-6 bg-white border-none rounded-2xl min-h-[120px] p-4 text-base focus-visible:ring-primary/20" 
                    />
                    <Button type="submit" disabled={isSubmitting} className="rounded-2xl h-14 px-10 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                      {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Publish Review
                    </Button>
                  </form>
                ) : (
                  <div className="mb-10 p-10 bg-primary/5 border border-dashed border-primary/20 rounded-[2rem] text-center">
                    <p className="text-slate-600 mb-6 font-medium">Authentication is required to contribute feedback.</p>
                    <Button asChild variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-[10px] tracking-widest border-2 border-primary/20 hover:bg-primary/5"><Link href="/auth">Authenticate Account</Link></Button>
                  </div>
                )}

                <div className="space-y-6">
                  {isReviewsLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                  ) : reviews?.length ? (
                    reviews.map((rev: any) => (
                      <div key={rev.id} className="p-8 bg-white rounded-[2rem] border-none ring-1 ring-black/5 shadow-sm animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary font-black uppercase text-xs">{rev.userName?.charAt(0)}</div>
                             <div>
                                <p className="font-bold text-slate-900">{rev.userName}</p>
                                <div className="flex gap-0.5 text-yellow-500 mt-1">
                                  {Array.from({ length: rev.rating }).map((_, i) => <Star key={i} fill="currentColor" size={12} />)}
                                </div>
                             </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {rev.createdAt?.toDate().toLocaleDateString() || 'Recent'}
                          </p>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 opacity-30">
                       <MessageSquare size={48} className="mx-auto mb-4" />
                       <p className="text-sm font-bold uppercase tracking-widest">No archival feedback yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
          
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl ring-1 ring-black/5 sticky top-28 animate-in slide-in-from-right-4">
              <h3 className="font-headline text-3xl font-bold mb-8">Access Information</h3>
              <div className="space-y-8 mb-10">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0"><MapPin size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1">Geographic Address</h4>
                    <p className="font-bold text-slate-700 leading-tight">{site.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-2xl text-primary shrink-0"><Clock size={24} /></div>
                  <div>
                    <h4 className="font-black text-[10px] text-slate-400 uppercase tracking-widest mb-1">Observation Hours</h4>
                    <p className="font-bold text-slate-700 leading-tight">{site.visitingHours}</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                <Button className="w-full h-16 bg-primary rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform" asChild>
                  <Link href={`/discover?siteId=${site.id}`}>
                    <Route size={20} className="mr-3" /> Initialize Route
                  </Link>
                </Button>
                <Button 
                   className="w-full h-16 bg-accent text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-accent/20 hover:scale-[1.02] transition-transform"
                   asChild
                >
                   <Link href="/discover">
                      <Plus size={20} className="mr-3" /> Add to Itinerary
                   </Link>
                </Button>
                <Button variant="outline" className="w-full h-16 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border-2 border-slate-100 hover:bg-slate-50 transition-all">
                  <Share2 size={20} className="mr-3" /> Share Record
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

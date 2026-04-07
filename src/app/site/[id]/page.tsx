'use client';

import { use, useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { getSiteById } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, serverTimestamp, doc } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Navigation, Heart, Loader2, Route } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const site = getSiteById(id);
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      
      <div className="relative h-[60vh] w-full">
        <Image src={site.imageUrl} alt={site.name} fill className="object-cover brightness-75" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container mx-auto">
            <Link href="/explore" className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft className="mr-2" size={20} /> Back to explore
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-primary hover:bg-primary text-white border-none px-3 py-1">{site.category}</Badge>
              {site.isMustVisit && <Badge variant="secondary" className="bg-accent text-white border-none px-3 py-1">Must Visit</Badge>}
              <div className="flex items-center gap-1 text-yellow-400 bg-black/20 backdrop-blur px-2 py-1 rounded">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold">{site.rating}</span>
              </div>
            </div>
            <div className="flex justify-between items-end gap-4">
              <h1 className="font-headline text-4xl md:text-6xl font-bold text-white mb-4">{site.name}</h1>
              <Button onClick={handleToggleFavorite} variant={isFavorited ? "default" : "outline"} className={cn("rounded-full h-12 w-12 p-0 border-white/20", isFavorited ? "bg-accent" : "bg-white/10 backdrop-blur text-white hover:bg-white/20")}>
                <Heart size={24} className={isFavorited ? "fill-white" : ""} />
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-2"><MapPin size={20} className="text-primary" /><span>{site.location}, {site.city}</span></div>
              <div className="flex items-center gap-2"><Clock size={20} className="text-primary" /><span>{site.visitingHours}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3 text-primary"><Info size={28} /> Overview</h2>
              <p className="text-lg leading-relaxed text-slate-700">{site.description}</p>
            </section>
            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h2 className="font-headline text-2xl font-bold mb-4 flex items-center gap-3 text-primary"><Landmark size={24} /> Historical Significance</h2>
              <p className="text-slate-600 leading-relaxed italic">"{site.significance}"</p>
            </section>
            <Separator />
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3"><MessageSquare className="text-primary" /> Community Feedback</h2>
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
                  <Textarea placeholder="Share your experience..." value={comment} onChange={(e) => setComment(e.target.value)} required className="mb-4" />
                  <Button type="submit" disabled={isSubmitting} className="rounded-full px-8">
                    {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null} Submit Review
                  </Button>
                </form>
              ) : (
                <div className="mb-8 p-6 bg-primary/5 border border-dashed rounded-2xl text-center">
                  <p className="text-sm text-muted-foreground mb-4">You must be logged in to leave a review.</p>
                  <Button asChild variant="outline" size="sm" className="rounded-full"><Link href="/auth">Login to Review</Link></Button>
                </div>
              )}
              <div className="space-y-4">
                {isReviewsLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div> : reviews?.map((rev: any) => (
                  <div key={rev.id} className="p-6 bg-white rounded-2xl border shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div><p className="font-bold text-sm">{rev.userName}</p><div className="flex gap-0.5 text-yellow-500 mt-1">{Array.from({ length: rev.rating }).map((_, i) => <Star key={i} fill="currentColor" size={12} />)}</div></div>
                      <p className="text-[10px] text-muted-foreground">{rev.createdAt?.toDate().toLocaleDateString() || 'Just now'}</p>
                    </div>
                    <p className="text-sm text-slate-600">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-primary/5 sticky top-24">
              <h3 className="font-headline text-2xl font-bold mb-6">In-App Navigation</h3>
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><MapPin size={24} /></div>
                  <div><h4 className="font-bold text-sm text-muted-foreground uppercase">Address</h4><p className="font-medium">{site.location}</p></div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><Clock size={24} /></div>
                  <div><h4 className="font-bold text-sm text-muted-foreground uppercase">Hours</h4><p className="font-medium">{site.visitingHours}</p></div>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <Button className="w-full h-12 bg-primary rounded-full font-bold" asChild>
                  <Link href={`/discover`}>
                    <Route size={18} className="mr-2" /> Start Navigation
                  </Link>
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-full font-bold">
                  <Share2 size={18} className="mr-2" /> Share Site
                </Button>
              </div>
              <p className="mt-4 text-[10px] text-center text-muted-foreground">Navigate directly within Handumanan using our built-in routing system.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

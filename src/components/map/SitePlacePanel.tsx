'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SafeImage } from '@/components/ui/safe-image';
import { getSiteImageFallback, getSiteImageSources } from '@/lib/site-images';
import { getDailyVisitingTime, WEEKLY_VISITING_DAYS } from '@/lib/visiting-hours';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import {
  Star,
  MapPin,
  Clock,
  Route,
  Plus,
  Check,
  ExternalLink,
  MessageSquare,
  Ticket,
  Info,
  X,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Landmark
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SitePlacePanelProps {
  site: any | null;
  userLocation: { lat: number; lng: number } | null;
  isInItinerary: boolean;
  onClose: () => void;
  onInitializeRoute: (site: any) => void;
  onToggleItinerary: (siteId: string) => void;
  isMobile?: boolean;
}

function formatReviewDate(createdAt: any) {
  if (!createdAt) return 'Recent';
  try {
    const date = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}m ago`;
  } catch {
    return 'Recent';
  }
}

function StarRatingDisplay({ rating, count }: { rating: number; count?: number }) {
  const rounded = Math.round(rating * 2) / 2;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={cn(
              star <= rounded
                ? 'fill-amber-400 text-amber-400'
                : star - 0.5 === rounded
                ? 'fill-amber-400/50 text-amber-400'
                : 'text-slate-300'
            )}
          />
        ))}
      </div>
      <span className="text-xs font-black text-slate-900">{rating.toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-[10px] font-bold text-slate-400">({count})</span>
      )}
    </div>
  );
}

export default function SitePlacePanel({
  site,
  userLocation: _userLocation,
  isInItinerary,
  onClose,
  onInitializeRoute,
  onToggleItinerary,
  isMobile = false,
}: SitePlacePanelProps) {
  const db = useFirestore();
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const siteId = site?.id;

  // Fetch Firestore reviews (single source of truth with directory & details page)
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !siteId) return null;
    return query(
      collection(db, 'heritageSites', siteId, 'reviews'),
      orderBy('createdAt', 'desc')
    );
  }, [db, siteId]);
  const { data: reviews, isLoading: isReviewsLoading } = useCollection(reviewsQuery);

  const averageRatingNumber = useMemo(() => {
    if (reviews && reviews.length > 0) {
      const sum = reviews.reduce((acc, rev) => acc + (Number(rev.rating) || 0), 0);
      return Math.round((sum / reviews.length) * 10) / 10;
    }
    return Number.isFinite(Number(site?.rating)) ? Number(site.rating) : 4.5;
  }, [reviews, site?.rating]);

  const totalReviews = reviews ? reviews.length : 0;

  const ratingCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviews && reviews.length > 0) {
      reviews.forEach((rev) => {
        const r = Math.min(5, Math.max(1, Math.round(Number(rev.rating) || 5)));
        counts[r as keyof typeof counts]++;
      });
    }
    return counts;
  }, [reviews]);

  if (!site) return null;

  const imageSources = getSiteImageSources(site);
  const fallbackImage = getSiteImageFallback(site);
  const mainImage = imageSources[0] || fallbackImage;

  const renderContent = () => (
    <div className="flex flex-col h-full bg-white text-slate-900 overflow-hidden select-none">
      {/* IMAGE BANNER */}
      <div className="relative h-48 sm:h-52 w-full shrink-0 bg-slate-900 overflow-hidden">
        <SafeImage
          src={mainImage}
          alt={site.name}
          fill
          fallbackSrc={[fallbackImage]}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />
        
        {/* Floating Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/60 text-white backdrop-blur-md transition-all hover:bg-slate-950/90 active:scale-95 cursor-pointer"
          aria-label="Close place preview"
        >
          <X size={18} />
        </button>

        {/* Floating Badges */}
        <div className="absolute bottom-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-white/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-primary shadow-sm backdrop-blur-sm">
              {site.city}
            </span>
            {site.isMustVisit && (
              <span className="rounded-full bg-accent px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-sm">
                Must Visit
              </span>
            )}
            {site.verificationStatus === 'LGU Verified' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white shadow-sm backdrop-blur-sm">
                <CheckCircle2 size={10} /> Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* HEADER & BASIC SITE INFO */}
      <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 space-y-2">
        <div className="space-y-1">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
            {site.category}
          </p>
          <h2 className="text-xl sm:text-2xl font-headline font-black text-slate-950 leading-tight">
            {site.name}
          </h2>
        </div>

        {/* Rating Summary Header */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <StarRatingDisplay rating={averageRatingNumber} count={totalReviews} />
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
            <MapPin size={12} className="text-primary shrink-0" />
            <span className="truncate max-w-[180px]">{site.location || site.city}</span>
          </div>
        </div>

        {/* MAIN ACTIONS */}
        <div className="grid grid-cols-3 gap-2 pt-3">
          <Button
            type="button"
            onClick={() => onInitializeRoute(site)}
            className="h-11 rounded-2xl bg-primary text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:bg-primary/90 active:scale-95 transition-all"
          >
            <Route size={15} className="mr-1.5 shrink-0" /> Directions
          </Button>

          <Button
            type="button"
            asChild
            variant="outline"
            className="h-11 rounded-2xl border-slate-200 bg-white text-[10px] font-black uppercase tracking-widest text-slate-800 hover:bg-slate-50 active:scale-95 transition-all"
          >
            <Link href={`/site/${site.id}`}>
              <ExternalLink size={15} className="mr-1.5 shrink-0" /> Details
            </Link>
          </Button>

          <Button
            type="button"
            onClick={() => onToggleItinerary(site.id)}
            variant={isInItinerary ? "secondary" : "default"}
            className={cn(
              "h-11 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all",
              isInItinerary
                ? "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20"
                : "bg-slate-900 text-white hover:bg-slate-800"
            )}
          >
            {isInItinerary ? (
              <>
                <Check size={15} className="mr-1.5 shrink-0" /> In Trip
              </>
            ) : (
              <>
                <Plus size={15} className="mr-1.5 shrink-0" /> Add Trip
              </>
            )}
          </Button>
        </div>
      </div>

      {/* SCROLLABLE OVERVIEW & REVIEWS */}
      <ScrollArea className="flex-1 px-4 sm:px-5 py-4 space-y-6">
        <div className="space-y-6 pb-6">
          {/* OVERVIEW SECTION */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
              <Info size={15} className="text-primary" /> Overview
            </div>
            
            <p className={cn(
              "text-xs leading-relaxed text-slate-600 transition-all",
              !isOverviewExpanded && "line-clamp-3"
            )}>
              {site.overview || site.description}
            </p>
            
            {(site.overview || site.description || '').length > 140 && (
              <button
                type="button"
                onClick={() => setIsOverviewExpanded(!isOverviewExpanded)}
                className="text-[10px] font-black text-primary uppercase tracking-widest inline-flex items-center gap-1 hover:underline"
              >
                {isOverviewExpanded ? 'Show Less' : 'Read Full Overview'}
              </button>
            )}

            {/* Historical Significance Box */}
            {site.significance && (
              <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary">
                  <Landmark size={12} /> Historical Value
                </div>
                <p className="text-[11px] leading-relaxed italic text-slate-600">
                  &ldquo;{site.significance}&rdquo;
                </p>
              </div>
            )}

            {/* Quick Details Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <Clock size={12} className="text-primary" /> Hours
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">{site.visitingHours}</p>
                <button
                  type="button"
                  onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                  className="text-[9px] font-black text-slate-500 hover:text-primary inline-flex items-center gap-0.5 mt-0.5"
                >
                  Schedule {isHoursExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <Ticket size={12} className="text-primary" /> Admission
                </div>
                <p className="text-xs font-bold text-slate-800 truncate">{site.entranceFee || 'Free Admission'}</p>
              </div>
            </div>

            {isHoursExpanded && (
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1 text-[10px] animate-in fade-in-50">
                <p className="font-black text-[9px] uppercase tracking-widest text-slate-400 mb-1">Weekly Visiting Days</p>
                {WEEKLY_VISITING_DAYS.map(({ abbr, day }) => (
                  <div key={day} className="flex justify-between items-center py-0.5">
                    <span className="font-bold text-slate-700">{day} ({abbr}):</span>
                    <span className="text-slate-500 font-medium">{getDailyVisitingTime(site.visitingHours)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <hr className="border-slate-100" />

          {/* VISITOR REVIEWS SECTION */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-900">
                <MessageSquare size={15} className="text-primary" /> Visitor Reviews
              </div>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                Community Feed
              </Badge>
            </div>

            {/* Rating Breakdown Card */}
            <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 space-y-3">
              <div className="flex items-center gap-4">
                <div className="text-center shrink-0 pr-3 border-r border-slate-200">
                  <p className="text-3xl font-headline font-black text-slate-900 leading-none">
                    {averageRatingNumber.toFixed(1)}
                  </p>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">out of 5</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5, 4, 3, 2, 1].map((starLevel) => {
                    const count = ratingCounts[starLevel as keyof typeof ratingCounts];
                    const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                    return (
                      <div key={starLevel} className="flex items-center gap-2 text-[10px]">
                        <span className="w-3 text-right font-bold text-slate-500">{starLevel}</span>
                        <Star size={10} className="fill-amber-400 text-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="w-4 text-right font-medium text-slate-400">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Recent Reviews List */}
            {isReviewsLoading ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                Loading visitor reviews...
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.slice(0, 4).map((rev) => (
                  <div key={rev.id} className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 font-headline text-xs font-black text-primary">
                          {(rev.userName || 'V').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 leading-tight">
                            {rev.userName || 'Visitor'}
                          </p>
                          <p className="text-[9px] font-bold text-slate-400">
                            {formatReviewDate(rev.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-amber-400">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={11}
                            className={cn(
                              s <= Math.round(Number(rev.rating) || 5)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            )}
                          />
                        ))}
                      </div>
                    </div>
                    {rev.comment && (
                      <p className="text-xs leading-relaxed text-slate-600 font-medium">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">No visitor reviews yet</p>
                <p className="text-[10px] text-slate-500">
                  Be the first to share your experience on the site details page!
                </p>
              </div>
            )}

            {/* Link to details reviews */}
            <Button
              type="button"
              asChild
              variant="outline"
              className="w-full h-10 rounded-2xl border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50"
            >
              <Link href={`/site/${site.id}#reviews`}>
                View All Reviews & Contribute
              </Link>
            </Button>
          </section>
        </div>
      </ScrollArea>
    </div>
  );

  // MOBILE: COMPACT BOTTOM SHEET
  if (isMobile) {
    return (
      <Sheet open={Boolean(site)} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent
          side="bottom"
          className="h-[84dvh] max-h-[820px] p-0 rounded-t-[2.5rem] bg-white border-none shadow-3xl overflow-hidden flex flex-col z-[1002]"
        >
          <SheetTitle className="sr-only">{site.name} preview</SheetTitle>
          <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-2 shrink-0" />
          {renderContent()}
        </SheetContent>
      </Sheet>
    );
  }

  // DESKTOP: LEFT-SIDE PLACE PREVIEW PANEL
  return (
    <div className="fixed left-4 top-4 bottom-4 z-[1001] w-[420px] max-w-[calc(100vw-2rem)] flex flex-col rounded-[2.5rem] bg-white/95 backdrop-blur-2xl shadow-3xl ring-1 ring-black/5 overflow-hidden animate-in slide-in-from-left-6 duration-300">
      {renderContent()}
    </div>
  );
}

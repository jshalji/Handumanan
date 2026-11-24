'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { SafeImage } from '@/components/ui/safe-image';
import { getAdmissionDisplay } from '@/lib/heritage-data';
import { getSiteImageFallback, getSiteImageSources } from '@/lib/site-images';
import { evaluateSiteOperatingStatus } from '@/lib/site-availability';
import { getWeeklyScheduleRows } from '@/lib/visiting-hours';
import { getRatingSummaryState, isValidRating } from '@/lib/review-ratings';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
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

function StarRatingDisplay({ summary }: { summary: ReturnType<typeof getRatingSummaryState> }) {
  if (summary.status === 'loading' || summary.status === 'unavailable') {
    return (
      <span className="text-xs font-bold text-slate-400" aria-live="polite">
        {summary.status === 'loading' ? 'Loading ratings…' : 'Ratings unavailable'}
      </span>
    );
  }

  if (summary.status === 'empty') {
    return (
      <div className="flex items-center gap-1.5" aria-live="polite">
        <div className="flex items-center text-slate-300" aria-label="Empty stars">
          {[1, 2, 3, 4, 5].map(star => <Star key={star} size={14} />)}
        </div>
        <span className="text-xs font-bold text-slate-500">No ratings yet</span>
      </div>
    );
  }

  const rounded = Math.round(summary.average * 2) / 2;
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
      <span className="text-xs font-black text-slate-900">{summary.average.toFixed(1)}</span>
      <span className="text-[10px] font-bold text-slate-400">({summary.count} {summary.count === 1 ? 'rating' : 'ratings'})</span>
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
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const siteId = site?.id;
  const operatingEval = useMemo(
    () => (site ? evaluateSiteOperatingStatus(site, now) : null),
    [site, now]
  );
  const weeklyRows = useMemo(
    () => (site ? getWeeklyScheduleRows(site) : []),
    [site]
  );

  // Fetch Firestore reviews (single source of truth with directory & details page)
  const reviewsQuery = useMemoFirebase(() => {
    if (!db || !siteId) return null;
    return collection(db, 'heritageSites', siteId, 'reviews');
  }, [db, siteId]);
  const { data: reviews, isLoading: isReviewsLoading, error: reviewsError } = useCollection(reviewsQuery);
  const ratingSummary = getRatingSummaryState(reviews, {
    isLoading: isReviewsLoading,
    isAvailable: Boolean(reviewsQuery),
    error: reviewsError,
  });
  const orderedReviews = useMemo(() => [...(reviews || [])].sort((a: any, b: any) => {
    const getTime = (value: any) => typeof value?.toDate === 'function'
      ? value.toDate().getTime()
      : (value ? new Date(value).getTime() : 0);
    return getTime(b.createdAt) - getTime(a.createdAt);
  }), [reviews]);
  const totalReviews = ratingSummary.count;
  const ratingCounts = ratingSummary.counts;


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
          <StarRatingDisplay summary={ratingSummary} />
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
      <ScrollArea className="flex-1 min-h-0 px-4 sm:px-5 py-4 space-y-6">
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
                <div className="flex items-center justify-between gap-1 text-[9px] font-black uppercase tracking-widest text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-primary" /> Hours
                  </span>
                  {operatingEval && (
                    <span
                      className={cn(
                        'rounded-full border px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider',
                        operatingEval.isOpen === true
                          ? operatingEval.isClosingSoon
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : operatingEval.subFacilityEvaluations.some(sub => sub.isOpen === true)
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : operatingEval.isOpen === false
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
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
                <p
                  className="text-xs font-bold text-slate-800 truncate"
                  title={operatingEval?.displaySummary || site.visitingHours}
                >
                  {operatingEval?.displaySummary || site.visitingHours}
                </p>
                <button
                  type="button"
                  onClick={() => setIsHoursExpanded(!isHoursExpanded)}
                  className="text-[9px] font-black text-slate-500 hover:text-primary inline-flex items-center gap-0.5 mt-0.5"
                >
                  Schedule &amp; Access {isHoursExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                </button>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-1">
                {(() => {
                  const admission = getAdmissionDisplay(site);
                  const badgeText =
                    admission.status === 'free'
                      ? admission.isVerified
                        ? 'Verified Free'
                        : 'Open Access'
                      : admission.status === 'paid'
                        ? admission.isVerified
                          ? 'Verified Paid'
                          : 'Paid'
                        : admission.status === 'unverified'
                          ? 'Unverified'
                          : 'N/A';
                  return (
                    <>
                      <div className="flex items-center justify-between gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Ticket size={12} className="text-primary" /> Admission
                        </span>
                        <span className="rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-[8px] text-slate-600">
                          {badgeText}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-xs font-bold leading-snug',
                          admission.status === 'not_available' ? 'text-slate-500 italic font-normal' : 'text-slate-800'
                        )}
                        title={admission.displayLabel}
                      >
                        {admission.displayLabel}
                      </p>
                      {admission.scope && (
                        <p className="text-[9px] text-slate-500 leading-snug">
                          Scope: {admission.scope}
                        </p>
                      )}
                      {Array.isArray(admission.subFacilities) && admission.subFacilities.length > 0 && (
                        <div className="pt-1 space-y-0.5 border-t border-slate-200/70">
                          {admission.subFacilities.map((sub, idx) => (
                            <p key={idx} className="text-[9px] text-slate-600 leading-snug">
                              <span className="font-bold">{sub.name}:</span> {sub.label}
                            </p>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            {isHoursExpanded && (
              <div className="rounded-2xl bg-slate-50 p-3 border border-slate-100 space-y-2.5 text-[10px] animate-in fade-in-50">
                {operatingEval?.statusDetailMessage && (
                  <p className="text-[10px] font-medium text-slate-600 leading-snug">
                    {operatingEval.statusDetailMessage}
                  </p>
                )}

                {site.operatingSchedule && (
                  <div className="rounded-xl bg-white p-2 border border-slate-100 space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-slate-500">Interior:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {site.operatingSchedule.interiorAccess.policyStatus}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-slate-500">Grounds:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {site.operatingSchedule.exteriorGroundsAccess.policyStatus}
                      </span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="font-bold text-slate-500">Street View:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {site.operatingSchedule.exteriorStreetVisibility.status}
                      </span>
                    </div>
                  </div>
                )}

                {operatingEval && operatingEval.subFacilityEvaluations.length > 0 && (
                  <div className="space-y-1">
                    <p className="font-black text-[9px] uppercase tracking-widest text-slate-400">
                      Sub-Facilities
                    </p>
                    {operatingEval.subFacilityEvaluations.map(sub => (
                      <div
                        key={sub.subFacilityId}
                        className="rounded-xl bg-white p-2 border border-slate-100 space-y-0.5"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-800">{sub.subFacilityName}</span>
                          <span className="font-black text-[8px] uppercase text-primary">
                            {sub.calculatedStatus}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-500 leading-snug">{sub.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <p className="font-black text-[9px] uppercase tracking-widest text-slate-400 mb-1">
                    Weekly Visiting Days (Asia/Manila)
                  </p>
                  {weeklyRows.map(row => (
                    <div key={row.key} className="flex justify-between items-center py-0.5">
                      <span className="font-bold text-slate-700">
                        {row.day} ({row.abbr}):
                      </span>
                      <span className="text-slate-500 font-medium text-right">
                        {row.formattedHours}
                      </span>
                    </div>
                  ))}
                </div>

                {site.operatingSchedule?.verification && (
                  <div className="rounded-xl bg-white p-2 border border-slate-100 space-y-1 text-[10px]">
                    <p className="font-bold text-slate-700">
                      {site.operatingSchedule.verification.verificationStatusLabel}
                    </p>
                    {site.operatingSchedule.verification.sources?.length > 0 && (
                      <div className="space-y-1">
                        {site.operatingSchedule.verification.sources.map((src: any, idx: number) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-1 text-primary font-semibold hover:underline break-words"
                          >
                            <ExternalLink size={10} className="shrink-0 mt-0.5" />
                            <span className="min-w-0">{src.publisher}: {src.title}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
              {ratingSummary.status === 'rated' || ratingSummary.status === 'empty' ? (
                <div className="flex items-center gap-4">
                  <div className="text-center shrink-0 pr-3 border-r border-slate-200">
                    {ratingSummary.status === 'rated' ? (
                      <>
                        <p className="text-3xl font-headline font-black text-slate-900 leading-none">
                          {ratingSummary.average.toFixed(1)}
                        </p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">out of 5</p>
                        <p className="text-[9px] text-slate-400">{ratingSummary.count} {ratingSummary.count === 1 ? 'rating' : 'ratings'}</p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center text-slate-300" aria-label="Empty stars">
                          {[1, 2, 3, 4, 5].map(star => <Star key={star} size={12} />)}
                        </div>
                        <p className="mt-1 text-[9px] font-bold text-slate-500">No ratings yet</p>
                      </>
                    )}
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
              ) : (
                <p className="text-center text-xs font-bold text-slate-400" aria-live="polite">
                  {ratingSummary.status === 'loading' ? 'Loading ratings…' : 'Ratings unavailable'}
                </p>
              )}
            </div>

            {/* Recent Reviews List */}
            {isReviewsLoading ? (
              <div className="p-4 text-center text-xs font-bold text-slate-400">
                Loading visitor reviews...
              </div>
            ) : reviewsError ? (
              <div role="alert" className="p-4 text-center text-xs font-bold text-red-600">
                Visitor reviews are unavailable. Please try again later.
              </div>
            ) : orderedReviews.length > 0 ? (
              <div className="space-y-3">
                {orderedReviews.slice(0, 4).map((rev) => (
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
                      {isValidRating(rev.rating) && (
                        <div className="flex items-center text-amber-400" aria-label={`${rev.rating} out of 5 stars`}>
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={11}
                              className={cn(
                                s <= Math.round(rev.rating)
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              )}
                            />
                          ))}
                        </div>
                      )}
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
          hideCloseButton
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

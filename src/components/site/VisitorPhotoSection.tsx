'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser, useFirestore, useFirebaseApp, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { SafeImage } from '@/components/ui/safe-image';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Camera,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';

interface VisitorPhoto {
  id: string;
  siteId: string;
  userId: string;
  userDisplayName?: string;
  imageUrl: string;
  storagePath?: string;
  caption?: string;
  createdAt?: any;
  uploadBatchId?: string;
}

interface VisitorPhotoSectionProps {
  siteId: string;
  siteName: string;
  reviews?: any[];
  isReviewsLoading?: boolean;
  reviewForm?: React.ReactNode;
  reviewPrompt?: React.ReactNode;
}

async function compressImage(file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Image compression failed'));
        },
        'image/jpeg',
        quality
      );
    };

    reader.readAsDataURL(file);
  });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getDisplayDate(value: any) {
  const date = typeof value?.toDate === 'function' ? value.toDate() : value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 'Recent';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDisplayName(value?: string) {
  return value?.trim() || 'Visitor';
}

function getInitials(name?: string) {
  return getDisplayName(name)
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

function RatingStars({ rating = 0, onSelect }: { rating?: number; onSelect?: (rating: number) => void }) {
  const normalizedRating = Number(rating || 0);
  return (
    <div className="flex gap-1 text-yellow-500">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= normalizedRating;
        if (onSelect) {
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(starValue)}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl transition-transform hover:scale-110",
                isFilled ? "bg-yellow-50 text-yellow-500" : "bg-slate-100 text-slate-300"
              )}
              aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
            >
              <Star fill={isFilled ? 'currentColor' : 'none'} size={18} />
            </button>
          );
        }
        return (
          <Star
            key={index}
            fill={isFilled ? 'currentColor' : 'none'}
            size={14}
            className={isFilled ? '' : 'text-slate-200'}
          />
        );
      })}
    </div>
  );
}

export function VisitorPhotoSection({
  siteId,
  siteName,
  reviews = [],
  isReviewsLoading = false,
  reviewPrompt,
}: VisitorPhotoSectionProps) {
  const { user } = useUser();
  const db = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Array<{ file: File; preview: string; caption: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const photosQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, 'heritageSites', siteId, 'visitorPhotos'),
      orderBy('createdAt', 'desc')
    );
  }, [db, siteId]);

  const { data: photosData, isLoading: isPhotosLoading } = useCollection(photosQuery);

  const visitorPhotos: VisitorPhoto[] = (photosData || []).map((docData: any) => ({
    id: docData.id,
    siteId: docData.siteId || siteId,
    userId: docData.userId || '',
    userDisplayName: docData.userDisplayName || 'Visitor',
    imageUrl: docData.imageUrl || '',
    storagePath: docData.storagePath || '',
    caption: docData.caption || '',
    createdAt: docData.createdAt,
    uploadBatchId: docData.uploadBatchId || '',
  })).filter(photo => photo.imageUrl);

  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);
  const isAdmin = userData?.role === 'admin';

  // Group photos and reviews into unified community posts
  const claimedPhotoIds = new Set<string>();

  const communityPosts: Array<{
    id: string;
    userName: string;
    userId?: string;
    createdAt: any;
    rating?: number;
    comment?: string;
    photos?: VisitorPhoto[];
    rawReviewId?: string;
  }> = [];

  (reviews || []).forEach((review: any) => {
    const reviewTime = typeof review.createdAt?.toDate === 'function'
      ? review.createdAt.toDate().getTime()
      : (review.createdAt ? new Date(review.createdAt).getTime() : 0);

    const matchingPhotos = visitorPhotos.filter(photo => {
      if (claimedPhotoIds.has(photo.id)) return false;
      if (review.uploadBatchId && photo.uploadBatchId === review.uploadBatchId) return true;
      if (photo.userId && review.userId && photo.userId === review.userId) {
        const photoTime = typeof photo.createdAt?.toDate === 'function'
          ? photo.createdAt.toDate().getTime()
          : (photo.createdAt ? new Date(photo.createdAt).getTime() : 0);
        if (Math.abs(photoTime - reviewTime) < 15 * 60 * 1000) return true;
      }
      return false;
    });

    matchingPhotos.forEach(p => claimedPhotoIds.add(p.id));

    communityPosts.push({
      id: `review-${review.id}`,
      userName: review.userName || 'Visitor',
      userId: review.userId,
      createdAt: review.createdAt,
      rating: review.rating,
      comment: review.comment,
      photos: matchingPhotos.length > 0 ? matchingPhotos : undefined,
      rawReviewId: review.id,
    });
  });

  // Remaining standalone photos
  const remainingPhotos = visitorPhotos.filter(p => !claimedPhotoIds.has(p.id));
  const photoGroupsMap = new Map<string, VisitorPhoto[]>();
  remainingPhotos.forEach(photo => {
    const key = photo.uploadBatchId || photo.id;
    if (!photoGroupsMap.has(key)) photoGroupsMap.set(key, []);
    photoGroupsMap.get(key)!.push(photo);
  });

  photoGroupsMap.forEach((photos, key) => {
    const first = photos[0];
    communityPosts.push({
      id: `photos-${key}`,
      userName: first?.userDisplayName || 'Visitor',
      userId: first?.userId,
      createdAt: first?.createdAt,
      photos: photos,
    });
  });

  communityPosts.sort((a, b) => {
    const tA = typeof a.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
    const tB = typeof b.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
    return tB - tA;
  });

  const handleDeleteReview = async (reviewId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'heritageSites', siteId, 'reviews', reviewId));
      toast({ title: 'Review Deleted', description: 'Your review has been removed.' });
    } catch (err: any) {
      console.error('Failed to delete review:', err);
      toast({ title: 'Delete Failed', description: err?.message || 'Could not delete review.', variant: 'destructive' });
    }
  };

  const handleDeleteVisitorPhoto = async (photoId: string) => {
    if (!user || !db) return;
    try {
      await deleteDoc(doc(db, 'heritageSites', siteId, 'visitorPhotos', photoId));
      if (activeLightboxIndex !== null) {
        setActiveLightboxIndex(null);
      }
      toast({ title: 'Photo Deleted', description: 'The photo has been removed.' });
    } catch (err: any) {
      console.error('Failed to delete photo:', err);
      toast({ title: 'Delete Failed', description: err?.message || 'Could not delete photo.', variant: 'destructive' });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSizeBytes = 10 * 1024 * 1024;
    const newItems: Array<{ file: File; preview: string; caption: string }> = [];
    let invalidTypeCount = 0;
    let oversizeCount = 0;

    for (const file of files) {
      if (!validTypes.includes(file.type.toLowerCase())) {
        invalidTypeCount++;
        continue;
      }
      if (file.size > maxSizeBytes) {
        oversizeCount++;
        continue;
      }
      newItems.push({ file, preview: URL.createObjectURL(file), caption: '' });
    }

    if (invalidTypeCount > 0) {
      toast({
        title: 'Unsupported File Format',
        description: 'Only JPG, PNG, and WebP images are allowed.',
        variant: 'destructive',
      });
    }

    if (oversizeCount > 0) {
      toast({
        title: 'File Too Large',
        description: 'Selected images must be under 10MB each.',
        variant: 'destructive',
      });
    }

    setSelectedFiles(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemovePreview = (index: number) => {
    setSelectedFiles(prev => {
      const target = prev[index];
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const handlePostExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !db) return;

    if (!comment.trim() && selectedFiles.length === 0) {
      toast({
        title: 'Contribution Required',
        description: 'Please write a comment or upload at least one photo.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    const uploadBatchId = `${user.uid}_${Date.now()}`;
    const userName = user.displayName || user.email?.split('@')[0] || 'Visitor';

    try {
      // 1. Submit review if comment is entered
      if (comment.trim()) {
        const reviewRef = doc(collection(db, 'heritageSites', siteId, 'reviews'));
        await setDoc(reviewRef, {
          userId: user.uid,
          userName,
          siteId,
          rating,
          comment: comment.trim(),
          uploadBatchId,
          createdAt: serverTimestamp(),
        }, { merge: true });
      }

      // 2. Upload photos if selected
      if (selectedFiles.length > 0) {
        const storage = getStorage(firebaseApp);
        for (let index = 0; index < selectedFiles.length; index++) {
          const item = selectedFiles[index];
          const compressedBlob = await compressImage(item.file);
          let finalImageUrl = '';
          let storagePath = '';

          try {
            const timestamp = Date.now();
            const safeFileName = item.file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            storagePath = `visitorPhotos/${siteId}/${user.uid}_${timestamp}_${safeFileName}`;
            const imageRef = ref(storage, storagePath);
            await uploadBytes(imageRef, compressedBlob, {
              contentType: 'image/jpeg',
              customMetadata: { userId: user.uid, siteId },
            });
            finalImageUrl = await getDownloadURL(imageRef);
          } catch (storageErr) {
            console.warn('Firebase Storage upload fallback triggered:', storageErr);
            finalImageUrl = await blobToDataURL(compressedBlob);
          }

          const photoDocRef = doc(collection(db, 'heritageSites', siteId, 'visitorPhotos'));
          await setDoc(photoDocRef, {
            siteId,
            userId: user.uid,
            userDisplayName: userName,
            imageUrl: finalImageUrl,
            storagePath,
            caption: item.caption.trim(),
            uploadBatchId,
            createdAt: serverTimestamp(),
          });

          setUploadProgress(Math.round(((index + 1) / selectedFiles.length) * 100));
        }

        selectedFiles.forEach(item => {
          if (item.preview) URL.revokeObjectURL(item.preview);
        });
        setSelectedFiles([]);
      }

      setComment('');
      setRating(5);

      toast({
        title: 'Contribution Shared!',
        description: 'Thank you for sharing your experience with the Handumanan community.',
      });
    } catch (error: any) {
      console.error('Failed to submit contribution:', error);
      toast({
        title: 'Submission Failed',
        description: error?.message || 'Could not post your contribution. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    if (activeLightboxIndex === null) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveLightboxIndex(null);
      if (event.key === 'ArrowLeft') {
        setActiveLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : visitorPhotos.length - 1));
      }
      if (event.key === 'ArrowRight') {
        setActiveLightboxIndex(prev => (prev !== null && prev < visitorPhotos.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLightboxIndex, visitorPhotos.length]);

  return (
    <div className="space-y-8">
      {/* Create Contribution Form */}
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Sparkles size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-headline text-lg font-bold text-slate-900 sm:text-xl">Create Contribution</h3>
              <p className="text-xs font-medium text-slate-500">
                Share your experience, rating, or photos from {siteName}.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
            Visitor Community
          </Badge>
        </div>

        {user ? (
          <form onSubmit={handlePostExperience} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rating</label>
              <RatingStars rating={rating} onSelect={setRating} />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Experience & Memories</label>
              <Textarea
                placeholder="Write about your visit, historical tips, or personal memories..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[110px] rounded-2xl border-slate-200 bg-slate-50 text-sm shadow-none focus-visible:ring-2 focus-visible:ring-primary/20 md:text-base"
              />
            </div>

            {/* Photo Attachment Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Add Photos (Optional)</label>
                {selectedFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      selectedFiles.forEach(item => URL.revokeObjectURL(item.preview));
                      setSelectedFiles([]);
                    }}
                    className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:underline"
                  >
                    Clear All ({selectedFiles.length})
                  </button>
                )}
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                className="hidden"
                id="visitor-photo-input"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-24 w-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 transition-all hover:border-primary hover:bg-primary/5 hover:text-primary"
                >
                  <Camera size={22} className="mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                </button>

                {selectedFiles.map((item, index) => (
                  <div key={index} className="group relative h-24 w-32 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
                    <img src={item.preview} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePreview(index)}
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white shadow transition-colors hover:bg-red-600"
                      aria-label="Remove photo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {isSubmitting && selectedFiles.length > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Uploading photos...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full bg-primary transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full rounded-2xl bg-primary text-xs font-black uppercase tracking-[0.18em] text-white shadow-xl shadow-primary/20 sm:w-auto sm:px-8"
            >
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" size={16} /> : null} Post Experience
            </Button>
          </form>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
            {reviewPrompt || (
              <>
                <p className="mb-4 text-sm font-medium text-slate-600">
                  Sign in to share your visitor photos, ratings, and stories with the community.
                </p>
                <Button asChild variant="outline" className="h-11 rounded-2xl border-2 px-6 text-[10px] font-black uppercase tracking-widest">
                  <Link href="/auth">Sign In to Contribute</Link>
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* VISITOR PHOTO ALBUM SECTION */}
      {visitorPhotos.length > 0 && (
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera size={18} className="text-primary" />
              <h3 className="font-headline text-lg font-bold text-slate-900">Visitor Photo Album</h3>
              <Badge variant="secondary" className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
                {visitorPhotos.length} {visitorPhotos.length === 1 ? 'photo' : 'photos'}
              </Badge>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Community Gallery</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
            {visitorPhotos.map((photo, index) => {
              const canDeletePhoto = Boolean(user && (isAdmin || (photo.userId && photo.userId === user.uid)));
              return (
                <div key={photo.id} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveLightboxIndex(index)}
                    className="group relative h-32 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <SafeImage
                      src={photo.imageUrl}
                      alt={photo.caption || `Visitor photo of ${siteName}`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent p-2.5 flex flex-col justify-between">
                      <span className="self-end rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                        Visitor Photo
                      </span>
                      <div className="text-white">
                        <p className="text-[10px] font-black truncate">{photo.userDisplayName || 'Visitor'}</p>
                        <p className="text-[8px] text-white/70">{getDisplayDate(photo.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                  {canDeletePhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteVisitorPhoto(photo.id);
                      }}
                      className="absolute top-2 left-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white backdrop-blur-md hover:bg-red-600 transition-colors"
                      title="Delete visitor photo"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Community Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <h3 className="font-headline text-xl font-bold text-slate-900">Community Feed</h3>
            <Badge variant="secondary" className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary">
              {communityPosts.length}
            </Badge>
          </div>
        </div>

        {isPhotosLoading || isReviewsLoading ? (
          <div className="flex h-40 items-center justify-center rounded-2xl bg-slate-50">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : communityPosts.length > 0 ? (
          <div className="space-y-4">
            {communityPosts.map(post => {
              const isAuthor = Boolean(user && post.userId && post.userId === user.uid);
              const canDelete = isAuthor || isAdmin;

              return (
                <article key={post.id} className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:border-slate-200 sm:p-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xs font-black text-primary shadow-sm">
                        {getInitials(post.userName)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{getDisplayName(post.userName)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{getDisplayDate(post.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-primary/15 bg-primary/5 text-[9px] font-black uppercase tracking-widest text-primary">
                        Visitor Contribution
                      </Badge>
                      {canDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (post.rawReviewId) {
                              handleDeleteReview(post.rawReviewId);
                            } else if (post.photos && post.photos.length > 0) {
                              handleDeleteVisitorPhoto(post.photos[0].id);
                            }
                          }}
                          className="h-8 w-8 rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title={post.rawReviewId ? "Delete review" : "Delete photo"}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                {/* Rating if present */}
                {Boolean(post.rating) && (
                  <div className="mb-2">
                    <RatingStars rating={post.rating} />
                  </div>
                )}

                {/* Comment text if present */}
                {Boolean(post.comment) && (
                  <p className="mb-4 text-sm leading-relaxed text-slate-700 sm:text-base">
                    "{post.comment}"
                  </p>
                )}

                {/* Photos if present */}
                {Boolean(post.photos && post.photos.length > 0) && (
                  <div>
                    {post.photos!.length === 1 ? (
                      (() => {
                        const photo = post.photos![0];
                        const photoIndex = visitorPhotos.findIndex(item => item.id === photo.id);
                        return (
                          <button
                            type="button"
                            onClick={() => setActiveLightboxIndex(photoIndex >= 0 ? photoIndex : 0)}
                            className="group relative aspect-[16/10] w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm"
                          >
                            <SafeImage
                              src={photo.imageUrl}
                              alt={photo.caption || `Visitor photo of ${siteName}`}
                              fill
                              className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-slate-950/40 text-white backdrop-blur-md">
                              <Maximize2 size={15} />
                            </div>
                            {photo.caption && (
                              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
                                <p className="line-clamp-2 text-xs font-bold">{photo.caption}</p>
                              </div>
                            )}
                          </button>
                        );
                      })()
                    ) : (
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch' }}>
                        {post.photos!.map(photo => {
                          const photoIndex = visitorPhotos.findIndex(item => item.id === photo.id);
                          return (
                            <button
                              key={photo.id}
                              type="button"
                              onClick={() => setActiveLightboxIndex(photoIndex >= 0 ? photoIndex : 0)}
                              className="group relative aspect-[4/3] w-[75%] max-w-[260px] shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-left shadow-sm sm:w-[220px]"
                            >
                              <SafeImage
                                src={photo.imageUrl}
                                alt={photo.caption || `Visitor photo of ${siteName}`}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {photo.caption && (
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-2 text-white">
                                  <p className="line-clamp-2 text-[11px] font-bold">{photo.caption}</p>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
            <MessageSquare size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-500">No visitor insights yet</p>
            <p className="mt-1 text-xs text-slate-400">Be the first to share a story, rating, or photo from your visit.</p>
          </div>
        )}
      </div>

      {/* Lightbox Viewer */}
      {activeLightboxIndex !== null && visitorPhotos[activeLightboxIndex] && (() => {
        const currentPhoto = visitorPhotos[activeLightboxIndex];
        const canDeleteCurrentPhoto = Boolean(user && (isAdmin || (currentPhoto.userId && currentPhoto.userId === user.uid)));
        return (
          <div className="fixed inset-0 z-[1300] flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950/95 backdrop-blur-2xl">
            <div className="fixed left-4 right-4 top-[calc(env(safe-area-inset-top)+1rem)] z-30 flex items-center justify-between gap-4 text-white md:left-8 md:right-8 md:top-6">
              <div className="min-w-0">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
                  Visitor Photo {activeLightboxIndex + 1} of {visitorPhotos.length}
                </span>
                <p className="truncate text-sm font-bold md:text-lg">
                  {currentPhoto.caption || siteName}
                </p>
                <p className="truncate text-[10px] text-white/70">
                  Shared by {currentPhoto.userDisplayName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canDeleteCurrentPhoto && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteVisitorPhoto(currentPhoto.id)}
                    className="h-11 w-11 shrink-0 rounded-full bg-red-600/80 text-white hover:bg-red-600 transition-colors"
                    title="Delete this photo"
                  >
                    <Trash2 size={20} />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setActiveLightboxIndex(null)}
                  className="h-11 w-11 shrink-0 rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Close photo viewer"
                >
                  <X size={22} />
                </Button>
              </div>
            </div>

          <div className="relative flex flex-1 items-center justify-center p-4 pb-20 pt-20 md:p-16">
            <div className="relative h-full max-h-[75vh] w-full max-w-5xl">
              <SafeImage
                src={visitorPhotos[activeLightboxIndex].imageUrl}
                alt={visitorPhotos[activeLightboxIndex].caption || siteName}
                fill
                loading="eager"
                className="object-contain drop-shadow-2xl"
              />
            </div>
          </div>

          {visitorPhotos.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActiveLightboxIndex(prev => (prev !== null && prev > 0 ? prev - 1 : visitorPhotos.length - 1))}
                className="fixed left-3 top-1/2 z-30 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 md:left-8"
                aria-label="Previous photo"
              >
                <ChevronLeft size={24} />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setActiveLightboxIndex(prev => (prev !== null && prev < visitorPhotos.length - 1 ? prev + 1 : 0))}
                className="fixed right-3 top-1/2 z-30 h-12 w-12 -translate-y-1/2 rounded-full bg-white/10 text-white hover:bg-white/20 md:right-8"
                aria-label="Next photo"
              >
                <ChevronRight size={24} />
              </Button>
            </>
          )}

          {visitorPhotos.length > 1 && (
            <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-20 flex justify-center md:inset-x-4 md:bottom-6">
              <div className="flex max-w-full gap-2 overflow-x-auto rounded-2xl bg-white/10 p-2 backdrop-blur-xl">
                {visitorPhotos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActiveLightboxIndex(index)}
                    className={cn(
                      'relative h-12 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all',
                      activeLightboxIndex === index ? 'scale-105 border-primary' : 'border-transparent opacity-50 hover:opacity-100'
                    )}
                    aria-label={`Open visitor photo ${index + 1}`}
                  >
                    <SafeImage src={photo.imageUrl} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        );
      })()}
    </div>
  );
}

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { query, collection, collectionGroup, where, orderBy, doc, getDoc, getDocs, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile, updatePassword, signOut } from 'firebase/auth';
import {
  User as UserIcon,
  Heart,
  Calendar,
  LogOut,
  Loader2,
  ArrowRight,
  Trash2,
  Edit2,
  Lock,
  Shield,
  ShieldCheck,
  MessageSquare,
  Camera,
  Settings,
  CheckCircle2,
  Globe,
  Eye,
  EyeOff,
  MapPin,
  Star,
  Compass,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/safe-image';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [deletingItineraryId, setDeletingItineraryId] = useState<string | null>(null);

  // Edit Profile State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Change Password State
  const [isChangePassOpen, setIsChangePassOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Location permission testing state
  const [isTestingLocation, setIsTestingLocation] = useState(false);
  const [locationStatusMessage, setLocationStatusMessage] = useState<string | null>(null);

  // Auto-provision Firestore users/{uid} document if missing
  useEffect(() => {
    if (!db || !user) return;
    const userRef = doc(db, 'users', user.uid);
    getDoc(userRef)
      .then((snap) => {
        if (!snap.exists()) {
          setDoc(userRef, {
            uid: user.uid,
            displayName: user.displayName || user.email?.split('@')[0] || 'Registered Explorer',
            email: user.email || '',
            role: 'user',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch(err => console.error('Failed to auto-provision user document:', err));
        }
      })
      .catch((err) => {
        console.error('Error checking user profile document:', err);
      });
  }, [db, user]);

  // Redirect if not signed in
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

  // Fetch Firestore user doc for role & metadata
  const userDocRef = useMemoFirebase(() => (db && user) ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: userData } = useDoc(userDocRef);

  // Fetch Favorites
  const favoritesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'favorites'), orderBy('createdAt', 'desc'));
  }, [db, user]);
  const { data: favorites, isLoading: isFavLoading } = useCollection(favoritesQuery);

  // Fetch Saved Itineraries
  const itinerariesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'itineraries'), orderBy('createdAt', 'desc'));
  }, [db, user]);
  const { data: savedItineraries, isLoading: isItinLoading } = useCollection(itinerariesQuery);

  // Fetch User Reviews across all sites (Collection Group) using safe getDocs
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [isReviewsLoading, setIsReviewsLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setUserReviews([]);
      setIsReviewsLoading(false);
      return;
    }
    setIsReviewsLoading(true);
    const q = query(collectionGroup(db, 'reviews'), where('userId', '==', user.uid));
    getDocs(q)
      .then((snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserReviews(list);
      })
      .catch((err) => {
        console.warn('CollectionGroup reviews query notice:', err);
        setUserReviews([]);
      })
      .finally(() => setIsReviewsLoading(false));
  }, [db, user]);

  // Fetch User Visitor Photos across all sites (Collection Group) using safe getDocs
  const [userPhotos, setUserPhotos] = useState<any[]>([]);
  const [isPhotosLoading, setIsPhotosLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) {
      setUserPhotos([]);
      setIsPhotosLoading(false);
      return;
    }
    setIsPhotosLoading(true);
    const q = query(collectionGroup(db, 'visitorPhotos'), where('userId', '==', user.uid));
    getDocs(q)
      .then((snap) => {
        const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setUserPhotos(list);
      })
      .catch((err) => {
        console.warn('CollectionGroup visitorPhotos query notice:', err);
        setUserPhotos([]);
      })
      .finally(() => setIsPhotosLoading(false));
  }, [db, user]);

  // Sort reviews in memory by createdAt
  const sortedReviews = useMemo(() => {
    return (userReviews || []).slice().sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [userReviews]);

  // Sort visitor photos in memory by createdAt
  const sortedPhotos = useMemo(() => {
    return (userPhotos || []).slice().sort((a: any, b: any) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });
  }, [userPhotos]);

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const handleLogout = () => {
    signOut(auth);
    router.push('/');
  };

  const handleOpenEditProfile = () => {
    setEditDisplayName(user.displayName || userData?.displayName || '');
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editDisplayName.trim();
    if (!trimmed) {
      toast({ title: "Name Required", description: "Please enter your full name.", variant: "destructive" });
      return;
    }

    setIsUpdatingProfile(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmed });
      }

      if (db) {
        await setDoc(doc(db, 'users', user.uid), {
          displayName: trimmed,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }

      toast({
        title: "Profile Updated",
        description: "Your full name has been updated successfully.",
      });
      setIsEditProfileOpen(false);
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Could not update profile information.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "New password and confirm password fields must match.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      toast({
        title: "Password Changed",
        description: "Your password was updated successfully.",
      });
      setIsChangePassOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error("Failed to change password:", error);
      const isReauthNeeded = error?.code === 'auth/requires-recent-login';
      toast({
        title: isReauthNeeded ? "Re-authentication Required" : "Password Update Failed",
        description: isReauthNeeded
          ? "For security reasons, please log out and log back in before updating your password."
          : (error.message || "Could not update password."),
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteItinerary = async (itineraryId: string) => {
    if (!db || !user) return;
    setDeletingItineraryId(itineraryId);
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'itineraries', itineraryId));
      toast({
        title: 'Trip Deleted',
        description: 'The saved trip was removed from your profile.',
      });
    } catch (error) {
      console.error('Failed to delete itinerary:', error);
      toast({
        title: 'Delete Failed',
        description: 'Please try deleting the trip again.',
        variant: 'destructive',
      });
    } finally {
      setDeletingItineraryId(null);
    }
  };

  const handleTestLocationPermission = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationStatusMessage("Geolocation is not supported by your current browser.");
      return;
    }
    setIsTestingLocation(true);
    setLocationStatusMessage("Requesting GPS coordinates...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsTestingLocation(false);
        const { latitude, longitude, accuracy } = position.coords;
        setLocationStatusMessage(
          `GPS active! Latitude: ${latitude.toFixed(4)}, Longitude: ${longitude.toFixed(4)} (Accuracy: ${Math.round(accuracy)}m)`
        );
        toast({
          title: "Location Permission Granted",
          description: "Live GPS coordinates are available for navigation & nearby recommendations.",
        });
      },
      (error) => {
        setIsTestingLocation(false);
        setLocationStatusMessage(`Geolocation permission denied or unavailable (${error.message}).`);
        toast({
          title: "Location Permission Denied",
          description: "Map & routing features will default to Metro Cebu central coordinates.",
          variant: "destructive",
        });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const userRole = userData?.role || 'user';
  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'lgu' ? 'LGU Officer' : 'Registered Explorer';

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary via-primary/95 to-primary/85 pt-20 pb-28 text-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/20 shadow-2xl overflow-hidden text-white font-headline text-3xl font-bold">
                {user.photoURL ? (
                  <SafeImage src={user.photoURL} alt={user.displayName || 'Profile Avatar'} fill className="object-cover" />
                ) : (
                  <span>{(user.displayName || user.email || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active Account">
                <CheckCircle2 size={15} />
              </div>
            </div>

            <div className="min-w-0 text-center md:text-left flex-1 space-y-1">
              <h1 className="font-headline text-3xl sm:text-4xl font-black break-words tracking-tight">
                {user.displayName || user.email?.split('@')[0]}
              </h1>
              <div className="opacity-90 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-sm">
                <span className="break-all font-medium text-white/90">{user.email}</span>
                <span className="text-white/40">•</span>
                <Badge className={
                  userRole === 'admin'
                    ? 'bg-purple-500/90 text-white font-bold text-xs uppercase'
                    : userRole === 'lgu'
                    ? 'bg-emerald-500/90 text-white font-bold text-xs uppercase'
                    : 'bg-white/20 text-white border-none font-bold text-xs'
                }>
                  {userRole === 'admin' ? <ShieldCheck size={12} className="mr-1 inline" /> : null}
                  {userRole === 'lgu' ? <Shield size={12} className="mr-1 inline" /> : null}
                  {roleLabel}
                </Badge>
                <Badge variant="outline" className="bg-emerald-500/20 text-emerald-100 border-emerald-300/30 text-xs font-semibold">
                  Active Account
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 md:ml-auto">
              <Button onClick={handleOpenEditProfile} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full font-bold text-xs h-10 px-4">
                <Edit2 size={14} className="mr-1.5" /> Edit Profile
              </Button>
              <Button onClick={() => setIsChangePassOpen(true)} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full font-bold text-xs h-10 px-4">
                <Lock size={14} className="mr-1.5" /> Change Password
              </Button>
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-red-500/30 rounded-full font-bold text-xs h-10 px-4">
                <LogOut size={14} className="mr-1.5" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 -mt-14 pb-16 space-y-6">
        {/* Activity Counter Cards Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-none shadow-lg bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Heart size={22} className="fill-red-600/20" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Favorites</p>
              <p className="text-xl font-black text-slate-900">{favorites ? favorites.length : 0}</p>
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Saved Plans</p>
              <p className="text-xl font-black text-slate-900">{savedItineraries ? savedItineraries.length : 0}</p>
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">My Reviews</p>
              <p className="text-xl font-black text-slate-900">{sortedReviews.length}</p>
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white rounded-2xl p-4 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Camera size={22} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visitor Photos</p>
              <p className="text-xl font-black text-slate-900">{sortedPhotos.length}</p>
            </div>
          </Card>
        </div>

        {/* Dashboard Tabs Card */}
        <Card className="border-none shadow-xl overflow-hidden rounded-3xl bg-white">
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="w-full h-auto bg-white border-b border-slate-100 flex flex-wrap justify-start rounded-none px-4 sm:px-6 gap-2 sm:gap-6 py-2">
              <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 font-bold text-xs sm:text-sm">
                <Heart size={16} className="mr-2" /> Favorites ({favorites ? favorites.length : 0})
              </TabsTrigger>
              <TabsTrigger value="itineraries" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 font-bold text-xs sm:text-sm">
                <Calendar size={16} className="mr-2" /> Saved Trips ({savedItineraries ? savedItineraries.length : 0})
              </TabsTrigger>
              <TabsTrigger value="reviews" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 font-bold text-xs sm:text-sm">
                <MessageSquare size={16} className="mr-2" /> My Reviews ({sortedReviews.length})
              </TabsTrigger>
              <TabsTrigger value="photos" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 font-bold text-xs sm:text-sm">
                <Camera size={16} className="mr-2" /> My Visitor Photos ({sortedPhotos.length})
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 font-bold text-xs sm:text-sm ml-auto">
                <Settings size={16} className="mr-2" /> Settings
              </TabsTrigger>
            </TabsList>

            <div className="p-4 sm:p-8 min-h-[420px]">
              {/* TAB 1: FAVORITES */}
              <TabsContent value="favorites" className="mt-0 space-y-4">
                {isFavLoading ? (
                  <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
                ) : favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav: any) => (
                      <Card key={fav.id} className="overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all border border-slate-200/80 shadow-sm hover:shadow-md rounded-2xl">
                        <Link href={`/site/${fav.siteId}`}>
                          <div className="relative h-44 bg-slate-100 overflow-hidden">
                            <SafeImage src={fav.imageUrl} alt={fav.siteName} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-red-600 text-white border-none shadow-md font-bold text-xs">
                                <Heart size={11} className="fill-white mr-1" /> Saved
                              </Badge>
                            </div>
                          </div>
                          <CardHeader className="p-4">
                            <CardTitle className="text-base font-headline group-hover:text-primary transition-colors line-clamp-1">
                              {fav.siteName}
                            </CardTitle>
                            {fav.city && (
                              <CardDescription className="text-xs flex items-center gap-1 text-slate-500 mt-1">
                                <MapPin size={12} className="text-primary" /> {fav.city}
                              </CardDescription>
                            )}
                          </CardHeader>
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 opacity-70">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
                      <Heart size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Favorite Sites Saved</h3>
                    <p className="max-w-xs mx-auto mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Explore Metro Cebu's cultural landmarks and save your favorite sites to easily access them anytime.
                    </p>
                    <Button asChild className="mt-5 rounded-full font-bold text-xs" variant="outline">
                      <Link href="/explore"><Compass size={14} className="mr-1.5" /> Explore Heritage Sites</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 2: SAVED TRIPS */}
              <TabsContent value="itineraries" className="mt-0 space-y-4">
                {isItinLoading ? (
                  <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
                ) : savedItineraries && savedItineraries.length > 0 ? (
                  <div className="space-y-4">
                    {savedItineraries.map((itin: any) => {
                      const createdDate = itin.createdAt?.toDate ? itin.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Saved Trip';
                      return (
                        <Card key={itin.id} className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
                          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30 bg-primary/5">
                                  Saved Plan
                                </Badge>
                                <span className="text-xs text-slate-400 font-medium">{createdDate}</span>
                              </div>
                              <CardTitle className="text-lg font-black text-slate-950 flex items-center gap-2 truncate">
                                <Calendar size={18} className="text-primary shrink-0" />
                                {itin.summary || 'Custom Metro Cebu Heritage Itinerary'}
                              </CardTitle>
                              {Array.isArray(itin.sites) && itin.sites.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1 font-medium">
                                  Includes {itin.sites.length} heritage stop{itin.sites.length === 1 ? '' : 's'}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                              <Button asChild variant="default" size="sm" className="rounded-full font-bold text-xs">
                                <Link href={`/trip/${itin.id}`}>
                                  View Plan <ArrowRight size={14} className="ml-1" />
                                </Link>
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 rounded-full text-red-500 hover:bg-red-50 hover:text-red-600 border-slate-200"
                                    aria-label="Delete saved trip"
                                    disabled={deletingItineraryId === itin.id}
                                  >
                                    {deletingItineraryId === itin.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="font-black">Delete saved trip?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-xs">
                                      This will permanently remove this saved plan from your profile.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-full font-bold text-xs">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteItinerary(itin.id)}
                                      className="bg-red-600 text-white hover:bg-red-700 rounded-full font-bold text-xs"
                                    >
                                      Delete Trip
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </CardHeader>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 opacity-70">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center">
                      <Calendar size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Saved Trips Yet</h3>
                    <p className="max-w-xs mx-auto mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Use our Genkit AI Heritage Assistant to generate custom itineraries tailored to your interests.
                    </p>
                    <Button asChild className="mt-5 rounded-full font-bold text-xs" variant="outline">
                      <Link href="/discover"><Compass size={14} className="mr-1.5" /> Try AI Itinerary Planner</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 3: MY REVIEWS */}
              <TabsContent value="reviews" className="mt-0 space-y-4">
                {isReviewsLoading ? (
                  <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
                ) : sortedReviews.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedReviews.map((rev: any) => {
                      const createdDate = rev.createdAt?.toDate ? rev.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Review';
                      const ratingNum = Number(rev.rating) || 5;
                      return (
                        <Card key={rev.id} className="border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl p-5 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <Link href={`/site/${rev.siteId}#reviews`} className="font-black text-slate-950 hover:text-primary transition-colors text-base line-clamp-1">
                                {rev.siteName || 'Heritage Site'}
                              </Link>
                              <span className="text-[11px] text-slate-400 font-medium">{createdDate}</span>
                            </div>
                            <div className="flex items-center gap-0.5 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg text-amber-700 text-xs font-bold shrink-0">
                              <Star size={13} className="fill-amber-400 text-amber-400 mr-1" />
                              {ratingNum.toFixed(1)}
                            </div>
                          </div>

                          <p className="text-xs text-slate-600 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                            "{rev.comment}"
                          </p>

                          <div className="pt-1 flex justify-end">
                            <Button asChild variant="ghost" size="sm" className="text-primary font-bold text-xs h-7 px-2">
                              <Link href={`/site/${rev.siteId}#reviews`}>
                                View on Site Page <ArrowRight size={12} className="ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 opacity-70">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                      <MessageSquare size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Site Reviews Posted</h3>
                    <p className="max-w-xs mx-auto mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Share your experience and star ratings on heritage site pages to help fellow visitors.
                    </p>
                    <Button asChild className="mt-5 rounded-full font-bold text-xs" variant="outline">
                      <Link href="/explore"><Compass size={14} className="mr-1.5" /> Explore Sites & Leave Review</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 4: MY VISITOR PHOTOS */}
              <TabsContent value="photos" className="mt-0 space-y-4">
                {isPhotosLoading ? (
                  <div className="flex justify-center p-16"><Loader2 className="animate-spin text-primary" size={36} /></div>
                ) : sortedPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {sortedPhotos.map((photo: any) => {
                      const createdDate = photo.createdAt?.toDate ? photo.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Photo';
                      return (
                        <Card key={photo.id} className="overflow-hidden border border-slate-200/80 shadow-sm hover:shadow-md transition-all rounded-2xl group">
                          <Link href={`/site/${photo.siteId}`}>
                            <div className="relative h-44 bg-slate-100 overflow-hidden">
                              <SafeImage src={photo.imageUrl} alt={photo.caption || photo.siteName || 'Visitor photo'} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
                              <div className="absolute bottom-2 left-2 right-2 text-white">
                                <p className="text-xs font-black truncate">{photo.siteName || 'Heritage Landmark'}</p>
                                <p className="text-[10px] text-white/80">{createdDate}</p>
                              </div>
                            </div>
                            {photo.caption && (
                              <div className="p-3 bg-white text-xs text-slate-600 line-clamp-2 italic">
                                "{photo.caption}"
                              </div>
                            )}
                          </Link>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 opacity-70">
                    <div className="mx-auto mb-4 w-16 h-16 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center">
                      <Camera size={32} />
                    </div>
                    <h3 className="text-lg font-black text-slate-900">No Visitor Photos Uploaded</h3>
                    <p className="max-w-xs mx-auto mt-1.5 text-xs text-slate-500 leading-relaxed">
                      Upload your high-resolution photos on heritage site pages to contribute to Metro Cebu cultural documentation.
                    </p>
                    <Button asChild className="mt-5 rounded-full font-bold text-xs" variant="outline">
                      <Link href="/explore"><Compass size={14} className="mr-1.5" /> Explore Sites & Upload Photos</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* TAB 5: ACCOUNT SETTINGS */}
              <TabsContent value="settings" className="mt-0 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Account Information */}
                  <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="text-primary" size={20} />
                        <CardTitle className="text-base font-black text-slate-950">Account Profile Details</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Full Name</span>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{user.displayName || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Email Address</span>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{user.email}</p>
                      </div>
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Assigned System Role</span>
                        <div className="mt-1">
                          <Badge className={
                            userRole === 'admin'
                              ? 'bg-purple-600 text-white font-bold text-[10px] uppercase'
                              : userRole === 'lgu'
                              ? 'bg-emerald-600 text-white font-bold text-[10px] uppercase'
                              : 'bg-slate-100 text-slate-800 border border-slate-200 font-bold text-[10px] uppercase'
                          }>
                            {roleLabel}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Firebase User ID (UID)</span>
                        <p className="font-mono text-xs text-slate-600 bg-slate-100 p-2 rounded-lg mt-1 break-all">{user.uid}</p>
                      </div>

                      <div className="pt-2">
                        <Button onClick={handleOpenEditProfile} className="w-full rounded-xl font-bold text-xs h-10">
                          <Edit2 size={14} className="mr-1.5" /> Edit Profile Name
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Security & Password */}
                  <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Lock className="text-amber-600" size={20} />
                        <CardTitle className="text-base font-black text-slate-950">Security & Authentication</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Authentication Method</span>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">Firebase Email & Password Provider</p>
                      </div>
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Password Security</span>
                        <p className="text-slate-600 mt-0.5 leading-relaxed">
                          Your account password is encrypted and stored safely by Firebase Authentication.
                        </p>
                      </div>
                      <div>
                        <span className="font-black uppercase tracking-wider text-[10px] text-slate-400">Account Status</span>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 font-bold text-[10px]">
                            🟢 Authenticated & Active
                          </Badge>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100">
                        <Button onClick={() => setIsChangePassOpen(true)} variant="outline" className="w-full rounded-xl font-bold text-xs h-10 border-slate-300">
                          <Lock size={14} className="mr-1.5" /> Update Account Password
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Privacy & Location Information */}
                  <Card className="border border-slate-200/80 shadow-sm rounded-2xl bg-white md:col-span-2">
                    <CardHeader className="border-b border-slate-100 pb-4">
                      <div className="flex items-center gap-2">
                        <Globe className="text-emerald-600" size={20} />
                        <CardTitle className="text-base font-black text-slate-950">Privacy & Location Access Policy</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <p className="text-slate-600 leading-relaxed">
                        Handumanan uses browser geolocation coordinates (`navigator.geolocation`) strictly on demand for map pin centering, calculating nearby heritage site distances, and routing directions. Live GPS coordinates are never stored as permanent tracking data.
                      </p>

                      {locationStatusMessage && (
                        <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                          {locationStatusMessage}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <Button
                          onClick={handleTestLocationPermission}
                          disabled={isTestingLocation}
                          variant="outline"
                          className="rounded-xl font-bold text-xs h-9"
                        >
                          {isTestingLocation ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <MapPin size={14} className="mr-1.5" />}
                          Check Browser Geolocation Permission
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* EDIT PROFILE DIALOG */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">Edit Profile Information</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Update your display name across Handumanan features.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveProfile} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-xs font-bold text-slate-700">Full Name</Label>
              <Input
                id="edit-name"
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Juan Dela Cruz"
                required
                className="h-11 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)} disabled={isUpdatingProfile} className="rounded-xl font-bold text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingProfile} className="rounded-xl font-bold text-xs">
                {isUpdatingProfile ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CHANGE PASSWORD DIALOG */}
      <Dialog open={isChangePassOpen} onOpenChange={setIsChangePassOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-950">Change Password</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Enter a new secure password for your account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleChangePasswordSubmit} className="space-y-4 my-2">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-xs font-bold text-slate-700">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  minLength={6}
                  className="h-11 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-bold text-slate-700">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                minLength={6}
                className="h-11 rounded-xl"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsChangePassOpen(false)} disabled={isUpdatingPassword} className="rounded-xl font-bold text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdatingPassword} className="rounded-xl font-bold text-xs">
                {isUpdatingPassword ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                Update Password
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

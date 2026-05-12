'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { query, collection, orderBy } from 'firebase/firestore';
import { User as UserIcon, Heart, Calendar, LogOut, Loader2, ArrowRight, Landmark } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useAuth } from '@/firebase';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/auth');
    }
  }, [user, isUserLoading, router]);

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

  if (isUserLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  const handleLogout = () => {
    signOut(auth);
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <div className="bg-primary pt-20 pb-32">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6 text-white">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-4 border-white/10 shadow-xl">
              <UserIcon size={48} />
            </div>
            <div className="text-center md:text-left">
              <h1 className="font-headline text-4xl font-bold mb-1">
                {user.displayName || user.email?.split('@')[0]}
              </h1>
              <div className="opacity-80 flex items-center justify-center md:justify-start gap-2">
                {user.email} <Badge className="bg-white/20 text-white border-none">Explorer</Badge>
              </div>
            </div>
            <div className="md:ml-auto">
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full">
                <LogOut size={16} className="mr-2" /> Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-16">
        <Card className="border-none shadow-xl overflow-hidden rounded-3xl">
          <Tabs defaultValue="favorites" className="w-full">
            <TabsList className="w-full h-16 bg-white border-b flex justify-start rounded-none px-6 gap-8">
              <TabsTrigger value="favorites" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-bold">
                <Heart size={18} className="mr-2" /> Favorites
              </TabsTrigger>
              <TabsTrigger value="itineraries" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full font-bold">
                <Calendar size={18} className="mr-2" /> My Trips
              </TabsTrigger>
            </TabsList>
            
            <div className="p-8 min-h-[400px]">
              <TabsContent value="favorites" className="mt-0">
                {isFavLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : favorites && favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((fav: any) => (
                      <Card key={fav.id} className="overflow-hidden group hover:ring-2 hover:ring-primary/20 transition-all border-none shadow-md">
                        <Link href={`/site/${fav.siteId}`}>
                          <div className="relative h-40">
                            <Image src={fav.imageUrl} alt={fav.siteName} fill className="object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute top-2 right-2">
                              <Badge className="bg-accent text-white"><Heart size={10} className="fill-white mr-1" /> Saved</Badge>
                            </div>
                          </div>
                          <CardHeader className="p-4">
                            <CardTitle className="text-lg font-headline group-hover:text-primary transition-colors">{fav.siteName}</CardTitle>
                          </CardHeader>
                        </Link>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <Heart size={64} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-bold">No Favorites Yet</h3>
                    <p className="max-w-xs mx-auto mt-2">Start exploring and save the sites you want to visit later.</p>
                    <Button asChild className="mt-6 rounded-full" variant="outline">
                      <Link href="/explore">Explore Sites</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="itineraries" className="mt-0">
                {isItinLoading ? (
                  <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
                ) : savedItineraries && savedItineraries.length > 0 ? (
                  <div className="space-y-4">
                    {savedItineraries.map((itin: any) => (
                      <Card key={itin.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between">
                          <div className="min-w-0 flex-1 mr-4">
                            <CardTitle className="text-lg flex items-center gap-2 truncate">
                              <Calendar size={18} className="text-primary shrink-0" /> 
                              Saved Plan: {itin.createdAt?.toDate().toLocaleDateString()}
                            </CardTitle>
                            <CardDescription className="italic truncate">"{itin.summary}"</CardDescription>
                          </div>
                          <Button asChild variant="ghost" size="sm" className="text-primary font-bold">
                            <Link href={`/trip/${itin.id}`}>
                              View <ArrowRight size={14} className="ml-1" />
                            </Link>
                          </Button>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 opacity-50">
                    <Calendar size={64} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-bold">No Saved Trips</h3>
                    <p className="max-w-xs mx-auto mt-2">Use our AI Planner to map out your next heritage journey.</p>
                    <Button asChild className="mt-6 rounded-full" variant="outline">
                      <Link href="/discover">Try AI Planner</Link>
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}


'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert, Loader2, Lock, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const adminDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData } = useDoc(adminDocRef);

  useEffect(() => {
    if (user && userData?.role === 'admin') {
      router.push('/admin-dashboard');
    }
  }, [user, userData, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const newUid = userCredential.user.uid;

      if (db) {
        const userDoc = await getDoc(doc(db, 'users', newUid));
        const role = userDoc.data()?.role;

        if (role === 'admin') {
          toast({
            title: "Admin Access Granted",
            description: "Authenticated successfully as Administrator.",
          });
          router.push('/admin-dashboard');
          return;
        } else {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "The specified account does not have administrative privileges.",
          });
          await signOut(auth);
          setIsSubmitting(false);
          return;
        }
      }

      router.push('/admin-dashboard');
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials or unauthorized access.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white">
          <CardHeader className="text-center">
            <div className="mx-auto bg-slate-900 w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4">
              <ShieldAlert size={28} />
            </div>
            <CardTitle className="font-headline text-3xl text-slate-900">
              Admin Gateway
            </CardTitle>
            <CardDescription className="text-slate-500">
              Restricted area for Handumanan administrators.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user && userData?.role !== 'admin' && (
              <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-3 text-xs text-amber-800">
                <UserCheck size={16} className="text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold">Currently signed in as {user.email}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Role: <span className="font-semibold capitalize">{userData?.role || 'Explorer'}</span>. Enter credentials below to switch to an Admin account.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@handumanan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Security Key</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-12"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                </div>
              </div>
              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Authorize Access
              </Button>
            </form>
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                Secure Administrative Portal v1.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

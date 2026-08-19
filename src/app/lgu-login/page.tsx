'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Loader2, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LguLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const lguDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, 'users', user.uid);
  }, [db, user]);

  const { data: userData, isLoading: isCheckingRole } = useDoc(lguDocRef);

  useEffect(() => {
    if (user && !isCheckingRole) {
      if (userData?.role === 'lgu') {
        router.push('/lgu-dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You do not have LGU officer privileges.",
        });
        signOut(auth);
      }
    }
  }, [user, userData, isCheckingRole, router, auth, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setIsSubmitting(false);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message || "Invalid credentials or unauthorized LGU account.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md shadow-2xl border-none bg-white">
          <CardHeader className="text-center">
            <div className="mx-auto bg-emerald-600 w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-emerald-600/30">
              <ShieldCheck size={28} />
            </div>
            <CardTitle className="font-headline text-3xl text-slate-900">
              LGU Officer Portal
            </CardTitle>
            <CardDescription className="text-slate-500">
              Authorized portal for Local Government Unit heritage verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">LGU Account Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="officer@lgu.gov.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Security Password</Label>
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
              <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isSubmitting || isCheckingRole}>
                {isSubmitting || isCheckingRole ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                Authenticate LGU Access
              </Button>
            </form>
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                Metro Cebu Cultural Heritage Verification v1.0
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

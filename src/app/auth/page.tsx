'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.push('/profile');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (isLogin) {
      signInWithEmailAndPassword(auth, email, password)
        .catch((error: any) => {
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: error.message || "Invalid email or password.",
          });
        });
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          if (name) {
            await updateProfile(userCredential.user, {
              displayName: name
            });
          }
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: error.message || "Could not create account.",
          });
        });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Card className="w-full max-w-md shadow-2xl border-none">
          <CardHeader className="text-center">
            <div className="mx-auto w-14 h-14 rounded-xl overflow-hidden mb-4 shadow-lg shadow-primary/20">
              <Image src="/logo.png" alt="Handumanan" width={56} height={56} className="w-full h-full object-cover" />
            </div>
            <CardTitle className="font-headline text-3xl">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Login to access your saved itineraries and reviews.' 
                : 'Join the Handumanan community to explore and preserve Cebuano heritage.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Juan Dela Cruz" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="juan@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-12"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 rounded-full font-bold" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {isLogin ? 'Login' : 'Sign Up'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <p className="text-muted-foreground">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary font-bold hover:underline"
                >
                  {isLogin ? 'Sign up now' : 'Log in here'}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

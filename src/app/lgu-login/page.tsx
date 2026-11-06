'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Lock, UserCheck, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AuthShell } from '@/components/auth/AuthShell';

export default function LguLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const auth = useAuth();
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const lguDocRef = useMemoFirebase(
    () => (db && user) ? doc(db, 'users', user.uid) : null,
    [db, user]
  );
  const { data: userData } = useDoc(lguDocRef);

  useEffect(() => {
    if (user && userData?.role === 'lgu') {
      router.push('/lgu-dashboard');
    }
  }, [user, userData, router]);

  const validate = () => {
    let ok = true;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.');
      ok = false;
    } else {
      setEmailError('');
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      ok = false;
    } else {
      setPasswordError('');
    }

    return ok;
  };

  const friendlyError = (error: any) => {
    const code = error?.code || '';

    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/wrong-password' ||
      code === 'auth/user-not-found'
    ) {
      return 'Invalid email or password.';
    }

    if (code === 'auth/too-many-requests') {
      return 'Too many attempts. Try again later.';
    }

    if (code === 'auth/network-request-failed') {
      return 'Network error. Check your connection.';
    }

    return 'Login failed. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const newUid = userCredential.user.uid;

      if (db) {
        const userDoc = await getDoc(doc(db, 'users', newUid));
        const role = userDoc.data()?.role;

        if (role === 'lgu') {
          toast({
            title: 'LGU Access Granted',
            description: 'Authenticated successfully as LGU Officer.',
          });

          router.push('/lgu-dashboard');
          return;
        } else {
          toast({
            variant: 'destructive',
            title: 'Access Denied',
            description: 'This account does not have LGU Officer privileges.',
          });

          await signOut(auth);
          setIsSubmitting(false);
          return;
        }
      }

      router.push('/lgu-dashboard');
    } catch (error: any) {
      setIsSubmitting(false);

      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: friendlyError(error),
      });
    }
  };

  return (
    <AuthShell
      title="LGU Officer Portal"
      subtitle="Authorized portal for Local Government Unit heritage verification."
      accent="emerald"
      portalLabel="LGU officer portal"
      footer={
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Metro Cebu Cultural Heritage Verification v1.0
        </span>
      }
    >
      {user && userData?.role !== 'lgu' && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          <div className="flex items-start gap-3">
            <UserCheck size={16} className="mt-0.5 shrink-0 text-amber-600" />
            <div>
              <p className="font-bold">
                Currently signed in as {user.email}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-700">
                Role:{' '}
                <span className="font-semibold capitalize">
                  {userData?.role || 'Explorer'}
                </span>
                . Enter credentials below to switch to an LGU Officer account.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">LGU Account Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="officer@lgu.gov.ph"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (emailError) setEmailError('');
            }}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? 'email-error' : undefined}
            className="h-12"
            disabled={isSubmitting}
          />
          {emailError && (
            <p id="email-error" className="text-xs text-red-600">
              {emailError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Security Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (passwordError) setPasswordError('');
              }}
              aria-invalid={!!passwordError}
              aria-describedby={passwordError ? 'password-error' : undefined}
              className="h-12 pr-12"
              disabled={isSubmitting}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>

          {passwordError && (
            <p id="password-error" className="text-xs text-red-600">
              {passwordError}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl font-bold"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 animate-spin" size={18} />
          ) : (
            <Lock size={16} className="mr-2" />
          )}
          Authenticate LGU Access
        </Button>
      </form>
    </AuthShell>
  );
}
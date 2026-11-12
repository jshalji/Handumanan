'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser, useFirestore, setPendingRegistrationDisplayName, clearPendingRegistrationDisplayName, resolveProvisionedDisplayName } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { AuthShell } from '@/components/auth/AuthShell';
import { requestPasswordReset, type PasswordResetResult } from '@/lib/password-reset';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordResetMode, setIsPasswordResetMode] = useState(false);
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [resetFeedback, setResetFeedback] = useState<PasswordResetResult | null>(null);

  const auth = useAuth();
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const friendlyError = (error: any) => {
    const code = error?.code || '';
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') return 'Invalid email or password.';
    if (code === 'auth/email-already-in-use') return 'An account with this email already exists.';
    if (code === 'auth/weak-password') return 'Password must be at least 6 characters.';
    if (code === 'auth/invalid-email') return 'Enter a valid email address.';
    if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
    if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
    return 'Something went wrong. Please try again.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let ok = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setEmailError('Enter a valid email address.'); ok = false; } else setEmailError('');
    if (password.length < 6) { setPasswordError('Password must be at least 6 characters.'); ok = false; } else setPasswordError('');
    if (!ok) return;
    setIsSubmitting(true);

    if (isLogin) {
      signInWithEmailAndPassword(auth, email, password)
        .then(() => {
          toast({
            title: "Signed In",
            description: "Successfully authenticated.",
          });
          router.push('/profile');
        })
        .catch((error: any) => {
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Login Failed",
            description: friendlyError(error),
          });
        });
    } else {
      const normalizedEmail = email.trim();
      const chosenDisplayName = resolveProvisionedDisplayName({
        pendingDisplayName: name,
        email: normalizedEmail,
      });
      setPendingRegistrationDisplayName(normalizedEmail, chosenDisplayName);

      createUserWithEmailAndPassword(auth, normalizedEmail, password)
        .then(async (userCredential) => {
          const newUid = userCredential.user.uid;
          setPendingRegistrationDisplayName(newUid, chosenDisplayName);

          if (chosenDisplayName) {
            try {
              await updateProfile(userCredential.user, {
                displayName: chosenDisplayName,
              });
            } catch (profileAuthErr) {
              console.error("Failed to update Auth profile displayName:", profileAuthErr);
            }
          }

          let profileWriteSucceeded = false;
          if (db) {
            try {
              await setDoc(doc(db, 'users', newUid), {
                uid: newUid,
                displayName: chosenDisplayName,
                email: normalizedEmail,
                role: 'user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
              }, { merge: true });
              profileWriteSucceeded = true;
            } catch (firestoreErr) {
              console.error("Firestore profile write failed after account creation:", firestoreErr);
            }
          } else {
            profileWriteSucceeded = true;
          }

          if (profileWriteSucceeded) {
            clearPendingRegistrationDisplayName(normalizedEmail);
            clearPendingRegistrationDisplayName(newUid);
            toast({
              title: "Account Created",
              description: "Welcome to Handumanan!",
            });
          } else {
            toast({
              title: "Account Created",
              description: "Your account is ready. Finalizing your profile details in the background.",
            });
          }

          setIsSubmitting(false);
          router.push('/profile');
        })
        .catch((error: any) => {
          clearPendingRegistrationDisplayName(normalizedEmail);
          setIsSubmitting(false);
          toast({
            variant: "destructive",
            title: "Sign Up Failed",
            description: friendlyError(error),
          });
        });
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetFeedback(null);
    const result = await requestPasswordReset(
      email,
      normalizedEmail => sendPasswordResetEmail(auth, normalizedEmail),
      setIsResetSubmitting,
    );
    setResetFeedback(result);
  };

  const openPasswordResetForm = () => {
    setIsPasswordResetMode(true);
    setResetFeedback(null);
    setPassword('');
  };

  const returnToLogin = () => {
    setIsPasswordResetMode(false);
    setResetFeedback(null);
    setIsLogin(true);
  };

  return (
    <AuthShell
      title={isPasswordResetMode ? "Reset your password" : (isLogin ? "" : "Create your account")}
      subtitle={isPasswordResetMode ? "Enter your email to receive a reset link." : (isLogin ? "" : "Join Handumanan to save trips and favorites.")}
      accent="primary"
    >
      {user && !isPasswordResetMode && (
        <div className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
          <p className="font-bold">Currently signed in as {user.email}</p>
          <p className="mt-0.5 text-[11px] text-blue-700">Enter credentials below to switch accounts.</p>
        </div>
      )}

      {isPasswordResetMode ? (
        <form noValidate onSubmit={handlePasswordResetSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="reset-email">Registered email</Label>
            <Input
              id="reset-email"
              type="email"
              autoComplete="email"
              placeholder="juan@example.com"
              value={email}
              onChange={event => {
                setEmail(event.target.value);
                setResetFeedback(null);
              }}
              aria-invalid={resetFeedback?.status === 'invalid'}
              aria-describedby={resetFeedback ? 'password-reset-feedback' : undefined}
              className="h-12"
              required
            />
          </div>
          {resetFeedback && (
            <div
              id="password-reset-feedback"
              role={resetFeedback.status === 'success' ? 'status' : 'alert'}
              aria-live="polite"
              className={cn(
                'rounded-xl border px-3 py-3 text-sm leading-relaxed',
                resetFeedback.status === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-800'
              )}
            >
              {resetFeedback.message}
            </div>
          )}
          <Button type="submit" className="h-12 w-full rounded-xl font-bold" disabled={isResetSubmitting}>
            {isResetSubmitting ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
            {isResetSubmitting ? 'Sending request…' : 'Send reset link'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 w-full rounded-xl font-bold text-primary"
            onClick={returnToLogin}
            disabled={isResetSubmitting}
          >
            <ArrowLeft size={16} className="mr-2" /> Back to Login
          </Button>
        </form>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Juan Dela Cruz"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="juan@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(''); }}
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                className="h-12"
                required
              />
              {emailError && <p id="email-error" className="text-xs text-red-600">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={openPasswordResetForm}
                    className="text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (passwordError) setPasswordError(''); }}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className="h-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {passwordError && <p id="password-error" className="text-xs text-red-600">{passwordError}</p>}
            </div>
            <Button type="submit" className="h-12 w-full rounded-xl font-bold" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" size={18} /> : null}
              {isLogin ? 'Login' : 'Sign Up'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-stone-500">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setResetFeedback(null);
                }}
                className="font-bold text-primary hover:underline"
              >
                {isLogin ? 'Sign up now' : 'Log in here'}
              </button>
            </p>
          </div>
        </>
      )}
    </AuthShell>
  );
}



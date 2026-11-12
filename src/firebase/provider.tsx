'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

const pendingRegistrationProfiles = new Map<string, string>();

/**
 * Registers an in-flight registration display name so FirebaseProvider does not
 * overwrite the user's chosen registration name with an email prefix fallback.
 */
export function setPendingRegistrationDisplayName(emailOrKey: string, displayName: string) {
  const trimmedName = displayName.trim();
  const normalizedKey = emailOrKey.trim().toLowerCase();
  if (normalizedKey && trimmedName) {
    pendingRegistrationProfiles.set(normalizedKey, trimmedName);
  }
}

export function clearPendingRegistrationDisplayName(emailOrKey: string) {
  const normalizedKey = emailOrKey.trim().toLowerCase();
  if (normalizedKey) {
    pendingRegistrationProfiles.delete(normalizedKey);
  }
}

export function resolveProvisionedDisplayName(params: {
  existingDisplayName?: unknown;
  pendingDisplayName?: unknown;
  authDisplayName?: unknown;
  email?: unknown;
  fallback?: string;
}): string {
  const candidates = [
    params.existingDisplayName,
    params.pendingDisplayName,
    params.authDisplayName,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === 'string' && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  if (typeof params.email === 'string' && params.email.trim().length > 0) {
    const emailPrefix = params.email.trim().split('@')[0]?.trim();
    if (emailPrefix) return emailPrefix;
  }
  return params.fallback || 'Registered Account';
}

export function buildAutoProvisionUserPayload(params: {
  uid: string;
  email?: string | null;
  authDisplayName?: string | null;
  pendingDisplayName?: string | null;
  existingData?: Record<string, any> | null;
  timestampValue: unknown;
}): Record<string, any> | null {
  const existing = params.existingData || null;
  const resolvedDisplayName = resolveProvisionedDisplayName({
    existingDisplayName: existing?.displayName,
    pendingDisplayName: params.pendingDisplayName,
    authDisplayName: params.authDisplayName,
    email: params.email,
  });

  if (existing) {
    const hasExistingName = typeof existing.displayName === 'string' && existing.displayName.trim().length > 0;
    const hasExistingRole = typeof existing.role === 'string' && existing.role.trim().length > 0;
    if (hasExistingName && hasExistingRole) {
      return null;
    }
    return {
      uid: params.uid,
      ...(!hasExistingName ? { displayName: resolvedDisplayName } : {}),
      ...(!existing.email && params.email ? { email: params.email } : {}),
      ...(!hasExistingRole ? { role: 'user' } : {}),
      updatedAt: params.timestampValue,
    };
  }

  return {
    uid: params.uid,
    displayName: resolvedDisplayName,
    email: params.email || '',
    role: 'user',
    createdAt: params.timestampValue,
    updatedAt: params.timestampValue,
  };
}

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication
interface UserAuthState {
  user: User | null;
  userData: Record<string, any> | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean; // True if core services (app, firestore, auth instance) are provided
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null; // The Auth service instance
  // User authentication state
  user: User | null;
  userData: Record<string, any> | null;
  isUserLoading: boolean; // True during initial auth check
  userError: Error | null; // Error from auth listener
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userData: Record<string, any> | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { // Renamed from UserAuthHookResult for consistency if desired, or keep as UserAuthHookResult
  user: User | null;
  userData: Record<string, any> | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

/**
 * FirebaseProvider manages and provides Firebase services and user authentication state.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    userData: null,
    isUserLoading: true, // Start loading until first auth event
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes and the active user's Firestore document
  useEffect(() => {
    if (!auth) { // If no Auth service instance, cannot determine user state
      setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    setUserAuthState({ user: null, userData: null, isUserLoading: true, userError: null }); // Reset on auth instance change

    let unsubscribeUserDoc: (() => void) | null = null;
    const provisionedUids = new Set<string>();
    const repairedUids = new Set<string>();

    const cleanupUserDocListener = () => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
    };

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => { // Auth state determined
        cleanupUserDocListener();

        if (!firebaseUser) {
          setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: null });
          return;
        }

        setUserAuthState(prev => ({
          user: firebaseUser,
          userData: prev.user?.uid === firebaseUser.uid ? prev.userData : null,
          isUserLoading: false,
          userError: null,
        }));

        if (firestore) {
          const userRef = doc(firestore, 'users', firebaseUser.uid);
          unsubscribeUserDoc = onSnapshot(
            userRef,
            (snap) => {
              // Resolve any in-flight registration display name by normalized email or UID
              const emailKey = (firebaseUser.email || '').trim().toLowerCase();
              const pendingName = (emailKey && pendingRegistrationProfiles.get(emailKey))
                || pendingRegistrationProfiles.get(firebaseUser.uid)
                || null;

              if (snap.exists()) {
                const rawData = snap.data() as Record<string, any>;
                const repairPayload = buildAutoProvisionUserPayload({
                  uid: firebaseUser.uid,
                  email: firebaseUser.email,
                  authDisplayName: firebaseUser.displayName,
                  pendingDisplayName: pendingName,
                  existingData: rawData,
                  timestampValue: serverTimestamp(),
                });

                const docData: Record<string, any> = {
                  id: snap.id,
                  ...rawData,
                  ...(repairPayload?.displayName ? { displayName: repairPayload.displayName } : {}),
                  ...(repairPayload?.role ? { role: repairPayload.role } : {}),
                };

                setUserAuthState({
                  user: firebaseUser,
                  userData: docData,
                  isUserLoading: false,
                  userError: null,
                });

                if (!repairPayload) {
                  if (emailKey) clearPendingRegistrationDisplayName(emailKey);
                  clearPendingRegistrationDisplayName(firebaseUser.uid);
                  return;
                }

                if (repairedUids.has(firebaseUser.uid)) {
                  return;
                }
                repairedUids.add(firebaseUser.uid);

                setDoc(userRef, repairPayload, { merge: true })
                  .then(() => {
                    if (emailKey) clearPendingRegistrationDisplayName(emailKey);
                    clearPendingRegistrationDisplayName(firebaseUser.uid);
                  })
                  .catch((err) => {
                    repairedUids.delete(firebaseUser.uid);
                    console.error("Failed to repair incomplete user document:", err);
                  });
                return;
              }

              if (provisionedUids.has(firebaseUser.uid)) {
                return;
              }
              provisionedUids.add(firebaseUser.uid);

              const payload = buildAutoProvisionUserPayload({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                authDisplayName: firebaseUser.displayName,
                pendingDisplayName: pendingName,
                existingData: null,
                timestampValue: serverTimestamp(),
              });

              if (payload) {
                setDoc(userRef, payload, { merge: true })
                  .then(() => {
                    if (emailKey) clearPendingRegistrationDisplayName(emailKey);
                    clearPendingRegistrationDisplayName(firebaseUser.uid);
                  })
                  .catch((err) => {
                    provisionedUids.delete(firebaseUser.uid);
                    console.error("Failed to auto-provision user document:", err);
                  });
              }
            },
            (err) => {
              console.error("Error observing user document:", err);
            }
          );
        }
      },
      (error) => { // Auth listener error
        cleanupUserDocListener();
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, userData: null, isUserLoading: false, userError: error });
      }
    );

    return () => {
      cleanupUserDocListener();
      unsubscribeAuth();
    }; // Cleanup both listeners
  }, [auth, firestore]); // Depends on auth and firestore instances

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      userData: userAuthState.userData,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 * Throws error if core services are not available or used outside provider.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    userData: context.userData,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, userData, isUserLoading, userError.
 */
export const useUser = (): UserHookResult => { // Renamed from useAuthUser
  const { user, userData, isUserLoading, userError } = useFirebase(); // Leverages the main hook
  return { user, userData, isUserLoading, userError };
};
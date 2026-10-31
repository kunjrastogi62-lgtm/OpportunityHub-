import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  profileLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
  updatePreferences: (categories: string[], locations: string[]) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  intendedDestination: string | null;
  setIntendedDestination: (dest: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  // Initialize and observe Auth state
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        setProfileLoading(true);
        const userDocRef = doc(db, 'users', user.uid);

        // First attempt a safe getDoc or listen to real-time updates
        try {
          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            // Provision initial user profile if absent (e.g. initial Google sign-in)
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              photoURL: user.photoURL || null,
              preferredCategories: ['Internship', 'Full-Time'],
              preferredLocations: ['Remote'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          } else {
            setUserProfile(docSnap.data() as UserProfile);
          }
        } catch (err) {
          console.warn('Initial profile fetch warning:', err);
        }

        // Attach defensive snapshot listener with error callback
        unsubscribeProfile = onSnapshot(
          userDocRef,
          (snapshot) => {
            if (snapshot.exists()) {
              setUserProfile(snapshot.data() as UserProfile);
            }
            setProfileLoading(false);
          },
          (error) => {
            setProfileLoading(false);
            console.error('Snapshot error for user profile:', error);
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
          }
        );
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
        setProfileLoading(false);
      }

      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Login with Email/Password and configurable persistence
  const login = async (email: string, password: string, rememberMe = true) => {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    await signInWithEmailAndPassword(auth, email, password);
  };

  // Register new account with Email/Password
  const register = async (email: string, password: string, fullName: string) => {
    // 1. Create account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Set user display name in Firebase Auth
    if (fullName) {
      await updateProfile(user, { displayName: fullName.trim() });
    }

    // 3. Send email verification
    try {
      await sendEmailVerification(user);
    } catch (verifError) {
      console.warn('Failed to send verification email automatically:', verifError);
    }

    // 4. Create user profile in Firestore
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: fullName.trim() || email.split('@')[0],
      email: user.email || email,
      photoURL: null,
      preferredCategories: [],
      preferredLocations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile);
    } catch (dbError) {
      handleFirestoreError(dbError, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Google Sign-In
  const loginWithGoogle = async () => {
    // Always ensure local persistence for seamless Google sign-in
    await setPersistence(auth, browserLocalPersistence);
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if Firestore user record exists
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (!docSnap.exists()) {
        const newProfile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          photoURL: user.photoURL || null,
          preferredCategories: ['Internship', 'Fellowship'],
          preferredLocations: ['Remote'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
      } else {
        // Update without overwriting user preferences
        await updateDoc(userDocRef, {
          displayName: user.displayName || docSnap.data().displayName,
          photoURL: user.photoURL || docSnap.data().photoURL || null,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Resend Verification Email
  const resendVerificationEmail = async () => {
    if (!auth.currentUser) throw new Error('No user is currently signed in.');
    await sendEmailVerification(auth.currentUser);
  };

  // Refresh User State (to check emailVerified status)
  const reloadUser = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    // Clone prototype chain and properties to guarantee React triggers re-render
    const freshUser = Object.assign(
      Object.create(Object.getPrototypeOf(auth.currentUser)),
      auth.currentUser
    );
    setCurrentUser(freshUser);
    return auth.currentUser.emailVerified;
  };

  // Update Career Preferences in Firestore
  const updatePreferences = async (categories: string[], locations: string[]) => {
    if (!currentUser) throw new Error('You must be logged in to update preferences.');
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        preferredCategories: categories,
        preferredLocations: locations,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              preferredCategories: categories,
              preferredLocations: locations,
              updatedAt: new Date().toISOString(),
            }
          : null
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  // Update Display Name
  const updateDisplayName = async (name: string) => {
    if (!currentUser) throw new Error('You must be logged in.');
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Display name cannot be empty.');

    await updateProfile(currentUser, { displayName: trimmed });
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, {
        displayName: trimmed,
        updatedAt: new Date().toISOString(),
      });
      setUserProfile((prev) => (prev ? { ...prev, displayName: trimmed } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        profileLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        reloadUser,
        updatePreferences,
        updateDisplayName,
        intendedDestination,
        setIntendedDestination,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

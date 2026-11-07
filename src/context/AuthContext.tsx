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
import { UserProfile, AccountType } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  profileLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ user: User; profile: UserProfile | null }>;
  register: (
    email: string,
    password: string,
    fullName: string,
    accountType?: AccountType,
    companyName?: string,
    companyWebsite?: string
  ) => Promise<UserProfile>;
  loginWithGoogle: (preferredRole?: AccountType) => Promise<UserProfile | null>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<boolean>;
  updatePreferences: (categories: string[], locations: string[]) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  updateCompanyProfile: (companyName: string, companyWebsite?: string) => Promise<void>;
  intendedDestination: string | null;
  setIntendedDestination: (dest: string | null) => void;
}

const SUPER_ADMIN_EMAIL = 'kunjrastogi62@gmail.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [profileLoading, setProfileLoading] = useState<boolean>(false);
  const [intendedDestination, setIntendedDestination] = useState<string | null>(null);

  const isAdmin = Boolean(
    currentUser?.email &&
    currentUser.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()
  );

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
          // If super admin email, guarantee admin document exists in Firestore
          if (user.email && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase()) {
            const adminDocRef = doc(db, 'admins', user.uid);
            setDoc(adminDocRef, {
              uid: user.uid,
              email: user.email.toLowerCase(),
              role: 'admin',
              updatedAt: new Date().toISOString(),
            }, { merge: true }).catch((err) => console.warn('Admin record auto-provision note:', err));
          }

          const docSnap = await getDoc(userDocRef);
          if (!docSnap.exists()) {
            // Provision initial user profile if absent (e.g. initial Google sign-in)
            const initialProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              photoURL: user.photoURL || null,
              accountType: 'employee',
              isAdmin: user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase(),
              preferredCategories: ['Internship', 'Full-Time'],
              preferredLocations: ['Remote'],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, initialProfile);
            setUserProfile(initialProfile);
          } else {
            const existing = docSnap.data() as UserProfile;
            if (user.email?.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() && !existing.isAdmin) {
              existing.isAdmin = true;
              updateDoc(userDocRef, { isAdmin: true }).catch(() => {});
            }
            setUserProfile(existing);
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
  const login = async (email: string, password: string, rememberMe = true): Promise<{ user: User; profile: UserProfile | null }> => {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    let profile: UserProfile | null = null;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        profile = docSnap.data() as UserProfile;
        setUserProfile(profile);
      }
    } catch (e) {
      console.warn('Login profile fetch note:', e);
    }

    return { user, profile };
  };

  // Register new account with Email/Password & Role
  const register = async (
    email: string,
    password: string,
    fullName: string,
    accountType: AccountType = 'employee',
    companyName?: string,
    companyWebsite?: string
  ): Promise<UserProfile> => {
    // 1. Create account in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Set user display name in Firebase Auth
    const resolvedName = fullName.trim() || (accountType === 'company' && companyName ? companyName.trim() : email.split('@')[0]);
    if (resolvedName) {
      await updateProfile(user, { displayName: resolvedName });
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
      displayName: resolvedName,
      email: user.email || email,
      photoURL: null,
      accountType,
      ...(accountType === 'company' && companyName ? { companyName: companyName.trim() } : {}),
      ...(accountType === 'company' && companyWebsite ? { companyWebsite: companyWebsite.trim() } : {}),
      preferredCategories: accountType === 'company' ? ['Full-Time', 'Internship'] : ['Internship', 'Full-Time'],
      preferredLocations: ['Remote'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', user.uid), newProfile);
      setUserProfile(newProfile);
      return newProfile;
    } catch (dbError) {
      handleFirestoreError(dbError, OperationType.WRITE, `users/${user.uid}`);
      return newProfile;
    }
  };

  // Google Sign-In with Role support
  const loginWithGoogle = async (preferredRole: AccountType = 'employee'): Promise<UserProfile | null> => {
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
          accountType: preferredRole,
          preferredCategories: ['Internship', 'Fellowship'],
          preferredLocations: ['Remote'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
        return newProfile;
      } else {
        const existingData = docSnap.data() as UserProfile;
        await updateDoc(userDocRef, {
          displayName: user.displayName || existingData.displayName,
          photoURL: user.photoURL || existingData.photoURL || null,
          updatedAt: new Date().toISOString(),
        });
        setUserProfile(existingData);
        return existingData;
      }
    } catch (dbErr) {
      handleFirestoreError(dbErr, OperationType.WRITE, `users/${user.uid}`);
      return null;
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

  // Update Company Profile (Name & Website)
  const updateCompanyProfile = async (companyName: string, companyWebsite?: string) => {
    if (!currentUser) throw new Error('You must be logged in.');
    const trimmedName = companyName.trim();
    if (!trimmedName) throw new Error('Company name cannot be empty.');

    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      const updates: { companyName: string; companyWebsite?: string; updatedAt: string } = {
        companyName: trimmedName,
        updatedAt: new Date().toISOString(),
      };
      if (companyWebsite !== undefined) {
        updates.companyWebsite = companyWebsite.trim();
      }
      await updateDoc(userDocRef, updates);
      setUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
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
        updateCompanyProfile,
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

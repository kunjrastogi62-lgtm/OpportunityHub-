import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SavedOpportunity, ApplicationTrackerItem, Opportunity } from '../types';

interface UserDataContextType {
  savedOpportunities: SavedOpportunity[];
  applications: ApplicationTrackerItem[];
  loading: boolean;
  saveOpportunity: (opp: Opportunity) => Promise<void>;
  removeSavedOpportunity: (oppId: string) => Promise<void>;
  isOpportunitySaved: (oppId: string) => boolean;
  addApplication: (item: Omit<ApplicationTrackerItem, 'id' | 'userId' | 'updatedAt'>) => Promise<void>;
  updateApplicationStatus: (appId: string, status: ApplicationTrackerItem['status'], notes?: string) => Promise<void>;
  deleteApplication: (appId: string) => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export const UserDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [applications, setApplications] = useState<ApplicationTrackerItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!currentUser) {
      setSavedOpportunities([]);
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const userId = currentUser.uid;
    const savedPath = `users/${userId}/saved_opportunities`;
    const appsPath = `users/${userId}/applications`;

    const savedColRef = collection(db, 'users', userId, 'saved_opportunities');
    const appsColRef = collection(db, 'users', userId, 'applications');

    // Listener for saved opportunities
    const unsubSaved = onSnapshot(
      savedColRef,
      (snapshot) => {
        const items: SavedOpportunity[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as SavedOpportunity);
        });
        setSavedOpportunities(items);
      },
      (error) => {
        console.error('Error fetching saved opportunities:', error);
        handleFirestoreError(error, OperationType.GET, savedPath);
      }
    );

    // Listener for applications tracker
    const unsubApps = onSnapshot(
      appsColRef,
      (snapshot) => {
        const items: ApplicationTrackerItem[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as ApplicationTrackerItem);
        });
        // Sort by applied date descending
        items.sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime());
        setApplications(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching applications:', error);
        handleFirestoreError(error, OperationType.GET, appsPath);
        setLoading(false);
      }
    );

    return () => {
      unsubSaved();
      unsubApps();
    };
  }, [currentUser]);

  const saveOpportunity = async (opp: Opportunity) => {
    if (!currentUser) throw new Error('Sign in required to bookmark opportunities.');
    const docPath = `users/${currentUser.uid}/saved_opportunities/${opp.id}`;
    const payload: SavedOpportunity = {
      id: opp.id,
      userId: currentUser.uid,
      title: opp.title,
      company: opp.company,
      location: opp.location || '',
      type: opp.category || '',
      deadline: opp.deadline || '',
      savedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'saved_opportunities', opp.id), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const removeSavedOpportunity = async (oppId: string) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/saved_opportunities/${oppId}`;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'saved_opportunities', oppId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  const isOpportunitySaved = (oppId: string): boolean => {
    return savedOpportunities.some((item) => item.id === oppId);
  };

  const addApplication = async (
    item: Omit<ApplicationTrackerItem, 'id' | 'userId' | 'updatedAt'>
  ) => {
    if (!currentUser) throw new Error('Sign in required to track applications.');
    const newId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docPath = `users/${currentUser.uid}/applications/${newId}`;

    const payload: ApplicationTrackerItem = {
      id: newId,
      userId: currentUser.uid,
      opportunityTitle: item.opportunityTitle,
      organization: item.organization,
      status: item.status,
      appliedDate: item.appliedDate,
      notes: item.notes || '',
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'users', currentUser.uid, 'applications', newId), payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const updateApplicationStatus = async (
    appId: string,
    status: ApplicationTrackerItem['status'],
    notes?: string
  ) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/applications/${appId}`;
    try {
      const updateData: Partial<ApplicationTrackerItem> = {
        status,
        updatedAt: new Date().toISOString(),
      };
      if (notes !== undefined) {
        updateData.notes = notes;
      }
      await updateDoc(doc(db, 'users', currentUser.uid, 'applications', appId), updateData);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  const deleteApplication = async (appId: string) => {
    if (!currentUser) return;
    const docPath = `users/${currentUser.uid}/applications/${appId}`;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'applications', appId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  return (
    <UserDataContext.Provider
      value={{
        savedOpportunities,
        applications,
        loading,
        saveOpportunity,
        removeSavedOpportunity,
        isOpportunitySaved,
        addApplication,
        updateApplicationStatus,
        deleteApplication,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
};

export const useUserData = () => {
  const context = useContext(UserDataContext);
  if (!context) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
};

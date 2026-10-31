import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  getDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { VideoResource, VideoCategory } from '../types';
import { INITIAL_VIDEOS } from '../data/seedVideos';

interface VideoResourcesContextType {
  videos: VideoResource[];
  loading: boolean;
  isAdmin: boolean;
  addVideo: (video: {
    videoUrl: string;
    videoId: string;
    title: string;
    description?: string;
    category: VideoCategory;
    thumbnailUrl: string;
    channelTitle?: string;
    status: 'published' | 'draft';
  }) => Promise<void>;
  updateVideo: (
    id: string,
    updates: Partial<Omit<VideoResource, 'id' | 'createdAt' | 'createdBy'>>
  ) => Promise<void>;
  togglePublishStatus: (id: string, currentStatus: 'published' | 'draft') => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
}

const VideoResourcesContext = createContext<VideoResourcesContextType | undefined>(undefined);

// Primary administrator emails
const SUPER_ADMIN_EMAILS = ['kunjrastogi62@gmail.com'];

export const VideoResourcesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<VideoResource[]>(INITIAL_VIDEOS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Check administrator authorization
  useEffect(() => {
    let isMounted = true;

    async function checkAdminStatus() {
      if (!currentUser) {
        if (isMounted) setIsAdmin(false);
        return;
      }

      // Check if user's email matches the configured admin email
      if (currentUser.email && SUPER_ADMIN_EMAILS.includes(currentUser.email.toLowerCase())) {
        if (isMounted) setIsAdmin(true);
        return;
      }

      // Or check if user exists in the admins/ collection
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (isMounted) {
          setIsAdmin(adminDoc.exists());
        }
      } catch (err) {
        if (isMounted) setIsAdmin(false);
      }
    }

    checkAdminStatus();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  // Real-time synchronization of video resources
  useEffect(() => {
    const colRef = collection(db, 'video_resources');
    const path = 'video_resources';

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        if (snapshot.empty) {
          // If Firestore collection has no items yet, use high-quality seed videos
          setVideos(INITIAL_VIDEOS);
        } else {
          const list: VideoResource[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as VideoResource;
            // Public non-admins only see published videos
            if (isAdmin || data.status === 'published') {
              list.push(data);
            }
          });
          // Sort by createdAt descending
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setVideos(list);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Video resources snapshot info:', error);
        // Fall back gracefully to curated initial videos so visitors always have content
        setVideos(INITIAL_VIDEOS);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const addVideo = async (video: {
    videoUrl: string;
    videoId: string;
    title: string;
    description?: string;
    category: VideoCategory;
    thumbnailUrl: string;
    channelTitle?: string;
    status: 'published' | 'draft';
  }) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Unauthorized: Only administrators can create video resources.');
    }

    const newId = `vid_${Date.now()}_${video.videoId}`;
    const docPath = `video_resources/${newId}`;

    const payload: VideoResource = {
      id: newId,
      videoUrl: video.videoUrl.trim(),
      videoId: video.videoId.trim(),
      title: video.title.trim(),
      description: video.description?.trim() || '',
      category: video.category,
      thumbnailUrl: video.thumbnailUrl.trim(),
      channelTitle: video.channelTitle?.trim() || '',
      status: video.status,
      createdBy: currentUser.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, 'video_resources', newId), payload);
      // Immediately reflect in local state for optimistic responsiveness
      setVideos((prev) => [payload, ...prev.filter((v) => v.id !== newId)]);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const updateVideo = async (
    id: string,
    updates: Partial<Omit<VideoResource, 'id' | 'createdAt' | 'createdBy'>>
  ) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Unauthorized: Only administrators can modify video resources.');
    }

    const docPath = `video_resources/${id}`;
    const cleanUpdates = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await updateDoc(doc(db, 'video_resources', id), cleanUpdates);
      setVideos((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...cleanUpdates } : v))
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  const togglePublishStatus = async (id: string, currentStatus: 'published' | 'draft') => {
    const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
    await updateVideo(id, { status: nextStatus });
  };

  const deleteVideo = async (id: string) => {
    if (!currentUser || !isAdmin) {
      throw new Error('Unauthorized: Only administrators can delete video resources.');
    }

    const docPath = `video_resources/${id}`;
    try {
      await deleteDoc(doc(db, 'video_resources', id));
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  return (
    <VideoResourcesContext.Provider
      value={{
        videos,
        loading,
        isAdmin,
        addVideo,
        updateVideo,
        togglePublishStatus,
        deleteVideo,
      }}
    >
      {children}
    </VideoResourcesContext.Provider>
  );
};

export const useVideoResources = () => {
  const context = useContext(VideoResourcesContext);
  if (!context) {
    throw new Error('useVideoResources must be used within a VideoResourcesProvider');
  }
  return context;
};

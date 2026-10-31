import React, { useState } from 'react';
import {
  Youtube,
  Search,
  Plus,
  Filter,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Lock,
  Play
} from 'lucide-react';
import { useVideoResources } from '../context/VideoResourcesContext';
import { useAuth } from '../context/AuthContext';
import { VideoCard } from './VideoCard';
import { AdminVideoModal } from './AdminVideoModal';
import { VideoPlayerModal } from './VideoPlayerModal';
import { VideoResource, VideoCategory } from '../types';
import { VIDEO_CATEGORIES } from '../lib/youtube';

interface VideoResourcesViewProps {
  onOpenAuth: (mode: 'login') => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const VideoResourcesView: React.FC<VideoResourcesViewProps> = ({ onOpenAuth, onToast }) => {
  const { videos, loading, isAdmin, addVideo, updateVideo, togglePublishStatus, deleteVideo } = useVideoResources();
  const { currentUser } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<VideoResource | null>(null);
  const [previewVideo, setPreviewVideo] = useState<VideoResource | null>(null);

  // Filter videos based on category and search query
  const filteredVideos = videos.filter((vid) => {
    // If not admin, only show published
    if (!isAdmin && vid.status !== 'published') return false;

    const matchesCategory = selectedCategory === 'All' || vid.category === selectedCategory;
    const matchesSearch =
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vid.description && vid.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (vid.channelTitle && vid.channelTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      vid.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const handleSaveVideo = async (videoData: {
    videoUrl: string;
    videoId: string;
    title: string;
    description?: string;
    category: VideoCategory;
    thumbnailUrl: string;
    channelTitle?: string;
    status: 'published' | 'draft';
  }) => {
    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, videoData);
        onToast(`"${videoData.title}" updated successfully!`, 'success');
      } else {
        await addVideo(videoData);
        onToast(`"${videoData.title}" added to Video Resources!`, 'success');
      }
      setIsAddModalOpen(false);
      setEditingVideo(null);
    } catch (err: any) {
      onToast(err?.message || 'Failed to save video entry', 'error');
      throw err;
    }
  };

  const handleTogglePublish = async (video: VideoResource) => {
    try {
      await togglePublishStatus(video.id, video.status);
      const newStatus = video.status === 'published' ? 'Draft' : 'Published';
      onToast(`Video set to ${newStatus}.`, 'info');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update publication status', 'error');
    }
  };

  const handleDelete = async (video: VideoResource) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${video.title}"?`);
    if (!confirmDelete) return;

    try {
      await deleteVideo(video.id);
      onToast('Video resource deleted.', 'info');
    } catch (err: any) {
      onToast(err?.message || 'Failed to delete video', 'error');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-indigo-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Youtube className="w-4 h-4 text-red-500" />
            Curated YouTube Learning Resources
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Level up your career with curated video guides.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            High-impact tutorials, interview breakdowns, scholarship guidance, and coding roadmaps from top YouTube creators.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-slate-950/60 p-2 border border-slate-700/50">
              <Search className="w-5 h-5 text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Search videos by title, channel (e.g. CS50, freeCodeCamp), or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="mr-2 text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded-md"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog & Admin Toolbar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Admin Bar */}
        <div className="mb-6 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                {isAdmin ? 'Administrator Access Verified' : 'Public Visitor Mode'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isAdmin
                  ? 'You have permission to add, edit, publish, and delete YouTube resources in Firestore'
                  : 'Visitors can watch and browse published videos freely without signing in'}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <button
              onClick={() => {
                setEditingVideo(null);
                setIsAddModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md shadow-red-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add YouTube Video
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Admin?</span>
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                Sign in to manage
              </button>
            </div>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-8">
          <span className="text-xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Category:
          </span>
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Videos ({videos.length})
          </button>
          {VIDEO_CATEGORIES.map((cat) => {
            const count = videos.filter((v) => (isAdmin || v.status === 'published') && v.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat} {count > 0 ? `(${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Video Grid */}
        {filteredVideos.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs">
            <Youtube className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No videos found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery
                ? `No video matches your search "${searchQuery}". Try a different keyword.`
                : 'No videos currently available under this category.'}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
              >
                Reset Filters
              </button>
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingVideo(null);
                    setIsAddModalOpen(true);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Video
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                isAdmin={isAdmin}
                onPreview={(v) => setPreviewVideo(v)}
                onEdit={(v) => {
                  setEditingVideo(v);
                  setIsAddModalOpen(true);
                }}
                onTogglePublish={handleTogglePublish}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Add / Edit Video Modal (Admin Only) */}
      <AdminVideoModal
        isOpen={isAddModalOpen}
        editingVideo={editingVideo}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingVideo(null);
        }}
        onSave={handleSaveVideo}
      />

      {/* Video Player Modal (Public Preview) */}
      <VideoPlayerModal
        video={previewVideo}
        onClose={() => setPreviewVideo(null)}
      />
    </div>
  );
};

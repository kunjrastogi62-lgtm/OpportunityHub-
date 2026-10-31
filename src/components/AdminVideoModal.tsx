import React, { useState, useEffect } from 'react';
import {
  X,
  Youtube,
  Link,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Tag,
  FileText,
  Eye,
  Image as ImageIcon
} from 'lucide-react';
import { VideoResource, VideoCategory } from '../types';
import {
  extractYouTubeVideoId,
  getYouTubeThumbnail,
  fetchYouTubeOEmbed,
  VIDEO_CATEGORIES
} from '../lib/youtube';

interface AdminVideoModalProps {
  isOpen: boolean;
  editingVideo: VideoResource | null;
  onClose: () => void;
  onSave: (videoData: {
    videoUrl: string;
    videoId: string;
    title: string;
    description?: string;
    category: VideoCategory;
    thumbnailUrl: string;
    channelTitle?: string;
    status: 'published' | 'draft';
  }) => Promise<void>;
}

export const AdminVideoModal: React.FC<AdminVideoModalProps> = ({
  isOpen,
  editingVideo,
  onClose,
  onSave,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<VideoCategory>('Career Guidance');
  const [channelTitle, setChannelTitle] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');

  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingVideo) {
      setVideoUrl(editingVideo.videoUrl);
      setExtractedId(editingVideo.videoId);
      setTitle(editingVideo.title);
      setDescription(editingVideo.description || '');
      setCategory(editingVideo.category);
      setChannelTitle(editingVideo.channelTitle || '');
      setStatus(editingVideo.status);
    } else {
      setVideoUrl('');
      setExtractedId(null);
      setTitle('');
      setDescription('');
      setCategory('Jobs');
      setChannelTitle('');
      setStatus('published');
    }
    setError(null);
  }, [editingVideo, isOpen]);

  // Handle URL change & real-time ID extraction
  const handleUrlChange = async (url: string) => {
    setVideoUrl(url);
    setError(null);

    const id = extractYouTubeVideoId(url);
    setExtractedId(id);

    // If a valid ID is detected and we are not in edit mode with existing title, try auto-filling metadata
    if (id && (!title || !editingVideo)) {
      setFetchingMeta(true);
      try {
        const meta = await fetchYouTubeOEmbed(url);
        if (meta?.title && !title) {
          setTitle(meta.title);
        }
        if (meta?.author_name && !channelTitle) {
          setChannelTitle(meta.author_name);
        }
      } catch (err) {
        // Fallback silently to manual entry
      } finally {
        setFetchingMeta(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    const id = extractedId || extractYouTubeVideoId(videoUrl);
    if (!id) {
      setError('Please provide a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title for the video entry.');
      return;
    }

    setSubmitting(true);
    try {
      const thumbnailUrl = getYouTubeThumbnail(id, true);
      await onSave({
        videoUrl: videoUrl.trim(),
        videoId: id,
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnailUrl,
        channelTitle: channelTitle.trim(),
        status,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save video resource to Firestore.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const previewThumbnail = extractedId ? getYouTubeThumbnail(extractedId, true) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-100 p-6 sm:p-8 my-8 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100">
            <Youtube className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {editingVideo ? 'Edit YouTube Video' : 'Add Public YouTube Video'}
            </h2>
            <p className="text-xs text-slate-500">
              Add career guidance, tutorials, or exam prep videos from any creator
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* YouTube Video URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                YouTube Video URL <span className="text-red-500">*</span>
              </label>
              {fetchingMeta && (
                <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Detecting video info...
                </span>
              )}
            </div>

            <div className="relative">
              <Link className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                value={videoUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
              />
            </div>
            {extractedId && (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Valid YouTube ID: <code className="bg-emerald-50 px-1 rounded">{extractedId}</code>
              </p>
            )}
          </div>

          {/* Live Thumbnail Preview */}
          {previewThumbnail && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
              <img
                src={previewThumbnail}
                alt="Thumbnail preview"
                className="w-24 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
              />
              <div className="text-xs text-slate-600 overflow-hidden">
                <p className="font-bold text-slate-800 truncate">Official Thumbnail Preview</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Fetched from YouTube CDN without re-uploading</p>
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Video Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Harvard CS50 – Full Computer Science Course"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Category & Channel */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VideoCategory)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-slate-800"
              >
                {VIDEO_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel / Creator Name (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. freeCodeCamp.org"
                value={channelTitle}
                onChange={(e) => setChannelTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
              />
            </div>
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Description / Summary (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Brief summary explaining why this video is valuable for students and job seekers..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
            />
          </div>

          {/* Publication Status */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Publication Status</label>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="published"
                  checked={status === 'published'}
                  onChange={() => setStatus('published')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="flex items-center gap-1 text-emerald-700 font-bold">
                  <Eye className="w-3.5 h-3.5" /> Published (Visible to all visitors)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={status === 'draft'}
                  onChange={() => setStatus('draft')}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-amber-700 font-semibold">Draft (Admin only)</span>
              </label>
            </div>
          </div>

          {/* Submit & Cancel */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving to Firestore...
                </>
              ) : (
                editingVideo ? 'Update Video Entry' : 'Add to Video Resources'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { X, ExternalLink, Youtube, Building, Tag } from 'lucide-react';
import { VideoResource } from '../types';
import { getYouTubeEmbedUrl, getYouTubeWatchUrl } from '../lib/youtube';

interface VideoPlayerModalProps {
  video: VideoResource | null;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ video, onClose }) => {
  if (!video) return null;

  const embedUrl = getYouTubeEmbedUrl(video.videoId);
  const watchUrl = video.videoUrl || getYouTubeWatchUrl(video.videoId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden relative my-8 animate-in fade-in zoom-in-95">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/80 p-2 rounded-full transition backdrop-blur-md"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Video Player Iframe */}
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>

        {/* Video Info Body */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {video.category}
            </span>

            {video.channelTitle && (
              <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                <Youtube className="w-4 h-4 text-red-600" />
                Original Creator: <strong className="text-slate-800">{video.channelTitle}</strong>
              </span>
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {video.title}
          </h2>

          <p className="mt-3 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {video.description || 'No additional summary provided.'}
          </p>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Content owned by original creator. OpportunityHub links directly to public YouTube videos.
            </p>

            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition shadow-sm active:scale-98"
            >
              <Youtube className="w-4 h-4" />
              <span>Watch on YouTube</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  ExternalLink,
  Play,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Youtube,
  Clock,
  Sparkles
} from 'lucide-react';
import { VideoResource } from '../types';
import { getYouTubeWatchUrl } from '../lib/youtube';

interface VideoCardProps {
  video: VideoResource;
  isAdmin: boolean;
  onPreview: (video: VideoResource) => void;
  onEdit?: (video: VideoResource) => void;
  onTogglePublish?: (video: VideoResource) => void;
  onDelete?: (video: VideoResource) => void;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Jobs: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Internships: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  Scholarships: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Coding: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Career Guidance': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  'Competitive Exams': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  Freelancing: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  isAdmin,
  onPreview,
  onEdit,
  onTogglePublish,
  onDelete,
}) => {
  const watchUrl = video.videoUrl || getYouTubeWatchUrl(video.videoId);
  const colorStyle = CATEGORY_COLORS[video.category] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:border-slate-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      <div>
        {/* Thumbnail Container with Play Overlay */}
        <div className="relative aspect-video w-full overflow-hidden bg-slate-900">
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback to standard YouTube thumbnail if high-res is missing
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
            }}
          />

          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20 opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Center Play Button for Modal Preview */}
          <button
            onClick={() => onPreview(video)}
            className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform active:scale-95 hover:bg-red-600"
            aria-label="Preview video"
            title="Preview video"
          >
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </button>

          {/* Category Pill on top left */}
          <div className="absolute top-3 left-3">
            <span
              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-xs backdrop-blur-md ${colorStyle.bg}/90 ${colorStyle.text} ${colorStyle.border}`}
            >
              {video.category}
            </span>
          </div>

          {/* Admin publication badge on top right */}
          {isAdmin && (
            <div className="absolute top-3 right-3">
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider backdrop-blur-md ${
                  video.status === 'published'
                    ? 'bg-emerald-500/90 text-white border-emerald-400'
                    : 'bg-amber-500/90 text-white border-amber-400'
                }`}
              >
                {video.status}
              </span>
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="p-5">
          {video.channelTitle && (
            <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-1.5 truncate">
              <Youtube className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span>{video.channelTitle}</span>
            </p>
          )}

          <h3
            onClick={() => onPreview(video)}
            className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2 cursor-pointer"
            title={video.title}
          >
            {video.title}
          </h3>

          <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
            {video.description || 'Curated career guidance and tutorial resource.'}
          </p>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex flex-col gap-3">
        {/* Watch on YouTube button (Opens in new browser tab, keeping OpportunityHub open) */}
        <div className="flex items-center justify-between gap-2">
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs active:scale-98 group/btn"
          >
            <Youtube className="w-4 h-4 text-red-500 group-hover/btn:scale-110 transition-transform" />
            <span>Watch on YouTube</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
          </a>

          <button
            onClick={() => onPreview(video)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition"
            title="Preview on page"
          >
            Preview
          </button>
        </div>

        {/* Admin Controls */}
        {isAdmin && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Admin:</span>
            <div className="flex items-center gap-1">
              {onTogglePublish && (
                <button
                  onClick={() => onTogglePublish(video)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                  title={video.status === 'published' ? 'Unpublish (set to draft)' : 'Publish video'}
                >
                  {video.status === 'published' ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                </button>
              )}

              {onEdit && (
                <button
                  onClick={() => onEdit(video)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
                  title="Edit entry"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}

              {onDelete && (
                <button
                  onClick={() => onDelete(video)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Delete entry"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import {
  X,
  Bookmark,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  DollarSign,
  Check,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Opportunity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  onClose: () => void;
  onOpenAuth: (mode: 'login') => void;
  onTrackInPipeline: (opp: Opportunity) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const OpportunityDetailModal: React.FC<OpportunityDetailModalProps> = ({
  opportunity,
  onClose,
  onOpenAuth,
  onTrackInPipeline,
  onToast,
}) => {
  const { currentUser } = useAuth();
  const { isOpportunitySaved, saveOpportunity, removeSavedOpportunity } = useUserData();

  if (!opportunity) return null;

  const isSaved = isOpportunitySaved(opportunity.id);

  const handleToggleSave = async () => {
    if (!currentUser) {
      onClose();
      onOpenAuth('login');
      onToast('Please sign in to save opportunities to your profile.', 'info');
      return;
    }

    try {
      if (isSaved) {
        await removeSavedOpportunity(opportunity.id);
        onToast('Removed from saved bookmarks.', 'info');
      } else {
        await saveOpportunity(opportunity);
        onToast('Opportunity saved to your profile!', 'success');
      }
    } catch (err: any) {
      onToast(err?.message || 'Failed to update bookmark', 'error');
    }
  };

  const handleTrack = () => {
    if (!currentUser) {
      onClose();
      onOpenAuth('login');
      onToast('Please sign in to track applications in your pipeline.', 'info');
      return;
    }
    onTrackInPipeline(opportunity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-slate-100 my-8 relative animate-in fade-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="pr-8">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              {opportunity.category}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              {opportunity.workType}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {opportunity.title}
          </h2>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1.5 text-slate-800">
              <Building className="w-4 h-4 text-indigo-500" />
              {opportunity.company}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-slate-400" />
              {opportunity.location}
            </span>
            <span className="flex items-center gap-1.5 text-emerald-700">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              {opportunity.stipendOrSalary}
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <Calendar className="w-4 h-4 text-amber-600" />
              Deadline: {opportunity.deadline}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-5 text-sm text-slate-600 border-t border-slate-100 pt-5">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Overview & Scope
            </h4>
            <p className="leading-relaxed">{opportunity.description}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Eligibility & Key Requirements
            </h4>
            <ul className="space-y-1.5">
              {opportunity.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              Domain Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {opportunity.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleToggleSave}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition border ${
              isSaved
                ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600 text-amber-600' : ''}`} />
            {isSaved ? 'Saved to Profile' : 'Save Opportunity'}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTrack}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm transition active:scale-95"
            >
              <Briefcase className="w-4 h-4" />
              Track in Pipeline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

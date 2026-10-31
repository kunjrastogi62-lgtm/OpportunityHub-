import React, { useState } from 'react';
import {
  Search,
  Bookmark,
  Calendar,
  Building,
  MapPin,
  DollarSign,
  Sparkles,
  ArrowRight,
  Filter,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { SAMPLE_OPPORTUNITIES, CATEGORIES, WORK_TYPES } from '../data/opportunities';
import { Opportunity } from '../types';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';

interface ExploreViewProps {
  onSelectOpportunity: (opp: Opportunity) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  onSelectOpportunity,
  onOpenAuth,
  onToast,
}) => {
  const { currentUser, setIntendedDestination } = useAuth();
  const { isOpportunitySaved, saveOpportunity, removeSavedOpportunity } = useUserData();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedWorkType, setSelectedWorkType] = useState<string>('All');

  const filteredOpportunities = SAMPLE_OPPORTUNITIES.filter((opp) => {
    const matchesSearch =
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'All' || opp.category === selectedCategory;

    const matchesWorkType =
      selectedWorkType === 'All' || opp.workType === selectedWorkType;

    return matchesSearch && matchesCategory && matchesWorkType;
  });

  const handleToggleSave = async (e: React.MouseEvent, opp: Opportunity) => {
    e.stopPropagation();
    if (!currentUser) {
      setIntendedDestination('Saved Opportunities');
      onOpenAuth('login');
      onToast('Please sign in to save opportunities to your personal profile.', 'info');
      return;
    }

    try {
      if (isOpportunitySaved(opp.id)) {
        await removeSavedOpportunity(opp.id);
        onToast(`Removed "${opp.title}" from your bookmarks.`, 'info');
      } else {
        await saveOpportunity(opp);
        onToast(`Saved "${opp.title}" to your bookmarks!`, 'success');
      }
    } catch (err: any) {
      onToast(err?.message || 'Failed to update saved opportunity', 'error');
    }
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-950 text-white pt-16 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold mb-4 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            Verified Opportunities & Live Tracking
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Discover frontier fellowships, grants, and tech careers.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-indigo-100/80 max-w-2xl mx-auto leading-relaxed">
            OpportunityHub organizes top fellowship programs, non-dilutive research grants, and high-impact
            tech roles with secure Firebase authentication and personalized tracking.
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto">
            <div className="relative flex items-center bg-white rounded-2xl shadow-xl shadow-indigo-950/50 p-2 border border-white/20">
              <Search className="w-5 h-5 text-slate-400 ml-3" />
              <input
                type="text"
                placeholder="Search by role, company (e.g. Anthropic, Stripe, MIT), or skill (e.g. AI, Python)..."
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

      {/* Main Catalog */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <span className="text-xs font-bold uppercase text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filter:
            </span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-500 font-medium">Work style:</span>
            <select
              value={selectedWorkType}
              onChange={(e) => setSelectedWorkType(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {WORK_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Showing {filteredOpportunities.length} Available Opportunities
          </p>
        </div>

        {/* Grid */}
        {filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
            <Search className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No matching opportunities</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or resetting filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedWorkType('All');
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opp) => {
              const isSaved = isOpportunitySaved(opp.id);
              return (
                <div
                  key={opp.id}
                  onClick={() => onSelectOpportunity(opp)}
                  className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                >
                  <div>
                    {/* Top Row: Category and Bookmark */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {opp.category}
                        </span>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {opp.workType}
                        </span>
                      </div>

                      <button
                        onClick={(e) => handleToggleSave(e, opp)}
                        className={`p-1.5 rounded-xl border transition ${
                          isSaved
                            ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                            : 'bg-white text-slate-400 border-slate-200 hover:text-slate-700 hover:border-slate-300'
                        }`}
                        title={isSaved ? 'Remove from saved' : 'Save opportunity'}
                      >
                        <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
                      </button>
                    </div>

                    {/* Title & Company */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition leading-snug line-clamp-2">
                      {opp.title}
                    </h3>

                    <p className="text-xs font-semibold text-slate-600 mt-2 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {opp.company}
                    </p>

                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {opp.location}
                    </p>

                    <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Tags */}
                    <div className="mt-4 flex flex-wrap gap-1">
                      {opp.tags.slice(0, 3).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
                    <span className="text-emerald-700 truncate max-w-[170px]">
                      {opp.stipendOrSalary}
                    </span>

                    <span className="text-indigo-600 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Details <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

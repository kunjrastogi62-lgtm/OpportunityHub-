import React, { useState } from 'react';
import {
  User,
  Bookmark,
  Briefcase,
  Sliders,
  Settings,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Check,
  Edit2,
  Calendar,
  Building,
  MapPin,
  Tag,
  Shield,
  LogOut,
  Loader2,
  AlertCircle,
  Copy,
  Mail,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { ApplicationTrackerItem } from '../types';
import { EmailVerificationBanner } from './EmailVerificationBanner';

const AVAILABLE_CATEGORIES = [
  'Internship',
  'Full-Time',
  'Fellowship',
  'Scholarship',
  'Grant',
  'AI & Machine Learning',
  'Distributed Systems',
  'Climate Tech',
  'Product Design',
  'Fintech',
  'Cybersecurity',
  'Quantum Computing'
];

const AVAILABLE_LOCATIONS = [
  'Remote',
  'Hybrid',
  'San Francisco, CA',
  'New York, NY',
  'Seattle, WA',
  'Cambridge, MA',
  'London, UK',
  'Global (Virtual)'
];

interface DashboardViewProps {
  initialSubTab?: 'overview' | 'saved' | 'applications' | 'preferences' | 'settings';
  onNavigateToExplore: () => void;
  onSelectOpportunityForDetails?: (oppId: string) => void;
  onToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  initialSubTab = 'overview',
  onNavigateToExplore,
  onSelectOpportunityForDetails,
  onToast,
}) => {
  const { currentUser, userProfile, updatePreferences, updateDisplayName, logout } = useAuth();
  const {
    savedOpportunities,
    applications,
    removeSavedOpportunity,
    addApplication,
    updateApplicationStatus,
    deleteApplication,
  } = useUserData();

  const [activeTab, setActiveTab] = useState<'overview' | 'saved' | 'applications' | 'preferences' | 'settings'>(
    initialSubTab
  );

  // Profile Edit State
  const [displayNameInput, setDisplayNameInput] = useState(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [savingName, setSavingName] = useState(false);

  // Preferences State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    userProfile?.preferredCategories || ['Internship', 'Fellowship']
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    userProfile?.preferredLocations || ['Remote']
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Application Tracker Modal State
  const [addAppModalOpen, setAddAppModalOpen] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppStatus, setNewAppStatus] = useState<ApplicationTrackerItem['status']>('Applied');
  const [newAppDate, setNewAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAppNotes, setNewAppNotes] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Editing notes state
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Copy UID helper
  const [copiedUid, setCopiedUid] = useState(false);

  const handleCopyUid = () => {
    if (currentUser?.uid) {
      navigator.clipboard.writeText(currentUser.uid);
      setCopiedUid(true);
      setTimeout(() => setCopiedUid(false), 2000);
      onToast('User UID copied to clipboard', 'info');
    }
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim()) return;
    setSavingName(true);
    try {
      await updateDisplayName(displayNameInput.trim());
      onToast('Display name updated successfully!', 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update name', 'error');
    } finally {
      setSavingName(false);
    }
  };

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await updatePreferences(selectedCategories, selectedLocations);
      onToast('Career preferences saved to your profile!', 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to save preferences', 'error');
    } finally {
      setSavingPreferences(false);
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppTitle.trim() || !newAppCompany.trim()) {
      onToast('Title and organization are required.', 'error');
      return;
    }
    setSubmittingApp(true);
    try {
      await addApplication({
        opportunityTitle: newAppTitle.trim(),
        organization: newAppCompany.trim(),
        status: newAppStatus,
        appliedDate: newAppDate,
        notes: newAppNotes.trim(),
      });
      onToast('Application added to pipeline!', 'success');
      setAddAppModalOpen(false);
      setNewAppTitle('');
      setNewAppCompany('');
      setNewAppNotes('');
      setNewAppStatus('Applied');
    } catch (err: any) {
      onToast(err?.message || 'Failed to add application', 'error');
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleSaveNotes = async (appId: string, currentStatus: ApplicationTrackerItem['status']) => {
    try {
      await updateApplicationStatus(appId, currentStatus, editingNotesText);
      setEditingAppId(null);
      onToast('Notes updated successfully.', 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update notes', 'error');
    }
  };

  if (!currentUser) {
    return null;
  }

  const displayName = userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const isGoogleUser = currentUser.providerData.some((p) => p.providerId === 'google.com');

  const stats = {
    saved: savedOpportunities.length,
    applied: applications.filter((a) => a.status === 'Applied').length,
    interviewing: applications.filter((a) => a.status === 'Interviewing').length,
    offer: applications.filter((a) => a.status === 'Offer').length,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Verification Warning Card if unverified */}
      {!currentUser.emailVerified && !isGoogleUser && (
        <div className="mb-8">
          <EmailVerificationBanner
            variant="card"
            onSuccess={() => onToast('Email verified successfully!', 'success')}
          />
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={displayName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {displayName}
              </h1>
              {currentUser.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </span>
              )}

              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {isGoogleUser ? 'Google Account' : 'Email/Password'}
              </span>
            </div>

            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              {currentUser.email}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>UID: {currentUser.uid.slice(0, 12)}...</span>
              <button
                onClick={handleCopyUid}
                className="hover:text-indigo-600 transition flex items-center gap-1"
                title="Copy Full UID"
              >
                {copiedUid ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUid ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions in header */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => onNavigateToExplore()}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
          >
            <Compass className="w-4 h-4" />
            Explore More
          </button>
          <button
            onClick={() => {
              setAddAppModalOpen(true);
              setActiveTab('applications');
            }}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Track Application
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'saved'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bookmark className="w-4 h-4" />
          Saved Opportunities ({savedOpportunities.length})
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'applications'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Application Pipeline ({applications.length})
        </button>

        <button
          onClick={() => setActiveTab('preferences')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'preferences'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Career Preferences
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'settings'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Settings className="w-4 h-4" />
          Account Settings
        </button>
      </div>

      {/* Tab: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Bookmarked</span>
                <Bookmark className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.saved}</div>
              <p className="text-xs text-slate-400 mt-1">Saved for review</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Applied</span>
                <Briefcase className="w-4 h-4 text-sky-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.applied}</div>
              <p className="text-xs text-slate-400 mt-1">Applications submitted</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Interviewing</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.interviewing}</div>
              <p className="text-xs text-slate-400 mt-1">Active interview stages</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider">Offers</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-3xl font-extrabold text-slate-900">{stats.offer}</div>
              <p className="text-xs text-slate-400 mt-1">Offers received</p>
            </div>
          </div>

          {/* Recent Applications Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
              <button
                onClick={() => setActiveTab('applications')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                View Pipeline &rarr;
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="text-center py-10 px-4 border-2 border-dashed border-slate-200 rounded-2xl">
                <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800">No applications tracked yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Keep tabs on your job, fellowship, and scholarship applications from submission to offer.
                </p>
                <button
                  onClick={() => setAddAppModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add First Application
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {applications.slice(0, 4).map((app) => (
                  <div key={app.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{app.opportunityTitle}</h4>
                      <p className="text-xs text-slate-500">{app.organization} &bull; Applied on {app.appliedDate}</p>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        app.status === 'Offer'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : app.status === 'Interviewing'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : app.status === 'Applied'
                          ? 'bg-sky-50 text-sky-700 border border-sky-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: SAVED OPPORTUNITIES */}
      {activeTab === 'saved' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Saved Opportunities</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Private bookmarks securely saved under your UID in Cloud Firestore
              </p>
            </div>
            <button
              onClick={onNavigateToExplore}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Browse Directory
            </button>
          </div>

          {savedOpportunities.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <Bookmark className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">Your bookmark list is empty</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Explore tech internships, AI fellowships, and innovation grants and click "Save" to keep them organized here.
              </p>
              <button
                onClick={onNavigateToExplore}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-sm transition"
              >
                <Compass className="w-4 h-4" />
                Explore Opportunities
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedOpportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                        {opp.type || 'Opportunity'}
                      </span>
                      <button
                        onClick={() => {
                          removeSavedOpportunity(opp.id);
                          onToast('Opportunity removed from saved list.', 'info');
                        }}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                        title="Remove Bookmark"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{opp.title}</h3>
                    <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {opp.company}
                    </p>

                    {opp.location && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {opp.location}
                      </p>
                    )}

                    {opp.deadline && (
                      <p className="text-xs text-amber-700 mt-2 flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        Deadline: {opp.deadline}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (onSelectOpportunityForDetails) {
                          onSelectOpportunityForDetails(opp.id);
                        } else {
                          onNavigateToExplore();
                        }
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
                    >
                      View Details &rarr;
                    </button>

                    <button
                      onClick={() => {
                        setNewAppTitle(opp.title);
                        setNewAppCompany(opp.company);
                        setAddAppModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Track in Pipeline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: APPLICATIONS PIPELINE */}
      {activeTab === 'applications' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Application Pipeline Tracker</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage and update statuses in real-time synced to Firestore
              </p>
            </div>
            <button
              onClick={() => setAddAppModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Add Application
            </button>
          </div>

          {applications.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
              <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No applications in your tracker</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Record your application submissions, interviews, and offers to stay on top of your job hunt.
              </p>
              <button
                onClick={() => setAddAppModalOpen(true)}
                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                Add First Application
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-slate-900">{app.opportunityTitle}</h3>
                      <select
                        value={app.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as ApplicationTrackerItem['status'];
                          updateApplicationStatus(app.id, newStatus);
                          onToast(`Status updated to ${newStatus}`, 'info');
                        }}
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          app.status === 'Offer'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : app.status === 'Interviewing'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : app.status === 'Applied'
                            ? 'bg-sky-50 text-sky-800 border-sky-300'
                            : 'bg-rose-50 text-rose-800 border-rose-300'
                        }`}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interviewing">Interviewing</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>

                    <p className="text-xs text-slate-600 flex items-center gap-3">
                      <span className="font-semibold text-slate-800">{app.organization}</span>
                      <span>&bull;</span>
                      <span>Applied: {app.appliedDate}</span>
                    </p>

                    {/* Notes display & editing */}
                    {editingAppId === app.id ? (
                      <div className="mt-3 flex items-center gap-2 max-w-lg">
                        <input
                          type="text"
                          value={editingNotesText}
                          onChange={(e) => setEditingNotesText(e.target.value)}
                          placeholder="Interview notes, contacts, deadlines..."
                          className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => handleSaveNotes(app.id, app.status)}
                          className="px-2.5 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingAppId(null)}
                          className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                        <span className="italic">{app.notes || 'No notes added'}</span>
                        <button
                          onClick={() => {
                            setEditingAppId(app.id);
                            setEditingNotesText(app.notes || '');
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-0.5"
                          title="Edit notes"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => {
                        deleteApplication(app.id);
                        onToast('Application entry removed.', 'info');
                      }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: CAREER PREFERENCES */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Career Preferences</h2>
            <p className="text-xs text-slate-500 mt-1">
              Customize your target opportunity types and work locations. Stored securely in your Firestore profile.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Interested Opportunity Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Preferred Work Locations
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_LOCATIONS.map((loc) => {
                const isSelected = selectedLocations.includes(loc);
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => toggleLocation(loc)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {loc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <button
              onClick={handleSavePreferences}
              disabled={savingPreferences}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-sm transition active:scale-95 disabled:opacity-50"
            >
              {savingPreferences ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab: ACCOUNT SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6 animate-in fade-in duration-150">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">Account Settings</h2>
            <p className="text-xs text-slate-500 mt-1">
              Manage your display name, review credentials, and inspect security rules
            </p>
          </div>

          {/* Edit Display Name */}
          <form onSubmit={handleSaveDisplayName} className="max-w-md space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Display Name
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                required
                className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={savingName}
                className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {savingName ? 'Saving...' : 'Update'}
              </button>
            </div>
          </form>

          {/* Account Details Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 max-w-lg space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-700">Account Email</span>
              <span className="font-mono text-slate-900">{currentUser.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-700">Authentication Method</span>
              <span className="capitalize">{currentUser.providerData[0]?.providerId || 'Firebase Auth'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/60">
              <span className="font-semibold text-slate-700">Email Verification</span>
              <span className={currentUser.emailVerified ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                {currentUser.emailVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold text-slate-700">User UID</span>
              <span className="font-mono text-slate-500 text-[11px] truncate max-w-[200px]">{currentUser.uid}</span>
            </div>
          </div>

          {/* Logout Section */}
          <div className="pt-6 border-t border-slate-100">
            <button
              onClick={async () => {
                await logout();
                onToast('Successfully signed out.', 'info');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-rose-300 text-rose-600 font-bold text-xs hover:bg-rose-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out of OpportunityHub
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Application */}
      {addAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 my-8 animate-in fade-in zoom-in-95">
            <h3 className="text-xl font-extrabold text-slate-900 mb-4">Track New Application</h3>
            <form onSubmit={handleCreateApplication} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Research Fellowship"
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anthropic, Stripe, MIT"
                  value={newAppCompany}
                  onChange={(e) => setNewAppCompany(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pipeline Stage</label>
                  <select
                    value={newAppStatus}
                    onChange={(e) => setNewAppStatus(e.target.value as ApplicationTrackerItem['status'])}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Applied">Applied</option>
                    <option value="Interviewing">Interviewing</option>
                    <option value="Offer">Offer</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Applied</label>
                  <input
                    type="date"
                    required
                    value={newAppDate}
                    onChange={(e) => setNewAppDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Referred by colleague, phone interview on Friday, portfolio submitted..."
                  value={newAppNotes}
                  onChange={(e) => setNewAppNotes(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAddAppModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingApp}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
                >
                  {submittingApp ? 'Saving...' : 'Add to Pipeline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

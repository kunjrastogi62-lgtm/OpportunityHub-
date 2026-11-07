import React, { useState, useEffect } from 'react';
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
  Building2,
  MapPin,
  Tag,
  Shield,
  LogOut,
  Loader2,
  AlertCircle,
  Copy,
  Mail,
  Compass,
  Globe,
  Users,
  Send,
  Eye,
  FileCheck,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useUserData } from '../context/UserDataContext';
import { ApplicationTrackerItem } from '../types';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { DeleteAccountModal } from './DeleteAccountModal';
import { AccountDeletedSuccessModal } from './AccountDeletedSuccessModal';

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

interface CompanyPosting {
  id: string;
  title: string;
  category: 'Internship' | 'Full-Time' | 'Fellowship' | 'Scholarship' | 'Grant';
  workType: 'Remote' | 'Hybrid' | 'On-site';
  location: string;
  stipendOrSalary: string;
  deadline: string;
  description: string;
  status: 'active' | 'closed';
  applicantsCount: number;
  createdAt: string;
}

interface CompanyApplicant {
  id: string;
  applicantName: string;
  applicantEmail: string;
  opportunityTitle: string;
  appliedDate: string;
  status: 'Under Review' | 'Interviewing' | 'Offer' | 'Rejected';
  portfolioUrl?: string;
}

interface DashboardViewProps {
  initialSubTab?: 'overview' | 'saved' | 'applications' | 'preferences' | 'settings' | 'post' | 'listings' | 'applicants';
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
  const { currentUser, userProfile, isAdmin, updatePreferences, updateDisplayName, updateCompanyProfile, logout } = useAuth();
  const {
    savedOpportunities,
    applications,
    removeSavedOpportunity,
    addApplication,
    updateApplicationStatus,
    deleteApplication,
  } = useUserData();

  const isCompany = userProfile?.accountType === 'company';
  const isEffectiveAdmin = Boolean(
    isAdmin ||
    userProfile?.isAdmin === true ||
    userProfile?.accountType === 'admin' ||
    userProfile?.role === 'admin' ||
    (currentUser?.email && currentUser.email.trim().toLowerCase() === 'kunjrastogi62@gmail.com')
  );

  const [activeTab, setActiveTab] = useState<
    'overview' | 'saved' | 'applications' | 'preferences' | 'settings' | 'post' | 'listings' | 'applicants'
  >(initialSubTab);

  // Sync activeTab when initialSubTab or role changes
  useEffect(() => {
    if (isCompany && (initialSubTab === 'saved' || initialSubTab === 'applications')) {
      setActiveTab('overview');
    } else if (initialSubTab) {
      setActiveTab(initialSubTab);
    }
  }, [initialSubTab, isCompany]);

  // Profile Edit State
  const [displayNameInput, setDisplayNameInput] = useState(
    userProfile?.displayName || currentUser?.displayName || ''
  );
  const [savingName, setSavingName] = useState(false);

  // Company Profile State
  const [companyNameInput, setCompanyNameInput] = useState(userProfile?.companyName || '');
  const [companyWebsiteInput, setCompanyWebsiteInput] = useState(userProfile?.companyWebsite || '');
  const [savingCompanyProfile, setSavingCompanyProfile] = useState(false);

  useEffect(() => {
    if (userProfile?.companyName) setCompanyNameInput(userProfile.companyName);
    if (userProfile?.companyWebsite) setCompanyWebsiteInput(userProfile.companyWebsite);
    if (userProfile?.displayName) setDisplayNameInput(userProfile.displayName);
  }, [userProfile]);

  // Candidate Preferences State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    userProfile?.preferredCategories || ['Internship', 'Fellowship']
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    userProfile?.preferredLocations || ['Remote']
  );
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Candidate Application Tracker Modal State
  const [addAppModalOpen, setAddAppModalOpen] = useState(false);
  const [newAppTitle, setNewAppTitle] = useState('');
  const [newAppCompany, setNewAppCompany] = useState('');
  const [newAppStatus, setNewAppStatus] = useState<ApplicationTrackerItem['status']>('Applied');
  const [newAppDate, setNewAppDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAppNotes, setNewAppNotes] = useState('');
  const [submittingApp, setSubmittingApp] = useState(false);

  // Candidate Editing notes state
  const [editingAppId, setEditingAppId] = useState<string | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');

  // Account Management & Deletion Modal State
  const [deleteAccountModalOpen, setDeleteAccountModalOpen] = useState(false);
  const [accountDeletedModalOpen, setAccountDeletedModalOpen] = useState(false);

  // Company Postings and Applicants state
  const [companyPostings, setCompanyPostings] = useState<CompanyPosting[]>([
    {
      id: 'post_1',
      title: 'Full Stack Software Engineer (React & Cloud)',
      category: 'Full-Time',
      workType: 'Remote',
      location: 'Global (Virtual)',
      stipendOrSalary: '$110,000 - $140,000 / yr',
      deadline: '2026-06-30',
      description: 'Building modern user interfaces, Firestore state persistence, and high-scale cloud backend workflows.',
      status: 'active',
      applicantsCount: 5,
      createdAt: '2026-04-10',
    },
    {
      id: 'post_2',
      title: 'Summer AI Engineering Fellow',
      category: 'Fellowship',
      workType: 'Hybrid',
      location: 'San Francisco, CA',
      stipendOrSalary: '$8,500 / month',
      deadline: '2026-05-15',
      description: 'Conduct applied LLM research, model tuning, and develop production AI Studio agents.',
      status: 'active',
      applicantsCount: 8,
      createdAt: '2026-04-12',
    },
  ]);

  const [companyApplicants, setCompanyApplicants] = useState<CompanyApplicant[]>([
    {
      id: 'app_c1',
      applicantName: 'Alex Rivera',
      applicantEmail: 'alex.rivera@example.com',
      opportunityTitle: 'Full Stack Software Engineer (React & Cloud)',
      appliedDate: '2026-04-28',
      status: 'Under Review',
      portfolioUrl: 'https://github.com/alexrivera-dev',
    },
    {
      id: 'app_c2',
      applicantName: 'Maya Chen',
      applicantEmail: 'm.chen@example.org',
      opportunityTitle: 'Summer AI Engineering Fellow',
      appliedDate: '2026-04-29',
      status: 'Interviewing',
      portfolioUrl: 'https://mayachen.ai',
    },
    {
      id: 'app_c3',
      applicantName: "David O'Connor",
      applicantEmail: 'david.oc@example.com',
      opportunityTitle: 'Full Stack Software Engineer (React & Cloud)',
      appliedDate: '2026-05-01',
      status: 'Offer',
    },
  ]);

  // Company: New Posting Form state
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState<'Internship' | 'Full-Time' | 'Fellowship' | 'Scholarship' | 'Grant'>('Full-Time');
  const [newPostWorkType, setNewPostWorkType] = useState<'Remote' | 'Hybrid' | 'On-site'>('Remote');
  const [newPostLocation, setNewPostLocation] = useState('Remote');
  const [newPostComp, setNewPostComp] = useState('');
  const [newPostDeadline, setNewPostDeadline] = useState('');
  const [newPostDesc, setNewPostDesc] = useState('');

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

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNameInput.trim()) {
      onToast('Company name cannot be empty.', 'error');
      return;
    }
    setSavingCompanyProfile(true);
    try {
      await updateCompanyProfile(companyNameInput.trim(), companyWebsiteInput.trim());
      if (displayNameInput.trim()) {
        await updateDisplayName(displayNameInput.trim());
      }
      onToast('Company profile updated in Firebase successfully!', 'success');
    } catch (err: any) {
      onToast(err?.message || 'Failed to update company profile', 'error');
    } finally {
      setSavingCompanyProfile(false);
    }
  };

  const handleCreatePosting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostDesc.trim()) {
      onToast('Job title and description are required.', 'error');
      return;
    }
    const newPosting: CompanyPosting = {
      id: `post_${Date.now()}`,
      title: newPostTitle.trim(),
      category: newPostCategory,
      workType: newPostWorkType,
      location: newPostLocation,
      stipendOrSalary: newPostComp.trim() || 'Competitive',
      deadline: newPostDeadline || 'Rolling Admissions',
      description: newPostDesc.trim(),
      status: 'active',
      applicantsCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCompanyPostings((prev) => [newPosting, ...prev]);
    onToast(`"${newPostTitle}" published to OpportunityHub!`, 'success');
    setActiveTab('listings');
    setNewPostTitle('');
    setNewPostComp('');
    setNewPostDesc('');
    setNewPostDeadline('');
  };

  const handleTogglePostingStatus = (postingId: string) => {
    setCompanyPostings((prev) =>
      prev.map((p) =>
        p.id === postingId ? { ...p, status: p.status === 'active' ? 'closed' : 'active' } : p
      )
    );
    onToast('Opportunity listing status updated.', 'info');
  };

  const handleUpdateApplicantStatus = (applicantId: string, status: CompanyApplicant['status']) => {
    setCompanyApplicants((prev) =>
      prev.map((app) => (app.id === applicantId ? { ...app, status } : app))
    );
    onToast(`Applicant status changed to ${status}.`, 'info');
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

  const isGoogleUser = currentUser.providerData.some((p) => p.providerId === 'google.com');
  const effectiveDisplayName = isCompany && userProfile?.companyName
    ? userProfile.companyName
    : userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';

  const candidateStats = {
    saved: savedOpportunities.length,
    applied: applications.filter((a) => a.status === 'Applied').length,
    interviewing: applications.filter((a) => a.status === 'Interviewing').length,
    offer: applications.filter((a) => a.status === 'Offer').length,
  };

  const companyStats = {
    activePostings: companyPostings.filter((p) => p.status === 'active').length,
    totalApplicants: companyApplicants.length,
    reviewing: companyApplicants.filter((a) => a.status === 'Under Review').length,
    interviewing: companyApplicants.filter((a) => a.status === 'Interviewing').length,
    offers: companyApplicants.filter((a) => a.status === 'Offer').length,
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
              alt={effectiveDisplayName}
              className="w-20 h-20 rounded-2xl object-cover ring-4 ring-indigo-50 shadow-md"
            />
          ) : (
            <div className={`w-20 h-20 rounded-2xl ${
              isCompany
                ? 'bg-gradient-to-tr from-amber-500 via-indigo-600 to-indigo-700'
                : 'bg-gradient-to-tr from-indigo-600 to-emerald-500'
            } text-white font-extrabold text-2xl flex items-center justify-center shadow-md shadow-indigo-500/20`}>
              {isCompany ? <Building2 className="w-10 h-10" /> : effectiveDisplayName.charAt(0).toUpperCase()}
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {effectiveDisplayName}
              </h1>

              <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                isEffectiveAdmin
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold'
                  : isCompany
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}>
                {isEffectiveAdmin ? '👑 System Administrator' : isCompany ? '🏢 Company Account' : '👤 Employee Account'}
              </span>

              {currentUser.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                  <Clock className="w-3.5 h-3.5" /> Pending Verification
                </span>
              )}
            </div>

            <p className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-slate-400" />
                {currentUser.email}
              </span>
              {isCompany && userProfile?.companyWebsite && (
                <a
                  href={userProfile.companyWebsite.startsWith('http') ? userProfile.companyWebsite : `https://${userProfile.companyWebsite}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {userProfile.companyWebsite.replace(/^https?:\/\//, '')}
                </a>
              )}
              {isCompany && (
                <span className="text-xs text-slate-400">
                  Recruiter Contact: {userProfile?.displayName || displayNameInput}
                </span>
              )}
            </p>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>Account UID: {currentUser.uid.slice(0, 12)}...</span>
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
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <Compass className="w-4 h-4" />
            Explore Hub
          </button>
          {isCompany ? (
            <button
              onClick={() => setActiveTab('post')}
              className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Post Opportunity
            </button>
          ) : (
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
          )}
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 mb-6 overflow-x-auto">
        {isCompany ? (
          <>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Company Overview
            </button>

            <button
              onClick={() => setActiveTab('post')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'post'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              Post Opportunity
            </button>

            <button
              onClick={() => setActiveTab('listings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'listings'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-4 h-4" />
              Active Listings ({companyPostings.length})
            </button>

            <button
              onClick={() => setActiveTab('applicants')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition-all ${
                activeTab === 'applicants'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Candidate Applicants ({companyApplicants.length})
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
              Company Settings
            </button>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* ============================================================== */}
      {/* COMPANY PORTAL VIEWS */}
      {/* ============================================================== */}
      {isCompany && (
        <>
          {/* COMPANY: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Active Postings</span>
                    <Briefcase className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{companyStats.activePostings}</div>
                  <p className="text-xs text-slate-400 mt-1">Accepting applicants</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Applicants</span>
                    <Users className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{companyStats.totalApplicants}</div>
                  <p className="text-xs text-slate-400 mt-1">Candidates applied</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Under Review</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{companyStats.reviewing}</div>
                  <p className="text-xs text-slate-400 mt-1">Awaiting review</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Interviewing</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{companyStats.interviewing}</div>
                  <p className="text-xs text-slate-400 mt-1">Interviews scheduled</p>
                </div>
              </div>

              {/* Recent Applicants Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Recent Candidate Applicants</h2>
                    <p className="text-xs text-slate-500">Candidates who submitted applications for your listings</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('applicants')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                  >
                    View All Applicants ({companyApplicants.length}) &rarr;
                  </button>
                </div>

                <div className="divide-y divide-slate-100">
                  {companyApplicants.map((applicant) => (
                    <div key={applicant.id} className="py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{applicant.applicantName}</h4>
                          <span className="text-xs text-slate-400">&bull; {applicant.applicantEmail}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Applying for: <span className="font-semibold text-slate-700">{applicant.opportunityTitle}</span> &bull; {applicant.appliedDate}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={applicant.status}
                          onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value as CompanyApplicant['status'])}
                          className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offer">Offer Extended</option>
                          <option value="Rejected">Declined</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Listings Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-slate-900">Active Job & Fellowship Listings</h2>
                  <button
                    onClick={() => setActiveTab('post')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Post New
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {companyPostings.map((posting) => (
                    <div key={posting.id} className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-slate-900 text-sm">{posting.title}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          posting.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {posting.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-3">{posting.description}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/60">
                        <span>{posting.category} &bull; {posting.workType}</span>
                        <span className="font-semibold text-indigo-700">{posting.applicantsCount} applicants</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* COMPANY: POST OPPORTUNITY */}
          {activeTab === 'post' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto animate-in fade-in duration-150">
              <div className="mb-6">
                <h2 className="text-xl font-extrabold text-slate-900">Post a New Opportunity</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Publish a job, internship, scholarship, or fellowship under your verified company profile.
                </p>
              </div>

              <form onSubmit={handleCreatePosting} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Opportunity Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead Frontend Architect, Data Science Fellow"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Full-Time">Full-Time Job</option>
                      <option value="Internship">Internship</option>
                      <option value="Fellowship">Fellowship</option>
                      <option value="Scholarship">Scholarship</option>
                      <option value="Grant">Grant</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Work Arrangement</label>
                    <select
                      value={newPostWorkType}
                      onChange={(e) => setNewPostWorkType(e.target.value as any)}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA or Global"
                      value={newPostLocation}
                      onChange={(e) => setNewPostLocation(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Compensation / Stipend</label>
                    <input
                      type="text"
                      placeholder="e.g. $120,000 / yr or $6,000 / mo"
                      value={newPostComp}
                      onChange={(e) => setNewPostComp(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={newPostDeadline}
                    onChange={(e) => setNewPostDeadline(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Description & Responsibilities</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe role scope, engineering stack, qualification requirements, and candidate perks..."
                    value={newPostDesc}
                    onChange={(e) => setNewPostDesc(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm transition active:scale-98"
                  >
                    Publish Opportunity Listing
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* COMPANY: ACTIVE LISTINGS */}
          {activeTab === 'listings' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Manage Postings</h2>
                  <p className="text-xs text-slate-500">Track and toggle active listings on OpportunityHub</p>
                </div>
                <button
                  onClick={() => setActiveTab('post')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Post New Opportunity
                </button>
              </div>

              {companyPostings.map((posting) => (
                <div key={posting.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        posting.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {posting.status === 'active' ? '● ACTIVE' : '○ CLOSED'}
                      </span>
                      <span className="text-xs font-bold text-indigo-700 px-2 py-0.5 rounded-md bg-indigo-50">
                        {posting.category}
                      </span>
                      <span className="text-xs text-slate-400">&bull; {posting.workType}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900">{posting.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 max-w-2xl">{posting.description}</p>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {posting.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        {posting.stipendOrSalary}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        Deadline: {posting.deadline}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-900">{posting.applicantsCount}</div>
                      <div className="text-[11px] text-slate-400">Applicants</div>
                    </div>

                    <button
                      onClick={() => handleTogglePostingStatus(posting.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        posting.status === 'active'
                          ? 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {posting.status === 'active' ? 'Close Listing' : 'Reactivate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMPANY: APPLICANTS PIPELINE */}
          {activeTab === 'applicants' && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs animate-in fade-in duration-150">
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Candidate Applicants</h2>
                  <p className="text-xs text-slate-500">Review candidates and advance hiring stages</p>
                </div>
                <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-full w-fit">
                  Total Candidates: {companyApplicants.length}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 px-2">Candidate</th>
                      <th className="pb-3 px-2">Role Applied</th>
                      <th className="pb-3 px-2">Date</th>
                      <th className="pb-3 px-2">Portfolio / Links</th>
                      <th className="pb-3 px-2">Stage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {companyApplicants.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-2 font-bold text-slate-900">
                          <div>{applicant.applicantName}</div>
                          <div className="text-slate-400 font-normal">{applicant.applicantEmail}</div>
                        </td>
                        <td className="py-3 px-2 text-slate-700 font-medium">
                          {applicant.opportunityTitle}
                        </td>
                        <td className="py-3 px-2 text-slate-500">
                          {applicant.appliedDate}
                        </td>
                        <td className="py-3 px-2">
                          {applicant.portfolioUrl ? (
                            <a
                              href={applicant.portfolioUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              View Portfolio
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          ) : (
                            <span className="text-slate-400">Attached to profile</span>
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <select
                            value={applicant.status}
                            onChange={(e) => handleUpdateApplicantStatus(applicant.id, e.target.value as CompanyApplicant['status'])}
                            className="font-bold px-2 py-1 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="Under Review">Under Review</option>
                            <option value="Interviewing">Interviewing</option>
                            <option value="Offer">Offer Extended</option>
                            <option value="Rejected">Declined</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPANY: SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-xl mx-auto animate-in fade-in duration-150">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Company Profile Settings</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage organization credentials, recruiter details, and web presence.
                </p>
              </div>

              <form onSubmit={handleSaveCompanyProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                  <input
                    type="text"
                    required
                    value={companyNameInput}
                    onChange={(e) => setCompanyNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Website</label>
                  <input
                    type="url"
                    placeholder="https://company.com"
                    value={companyWebsiteInput}
                    onChange={(e) => setCompanyWebsiteInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recruiter / Contact Person Name</label>
                  <input
                    type="text"
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Account Role</label>
                    {isEffectiveAdmin && (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Admin Privileges Active
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled
                    value={
                      isEffectiveAdmin
                        ? '👑 System Administrator'
                        : '🏢 Verified Company Account'
                    }
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      isEffectiveAdmin
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    } cursor-not-allowed`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isEffectiveAdmin
                      ? 'You have primary administrative governance over Cloud Firestore, YouTube Video Resources, and system settings.'
                      : 'Role is permanently bound to your account and enforced by Firebase Security Rules.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingCompanyProfile}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {savingCompanyProfile ? 'Saving...' : 'Update Company Profile'}
                  </button>
                </div>
              </form>

              {/* Account Management Section */}
              <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="mb-4">
                  <h3 className="text-base font-bold text-slate-900">Account Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage critical account actions, security controls, and company profile lifecycle.
                  </p>
                </div>

                <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-rose-950">Permanently Delete Account</h4>
                      <p className="text-xs text-rose-800/90 mt-0.5">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteAccountModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-sm shadow-rose-600/25 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ============================================================== */}
      {/* CANDIDATE / EMPLOYEE VIEWS */}
      {/* ============================================================== */}
      {!isCompany && (
        <>
          {/* CANDIDATE: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-in fade-in duration-150">
              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Bookmarked</span>
                    <Bookmark className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{candidateStats.saved}</div>
                  <p className="text-xs text-slate-400 mt-1">Saved for review</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Applied</span>
                    <Briefcase className="w-4 h-4 text-sky-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{candidateStats.applied}</div>
                  <p className="text-xs text-slate-400 mt-1">Applications submitted</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Interviewing</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{candidateStats.interviewing}</div>
                  <p className="text-xs text-slate-400 mt-1">Active interview stages</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider">Offers</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-900">{candidateStats.offer}</div>
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
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
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

          {/* CANDIDATE: SAVED OPPORTUNITIES */}
          {activeTab === 'saved' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Saved Opportunities</h2>
                  <p className="text-xs text-slate-500">Bookmarked positions and funding grants</p>
                </div>
                <button
                  onClick={() => onNavigateToExplore()}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
                >
                  Explore More Listings &rarr;
                </button>
              </div>

              {savedOpportunities.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200/80">
                  <Bookmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No saved opportunities yet</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Browse the Explore section and bookmark opportunities you are interested in.
                  </p>
                  <button
                    onClick={() => onNavigateToExplore()}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Browse Opportunities
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedOpportunities.map((saved) => (
                    <div
                      key={saved.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:border-slate-300 transition shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
                              {saved.type || 'Opportunity'}
                            </span>
                            <h3 className="text-base font-bold text-slate-900 mt-2">{saved.title}</h3>
                            <p className="text-xs text-slate-500">{saved.company} &bull; {saved.location || 'Remote'}</p>
                          </div>
                          <button
                            onClick={() => removeSavedOpportunity(saved.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            title="Remove from saved"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          {saved.deadline ? `Deadline: ${saved.deadline}` : 'Rolling application'}
                        </span>
                        {onSelectOpportunityForDetails && (
                          <button
                            onClick={() => onSelectOpportunityForDetails(saved.id)}
                            className="font-bold text-indigo-600 hover:text-indigo-800"
                          >
                            View Details &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CANDIDATE: APPLICATION PIPELINE */}
          {activeTab === 'applications' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Application Pipeline</h2>
                  <p className="text-xs text-slate-500">Track and advance every opportunity submission</p>
                </div>
                <button
                  onClick={() => setAddAppModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Application
                </button>
              </div>

              {applications.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-3xl border border-slate-200/80">
                  <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-900">Your pipeline is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    Track the jobs, internships, fellowships, and grants you've applied to in one place.
                  </p>
                  <button
                    onClick={() => setAddAppModalOpen(true)}
                    className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    Track First Application
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-slate-900">{app.opportunityTitle}</h3>
                          <span className="text-xs text-slate-400">&bull; {app.organization}</span>
                        </div>
                        <p className="text-xs text-slate-500">Applied date: {app.appliedDate}</p>

                        {/* Notes preview or editor */}
                        {editingAppId === app.id ? (
                          <div className="mt-3 flex items-center gap-2 max-w-lg">
                            <input
                              type="text"
                              value={editingNotesText}
                              onChange={(e) => setEditingNotesText(e.target.value)}
                              placeholder="Add personal notes, recruiter names, follow-up dates..."
                              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                              onClick={() => handleSaveNotes(app.id, app.status)}
                              className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold shrink-0"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingAppId(null)}
                              className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-800 shrink-0"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-slate-600 italic">
                              {app.notes ? `"${app.notes}"` : 'No personal notes attached.'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingAppId(app.id);
                                setEditingNotesText(app.notes || '');
                              }}
                              className="text-[11px] font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                            >
                              <Edit2 className="w-3 h-3" /> Edit notes
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Status changer & deletion */}
                      <div className="flex items-center gap-3 shrink-0">
                        <select
                          value={app.status}
                          onChange={(e) =>
                            updateApplicationStatus(
                              app.id,
                              e.target.value as ApplicationTrackerItem['status'],
                              app.notes
                            )
                          }
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Applied">Applied</option>
                          <option value="Interviewing">Interviewing</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>

                        <button
                          onClick={() => deleteApplication(app.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Delete application"
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

          {/* CANDIDATE: CAREER PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-2xl mx-auto animate-in fade-in duration-150">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Career Preferences</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Customize the categories and work arrangements that matter to you.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Preferred Opportunities & Fields
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_CATEGORIES.map((cat) => {
                      const isSelected = selectedCategories.includes(cat);
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleCategory(cat)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Work Location Types
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_LOCATIONS.map((loc) => {
                      const isSelected = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {loc}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={handleSavePreferences}
                    disabled={savingPreferences}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {savingPreferences ? 'Saving Preferences...' : 'Save Preferences to Profile'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CANDIDATE: ACCOUNT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs max-w-xl mx-auto animate-in fade-in duration-150">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Account Settings</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your personal display name and security credentials.
                </p>
              </div>

              <form onSubmit={handleSaveDisplayName} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Display Name</label>
                  <input
                    type="text"
                    required
                    value={displayNameInput}
                    onChange={(e) => setDisplayNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    value={currentUser.email || ''}
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Email address is managed through your Firebase Authentication account.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">Account Role</label>
                    {isEffectiveAdmin ? (
                      <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                        Admin Privileges Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        Employee
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled
                    value={
                      isEffectiveAdmin
                        ? '👑 System Administrator'
                        : '👤 Employee Account'
                    }
                    className={`w-full px-3.5 py-2 text-sm rounded-xl border ${
                      isEffectiveAdmin
                        ? 'border-emerald-300 bg-emerald-50/80 text-emerald-950 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    } cursor-not-allowed`}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {isEffectiveAdmin
                      ? 'You have primary administrative governance over Cloud Firestore, YouTube Video Resources, and system settings.'
                      : 'Role is permanently bound to your account and enforced by Firebase Security Rules.'}
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={savingName}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition disabled:opacity-50"
                  >
                    {savingName ? 'Saving...' : 'Update Display Name'}
                  </button>
                </div>
              </form>

              {/* Account Management: Permanently Delete Account Section */}
              <div className="mt-8 pt-6 border-t-2 border-slate-100">
                <div className="mb-3">
                  <h3 className="text-base font-bold text-slate-900">Account Management</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Security actions, danger zone controls, and data lifecycle.
                  </p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 bg-rose-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                      <Trash2 className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-rose-950">Permanently Delete Account</h4>
                      <p className="text-xs text-rose-800/90 mt-0.5">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteAccountModalOpen(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold transition shadow-sm shadow-rose-600/25 shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete Account</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Candidate Add Application Modal */}
      {addAppModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Track New Application</h3>
            <p className="text-xs text-slate-500 mb-4">Add a job, internship, or fellowship to your tracker.</p>

            <form onSubmit={handleCreateApplication} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opportunity Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Software Engineer Intern"
                  value={newAppTitle}
                  onChange={(e) => setNewAppTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Company</label>
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

      {/* Delete Account Confirmation Modal */}
      <DeleteAccountModal
        isOpen={deleteAccountModalOpen}
        onClose={() => setDeleteAccountModalOpen(false)}
        onDeletedSuccess={() => {
          setDeleteAccountModalOpen(false);
          setAccountDeletedModalOpen(true);
        }}
      />

      {/* Post-Deletion Success State Modal */}
      <AccountDeletedSuccessModal
        isOpen={accountDeletedModalOpen}
        onReturnHome={() => {
          setAccountDeletedModalOpen(false);
          onNavigateToExplore();
          window.location.href = '/';
        }}
      />
    </div>
  );
};

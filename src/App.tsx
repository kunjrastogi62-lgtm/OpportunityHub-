import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UserDataProvider, useUserData } from './context/UserDataContext';
import { VideoResourcesProvider } from './context/VideoResourcesContext';
import { Navbar } from './components/Navbar';
import { ExploreView } from './components/ExploreView';
import { VideoResourcesView } from './components/VideoResourcesView';
import { DashboardView } from './components/DashboardView';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { ForgotPasswordModal } from './components/ForgotPasswordModal';
import { OpportunityDetailModal } from './components/OpportunityDetailModal';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { AuthActionModal } from './components/AuthActionModal';
import { PreVerificationCard } from './components/PreVerificationCard';
import { VerificationSuccessModal } from './components/VerificationSuccessModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SAMPLE_OPPORTUNITIES } from './data/opportunities';
import { Opportunity, AccountType } from './types';
import { Loader2, ShieldCheck, Compass, Sparkles, Heart, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { currentUser, loading, intendedDestination, setIntendedDestination } = useAuth();
  const { addApplication } = useUserData();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<'explore' | 'videos' | 'dashboard' | 'saved' | 'applications' | 'settings'>('explore');
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'saved' | 'applications' | 'preferences' | 'settings'>('overview');

  // Email Verification routing & modal state
  const [isPreVerificationView, setIsPreVerificationView] = useState(false);
  const [verificationSuccessModalOpen, setVerificationSuccessModalOpen] = useState(false);

  useEffect(() => {
    const pathname = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // 1. Detect if standalone Pre-Verification Page is requested (/verify or ?page=verify)
    if (pathname === '/verify' || params.get('page') === 'verify' || params.get('view') === 'verify') {
      setIsPreVerificationView(true);
      return;
    }

    // 2. Detect if user arrived from successful verification redirect (?verified=true)
    if (params.get('verified') === 'true') {
      setVerificationSuccessModalOpen(true);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  // Modals state
  const [authRole, setAuthRole] = useState<AccountType>('employee');
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Protected route handler
  const handleNavigate = (tab: string) => {
    if (tab === 'videos') {
      setCurrentTab('videos');
      return;
    }

    if (tab === 'dashboard' || tab === 'saved' || tab === 'applications' || tab === 'settings') {
      if (!currentUser) {
        setIntendedDestination(tab === 'saved' ? 'Saved Opportunities' : tab === 'applications' ? 'Application Tracker' : 'Dashboard');
        setLoginModalOpen(true);
        addToast('Please sign in to access your private dashboard and saved data.', 'info');
        return;
      }

      if (tab === 'saved') {
        setCurrentTab('dashboard');
        setDashboardSubTab('saved');
        return;
      }

      if (tab === 'applications') {
        setCurrentTab('dashboard');
        setDashboardSubTab('applications');
        return;
      }

      if (tab === 'settings') {
        setCurrentTab('dashboard');
        setDashboardSubTab('settings');
        return;
      }

      setCurrentTab('dashboard');
      setDashboardSubTab('overview');
      return;
    }

    setCurrentTab('explore');
  };

  const handleOpenAuth = (mode: 'login' | 'register', role?: AccountType) => {
    if (role) {
      setAuthRole(role);
    }
    if (mode === 'login') {
      setLoginModalOpen(true);
      setRegisterModalOpen(false);
      setForgotPasswordModalOpen(false);
    } else {
      setRegisterModalOpen(true);
      setLoginModalOpen(false);
      setForgotPasswordModalOpen(false);
    }
  };

  // Handle successful login or registration with role-based redirection
  const handleAuthSuccess = (msg: string, role?: AccountType) => {
    addToast(msg, 'success');
    setCurrentTab('dashboard');
    if (role === 'company') {
      setDashboardSubTab('overview');
    } else if (intendedDestination) {
      if (intendedDestination.includes('Saved')) {
        setDashboardSubTab('saved');
      } else if (intendedDestination.includes('Application')) {
        setDashboardSubTab('applications');
      } else {
        setDashboardSubTab('overview');
      }
      setIntendedDestination(null);
    } else {
      setDashboardSubTab('overview');
    }
  };

  // One-click track in pipeline from modal
  const handleTrackInPipeline = async (opp: Opportunity) => {
    try {
      await addApplication({
        opportunityTitle: opp.title,
        organization: opp.company,
        status: 'Applied',
        appliedDate: new Date().toISOString().split('T')[0],
        notes: `Applied through OpportunityHub. Category: ${opp.category}`,
      });
      addToast(`"${opp.title}" added to your application pipeline!`, 'success');
      setCurrentTab('dashboard');
      setDashboardSubTab('applications');
    } catch (err: any) {
      addToast(err?.message || 'Failed to track application', 'error');
    }
  };

  const handleSelectOpportunityForDetails = (oppId: string) => {
    const opp = SAMPLE_OPPORTUNITIES.find((o) => o.id === oppId);
    if (opp) {
      setSelectedOpportunity(opp);
    }
  };

  // If standalone pre-verification page is active, render centered card UI directly
  if (isPreVerificationView) {
    return (
      <PreVerificationCard
        onReturnToApp={() => {
          setIsPreVerificationView(false);
          const cleanUrl = window.location.origin + '/';
          window.history.replaceState({}, document.title, cleanUrl);
        }}
        onVerificationComplete={() => {
          setIsPreVerificationView(false);
          const cleanUrl = window.location.origin + '/';
          window.history.replaceState({}, document.title, cleanUrl);
          setVerificationSuccessModalOpen(true);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4 animate-pulse">
          <Compass className="w-7 h-7" />
        </div>
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-semibold text-slate-700">Connecting to OpportunityHub...</p>
        <p className="text-xs text-slate-400">Verifying secure Firebase Authentication session</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Email Verification Banner */}
      <EmailVerificationBanner
        onSuccess={() => addToast('Email verification confirmed!', 'success')}
      />

      {/* Main Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'explore' ? (
          <ExploreView
            onSelectOpportunity={(opp) => setSelectedOpportunity(opp)}
            onOpenAuth={handleOpenAuth}
            onToast={addToast}
          />
        ) : currentTab === 'videos' ? (
          <VideoResourcesView
            onOpenAuth={handleOpenAuth}
            onToast={addToast}
          />
        ) : (
          <DashboardView
            initialSubTab={dashboardSubTab}
            onNavigateToExplore={() => setCurrentTab('explore')}
            onSelectOpportunityForDetails={handleSelectOpportunityForDetails}
            onToast={addToast}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-extrabold text-slate-900">
                Opportunity<span className="text-indigo-600">Hub</span>
              </span>
              <p className="text-xs text-slate-400">
                Secured by Firebase Authentication & Zero-Trust Cloud Firestore
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              RBAC Protected
            </div>
            <span>&bull;</span>
            <span>Client-side OAuth & Persistence</span>
            <span>&bull;</span>
            <span>Email Verification Supported</span>
          </div>

          <p className="text-xs text-slate-400">
            &copy; {new Date().getFullYear()} OpportunityHub. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal
        isOpen={loginModalOpen}
        initialRole={authRole}
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={(role) => {
          if (role) setAuthRole(role);
          setLoginModalOpen(false);
          setRegisterModalOpen(true);
        }}
        onSwitchToForgotPassword={() => {
          setLoginModalOpen(false);
          setForgotPasswordModalOpen(true);
        }}
        onSuccess={handleAuthSuccess}
      />

      <RegisterModal
        isOpen={registerModalOpen}
        initialRole={authRole}
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={(role) => {
          if (role) setAuthRole(role);
          setRegisterModalOpen(false);
          setLoginModalOpen(true);
        }}
        onSuccess={handleAuthSuccess}
      />

      <ForgotPasswordModal
        isOpen={forgotPasswordModalOpen}
        onClose={() => setForgotPasswordModalOpen(false)}
        onBackToLogin={() => {
          setForgotPasswordModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onOpenAuth={handleOpenAuth}
        onTrackInPipeline={handleTrackInPipeline}
        onToast={addToast}
      />

      {/* Automatic Action Handler for Firebase Email Links (?mode=verifyEmail / resetPassword) */}
      <AuthActionModal
        onSuccess={(msg) => addToast(msg, 'success')}
        onOpenLogin={() => setLoginModalOpen(true)}
      />

      {/* Central Post-Verification Success Modal */}
      <VerificationSuccessModal
        isOpen={verificationSuccessModalOpen}
        onClose={() => setVerificationSuccessModalOpen(false)}
        onSignIn={() => {
          setVerificationSuccessModalOpen(false);
          setLoginModalOpen(true);
        }}
      />

      {/* Verification Flow Demo & Quick Test Floating Bar */}
      <div className="fixed bottom-4 left-4 z-40 hidden md:flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-xl border border-slate-200 text-xs text-slate-700">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-slate-800">Email Verification:</span>
        <button
          onClick={() => {
            const demoUrl = '/verify?token=demo_opphub_token_' + Math.random().toString(36).substring(2, 8);
            window.history.pushState({}, document.title, demoUrl);
            setIsPreVerificationView(true);
          }}
          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold hover:bg-indigo-100 transition cursor-pointer"
        >
          Pre-Verification Page &rarr;
        </button>
        <button
          onClick={() => setVerificationSuccessModalOpen(true)}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold hover:bg-emerald-100 transition cursor-pointer"
        >
          Success Modal
        </button>
      </div>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserDataProvider>
        <VideoResourcesProvider>
          <AppContent />
        </VideoResourcesProvider>
      </UserDataProvider>
    </AuthProvider>
  );
}

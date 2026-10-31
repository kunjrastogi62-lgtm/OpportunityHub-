import React, { useState } from 'react';
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
import { ToastContainer, ToastMessage } from './components/Toast';
import { SAMPLE_OPPORTUNITIES } from './data/opportunities';
import { Opportunity } from './types';
import { Loader2, ShieldCheck, Compass, Sparkles, Heart } from 'lucide-react';

function AppContent() {
  const { currentUser, loading, intendedDestination, setIntendedDestination } = useAuth();
  const { addApplication } = useUserData();

  // Navigation tab state
  const [currentTab, setCurrentTab] = useState<'explore' | 'videos' | 'dashboard' | 'saved' | 'applications' | 'settings'>('explore');
  const [dashboardSubTab, setDashboardSubTab] = useState<'overview' | 'saved' | 'applications' | 'preferences' | 'settings'>('overview');

  // Modals state
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

  const handleOpenAuth = (mode: 'login' | 'register') => {
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

  // Handle successful login or registration
  const handleAuthSuccess = (msg: string) => {
    addToast(msg, 'success');
    // If there was an intended destination, redirect to it
    if (intendedDestination) {
      if (intendedDestination.includes('Saved')) {
        setCurrentTab('dashboard');
        setDashboardSubTab('saved');
      } else if (intendedDestination.includes('Application')) {
        setCurrentTab('dashboard');
        setDashboardSubTab('applications');
      } else {
        setCurrentTab('dashboard');
        setDashboardSubTab('overview');
      }
      setIntendedDestination(null);
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
        onClose={() => setLoginModalOpen(false)}
        onSwitchToRegister={() => {
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
        onClose={() => setRegisterModalOpen(false)}
        onSwitchToLogin={() => {
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

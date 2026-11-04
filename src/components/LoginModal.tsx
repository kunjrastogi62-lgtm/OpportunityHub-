import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  LogIn,
  Building2,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRegister: (role?: AccountType) => void;
  onSwitchToForgotPassword: () => void;
  onSuccess: (message: string, role?: AccountType) => void;
  initialRole?: AccountType;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRegister,
  onSwitchToForgotPassword,
  onSuccess,
  initialRole = 'employee',
}) => {
  const { login, loginWithGoogle, intendedDestination } = useAuth();

  const [activeRole, setActiveRole] = useState<AccountType>(initialRole);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync role when modal opens with specific initialRole
  useEffect(() => {
    if (isOpen && initialRole) {
      setActiveRole(initialRole);
      setError(null);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError(null);

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please provide a valid email address.');
      return;
    }

    if (!password) {
      setError('Please provide your account password.');
      return;
    }

    setLoading(true);
    try {
      const { profile } = await login(email, password, rememberMe);
      const resolvedRole = profile?.accountType || activeRole;
      
      const roleName = resolvedRole === 'company' ? 'Company Portal' : 'Employee Dashboard';
      onSuccess(`Welcome back! Signed in to ${roleName}.`, resolvedRole);
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      const code = err?.code;
      const msg = err?.message || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        setError('Invalid email or password. Please verify your credentials and try again.');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('operation-not-allowed')) {
        setError('Email/Password sign-in has not been enabled in your Firebase Console yet. Please enable Email/Password under Authentication > Sign-in method in Firebase Console, or sign in using "Continue with Google".');
      } else if (code === 'auth/api-key-not-valid' || msg.includes('api-key-not-valid')) {
        setError('Firebase API key is being initialized. Please ensure your project credentials in firebase-applet-config.json are loaded.');
      } else if (code === 'auth/user-disabled') {
        setError('This user account has been disabled. Please contact administrator support.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed sign-in attempts. For your security, this account is temporarily locked. Please reset your password or try again in a few minutes.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network connectivity problem. Please check your internet connection.');
      } else {
        setError(msg || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    setError(null);
    try {
      const profile = await loginWithGoogle(activeRole);
      const resolvedRole = profile?.accountType || activeRole;
      const roleName = resolvedRole === 'company' ? 'Company Portal' : 'Employee Dashboard';
      onSuccess(`Signed in with Google to ${roleName}!`, resolvedRole);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        // Closed without completing
      } else if (err?.code === 'auth/popup-blocked') {
        setError('The Google sign-in window was blocked by your browser. Please enable popups for this site.');
      } else {
        setError(err?.message || 'Google sign-in encountered an issue. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isCompany = activeRole === 'company';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Account Type Selector Cards */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Select Account Type
            </span>
            <span className="text-[11px] font-semibold text-indigo-600">
              {isCompany ? '🏢 Employer Portal' : '👤 Candidate Portal'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setActiveRole('company');
                setError(null);
              }}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                isCompany
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl select-none">🏢</span>
                {isCompany ? (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">Company</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Employer login</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('employee');
                setError(null);
              }}
              className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between cursor-pointer ${
                !isCompany
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl select-none">👤</span>
                {!isCompany ? (
                  <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
                ) : (
                  <span className="w-5 h-5 rounded-full border-2 border-slate-300" />
                )}
              </div>
              <div>
                <div className="font-extrabold text-sm text-slate-900">Employee</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Candidate login</div>
              </div>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
            {isCompany ? <Building2 className="w-6 h-6 text-indigo-600" /> : <LogIn className="w-6 h-6 text-indigo-600" />}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isCompany ? 'Company Portal Sign In' : 'Employee Sign In'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {isCompany
              ? 'Post career opportunities, fellowships, and hire top candidates'
              : 'Access your saved opportunities, application pipeline, and career profile'}
          </p>
          {intendedDestination && (
            <div className="mt-2 text-xs bg-indigo-50 text-indigo-700 py-1 px-2.5 rounded-lg border border-indigo-200 font-medium">
              Sign in to continue to your {intendedDestination}
            </div>
          )}
        </div>

        {/* Error alert / Provider configuration helper */}
        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <p className="font-semibold text-amber-950 mb-1">
                  {error.includes('Firebase') || error.includes('Email/Password')
                    ? 'Enable Email/Password in Firebase Console'
                    : 'Sign-in Notice'}
                </p>
                <p className="text-amber-800">{error}</p>

                {(error.includes('Firebase') || error.includes('Email/Password')) && (
                  <div className="mt-3 pt-3 border-t border-amber-200/70 flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading || loading}
                      className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition"
                    >
                      {googleLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Sign In with Google Instead (Instant & Active)
                    </button>

                    <div className="flex items-center gap-2 text-[11px] text-amber-700">
                      <span>Or enable Email/Password:</span>
                      <a
                        href="https://console.firebase.google.com/project/opportunityhub-a27e6/authentication/providers"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold underline text-amber-900 hover:text-amber-950"
                      >
                        Firebase Console &rarr;
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-between py-2.5 px-4 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 text-slate-800 text-sm font-semibold shadow-xs transition active:scale-98 disabled:opacity-50"
        >
          <div className="flex items-center gap-2.5">
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.27-2.09 3.67-5.17 3.67-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.25C.45 8.22 0 10.06 0 12c0 1.94.45 3.78 1.25 5.39l4.02-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.61l4.02 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : `Sign in as ${isCompany ? 'Company' : 'Employee'} with Google`}</span>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
            1-Click
          </span>
        </button>

        <div className="flex items-center my-5">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="px-3 text-xs uppercase tracking-wider text-slate-400 font-medium">or with email</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {isCompany ? 'Company Work Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder={isCompany ? 'hiring@company.com' : 'you@example.com'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">Password</label>
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember session checkbox */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs text-slate-600">Remember this device</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              `Sign In to ${isCompany ? 'Company Portal' : 'Employee Portal'}`
            )}
          </button>
        </form>

        {/* Footer switch to register */}
        <div className="mt-5 text-center text-xs text-slate-600">
          Don't have an account yet?{' '}
          <button
            type="button"
            onClick={() => onSwitchToRegister(activeRole)}
            className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Create {isCompany ? 'Company' : 'Employee'} Account
          </button>
        </div>
      </div>
    </div>
  );
};

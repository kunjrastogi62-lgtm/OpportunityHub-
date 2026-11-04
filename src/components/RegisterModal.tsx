import React, { useState, useEffect } from 'react';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Building2,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AccountType } from '../types';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: (role?: AccountType) => void;
  onSuccess: (message: string, role?: AccountType) => void;
  initialRole?: AccountType;
}

export const RegisterModal: React.FC<RegisterModalProps> = ({
  isOpen,
  onClose,
  onSwitchToLogin,
  onSuccess,
  initialRole = 'employee',
}) => {
  const { register, loginWithGoogle } = useAuth();

  const [activeRole, setActiveRole] = useState<AccountType>(initialRole);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [termsModalOpen, setTermsModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen && initialRole) {
      setActiveRole(initialRole);
      setError(null);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  // Password strength calculation
  const calculatePasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    let label = 'Very Weak';
    let color = 'bg-slate-200';
    let textColor = 'text-slate-400';

    if (score === 1) {
      label = 'Weak';
      color = 'bg-rose-500';
      textColor = 'text-rose-600';
    } else if (score === 2) {
      label = 'Fair';
      color = 'bg-amber-500';
      textColor = 'text-amber-600';
    } else if (score === 3) {
      label = 'Good';
      color = 'bg-sky-500';
      textColor = 'text-sky-600';
    } else if (score === 4) {
      label = 'Strong';
      color = 'bg-emerald-500';
      textColor = 'text-emerald-600';
    }

    return { score, label, color, textColor };
  };

  const strength = calculatePasswordStrength(password);
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const isCompany = activeRole === 'company';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || googleLoading) return;
    setError(null);

    // Validation checks
    if (isCompany && !companyName.trim()) {
      setError('Please provide your company or organization name.');
      return;
    }

    if (!fullName.trim()) {
      setError(isCompany ? 'Please provide the contact person / recruiter full name.' : 'Please provide your full name.');
      return;
    }

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (!agreedToTerms) {
      setError('You must agree to the Terms of Service & Privacy Policy.');
      return;
    }

    setLoading(true);
    try {
      await register(
        email,
        password,
        fullName.trim(),
        activeRole,
        isCompany ? companyName.trim() : undefined,
        isCompany && companyWebsite.trim() ? companyWebsite.trim() : undefined
      );

      const targetRoleName = isCompany ? 'Company Portal' : 'Employee Dashboard';
      onSuccess(`Account created! A verification link has been sent to ${email}. Redirecting to ${targetRoleName}...`, activeRole);
      onClose();
    } catch (err: any) {
      console.error('Registration error:', err);
      const code = err?.code;
      const msg = err?.message || '';
      if (code === 'auth/email-already-in-use') {
        setError('This email address is already registered. Please sign in instead.');
      } else if (code === 'auth/operation-not-allowed' || msg.includes('PASSWORD_LOGIN_DISABLED') || msg.includes('operation-not-allowed')) {
        setError('Email/Password registration is not yet enabled in your Firebase project. Please enable Email/Password under Authentication > Sign-in method in Firebase Console, or sign up using "Continue with Google".');
      } else if (code === 'auth/api-key-not-valid' || msg.includes('api-key-not-valid')) {
        setError('Firebase API key is being initialized. Please ensure your project credentials in firebase-applet-config.json are loaded.');
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 8 characters with a mix of numbers and letters.');
      } else if (code === 'auth/invalid-email') {
        setError('The email address provided is not valid.');
      } else if (code === 'auth/network-request-failed') {
        setError('Network connectivity error. Please check your internet connection and try again.');
      } else {
        setError(msg || 'Failed to create account. Please try again.');
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
      await loginWithGoogle(activeRole);
      const targetRoleName = isCompany ? 'Company Portal' : 'Employee Dashboard';
      onSuccess(`Signed up with Google to ${targetRoleName}!`, activeRole);
      onClose();
    } catch (err: any) {
      console.error('Google Sign-In error:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else if (err?.code === 'auth/popup-blocked') {
        setError('Google sign-in popup was blocked by your browser. Please allow popups for OpportunityHub.');
      } else {
        setError(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
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

          {/* Role Toggle Selector */}
          <div className="mb-6 p-1 bg-slate-100 rounded-2xl flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setActiveRole('company');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                isCompany
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base">🏢</span>
              <span>Company Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRole('employee');
                setError(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                !isCompany
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="text-base">👤</span>
              <span>Employee Account</span>
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              {isCompany ? <Building2 className="w-6 h-6 text-indigo-600" /> : <ShieldCheck className="w-6 h-6 text-indigo-600" />}
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {isCompany ? 'Register as Company' : 'Create Employee Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isCompany
                ? 'Join OpportunityHub to post opportunities, fellowships, and hire top candidates'
                : 'Join OpportunityHub to discover, track, and bookmark top career opportunities'}
            </p>
          </div>

          {/* Error banner / Provider configuration helper */}
          {error && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <p className="font-semibold text-amber-950 mb-1">
                    {error.includes('Firebase') || error.includes('Email/Password')
                      ? 'Email/Password Authentication Not Enabled'
                      : 'Registration Notice'}
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
                        Sign Up with Google Instead (Instant & Pre-configured)
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

          {/* 1-Click Instant Google Sign-in */}
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
              <span>{googleLoading ? 'Connecting to Google...' : `Sign up as ${isCompany ? 'Company' : 'Employee'} with Google`}</span>
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
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* If Company: Company Name */}
            {isCompany && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company / Organization Name</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Acme Innovations, Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Full Name / Recruiter Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isCompany ? 'Recruiter / Contact Name' : 'Full Name'}
              </label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder={isCompany ? 'Sarah Connor (Talent Lead)' : 'Jane Doe'}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {isCompany ? 'Company Work Email' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder={isCompany ? 'recruiting@acme.com' : 'jane@example.com'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>

            {/* If Company: Website (Optional) */}
            {isCompany && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Website <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://acme.com"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {password && (
                  <span className={`text-[11px] font-bold ${strength.textColor}`}>
                    Strength: {strength.label}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Min. 8 characters"
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

              {/* Password strength meter */}
              {password && (
                <div className="mt-1.5 grid grid-cols-4 gap-1">
                  <div className={`h-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-200'}`} />
                  <div className={`h-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-200'}`} />
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">Confirm Password</label>
                {confirmPassword && (
                  <span className="text-[11px] font-semibold">
                    {passwordsMatch ? (
                      <span className="text-emerald-600 flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Matches
                      </span>
                    ) : (
                      <span className="text-rose-500">Does not match</span>
                    )}
                  </span>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span className="text-xs text-slate-600 leading-normal">
                  I agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setTermsModalOpen(true)}
                    className="text-indigo-600 hover:underline font-semibold"
                  >
                    Terms of Service
                  </button>{' '}
                  and Privacy Policy.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating Account...
                </>
              ) : (
                `Register as ${isCompany ? 'Company' : 'Employee'}`
              )}
            </button>
          </form>

          {/* Footer switch to login */}
          <div className="mt-5 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => onSwitchToLogin(activeRole)}
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Sign In to {isCompany ? 'Company' : 'Employee'} Portal
            </button>
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {termsModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg p-6 relative">
            <h3 className="text-lg font-bold text-slate-900 mb-3">Terms of Service & Privacy</h3>
            <div className="max-h-60 overflow-y-auto text-xs text-slate-600 space-y-2 pr-2">
              <p>
                Welcome to OpportunityHub. By registering as a Company or Employee, you agree to submit truthful opportunity listings, application information, and comply with equal opportunity standards.
              </p>
              <p>
                Company accounts may post legitimate jobs, internships, and fellowships. Employee accounts may discover, bookmark, and track application submissions.
              </p>
              <p>
                All account sessions and permissions are protected by Firebase Authentication and Firestore security rules.
              </p>
            </div>
            <div className="mt-5 text-right">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
              >
                Close & Return
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

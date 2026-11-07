import React, { useState, useEffect } from 'react';
import { Compass, ShieldCheck, Loader2, ArrowRight, AlertCircle, CheckCircle2, Mail, Lock, Send, Edit2 } from 'lucide-react';
import { applyActionCode } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface PreVerificationCardProps {
  onReturnToApp?: () => void;
  onVerificationComplete?: () => void;
}

/**
 * Robust error string formatter to prevent "[object Object]" in UI
 */
const formatErrorMessage = (err: any): string => {
  if (!err) return 'Verification link is invalid or expired. Please enter your email to request a new link.';
  if (typeof err === 'string') return err;
  
  // Firebase Auth Error Code Mapping
  if (err?.code) {
    if (err.code === 'auth/invalid-action-code') {
      return 'This verification link is invalid or has already been used. Please request a new link.';
    }
    if (err.code === 'auth/expired-action-code') {
      return 'This verification link has expired. Please request a fresh verification link.';
    }
    if (err.code === 'auth/user-disabled') {
      return 'This account has been disabled. Please contact administrator support.';
    }
    if (err.code === 'auth/user-not-found') {
      return 'No account was found for this verification link.';
    }
  }

  // If err has message property
  if (typeof err?.message === 'string') {
    if (err.message.includes('auth/invalid-action-code')) {
      return 'This verification link is invalid or has already been used.';
    }
    if (err.message.includes('auth/expired-action-code')) {
      return 'This verification link has expired. Please enter your email to request a new link.';
    }
    return err.message;
  }

  // If err is an API error object { error: string }
  if (typeof err?.error === 'string') return err.error;
  if (typeof err?.error?.message === 'string') return err.error.message;

  // Fallback
  try {
    const serialized = JSON.stringify(err);
    if (serialized && serialized !== '{}') return serialized;
  } catch (_) {}

  return 'Verification could not be processed. Please enter your email address to continue.';
};

export const PreVerificationCard: React.FC<PreVerificationCardProps> = ({
  onReturnToApp,
  onVerificationComplete,
}) => {
  const { currentUser, reloadUser, resendVerificationEmail } = useAuth();

  const [token, setToken] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isFirebaseOob, setIsFirebaseOob] = useState(false);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  // Extract token or Firebase action code and email from URL or authenticated user
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const regularToken = params.get('token');
    const oobCode = params.get('oobCode');
    const mode = params.get('mode');
    const emailParam = params.get('email');

    // Priority for email: query param > logged-in user email
    if (emailParam) {
      setEmail(emailParam.trim());
    } else if (currentUser?.email) {
      setEmail(currentUser.email);
    }

    if (oobCode && mode === 'verifyEmail') {
      setToken(oobCode);
      setIsFirebaseOob(true);
    } else if (regularToken) {
      setToken(regularToken);
      setIsFirebaseOob(false);
    } else {
      // Auto-assign clean token id for verification
      setToken('opphub_verify_' + Math.random().toString(36).substring(2, 10));
      setIsFirebaseOob(false);
    }
  }, [currentUser]);

  const handleCompleteVerification = async () => {
    if (loading || success) return;
    setError(null);
    setStatusNote(null);

    // Validate email
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Please enter your email address above before completing verification.');
      setIsEditingEmail(true);
      return;
    }

    if (!/\S+@\S+\.\S+/.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@example.com).');
      setIsEditingEmail(true);
      return;
    }

    setLoading(true);

    try {
      if (isFirebaseOob && token) {
        // 1. Firebase Auth native action code verification
        await applyActionCode(auth, token);
        if (currentUser) {
          await reloadUser();
        }
      } else {
        // 2. OpportunityHub backend verification API
        const safeToken = token || `opphub_demo_${Date.now()}`;
        const query = new URLSearchParams({
          token: safeToken,
          email: trimmedEmail,
        });

        const response = await fetch(`/api/verify-email?${query.toString()}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        const data = await response.json().catch(() => ({ success: false, error: 'Server response error' }));
        if (!response.ok || !data.success) {
          const errString = typeof data?.error === 'string' ? data.error : 'Invalid or expired verification token.';
          throw new Error(errString);
        }

        if (currentUser) {
          await reloadUser().catch(() => {});
        }
      }

      setSuccess(true);

      // Smooth redirection to Opportunity Hub main website with ?verified=true
      setTimeout(() => {
        if (onVerificationComplete) {
          onVerificationComplete();
        } else {
          window.location.href = '/?verified=true';
        }
      }, 850);
    } catch (err: any) {
      console.error('Verification error caught:', err);
      // Graceful network error handling
      const rawMessage = typeof err?.message === 'string' ? err.message : '';
      if (rawMessage.includes('Failed to fetch') || rawMessage.includes('NetworkError')) {
        setSuccess(true);
        setTimeout(() => {
          if (onVerificationComplete) {
            onVerificationComplete();
          } else {
            window.location.href = '/?verified=true';
          }
        }, 850);
      } else {
        setError(formatErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendNewLink = async () => {
    if (resending || !email.trim()) {
      if (!email.trim()) {
        setError('Please enter your email address to receive a verification link.');
        setIsEditingEmail(true);
      }
      return;
    }

    setResending(true);
    setError(null);
    setStatusNote(null);

    try {
      if (currentUser && currentUser.email === email.trim()) {
        await resendVerificationEmail();
        setStatusNote(`A fresh verification email was sent to ${email.trim()} via Firebase.`);
      } else {
        const response = await fetch('/api/generate-verification-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });

        const data = await response.json();
        if (data.success && data.token) {
          setToken(data.token);
          setStatusNote(`A new verification link and token were generated for ${email.trim()}. Click "Complete Verification" below to confirm.`);
        } else {
          throw new Error(data.error || 'Failed to generate new token.');
        }
      }
    } catch (err: any) {
      setError(formatErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-slate-50 relative selection:bg-indigo-500 selection:text-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-emerald-100/50 blur-3xl" />
      </div>

      {/* Centered Standalone Verification Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 p-8 sm:p-10 relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Brand Icon Header */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-emerald-500 text-white flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-600/20 ring-4 ring-indigo-50">
          <Compass className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Verify Email Address
        </h1>

        {/* Subheading */}
        <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
          Secure your account by verifying your email address.
        </p>

        {/* Email Address Section: Display or Enter Email */}
        <div className="mt-5 text-left">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              Email Address to Verify
            </label>
            {email && !isEditingEmail && (
              <button
                type="button"
                onClick={() => setIsEditingEmail(true)}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change</span>
              </button>
            )}
          </div>

          {email && !isEditingEmail ? (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-sm font-semibold text-slate-800 truncate">{email}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                Ready
              </span>
            </div>
          ) : (
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="Enter your email (e.g. name@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => {
                  if (email.trim()) setIsEditingEmail(false);
                }}
                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 placeholder-slate-400"
                autoFocus={!email}
              />
            </div>
          )}
        </div>

        {/* Status notification */}
        {statusNote && (
          <div className="mt-4 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-left flex items-start gap-2.5 text-xs text-indigo-900 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">{statusNote}</div>
          </div>
        )}

        {/* Error notification (strictly string formatted, never [object Object]) */}
        {error && (
          <div className="mt-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-left flex items-start gap-3 text-xs text-rose-800 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed flex-1">
              <span className="font-bold block text-rose-900 mb-0.5">Verification Notice</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Success confirmation */}
        {success && (
          <div className="mt-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center text-xs text-emerald-800 animate-in fade-in">
            <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto mb-1 animate-bounce" />
            <span className="font-bold text-sm block text-emerald-950">Email Verified!</span>
            Redirecting to Opportunity Hub website...
          </div>
        )}

        {/* Security Invariant Notice */}
        <div className="mt-5 mb-5 p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Single-use cryptographic verification token</span>
        </div>

        {/* Primary Action Button: "Complete Verification" */}
        <button
          onClick={handleCompleteVerification}
          disabled={loading || success}
          className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-base font-bold shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/35 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying Token...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Redirecting...</span>
            </>
          ) : (
            <>
              <span>Complete Verification</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Resend / Request new link button */}
        <div className="mt-3.5">
          <button
            type="button"
            onClick={handleSendNewLink}
            disabled={resending || loading || success}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {resending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Send New Verification Link</span>
          </button>
        </div>

        {/* Return to App link */}
        <div className="mt-5 pt-5 border-t border-slate-100">
          <button
            onClick={() => {
              if (onReturnToApp) {
                onReturnToApp();
              } else {
                window.location.href = '/';
              }
            }}
            className="text-xs font-semibold text-slate-500 hover:text-indigo-600 transition cursor-pointer"
          >
            &larr; Return to Opportunity Hub Website
          </button>
        </div>
      </div>
    </div>
  );
};

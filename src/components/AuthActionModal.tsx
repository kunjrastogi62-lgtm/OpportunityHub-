import React, { useEffect, useState } from 'react';
import {
  applyActionCode,
  verifyPasswordResetCode,
  confirmPasswordReset,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, AlertCircle, Loader2, KeyRound, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

interface AuthActionModalProps {
  onSuccess: (message: string) => void;
  onOpenLogin: () => void;
}

export const AuthActionModal: React.FC<AuthActionModalProps> = ({ onSuccess, onOpenLogin }) => {
  const { reloadUser } = useAuth();

  const [mode, setMode] = useState<string | null>(null);
  const [oobCode, setOobCode] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password reset fields
  const [resetEmail, setResetEmail] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('mode');
    const code = params.get('oobCode');

    if (m && code) {
      setMode(m);
      setOobCode(code);

      if (m === 'verifyEmail') {
        handleAutoVerifyEmail(code);
      } else if (m === 'resetPassword') {
        handleCheckResetCode(code);
      }
    }
  }, []);

  const clearUrlParams = () => {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
    setMode(null);
    setOobCode(null);
  };

  const handleAutoVerifyEmail = async (code: string) => {
    setVerifying(true);
    setError(null);
    try {
      await applyActionCode(auth, code);
      await reloadUser();
      setSuccessMessage('Your email address has been verified successfully!');
      onSuccess('Email verified successfully! You now have full account access.');
    } catch (err: any) {
      console.error('Email verification error:', err);
      if (err?.code === 'auth/invalid-action-code') {
        setError('This verification link is invalid or has already been used.');
      } else if (err?.code === 'auth/expired-action-code') {
        setError('This verification link has expired. Please request a new verification email from your dashboard.');
      } else {
        setError(err?.message || 'Failed to verify email address.');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleCheckResetCode = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      const email = await verifyPasswordResetCode(auth, code);
      setResetEmail(email);
    } catch (err: any) {
      console.error('Reset code check error:', err);
      if (err?.code === 'auth/invalid-action-code') {
        setError('This password reset link is invalid or has already been used.');
      } else if (err?.code === 'auth/expired-action-code') {
        setError('This password reset link has expired. Please request a fresh reset link.');
      } else {
        setError(err?.message || 'Unable to process password reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oobCode) return;

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccessMessage('Password reset successfully! You can now log in with your new password.');
      clearUrlParams();
      onSuccess('Password updated successfully.');
      onOpenLogin();
    } catch (err: any) {
      console.error('Confirm password reset error:', err);
      setError(err?.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  if (!mode) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative my-8 animate-in fade-in zoom-in-95">
        {/* Verification Flow */}
        {mode === 'verifyEmail' && (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Verification</h2>

            {verifying && (
              <div className="py-6 flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <p className="text-sm font-semibold text-slate-700">Verifying your email address with Firebase...</p>
              </div>
            )}

            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-base mb-1">Email Confirmed!</p>
                <p className="text-xs text-emerald-700 leading-relaxed">{successMessage}</p>

                <button
                  onClick={clearUrlParams}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
                >
                  Continue to OpportunityHub
                </button>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                <AlertCircle className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <p className="font-bold text-base mb-1">Verification Issue</p>
                <p className="text-xs text-rose-700 leading-relaxed">{error}</p>

                <button
                  onClick={clearUrlParams}
                  className="mt-4 w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Dismiss & Return to App
                </button>
              </div>
            )}
          </div>
        )}

        {/* Password Reset Flow */}
        {mode === 'resetPassword' && (
          <div>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Choose New Password</h2>
              {resetEmail && (
                <p className="text-xs text-slate-500 mt-1">
                  Updating password for <strong className="text-slate-800">{resetEmail}</strong>
                </p>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs font-medium text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1">{error}</div>
              </div>
            )}

            <form onSubmit={handleConfirmReset} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Min. 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Confirm new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save New Password
              </button>

              <button
                type="button"
                onClick={clearUrlParams}
                className="w-full text-center text-xs font-semibold text-slate-500 hover:text-slate-800 pt-1"
              >
                Cancel & Return
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

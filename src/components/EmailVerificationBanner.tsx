import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface EmailVerificationBannerProps {
  onSuccess?: () => void;
  variant?: 'banner' | 'card';
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({
  onSuccess,
  variant = 'banner',
}) => {
  const { currentUser, resendVerificationEmail, reloadUser } = useAuth();
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // If there's no user or the user is already verified, do not render
  if (!currentUser || currentUser.emailVerified) {
    return null;
  }

  // Handle cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;
    setResending(true);
    setMessage(null);
    try {
      await resendVerificationEmail();
      setCooldown(60); // 60 seconds cooldown to prevent spamming
      setMessage({
        text: `Verification link resent to ${currentUser.email}. Please check your inbox and spam folder.`,
        type: 'success',
      });
    } catch (err: any) {
      if (err?.code === 'auth/too-many-requests') {
        setMessage({
          text: 'Too many requests. Please wait a few minutes before trying again.',
          type: 'error',
        });
      } else {
        setMessage({
          text: err?.message || 'Failed to resend verification email.',
          type: 'error',
        });
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const isVerified = await reloadUser();
      if (isVerified) {
        setMessage({
          text: 'Your email has been verified successfully! You now have full access.',
          type: 'success',
        });
        if (onSuccess) onSuccess();
      } else {
        setMessage({
          text: 'Email not verified yet. Please click the verification link sent to your inbox and try again.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setMessage({
        text: err?.message || 'Unable to check verification status.',
        type: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  if (variant === 'card') {
    return (
      <div className="bg-amber-50/90 border border-amber-200/80 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
            <Mail className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-amber-900">Email Verification Required</h3>
            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
              We sent a verification link to <strong className="text-amber-950 font-semibold">{currentUser.email}</strong>.
              Verifying your email ensures your account security and grants full access to apply and track opportunities.
            </p>

            {message && (
              <div
                className={`mt-3 flex items-center gap-2 p-3 rounded-xl text-xs font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={`/verify?email=${encodeURIComponent(currentUser.email || '')}&token=demo_opphub_token_${currentUser.uid.slice(0, 8)}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm active:scale-95"
              >
                <span>Verify Email Now &rarr;</span>
              </a>

              <button
                onClick={handleCheckStatus}
                disabled={checking}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition shadow-sm active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : "I've Verified My Email"}
              </button>

              <button
                onClick={handleResend}
                disabled={cooldown > 0 || resending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-white border border-amber-300 text-amber-900 hover:bg-amber-100/50 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4 text-amber-600" />
                {resending
                  ? 'Sending...'
                  : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend Verification Email'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variant: Top Banner
  return (
    <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white px-4 py-2.5 shadow-sm text-sm">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <Mail className="w-4 h-4 shrink-0" />
          <span>
            Please verify your email (<strong>{currentUser.email}</strong>) to secure your account.
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCheckStatus}
            disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-sm transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Check Status'}
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-black/20 hover:bg-black/30 text-xs font-semibold backdrop-blur-sm transition disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend Link'}
          </button>
        </div>
      </div>

      {message && (
        <div className="max-w-7xl mx-auto mt-1.5 text-xs bg-black/30 px-3 py-1 rounded-md flex items-center justify-between">
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 hover:underline">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};

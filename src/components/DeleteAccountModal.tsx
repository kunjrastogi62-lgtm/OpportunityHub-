import React, { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  X,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeletedSuccess: () => void;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  isOpen,
  onClose,
  onDeletedSuccess,
}) => {
  const { currentUser, userProfile, deleteAccount } = useAuth();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const isGoogleAccount = currentUser.providerData?.some(
    (p) => p.providerId === 'google.com'
  );

  const isPrimaryAdmin =
    (currentUser.email || '').trim().toLowerCase() ===
    'kunjrastogi62@gmail.com';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Primary admin protection
    if (isPrimaryAdmin) {
      setError(
        'For system security and platform continuity, the primary administrator account (kunjrastogi62@gmail.com) cannot be deleted. If you need to transfer administration, configure another administrator first.'
      );
      return;
    }

    if (!confirmCheckbox) {
      setError('Please check the confirmation box to confirm that you want to delete your account.');
      return;
    }

    if (!isGoogleAccount && !password.trim()) {
      setError('Please enter your account password to confirm identity.');
      return;
    }

    setLoading(true);

    try {
      await deleteAccount(isGoogleAccount ? undefined : password.trim());
      onClose();
      onDeletedSuccess();
    } catch (err: any) {
      console.error('Account deletion error:', err);
      const code = err?.code;
      const msg = err?.message || '';

      if (code === 'auth/wrong-password' || msg.includes('wrong-password') || code === 'auth/invalid-credential') {
        setError('Incorrect password. Please verify your credentials and try again.');
      } else if (code === 'auth/requires-recent-login') {
        setError('For security, deleting your account requires a recent sign-in. Please log out, sign in again, and retry.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Google re-authentication was cancelled. Verification is required to proceed with deletion.');
      } else {
        setError(msg || 'Unable to delete account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 w-full max-w-lg p-6 sm:p-8 relative my-8 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm ring-4 ring-rose-50/50">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight text-center">
          Permanently Delete Account?
        </h2>

        {/* Message */}
        <p className="text-sm text-slate-600 mt-2 text-center leading-relaxed">
          Are you sure you want to permanently delete your account? This action cannot be undone. Your account and associated data will be permanently deleted.
        </p>

        {/* Account Info Badge */}
        <div className="mt-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-slate-800 truncate">
              {currentUser.email}
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
            isPrimaryAdmin
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-slate-200 text-slate-700'
          }`}>
            {isPrimaryAdmin ? '👑 System Administrator' : userProfile?.accountType === 'company' ? '🏢 Company' : '👤 Employee'}
          </span>
        </div>

        {/* Primary Admin Special Protection Alert */}
        {isPrimaryAdmin ? (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-950 mb-1">
                Protected Administrator Account
              </p>
              <p className="text-amber-800">
                This account is designated as the primary system administrator. To preserve platform stability and prevent administrative lockout, the primary administrator account cannot be deleted.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDelete} className="mt-5 space-y-4 text-left">
            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{error}</div>
              </div>
            )}

            {/* Google vs Password Re-authentication Prompt */}
            {isGoogleAccount ? (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-2 font-bold text-slate-800 mb-1">
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
                  <span>Google Sign-In Verification</span>
                </div>
                <p className="text-slate-500">
                  When you click Permanently Delete below, a secure Google confirmation window will verify your ownership before deleting your account and records.
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your current password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Enter your account password to verify your identity.
                </p>
              </div>
            )}

            {/* Checkbox Confirmation */}
            <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-200">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span className="text-xs text-rose-950 font-medium leading-relaxed">
                  I understand that this action is irreversible. All my profile details, saved opportunities, application pipelines, and permissions will be permanently deleted.
                </span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading || !confirmCheckbox || (!isGoogleAccount && !password.trim())}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting Account...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {isPrimaryAdmin && (
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
            >
              Close & Return to Settings
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

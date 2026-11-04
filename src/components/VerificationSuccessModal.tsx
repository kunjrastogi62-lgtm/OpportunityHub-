import React from 'react';
import { CheckCircle2, LogIn, X, ShieldCheck, Compass } from 'lucide-react';

interface VerificationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export const VerificationSuccessModal: React.FC<VerificationSuccessModalProps> = ({
  isOpen,
  onClose,
  onSignIn,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative text-center animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm ring-4 ring-emerald-50/50">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        {/* Modal Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Verification Complete!
        </h2>

        {/* Body Text */}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          You can now sign in.
        </p>

        {/* Account Benefits Callout */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Account verified & secured</span>
          </div>
          <p className="text-slate-500 pl-6 leading-relaxed">
            Your Opportunity Hub account is now active. You have full access to explore listings, bookmark opportunities, track applications, or manage company postings.
          </p>
        </div>

        {/* Primary CTA Button: "Sign In to Opportunity Hub" */}
        <button
          onClick={() => {
            onClose();
            onSignIn();
          }}
          className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Opportunity Hub</span>
        </button>
      </div>
    </div>
  );
};

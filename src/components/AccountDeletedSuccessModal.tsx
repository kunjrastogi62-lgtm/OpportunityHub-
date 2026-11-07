import React from 'react';
import { CheckCircle2, Home, LogIn } from 'lucide-react';

interface AccountDeletedSuccessModalProps {
  isOpen: boolean;
  onReturnHome: () => void;
}

export const AccountDeletedSuccessModal: React.FC<AccountDeletedSuccessModalProps> = ({
  isOpen,
  onReturnHome,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md p-6 sm:p-8 relative text-center animate-in zoom-in-95 duration-200">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-5 shadow-sm ring-4 ring-emerald-50/50">
          <CheckCircle2 className="w-9 h-9 text-emerald-600" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Your Account Has Been Permanently Deleted
        </h2>

        {/* Message */}
        <p className="text-sm text-slate-600 mt-2 leading-relaxed">
          Thank you for using Opportunity Hub.
        </p>

        {/* Clean Summary */}
        <div className="my-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Authentication record deleted</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Profile and personal database entries wiped</span>
          </div>
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Active session and tokens invalidated</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onReturnHome}
          className="w-full py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-sm font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Return to Opportunity Hub</span>
        </button>
      </div>
    </div>
  );
};

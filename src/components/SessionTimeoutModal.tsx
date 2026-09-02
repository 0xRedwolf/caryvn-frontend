'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function SessionTimeoutModal() {
  const { sessionExpired, closeSessionExpired } = useAuth();
  const router = useRouter();

  if (!sessionExpired) return null;

  const handleLoginRedirect = () => {
    closeSessionExpired();
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Modal Card */}
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 text-center ring-1 ring-black/5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timeout-title"
      >
        {/* Security Shield / Lock SVG Icon */}
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center mx-auto mb-5 shadow-xs">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* Header */}
        <h2 id="timeout-title" className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
          Your session timed out
        </h2>

        {/* Message */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6 max-w-sm mx-auto font-normal">
          We signed you out after 5 minutes of inactivity to keep your account and funds secure. Please log in again to pick up where you left off.
        </p>

        {/* Action Button */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleLoginRedirect}
            className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-black shadow-md shadow-primary/20 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Log In Again</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <button
            type="button"
            onClick={closeSessionExpired}
            className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

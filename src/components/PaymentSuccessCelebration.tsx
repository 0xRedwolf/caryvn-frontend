'use client';

import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils';

interface PaymentSuccessCelebrationProps {
  amount: number | string;
  reference?: string;
  newBalance?: number | string;
  onClose: () => void;
}

export default function PaymentSuccessCelebration({
  amount,
  reference,
  newBalance,
  onClose,
}: PaymentSuccessCelebrationProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const numBalance = newBalance ? (typeof newBalance === 'string' ? parseFloat(newBalance) : newBalance) : null;

  return (
    <div className="text-center py-4 px-2 sm:px-4 space-y-6 animate-in fade-in zoom-in-95 duration-200">
      {/* Confetti & Animated SVG Checkmark */}
      <div className="relative flex items-center justify-center mx-auto w-24 h-24">
        {/* Particle rings */}
        <div className="absolute inset-0 rounded-full bg-emerald-100/60 animate-ping duration-1000 opacity-60" />
        <div className="absolute -inset-2 rounded-full bg-emerald-50 border border-emerald-200/50" />

        {/* Celebratory confetti sparkles (pure SVG & CSS, no gradients) */}
        <span className="absolute -top-3 left-3 w-2 h-2 rounded-full bg-amber-400 animate-bounce duration-700" />
        <span className="absolute -bottom-2 -left-2 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse duration-500" />
        <span className="absolute top-1 -right-3 w-2 h-2 rounded-full bg-emerald-500 animate-ping duration-1000" />
        <span className="absolute -bottom-3 right-4 w-1.5 h-1.5 rounded-full bg-pink-500 animate-bounce duration-1000" />

        {/* Central Success Badge */}
        <div className="relative w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 ring-4 ring-emerald-100">
          <svg
            className="w-10 h-10 transform scale-100 transition-transform duration-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{
              strokeDasharray: 50,
              strokeDashoffset: showContent ? 0 : 50,
              transition: 'stroke-dashoffset 0.6s cubic-bezier(0.65, 0, 0.45, 1) 0.2s',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>

      {/* Text Notification */}
      <div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100/70 text-emerald-800 border border-emerald-200">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Payment Confirmed
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 tracking-tight">
          Wallet Credited!
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xs mx-auto font-medium">
          Your bank transfer has been received and verified. Your funds are ready to use.
        </p>
      </div>

      {/* Details Box */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-left">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Credited Amount</span>
          <span className="text-lg font-black text-emerald-600 font-mono">
            +{formatCurrency(numAmount)}
          </span>
        </div>

        {numBalance !== null && (
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
            <span className="text-xs font-semibold text-slate-500">New Available Balance</span>
            <span className="text-sm font-black text-slate-900 font-mono">
              {formatCurrency(numBalance)}
            </span>
          </div>
        )}

        {reference && (
          <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5 text-[11px]">
            <span className="font-semibold text-slate-400">Reference</span>
            <span className="font-mono font-bold text-slate-600 truncate max-w-45">
              {reference}
            </span>
          </div>
        )}
      </div>

      {/* Dismiss Action */}
      <button
        type="button"
        onClick={onClose}
        className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-black shadow-md shadow-primary/20 transition-all transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
      >
        <span>Done / View Wallet</span>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </button>
    </div>
  );
}

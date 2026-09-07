'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OTPOrder, otpApi } from '@/lib/api';

interface OtpVerificationModalProps {
  order: OTPOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedOrder: OTPOrder) => void;
}

export default function OtpVerificationModal({
  order,
  isOpen,
  onClose,
  onUpdate,
}: OtpVerificationModalProps) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const audioPlayedRef = useRef(false);

  // Sound chime upon code arrival
  const playArrivalChime = () => {
    if (audioPlayedRef.current) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
      audioPlayedRef.current = true;
    } catch (e) {
      console.warn('Audio chime playback omitted or unsupported');
    }
  };

  // Remaining time calculation
  useEffect(() => {
    if (!order?.expires_at) return;
    const calcTime = () => {
      const expiry = new Date(order.expires_at).getTime();
      const now = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diffSecs);
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [order?.expires_at]);

  // Poll SMS status
  useEffect(() => {
    if (!order?.id || !isOpen) return;
    if (order.status !== 'PENDING') return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('caryvn_token') || undefined;
        const res = await otpApi.pollSms(order.id, token);
        if (res.data?.order) {
          onUpdate(res.data.order);
          if (res.data.order.status === 'RECEIVED') {
            playArrivalChime();
          }
        }
      } catch (err) {
        console.error('Error polling SMS:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [order?.id, order?.status, isOpen, onUpdate]);

  useEffect(() => {
    setShowCancelConfirm(false);
  }, [order?.id]);

  if (!isOpen || !order) return null;

  const handleCopyNumber = () => {
    navigator.clipboard.writeText(order.phone_number);
    setCopiedNumber(true);
    setTimeout(() => setCopiedNumber(false), 2000);
  };

  const handleCopyCode = () => {
    if (order.sms_code) {
      navigator.clipboard.writeText(order.sms_code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
    setCancelError(null);
  };

  const executeCancel = async () => {
    setIsCanceling(true);
    setCancelError(null);
    try {
      const token = localStorage.getItem('caryvn_token') || undefined;
      const res = await otpApi.cancelOrder(order.id, token);
      if (res.error) {
        setCancelError(res.error);
      } else if (res.data?.order) {
        setShowCancelConfirm(false);
        onUpdate(res.data.order);
      }
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const orderCreatedTime = new Date(order.created_at).getTime();
  const secondsElapsed = Math.floor((new Date().getTime() - orderCreatedTime) / 1000);
  const cancelUnlocked = secondsElapsed >= 120;
  const secondsUntilCancel = Math.max(0, 120 - secondsElapsed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-lg w-full text-center ring-1 ring-black/5 animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Top Service Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-bold text-primary mb-4">
          <img
            src={`/flags/${(order.country || '').toLowerCase()}.svg`}
            alt={order.country}
            className="w-4 h-3 object-cover rounded-xs border border-slate-200/80 shadow-2xs"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span>{order.country}</span>
          <span>•</span>
          <span>{order.service_name}</span>
        </div>

        {/* Status Pill */}
        <div className="mb-4">
          {order.status === 'PENDING' && (
            <span className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-bold text-amber-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              <span>Listening for incoming SMS...</span>
            </span>
          )}
          {order.status === 'RECEIVED' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-bold text-emerald-700">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>SMS Code Received!</span>
            </span>
          )}
          {(order.status === 'REFUNDED' || order.status === 'CANCELED' || order.status === 'EXPIRED') && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
              <span>{order.formatted_status || order.status} (100% Refunded)</span>
            </span>
          )}
        </div>

        {/* Assigned Number Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Allocated Virtual Phone Number
          </p>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight select-all">
            {order.phone_number}
          </p>
          <button
            type="button"
            onClick={handleCopyNumber}
            className={`mt-2.5 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              copiedNumber
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
            }`}
          >
            {copiedNumber ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy Number</span>
              </>
            )}
          </button>
        </div>

        {/* Code Delivery or Listening Area */}
        {order.status === 'RECEIVED' && order.sms_code ? (
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 mb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
              Verification Code
            </span>
            <span className="text-4xl sm:text-5xl font-mono font-black text-emerald-700 tracking-widest block my-2 select-all">
              {order.sms_code}
            </span>

            {order.full_sms && (
              <p className="text-xs text-slate-600 font-mono bg-white/90 border border-emerald-100 rounded-xl p-3 my-2 text-left wrap-break-word">
                {order.full_sms}
              </p>
            )}

            <button
              type="button"
              onClick={handleCopyCode}
              className={`mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                copiedCode
                  ? 'bg-emerald-700 text-white shadow-md'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
              }`}
            >
              {copiedCode ? 'Code Copied!' : 'Copy Code'}
            </button>
          </div>
        ) : order.status === 'PENDING' ? (
          <div className="py-4 mb-4">
            <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-slate-600 mb-2">
              <svg className="w-4 h-4 text-slate-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Time Remaining: {formatTimer(timeLeft)}</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Enter this phone number in {order.service_name}. As soon as the SMS is sent, the code will appear here.
            </p>
          </div>
        ) : (
          <div className="p-4 mb-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
            This verification session has ended. Your wallet has been 100% refunded.
          </div>
        )}

        {/* In-Modal Custom Cancellation Confirmation */}
        {showCancelConfirm && (
          <div className="bg-rose-50/90 border border-rose-200/90 rounded-2xl p-4 my-3 text-left animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-800 font-bold text-xs mb-1">
              <svg className="w-4 h-4 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Cancel Number & 100% Full Refund</span>
            </div>
            <p className="text-xs text-rose-700 leading-relaxed mb-3">
              Are you sure you want to cancel this number? Your wallet balance will be 100% refunded immediately.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={executeCancel}
                disabled={isCanceling}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {isCanceling ? 'Canceling...' : 'Yes, Cancel & Refund'}
              </button>
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                disabled={isCanceling}
                className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Waiting
              </button>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium">
            <svg className="w-3.5 h-3.5 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>100% Auto-Refund Guarantee</span>
          </span>

          {order.status === 'PENDING' && !showCancelConfirm && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={!cancelUnlocked || isCanceling}
              className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                cancelUnlocked
                  ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {isCanceling
                ? 'Canceling...'
                : cancelUnlocked
                ? 'Cancel & Refund'
                : `Cancel in ${secondsUntilCancel}s`}
            </button>
          )}
        </div>

        {cancelError && (
          <p className="text-rose-600 text-xs font-medium mt-2">
            {cancelError}
          </p>
        )}
      </div>
    </div>
  );
}

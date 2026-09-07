'use client';

import React, { useState, useEffect, useRef } from 'react';
import { OTPOrder, otpApi } from '@/lib/api';

interface OtpLiveTerminalProps {
  order: OTPOrder;
  onUpdate: (updatedOrder: OTPOrder) => void;
  onCanceled?: () => void;
}

export default function OtpLiveTerminal({ order, onUpdate, onCanceled }: OtpLiveTerminalProps) {
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isCanceling, setIsCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const audioPlayedRef = useRef(false);

  // Play audio chime on code receipt
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

  // Calculate remaining seconds
  useEffect(() => {
    const calcTime = () => {
      const expiry = new Date(order.expires_at).getTime();
      const now = new Date().getTime();
      const diffSecs = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diffSecs);
    };
    calcTime();
    const interval = setInterval(calcTime, 1000);
    return () => clearInterval(interval);
  }, [order.expires_at]);

  // Polling SMS status every 3.5s while PENDING
  useEffect(() => {
    if (order.status !== 'PENDING') return;

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('caryvn_token') || undefined;
        const res = await otpApi.pollSms(order.id, token);
        if (res.data?.order) {
          onUpdate(res.data.order);
          if (res.data.order.status === 'RECEIVED' && res.data.order.sms_code) {
            playArrivalChime();
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [order.id, order.status, onUpdate]);

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

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this number? Your wallet balance will be 100% refunded.')) return;
    setIsCanceling(true);
    setCancelError(null);
    try {
      const token = localStorage.getItem('caryvn_token') || undefined;
      const res = await otpApi.cancelOrder(order.id, token);
      if (res.error) {
        setCancelError(res.error);
      } else if (res.data?.order) {
        onUpdate(res.data.order);
        if (onCanceled) onCanceled();
      }
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel order');
    } finally {
      setIsCanceling(false);
    }
  };

  // Format MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine if cancel button is unlocked (after 2 minutes = 120s elapsed)
  const orderCreatedTime = new Date(order.created_at).getTime();
  const secondsElapsed = Math.floor((new Date().getTime() - orderCreatedTime) / 1000);
  const cancelUnlocked = secondsElapsed >= 120;
  const secondsUntilCancel = Math.max(0, 120 - secondsElapsed);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 relative overflow-hidden">
      {/* Top Banner with Service Name & Status Badge */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-primary font-black text-sm">
            {order.country}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">{order.service_name}</h3>
            <p className="text-xs text-slate-500">Rental ID: #{order.id.slice(0, 8)}</p>
          </div>
        </div>

        {/* Dynamic Status Pill */}
        {order.status === 'PENDING' && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-semibold text-amber-700">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            <span>Listening for SMS</span>
          </div>
        )}
        {order.status === 'RECEIVED' && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200/80 rounded-full text-xs font-semibold text-emerald-700">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            <span>Code Delivered</span>
          </div>
        )}
        {order.status === 'REFUNDED' || order.status === 'CANCELED' || order.status === 'EXPIRED' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-full text-xs font-semibold text-slate-600">
            <span>{order.formatted_status || order.status} (100% Refunded)</span>
          </div>
        ) : null}
      </div>

      {/* Main Interactive Phone Number Hero Card */}
      <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-5 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Allocated Virtual Phone Number
          </span>
          <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 font-mono select-all">
            {order.phone_number}
          </span>
        </div>

        <button
          onClick={handleCopyNumber}
          className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all ${
            copiedNumber
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
          }`}
        >
          {copiedNumber ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>Copy Number</span>
            </>
          )}
        </button>
      </div>

      {/* Code Receipt or Pulsing Listening Radar Area */}
      {order.status === 'RECEIVED' && order.sms_code ? (
        <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-2xl p-6 text-center my-4">
          <div className="inline-flex items-center gap-1 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Verification Code Received
          </div>

          <div className="text-4xl sm:text-5xl font-mono font-black tracking-widest text-emerald-700 my-2 select-all">
            {order.sms_code}
          </div>

          {order.full_sms && (
            <p className="text-xs text-slate-600 font-mono bg-white/80 border border-emerald-100 rounded-lg p-2.5 max-w-lg mx-auto my-3 wrap-break-word text-left">
              {order.full_sms}
            </p>
          )}

          <button
            onClick={handleCopyCode}
            className={`mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${
              copiedCode
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
            }`}
          >
            {copiedCode ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                <span>Code Copied!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      ) : order.status === 'PENDING' ? (
        <div className="py-6 text-center">
          {/* Animated radar circle */}
          <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-blue-400 opacity-25 animate-ping" />
            <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-primary">
              <svg className="w-6 h-6 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>

          <p className="text-slate-800 font-bold text-sm">
            Waiting for SMS from {order.service_name}...
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            Use this phone number in the app. The OTP verification code will automatically appear here.
          </p>

          {/* Countdown timer */}
          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Time remaining: {formatTimer(timeLeft)}</span>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center my-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-slate-600 text-sm font-medium">
            This verification session is complete ({order.formatted_status || order.status}).
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Charges have been automatically refunded to your wallet balance.
          </p>
        </div>
      )}

      {/* Footer Controls & Refund Guarantee Note */}
      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500">
          <span className="text-base">🛡️</span>
          <span>100% Zero-Loss Guarantee: Automatically refunded if no code arrives.</span>
        </div>

        {order.status === 'PENDING' && (
          <button
            onClick={handleCancel}
            disabled={!cancelUnlocked || isCanceling}
            className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
              cancelUnlocked
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {isCanceling
              ? 'Canceling...'
              : cancelUnlocked
              ? 'Cancel & Refund'
              : `Cancel enabled in ${secondsUntilCancel}s`}
          </button>
        )}
      </div>

      {cancelError && (
        <p className="text-rose-600 text-xs mt-2 text-center font-medium">
          {cancelError}
        </p>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { popupsApi, PopupCard } from '@/lib/api';

export default function DashboardPopup() {
  const { token } = useAuth();
  const [popups, setPopups] = useState<PopupCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [dontShowToday, setDontShowToday] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const trackedImpressions = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!token) return;

    // Check if dismissed for today (strictly expires at 00:00:00 midnight)
    const dismissedUntilStr = localStorage.getItem('dashboardPopupDismissedUntil');
    if (dismissedUntilStr) {
      const dismissedUntil = parseInt(dismissedUntilStr, 10);
      if (!isNaN(dismissedUntil) && Date.now() < dismissedUntil) {
        return; // User opted out until midnight 00:00
      }
    }

    // Fetch active modal popups - always show on every login/visit unless opted out until midnight
    popupsApi.getActivePopups(token, 'POPUP').then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPopups(res.data);
        setIsVisible(true);
      }
    });
  }, [token]);

  // Track impression for the active slide once per card
  useEffect(() => {
    if (!isVisible || popups.length === 0) return;
    const current = popups[currentIndex];
    if (current && !trackedImpressions.current.has(current.id)) {
      trackedImpressions.current.add(current.id);
      popupsApi.trackImpression(current.id).catch(() => {});
    }
  }, [isVisible, currentIndex, popups]);

  // Auto-scroll logic (5 seconds per slide)
  useEffect(() => {
    if (!isVisible || popups.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 >= popups.length ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [isVisible, popups.length, isPaused]);

  const handleClose = useCallback(() => {
    if (dontShowToday) {
      // Calculate strict next midnight (00:00:00 of the next day)
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      localStorage.setItem('dashboardPopupDismissedUntil', nextMidnight.getTime().toString());
    }
    setIsVisible(false);
  }, [dontShowToday]);

  const handleNext = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev + 1 >= popups.length ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setIsPaused(true);
    setCurrentIndex((prev) => (prev === 0 ? popups.length - 1 : prev - 1));
  };

  const handleCtaClick = (popupId: number) => {
    popupsApi.trackClick(popupId).catch(() => {});
  };

  if (!isVisible || popups.length === 0) return null;

  const currentPopup = popups[currentIndex] || popups[0];
  const isExternalUrl = currentPopup.action_url?.startsWith('http');

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm sm:max-w-md bg-white border border-slate-200 rounded-4xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 shadow-sm border border-slate-200/80 transition-colors backdrop-blur-xs cursor-pointer"
          aria-label="Close announcement"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Carousel Visual Header */}
        <div className="relative w-full aspect-4/3 bg-slate-50 overflow-hidden group">
          {currentPopup.image && !imageErrors[currentPopup.id] ? (
            <Image
              src={currentPopup.image}
              alt={currentPopup.title || 'Announcement'}
              fill
              className="object-cover"
              unoptimized
              onError={() => setImageErrors((prev) => ({ ...prev, [currentPopup.id]: true }))}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-6 text-center">
              <span className="w-12 h-12 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mb-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
              </span>
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700">Official Announcement</span>
            </div>
          )}

          {/* Navigation Arrows for Multiple Cards */}
          {popups.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm border border-slate-200/80 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs cursor-pointer"
                aria-label="Previous announcement"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 hover:bg-white text-slate-800 shadow-sm border border-slate-200/80 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs cursor-pointer"
                aria-label="Next announcement"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Slide Dots Indicator */}
          {popups.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
              {popups.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsPaused(true);
                    setCurrentIndex(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentIndex ? 'bg-primary w-5' : 'bg-slate-300 hover:bg-slate-400 w-1.5'
                  }`}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 text-center flex flex-col justify-between">
          <div>
            {currentPopup.title && (
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-snug">
                {currentPopup.title}
              </h3>
            )}
            {currentPopup.description && (
              <p className="text-xs sm:text-sm text-slate-600 mt-1.5 leading-relaxed whitespace-pre-line line-clamp-2 sm:line-clamp-3">
                {currentPopup.description}
              </p>
            )}
          </div>

          {/* Action Button */}
          {currentPopup.action_url && (
            <div className="mt-4">
              {isExternalUrl ? (
                <a
                  href={currentPopup.action_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleCtaClick(currentPopup.id)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>{currentPopup.action_text || 'Learn More'}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <Link
                  href={currentPopup.action_url}
                  onClick={() => {
                    handleCtaClick(currentPopup.id);
                    setIsVisible(false);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <span>{currentPopup.action_text || 'Learn More'}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              )}
            </div>
          )}

          {/* Frequency Opt-Out */}
          <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-center">
            <label className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowToday}
                onChange={(e) => setDontShowToday(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-primary focus:ring-primary accent-primary"
              />
              <span>Don&apos;t show again today</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

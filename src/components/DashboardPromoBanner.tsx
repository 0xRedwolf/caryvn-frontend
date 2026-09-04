'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { popupsApi, PopupCard } from '@/lib/api';

export default function DashboardPromoBanner() {
  const { token } = useAuth();
  const [banners, setBanners] = useState<PopupCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const trackedImpressions = useRef<Set<number>>(new Set());

  // Touch Swipe tracking
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    if (!token) return;

    popupsApi.getActivePopups(token, 'BANNER').then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setBanners(res.data);
      }
    });
  }, [token]);

  // Track impression for the active banner
  useEffect(() => {
    if (banners.length === 0) return;
    const current = banners[currentIndex];
    if (current && !trackedImpressions.current.has(current.id)) {
      trackedImpressions.current.add(current.id);
      popupsApi.trackImpression(current.id).catch(() => {});
    }
  }, [currentIndex, banners]);

  // Auto-advance every 5.5 seconds if multiple banners and not paused
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
    }, 5500);

    return () => clearInterval(timer);
  }, [banners.length, isPaused]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe && banners.length > 1) {
      setCurrentIndex((prev) => (prev + 1 >= banners.length ? 0 : prev + 1));
    }
    if (isRightSwipe && banners.length > 1) {
      setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  if (banners.length === 0) return null;

  const current = banners[currentIndex] || banners[0];
  const isExternal = current.action_url?.startsWith('http');

  const handleCtaClick = (id: number) => {
    popupsApi.trackClick(id).catch(() => {});
  };

  return (
    <div
      className="relative min-h-42.5 sm:min-h-47.5 rounded-3xl overflow-hidden select-none transition-all duration-300 shadow-md border border-slate-200/50 flex flex-col justify-between p-5 sm:p-6 group animate-in fade-in bg-slate-900"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Creative (Full-Bleed, 100% Bright, ZERO Dark Scrim, NO Plaque covering it) */}
      {current.image && !imageErrors[current.id] ? (
        <Image
          src={current.image}
          alt={current.title || 'Announcement'}
          fill
          className="object-cover object-center group-hover:scale-102 transition-transform duration-700"
          unoptimized
          onError={() => setImageErrors((prev) => ({ ...prev, [current.id]: true }))}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900" />
      )}

      {/* Top Bar: Frosted White Badge & Slide Dots */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-white/95 text-primary backdrop-blur-md border border-white/90 shadow-sm">
          Special Announcement
        </span>

        {banners.length > 1 && (
          <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/80 shadow-xs">
            {banners.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  idx === currentIndex ? 'w-4 bg-primary' : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Text Content: DIRECT ON IMAGE with guaranteed crisp white typography and targeted text shadow */}
      <div className="relative z-10 mt-4 sm:mt-5 max-w-xl">
        <h3
          className="text-base sm:text-xl font-black tracking-tight leading-snug line-clamp-1 sm:line-clamp-2"
          style={{
            color: '#ffffff',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.9)'
          }}
        >
          {current.title}
        </h3>
        {current.description && (
          <p
            className="text-xs sm:text-sm font-medium mt-1 sm:mt-1.5 line-clamp-2 leading-relaxed"
            style={{
              color: 'rgba(255, 255, 255, 0.95)',
              textShadow: '0 1px 6px rgba(0, 0, 0, 0.95), 0 1px 3px rgba(0, 0, 0, 0.85)'
            }}
          >
            {current.description}
          </p>
        )}

        {/* Action Button: Preserved exactly as requested */}
        {current.action_url && (
          <div className="mt-4 flex items-center gap-3">
            {isExternal ? (
              <a
                href={current.action_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleCtaClick(current.id)}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-black shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{current.action_text || 'Learn More'}</span>
                <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            ) : (
              <Link
                href={current.action_url}
                onClick={() => handleCtaClick(current.id)}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs sm:text-sm font-black shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <span>{current.action_text || 'Learn More'}</span>
                <svg className="w-4 h-4 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

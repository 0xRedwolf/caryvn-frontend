'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { popupsApi } from '@/lib/api';

interface PopupCardData {
  id: number;
  title: string;
  description: string;
  image?: string;
  action_url?: string;
  action_text?: string;
}

export default function DashboardPopup() {
  const { token } = useAuth();
  const [popups, setPopups] = useState<PopupCardData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  // Only show X button if user has seen the last card
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Fetch popups
    popupsApi.getActivePopups(token).then((res) => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setPopups(res.data);
        setIsVisible(true);
        // If there's only 1 card, they can immediately close it
        if (res.data.length === 1) {
          setCanClose(true);
        }
      }
    });
  }, [token]);

  // Auto-scroll logic
  useEffect(() => {
    if (!isVisible || popups.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        const nextIndex = prev + 1;
        // If we reach the last card, enable the close button
        if (nextIndex >= popups.length - 1) {
          setCanClose(true);
        }
        
        if (nextIndex >= popups.length) {
          return 0; // Loop back
        }
        return nextIndex;
      });
    }, 4000); // 4 seconds per card

    return () => clearInterval(timer);
  }, [isVisible, popups.length, isPaused]);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleNext = () => {
    setIsPaused(true);
    const nextIndex = currentIndex + 1;
    if (nextIndex >= popups.length - 1) setCanClose(true);
    setCurrentIndex(nextIndex >= popups.length ? 0 : nextIndex);
  };

  const handlePrev = () => {
    setIsPaused(true);
    setCurrentIndex(currentIndex === 0 ? popups.length - 1 : currentIndex - 1);
  };

  if (!isVisible || popups.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div 
        className="relative w-full max-w-sm sm:max-w-md bg-surface-darker border border-border-dark rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Close Button - conditionally rendered based on canClose */}
        {canClose && (
          <button 
            type="button"
            onClick={handleClose}
            className="absolute top-3 right-3 z-[100] w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:text-white hover:bg-black/80 transition-all backdrop-blur-md cursor-pointer"
            aria-label="Close popup"
          >
            <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Carousel Container */}
        <div className="relative w-full aspect-square bg-surface-dark overflow-hidden group">
          {popups.map((popup, index) => (
            <div 
              key={popup.id}
              className={`absolute inset-0 transition-transform duration-500 ease-in-out flex flex-col items-center justify-center p-6 text-center
                ${index === currentIndex ? 'translate-x-0 opacity-100 z-10' : 
                  index < currentIndex ? '-translate-x-full opacity-0' : 'translate-x-full opacity-0'}`}
            >
              {popup.image && (
                <div className="absolute inset-0 z-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={popup.image} 
                    alt={popup.title} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div className="relative z-[50] flex flex-col items-center justify-end h-full w-full max-w-[90%] pb-4">
                <div>
                  {popup.title && (
                    <h3 className="text-2xl font-bold text-white mb-2 tracking-tight drop-shadow-md text-center">{popup.title}</h3>
                  )}
                  {popup.description && (
                    <p className="text-white text-sm mb-4 drop-shadow-md text-center">{popup.description}</p>
                  )}
                  {popup.action_url && (
                    <a 
                      href={popup.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-8 py-3 bg-white text-black font-bold text-sm uppercase rounded-full shadow-lg hover:bg-gray-200 transition-colors pointer-events-auto"
                    >
                      {popup.action_text || 'Learn More'}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Navigation Arrows for Multiple Cards */}
          {popups.length > 1 && (
            <>
              <button 
                type="button"
                onClick={handlePrev}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-[100] w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button 
                type="button"
                onClick={handleNext}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-[100] w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:text-white hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm cursor-pointer"
              >
                <svg className="w-5 h-5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Dots indicator */}
        {popups.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {popups.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setIsPaused(true);
                  if (idx === popups.length - 1) setCanClose(true);
                  setCurrentIndex(idx);
                }}
                className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-primary w-4' : 'bg-white/30 hover:bg-white/50'}`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

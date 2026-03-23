"use client";

import { useState, useEffect } from "react";

// ⚙️ Replace this with your actual Trustpilot review URL
const TRUSTPILOT_URL = "https://www.trustpilot.com/evaluate/caryvn.com";

// How many days before we show the popup again
const COOLDOWN_DAYS = 7;
const STORAGE_KEY = "tp_review_last_shown";

interface TrustpilotPopupProps {
  onClose: () => void;
}

function StarIcon({ filled, index, onHover, onClick }: {
  filled: boolean;
  index: number;
  onHover: (i: number) => void;
  onClick: (i: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      onMouseEnter={() => onHover(index)}
      className="transition-transform hover:scale-110 focus:outline-none"
      aria-label={`Rate ${index + 1} stars`}
    >
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill={filled ? "#00b67a" : "none"}
        stroke={filled ? "#00b67a" : "#4b5563"}
        strokeWidth="1.5"
        className="transition-all duration-150"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
    </button>
  );
}

export default function TrustpilotPopup({ onClose }: TrustpilotPopupProps) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(-1);
  const [clicked, setClicked] = useState(-1);

  // Slide in after a short delay
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 300);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 400); // wait for slide-out animation
  };

  const handleStarClick = (index: number) => {
    setClicked(index);
    // Mark as shown in localStorage
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    // Open Trustpilot
    window.open(TRUSTPILOT_URL, "_blank", "noopener,noreferrer");
    // Close popup after a short moment
    setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 400);
    }, 600);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
    handleClose();
  };

  const filledCount = clicked >= 0 ? clicked + 1 : hovered >= 0 ? hovered + 1 : 0;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] transition-opacity duration-300"
        style={{ opacity: visible ? 1 : 0 }}
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[201] flex justify-center pointer-events-none"
      >
        <div
          className="w-full max-w-md bg-surface-dark border border-border-dark rounded-t-3xl shadow-2xl pointer-events-auto transition-transform duration-500"
          style={{
            transform: visible ? "translateY(0)" : "translateY(110%)",
            transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-border-dark rounded-full" />
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-5 right-5 text-text-secondary hover:text-white transition-colors rounded-full hover:bg-red-500 p-1"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="px-6 pt-2 pb-8">
            {/* Trustpilot logo + brand */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {/* Trustpilot star logo */}
              <div className="flex items-center gap-1.5">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#00b67a">
                  <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
                </svg>
                <span className="text-white font-bold text-base tracking-tight">Trustpilot</span>
              </div>
            </div>

            {/* Heading */}
            <h2 className="text-white font-bold text-xl text-center mb-1">
              Enjoying our service?
            </h2>
            <p className="text-text-secondary text-sm text-center mb-6">
              Your review helps others discover us. It only takes 10 seconds!
            </p>

            {/* Stars */}
            <div
              className="flex items-center justify-center gap-2 mb-2"
              onMouseLeave={() => setHovered(-1)}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <StarIcon
                  key={i}
                  index={i}
                  filled={i < filledCount}
                  onHover={setHovered}
                  onClick={handleStarClick}
                />
              ))}
            </div>

            <p className="text-text-secondary text-xs text-center mb-6">
              {clicked >= 0
                ? "Opening Trustpilot… thank you!"
                : hovered >= 0
                ? ["Terrible", "Poor", "Average", "Good", "Excellent"][hovered]
                : "Tap a star to leave a review"}
            </p>

            {/* Divider */}
            <div className="border-t border-border-dark mb-5" />

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="w-full text-center text-text-secondary text-sm hover:text-white transition-colors py-1"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Utility: should we show the review popup?
 * Returns true if the cooldown has expired.
 */
export function shouldShowReviewPopup(): boolean {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return true;
    const daysSince = (Date.now() - parseInt(last)) / (1000 * 60 * 60 * 24);
    return daysSince >= COOLDOWN_DAYS;
  } catch {
    return true;
  }
}

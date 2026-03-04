'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

// Extend Window to include Tawk.to globals
declare global {
  interface Window {
    Tawk_API: {
      onLoad?: () => void;
      setAttributes?: (attrs: Record<string, string>, cb?: (err: unknown) => void) => void;
      hideWidget?: () => void;
      showWidget?: () => void;
    };
    Tawk_LoadStart: Date;
  }
}

const TAWK_PROPERTY_ID = '69a79b4ee2f23c1c34accf5e';
const TAWK_WIDGET_ID   = '1jirbdbku';

export default function TawkTo() {
  const { user } = useAuth();

  useEffect(() => {
    // Bail if already loaded
    if (document.getElementById('tawk-script')) return;

    // Initialise globals before the script loads
    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    // Pre-identify the logged-in user as soon as Tawk.to widget is ready
    window.Tawk_API.onLoad = () => {
      if (user && window.Tawk_API.setAttributes) {
        window.Tawk_API.setAttributes(
          {
            name:  `${user.first_name} ${user.last_name}`.trim() || user.username || user.email.split('@')[0],
            email: user.email,
          },
          (err) => { if (err) console.warn('Tawk.to setAttributes error:', err); }
        );
      }
    };

    const s1 = document.createElement('script');
    s1.id        = 'tawk-script';
    s1.async     = true;
    s1.src       = `https://embed.tawk.to/${TAWK_PROPERTY_ID}/${TAWK_WIDGET_ID}`;
    s1.charset   = 'UTF-8';
    s1.setAttribute('crossorigin', '*');

    const s0 = document.getElementsByTagName('script')[0];
    s0?.parentNode?.insertBefore(s1, s0);

    // No cleanup — removing Tawk after mount causes issues; it manages itself
  }, []);

  // Re-identify if user changes (e.g. after login resolves)
  useEffect(() => {
    if (!user) return;
    if (!window.Tawk_API?.setAttributes) return;
    window.Tawk_API.setAttributes(
      {
        name:  `${user.first_name} ${user.last_name}`.trim() || user.username || user.email.split('@')[0],
        email: user.email,
      },
      (err) => { if (err) console.warn('Tawk.to setAttributes error:', err); }
    );
  }, [user]);

  return null; // purely side-effect component
}

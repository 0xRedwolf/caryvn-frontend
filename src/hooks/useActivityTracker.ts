'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { activityApi } from '@/lib/api';

/**
 * Hook that automatically tracks page visits.
 * Sends a POST to /api/activity/ on every route change.
 * Fire-and-forget — errors are silently ignored.
 */
export function useActivityTracker() {
  const pathname = usePathname();
  const { token } = useAuth();
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    // Skip if no token or same page (avoid duplicate on re-render)
    if (!token || !pathname || pathname === lastPath.current) return;

    lastPath.current = pathname;

    // Fire and forget — don't block the UI
    activityApi.logPageVisit(pathname, token).catch(() => {
      // Silently ignore errors
    });
  }, [pathname, token]);
}

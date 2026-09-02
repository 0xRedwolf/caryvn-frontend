'use client';

import { useState, useEffect, useRef } from 'react';
import { adminApi } from '@/lib/api';

export interface AdminNotificationItem {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

interface Props {
  token: string;
  onCriticalAlertChange?: (alert: AdminNotificationItem | null) => void;
}

export default function AdminNotificationCenter({ token, onCriticalAlertChange }: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [permState, setPermState] = useState<NotificationPermission>('default');
  const seenIdsRef = useRef<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check browser permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermState(Notification.permission);
    }
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  // Fetch notifications
  const fetchNotifications = async (isFirstLoad = false) => {
    if (!token) return;
    try {
      const res = await adminApi.getNotifications(token);
      if (res.data) {
        const data = res.data as { notifications: AdminNotificationItem[]; unread_count: number };
        const items = data.notifications || [];
        setNotifications(items);
        setUnreadCount(data.unread_count || 0);

        // Check for active critical low balance unread alert
        const activeCritical = items.find(
          (n) => !n.is_read && (n.severity === 'critical' || n.severity === 'warning')
        );
        onCriticalAlertChange?.(activeCritical || null);

        // Fire desktop notification for newly detected unread alerts
        if (!isFirstLoad && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          for (const item of items) {
            if (!item.is_read && !seenIdsRef.current.has(item.id)) {
              try {
                new Notification(item.title, {
                  body: item.message,
                  icon: '/favicon.ico',
                  tag: item.id,
                });
              } catch (e) {
                console.warn('Desktop notification failed:', e);
              }
            }
          }
        }

        // Update seen IDs
        items.forEach((item) => seenIdsRef.current.add(item.id));
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  // Initial fetch and 45s periodic polling
  useEffect(() => {
    fetchNotifications(true);
    const interval = setInterval(() => fetchNotifications(false), 45000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Request browser desktop permission
  const requestDesktopPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Your browser does not support desktop notifications.');
      return;
    }
    try {
      const result = await Notification.requestPermission();
      setPermState(result);
      if (result === 'granted') {
        new Notification('Notifications Enabled', {
          body: 'You will now receive desktop alerts when provider balances are low or critical orders fail.',
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.error('Permission request error:', e);
    }
  };

  // Mark single as read
  const handleMarkRead = async (id: string) => {
    try {
      await adminApi.markNotificationRead(token, id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await adminApi.markNotificationRead(token, undefined, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      onCriticalAlertChange?.(null);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
    setLoading(false);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
        title="Admin Notifications"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-white text-[9px] font-extrabold items-center justify-center shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-96 max-w-sm bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-rose-50 text-rose-700 border border-rose-200/80 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                  {unreadCount} unread
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-black text-primary hover:text-primary-hover hover:underline cursor-pointer disabled:opacity-50"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Browser Permission Prompt Banner */}
          {permState === 'default' && (
            <div className="p-3.5 bg-blue-50/90 border-b border-blue-100 flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-slate-900">Enable Desktop Alerts</p>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                  Get notified on your screen when SMM provider balances run low.
                </p>
                <button
                  type="button"
                  onClick={requestDesktopPermission}
                  className="mt-2 text-xs font-bold px-3 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  Enable Notifications
                </button>
              </div>
            </div>
          )}

          {permState === 'denied' && (
            <div className="px-3.5 py-2 bg-slate-100 text-slate-600 text-[11px] font-medium border-b border-slate-200">
              Desktop alerts are currently blocked in your browser settings.
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                No notifications right now
              </div>
            ) : (
              notifications.map((n) => {
                const isCritical = n.severity === 'critical';
                const isWarning = n.severity === 'warning';
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                    className={`p-3.5 transition-colors cursor-pointer flex gap-3 ${
                      n.is_read
                        ? 'bg-white hover:bg-slate-50 opacity-75'
                        : isCritical
                        ? 'bg-rose-50/70 hover:bg-rose-100/60'
                        : isWarning
                        ? 'bg-amber-50/70 hover:bg-amber-100/60'
                        : 'bg-blue-50/50 hover:bg-blue-100/40'
                    }`}
                  >
                    {/* Severity Icon Container with high design contrast */}
                    <div className="shrink-0 mt-0.5">
                      {isCritical ? (
                        <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                      ) : isWarning ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-primary text-white flex items-center justify-center shadow-xs">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5 mb-0.5">
                        <p className={`text-xs font-black truncate ${
                          n.is_read
                            ? 'text-slate-700'
                            : isCritical
                            ? 'text-rose-950'
                            : isWarning
                            ? 'text-amber-950'
                            : 'text-slate-900'
                        }`}>
                          {n.title}
                        </p>
                        <span className={`text-[10px] font-semibold shrink-0 px-1.5 py-0.2 rounded-full ${
                          n.is_read
                            ? 'text-slate-400'
                            : isCritical
                            ? 'text-rose-700 bg-rose-100'
                            : isWarning
                            ? 'text-amber-800 bg-amber-100'
                            : 'text-blue-700 bg-blue-100'
                        }`}>
                          {formatTime(n.created_at)}
                        </span>
                      </div>
                      <p className={`text-xs leading-relaxed line-clamp-2 ${
                        n.is_read ? 'text-slate-500' : 'text-slate-700 font-medium'
                      }`}>
                        {n.message}
                      </p>
                    </div>

                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0 self-center shadow-xs" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

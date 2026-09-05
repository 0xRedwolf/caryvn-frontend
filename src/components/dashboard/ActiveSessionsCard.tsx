'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi, UserSessionItem } from '@/lib/api';

export default function ActiveSessionsCard() {
  const { token } = useAuth();
  const [sessions, setSessions] = useState<UserSessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await authApi.getSessions(token);
    if (res.data?.sessions) {
      setSessions(res.data.sessions);
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRevokeOtherSessions = async () => {
    if (!token) return;
    const current = sessions.find((s) => s.is_current);
    setActionLoading(true);
    setNotice(null);
    const res = await authApi.revokeOtherSessions(current?.id, token);
    if (res.data) {
      setNotice({ type: 'success', text: res.data.message });
      await fetchSessions();
    } else {
      setNotice({ type: 'error', text: res.error || 'Failed to revoke other sessions' });
    }
    setActionLoading(false);
  };

  const handleRevokeSingle = async (sessionId: string) => {
    if (!token) return;
    setActionLoading(true);
    setNotice(null);
    const res = await authApi.revokeSession(sessionId, token);
    if (res.data) {
      setNotice({ type: 'success', text: 'Device session logged out successfully' });
      await fetchSessions();
    } else {
      setNotice({ type: 'error', text: res.error || 'Failed to revoke session' });
    }
    setActionLoading(false);
  };

  const getDeviceIcon = (deviceType: string) => {
    const dt = deviceType.toLowerCase();
    if (dt === 'mobile') {
      return (
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <rect x="7" y="2" width="10" height="20" rx="2" ry="2" />
          <path d="M11 18h2" strokeLinecap="round" />
        </svg>
      );
    }
    if (dt === 'tablet') {
      return (
        <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <line x1="12" y1="18" x2="12.01" y2="18" strokeLinecap="round" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" strokeLinecap="round" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'Active recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffSec < 60) return 'Active just now';
    if (diffSec < 3600) return `Active ${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `Active ${Math.floor(diffSec / 3600)}h ago`;
    return `Active on ${date.toLocaleDateString()}`;
  };

  const hasOtherSessions = sessions.filter((s) => !s.is_current).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900">Active Devices & Security</h2>
            <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-slate-200">
              {sessions.length} Active
            </span>
          </div>
          <p className="text-slate-500 text-sm">
            Manage devices currently logged into your Caryvn account and revoke unrecognized sessions.
          </p>
        </div>

        {hasOtherSessions && (
          <button
            onClick={handleRevokeOtherSessions}
            disabled={actionLoading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out Other Devices
          </button>
        )}
      </div>

      {/* Notice alert */}
      {notice && (
        <div
          className={`mb-5 p-3.5 rounded-xl text-xs font-medium ${
            notice.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border border-rose-200 text-rose-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Sessions list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse bg-slate-50 border border-slate-200 rounded-xl p-4 h-20" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          No active session records found.
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((sess) => (
            <div
              key={sess.id}
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                sess.is_current
                  ? 'bg-emerald-50/40 border-emerald-200/80 shadow-2xs'
                  : 'bg-slate-50/60 hover:bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    sess.is_current ? 'bg-emerald-100 text-emerald-700' : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {getDeviceIcon(sess.device_type)}
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">
                      {sess.browser} on {sess.os}
                    </span>
                    {sess.is_current && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                        This Device
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 flex-wrap">
                    <span>{sess.device_type}</span>
                    <span>&bull;</span>
                    <span className="font-mono text-[11px]">{sess.ip_address || 'Unknown IP'}</span>
                    <span>&bull;</span>
                    <span>{sess.location}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <span className="text-xs text-slate-500 font-medium">
                  {sess.is_current ? 'Active now' : formatRelativeTime(sess.last_active_at)}
                </span>

                {!sess.is_current && (
                  <button
                    onClick={() => handleRevokeSingle(sess.id)}
                    disabled={actionLoading}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-200/80 transition-colors disabled:opacity-50"
                  >
                    Revoke
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

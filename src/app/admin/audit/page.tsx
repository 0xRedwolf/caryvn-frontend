'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, AuditLogItem } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type AuditTab = 'staff_audit' | 'system' | 'logins' | 'user';

interface APILog {
  id: number;
  action: string;
  provider_name: string;
  response_code: number | null;
  error: string;
  duration_ms: number | null;
  created_at: string;
  request_data?: Record<string, unknown>;
  response_data?: Record<string, unknown>;
}

interface UserActivity {
  id: string;
  action: string;
  page: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  user_email?: string;
  user_username?: string;
}

interface UserItem {
  id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export default function SecurityAuditHubPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<AuditTab>('staff_audit');
  const [loading, setLoading] = useState(true);

  // Tab 1: Staff Audit Logs
  const [staffLogs, setStaffLogs] = useState<AuditLogItem[]>([]);
  const [selectedStaffLog, setSelectedStaffLog] = useState<AuditLogItem | null>(null);
  const [staffActionFilter, setStaffActionFilter] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [staffPage, setStaffPage] = useState(1);
  const [staffTotalPages, setStaffTotalPages] = useState(1);
  const [staffTotalCount, setStaffTotalCount] = useState(0);

  // Tab 2: System API Logs
  const [systemLogs, setSystemLogs] = useState<APILog[]>([]);
  const [selectedLog, setSelectedLog] = useState<APILog | null>(null);

  // Tab 3: Logins & Sessions
  const [loginActivities, setLoginActivities] = useState<UserActivity[]>([]);

  // Tab 4: Per-User Audit
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);

  const loadStaffLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getAuditLogs(token, {
      page: staffPage,
      page_size: 25,
      action: staffActionFilter || undefined,
      search: staffSearch.trim() || undefined,
    });
    if (res.data) {
      setStaffLogs(res.data.logs || []);
      setStaffTotalPages(res.data.total_pages || 1);
      setStaffTotalCount(res.data.total_count || 0);
    }
    setLoading(false);
  }, [token, staffPage, staffActionFilter, staffSearch]);

  const loadSystemLogs = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getLogs(token, { limit: 50 });
    if (res.data) {
      const data = res.data as { logs: APILog[] };
      setSystemLogs(data.logs || []);
    }
    setLoading(false);
  }, [token]);

  const loadLoginSessions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const usersRes = await adminApi.getUsers(token, { limit: 20 });
    if (usersRes.data) {
      const data = usersRes.data as { users: UserItem[] };
      const allActivities: UserActivity[] = [];

      for (const u of (data.users || []).slice(0, 8)) {
        const actRes = await adminApi.getUserActivity(u.id, token, 10);
        if (actRes.data) {
          const actData = actRes.data as { activities: UserActivity[] };
          (actData.activities || []).forEach((a) => {
            allActivities.push({
              ...a,
              user_email: u.email,
              user_username: u.username,
            });
          });
        }
      }

      allActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLoginActivities(allActivities);
    }
    setLoading(false);
  }, [token]);

  const loadUsersForAudit = useCallback(async () => {
    if (!token) return;
    setSearchingUsers(true);
    const res = await adminApi.getUsers(token, { limit: 50 });
    if (res.data) {
      const data = res.data as { users: UserItem[] };
      setUsersList(data.users || []);
    }
    setSearchingUsers(false);
  }, [token]);

  // Fetch initial data based on active tab
  useEffect(() => {
    if (!token) return;

    if (activeTab === 'staff_audit') {
      loadStaffLogs();
    } else if (activeTab === 'system') {
      loadSystemLogs();
    } else if (activeTab === 'logins') {
      loadLoginSessions();
    } else if (activeTab === 'user') {
      loadUsersForAudit();
    }
  }, [token, activeTab, loadStaffLogs, loadSystemLogs, loadLoginSessions, loadUsersForAudit]);

  // Live debounced server search for users
  useEffect(() => {
    if (!token || activeTab !== 'user') return;
    
    const timer = setTimeout(async () => {
      setSearchingUsers(true);
      try {
        const res = await adminApi.getUsers(token, {
          search: userSearch.trim() || undefined,
          limit: 50,
        });
        if (res.data) {
          const data = res.data as { users: UserItem[] };
          setUsersList(data.users || []);
        }
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setSearchingUsers(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [userSearch, token, activeTab]);

  const fetchSingleUserAudit = async (userId: string) => {
    if (!token || !userId) return;
    setLoading(true);
    const res = await adminApi.getUserActivity(userId, token, 100);
    if (res.data) {
      const data = res.data as { activities: UserActivity[] };
      setUserActivities(data.activities || []);
    }
    setLoading(false);
  };

  const handleSelectUser = (user: UserItem) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setUserSearch(user.email);
    setUserDropdownOpen(false);
    fetchSingleUserAudit(user.id);
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'balance_adjustment':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'order_status_override':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'service_price_update':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'provider_update':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'user_role_change':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 text-slate-900 pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Security &amp; Audit Hub</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          Immutable audit trails of staff financial operations, system API logs, and per-user activity monitoring.
        </p>
      </div>

      {/* 4 TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 w-fit shadow-xs">
        {/* Tab 1: Staff Operations */}
        <button
          onClick={() => setActiveTab('staff_audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'staff_audit'
              ? 'bg-primary text-white! shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Staff &amp; Admin Operations</span>
        </button>

        {/* Tab 2: System Logs */}
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-primary text-white! shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>System API Logs</span>
        </button>

        {/* Tab 3: Logins */}
        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'logins'
              ? 'bg-primary text-white! shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>User Login &amp; Sessions</span>
        </button>

        {/* Tab 4: User Audit */}
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'user'
              ? 'bg-primary text-white! shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Per-User Activity</span>
        </button>
      </div>

      {/* TAB CONTENT 1: STAFF AUDIT TRAIL */}
      {activeTab === 'staff_audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-sm">
          {/* Action Filter & Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { label: 'All Operations', value: '' },
                { label: 'Deposits & Balance', value: 'balance_adjustment' },
                { label: 'Order Overrides', value: 'order_status_override' },
                { label: 'Price & Markup', value: 'service_price_update' },
                { label: 'Provider Keys', value: 'provider_update' },
                { label: 'Permissions', value: 'user_role_change' },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => {
                    setStaffActionFilter(pill.value);
                    setStaffPage(1);
                  }}
                  className={`text-xs font-semibold px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    staffActionFilter === pill.value
                      ? 'bg-primary text-white! border-primary shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadStaffLogs()}
                placeholder="Search staff, target ID, text..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all w-64"
              />
              <button
                onClick={() => {
                  setStaffPage(1);
                  loadStaffLogs();
                }}
                className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
              >
                Search
              </button>
            </div>
          </div>

          {/* Audit Logs Table */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-medium">Loading forensic audit logs...</p>
            </div>
          ) : staffLogs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-900 text-sm font-bold">No Staff Audit Records Found</p>
              <p className="text-slate-500 text-xs mt-1">Actions performed by staff and admins will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Staff Actor</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">IP Address</th>
                    <th className="px-4 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-medium">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getActionBadgeColor(log.action)}`}>
                          {log.action_display}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                        {log.actor ? log.actor.email : 'System Automated'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                        {log.target_model} #{log.target_id.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-slate-700 max-w-xs truncate" title={log.description}>
                        {log.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {log.ip_address || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStaffLog(log)}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Inspect Diff
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {staffTotalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
              <span>
                Showing page <strong>{staffPage}</strong> of <strong>{staffTotalPages}</strong> ({staffTotalCount} total actions)
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStaffPage((p) => Math.max(1, p - 1))}
                  disabled={staffPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setStaffPage((p) => Math.min(staffTotalPages, p + 1))}
                  disabled={staffPage === staffTotalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: SYSTEM AUDIT LOGS */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">System &amp; Provider API Logs</h2>
            <button
              onClick={loadSystemLogs}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-medium">Loading system logs...</p>
            </div>
          ) : systemLogs.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Provider</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Error / Note</th>
                    <th className="px-4 py-3 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{log.action}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{log.provider_name || 'System'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          log.response_code && log.response_code >= 200 && log.response_code < 300
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-800 border border-red-200'
                        }`}>
                          {log.response_code ? `${log.response_code}` : 'ERR'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{log.duration_ms ? `${log.duration_ms}ms` : '—'}</td>
                      <td className="px-4 py-3 text-slate-600 max-w-xs truncate" title={log.error}>
                        {log.error || '—'}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No system API logs found.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 3: LOGINS & SESSIONS */}
      {activeTab === 'logins' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">User Login &amp; Navigation Events</h2>
            <button
              onClick={loadLoginSessions}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-slate-500 text-xs font-medium">Loading session activity...</p>
            </div>
          ) : loginActivities.length > 0 ? (
            <div className="space-y-2.5 max-h-140 overflow-y-auto pr-1">
              {loginActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900">{act.user_email || 'User'}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Visited: <span className="font-semibold text-slate-800">{act.page}</span> &bull; Action: <span className="capitalize">{act.action}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        IP: {act.ip_address || '—'} &bull; {act.user_agent ? act.user_agent.slice(0, 60) : '—'}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 sm:text-right">{formatDate(act.created_at)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              No session activities recorded yet.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: PER-USER AUDIT */}
      {activeTab === 'user' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">Per-User Activity Forensics</h2>
          <p className="text-slate-500 text-xs">Select any customer account to view their timeline of clicks and page visits.</p>

          <div className="relative max-w-md">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => {
                setUserSearch(e.target.value);
                setUserDropdownOpen(true);
              }}
              onFocus={() => setUserDropdownOpen(true)}
              placeholder="Type customer email to inspect..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />

            {userDropdownOpen && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-xl max-h-56 overflow-y-auto">
                {searchingUsers ? (
                  <div className="p-3 text-center text-slate-400 text-xs">Searching accounts...</div>
                ) : usersList.length > 0 ? (
                  usersList.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => handleSelectUser(u)}
                      className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs text-slate-700 flex justify-between items-center border-b border-slate-100 last:border-b-0 cursor-pointer"
                    >
                      <span className="font-semibold text-slate-900 truncate">{u.email}</span>
                      <span className="text-[10px] text-slate-400">ID: {u.id.slice(0, 8)}</span>
                    </button>
                  ))
                ) : (
                  <div className="p-3 text-center text-slate-400 text-xs">No users found matching query</div>
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Activity Log for {selectedUser.email}</h3>
                  <p className="text-[11px] text-slate-500">Showing last 100 interaction events.</p>
                </div>
                <button
                  onClick={() => fetchSingleUserAudit(selectedUser.id)}
                  title="Reload activity"
                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Reload"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>

              {loading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Fetching records...</div>
              ) : userActivities.length > 0 ? (
                <div className="space-y-2.5 max-h-120 overflow-y-auto pr-1">
                  {userActivities.map((act) => (
                    <div
                      key={act.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 capitalize">{act.action.replace(/_/g, ' ')}</p>
                          <p className="text-[11px] text-slate-600 mt-0.5">Page: <span className="text-slate-800 font-medium">{act.page}</span></p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                            IP: {act.ip_address || '—'} &bull; {act.user_agent ? act.user_agent.slice(0, 50) : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 sm:text-right">{formatDate(act.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No activity events recorded for this user.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Staff Audit Diff Inspector */}
      {selectedStaffLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Staff Audit Record</h3>
                <p className="text-[11px] text-slate-500">ID: {selectedStaffLog.id}</p>
              </div>
              <button
                onClick={() => setSelectedStaffLog(null)}
                className="text-slate-400 hover:text-slate-700 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Action Type:</span>
                <span className="font-bold text-slate-900">{selectedStaffLog.action_display}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Staff Actor:</span>
                <span className="font-bold text-slate-900">
                  {selectedStaffLog.actor ? selectedStaffLog.actor.email : 'System'}
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Target Object:</span>
                <span className="font-mono text-slate-800">
                  {selectedStaffLog.target_model} #{selectedStaffLog.target_id}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="text-slate-800 font-medium">{selectedStaffLog.description || 'No description provided.'}</p>
              </div>
              <div>
                <span className="text-slate-500 block mb-1 font-semibold">Changes &amp; Mutation Payload:</span>
                <pre className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-mono text-[11px] overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(selectedStaffLog.changes, null, 2)}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setSelectedStaffLog(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL: System API Log Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">API Log Inspector #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Action:</span>
                <span className="font-bold text-slate-900">{selectedLog.action}</span>
              </div>
              <div className="flex justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500">Response Code:</span>
                <span className="font-bold text-emerald-700">{selectedLog.response_code || 'N/A'}</span>
              </div>
              {selectedLog.error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
                  {selectedLog.error}
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

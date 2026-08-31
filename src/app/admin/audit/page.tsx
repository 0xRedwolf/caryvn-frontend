'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

type AuditTab = 'system' | 'logins' | 'user';

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
  const [activeTab, setActiveTab] = useState<AuditTab>('system');
  const [loading, setLoading] = useState(true);

  // Tab 1: System Audit Logs
  const [systemLogs, setSystemLogs] = useState<APILog[]>([]);
  const [selectedLog, setSelectedLog] = useState<APILog | null>(null);

  // Tab 2: Logins & Sessions
  const [loginActivities, setLoginActivities] = useState<UserActivity[]>([]);

  // Tab 3: Per-User Audit
  const [usersList, setUsersList] = useState<UserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Fetch initial data based on active tab
  useEffect(() => {
    if (!token) return;

    if (activeTab === 'system') {
      loadSystemLogs();
    } else if (activeTab === 'logins') {
      loadLoginSessions();
    } else if (activeTab === 'user') {
      loadUsersForAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, activeTab]);

  const loadSystemLogs = async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getLogs(token, { limit: 50 });
    if (res.data) {
      const data = res.data as { logs: APILog[] };
      setSystemLogs(data.logs || []);
    }
    setLoading(false);
  };

  const loadLoginSessions = async () => {
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
  };

  const loadUsersForAudit = async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getUsers(token, { limit: 100 });
    if (res.data) {
      const data = res.data as { users: UserItem[] };
      setUsersList(data.users || []);
      if (data.users && data.users.length > 0 && !selectedUserId) {
        // Removed auto-selection to leave the default state as "Select a User to Inspect..."
      }
    }
    setLoading(false);
  };

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

  const handleSelectUser = (userId: string) => {
    setSelectedUserId(userId);
    fetchSingleUserAudit(userId);
  };

  const filteredUsers = usersList.filter((u) => {
    const q = (userSearch || '').toLowerCase().trim();
    if (!q) return true;
    const email = (u.email || '').toLowerCase();
    const username = (u.username || '').toLowerCase();
    const firstName = (u.first_name || '').toLowerCase();
    const lastName = (u.last_name || '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    return (
      email.includes(q) ||
      username.includes(q) ||
      firstName.includes(q) ||
      lastName.includes(q) ||
      fullName.includes(q)
    );
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Security &amp; Audit Hub</h1>
        <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
          System-wide administrative audit trails, user login sessions, and per-user security activity.
        </p>
      </div>

      {/* 3 DISTINCT TABS */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-200 w-fit shadow-xs">
        {/* Tab 1 */}
        <button
          onClick={() => setActiveTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'system'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span>System Audit Logs</span>
        </button>

        {/* Tab 2 */}
        <button
          onClick={() => setActiveTab('logins')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'logins'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>User Login &amp; Sessions</span>
        </button>

        {/* Tab 3 */}
        <button
          onClick={() => setActiveTab('user')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === 'user'
              ? 'bg-primary text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span>Per-User Security Audit</span>
        </button>
      </div>

      {/* TAB CONTENT 1: SYSTEM AUDIT LOGS */}
      {activeTab === 'system' && (
        <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">System &amp; Admin Actions</h2>
            <button
              onClick={loadSystemLogs}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : systemLogs.length > 0 ? (
            <div className="space-y-2.5">
              {systemLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-primary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        log.response_code && log.response_code >= 200 && log.response_code < 300
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-red-100 text-red-700 border border-red-200'
                      }`}
                    >
                      {log.action}
                    </span>
                    <div>
                      <p className="font-bold text-slate-900">Provider: {log.provider_name || 'System / Internal'}</p>
                      {log.error && <p className="text-red-600 text-[11px] mt-0.5 truncate max-w-md">{log.error}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 self-end sm:self-auto shrink-0">
                    {log.duration_ms !== null && (
                      <span className="text-[10px] font-medium bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-700">
                        {log.duration_ms}ms
                      </span>
                    )}
                    <span className="text-[11px]">{formatDate(log.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">No system audit logs found</div>
          )}
        </div>
      )}

      {/* TAB CONTENT 2: USER LOGIN & SESSIONS */}
      {activeTab === 'logins' && (
        <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">User Sessions &amp; History</h2>
            <button
              onClick={loadLoginSessions}
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : loginActivities.length > 0 ? (
            <div className="space-y-2.5">
              {loginActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary font-bold flex items-center justify-center shrink-0 border border-blue-100">
                      🔑
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 truncate">{act.user_email || 'Authenticated User'}</p>
                      <p className="text-[11px] text-slate-500 truncate">
                        Action: <span className="text-emerald-700 font-semibold">{act.action}</span> • Page: {act.page}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 self-end sm:self-auto shrink-0">
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      IP: {act.ip_address || '127.0.0.1'}
                    </span>
                    <span className="text-[11px]">{formatDate(act.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">No recent sessions found</div>
          )}
        </div>
      )}

      {activeTab === 'user' && (
        <div className="space-y-4">
          {/* User Selector Card — with search dropdown */}
          <div className="relative z-20 bento-card !overflow-visible p-5 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-black text-slate-900">Per-User Security Audit</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select an account to view their activity trail</p>
              </div>
              {selectedUserId && (
                <button
                  onClick={() => {
                    setSelectedUserId('');
                    setUserActivities([]);
                    setUserSearch('');
                    setUserDropdownOpen(false);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors font-semibold shadow-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Search input (above dropdown as requested in the design) */}
            <div className="relative mb-4">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search user by name/email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition shadow-sm"
              />
            </div>

            {/* Custom Dropdown for User Selection */}
            <div className="relative mb-3">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-medium hover:bg-slate-100 transition shadow-sm"
              >
                <span className={selectedUserId ? 'text-primary' : 'text-slate-600'}>
                  {selectedUserId 
                    ? (usersList.find(u => u.id === selectedUserId)?.email || 'Select a User to Inspect...') 
                    : 'Select a User to Inspect...'}
                </span>
                <svg className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden py-1">
                    <button
                      onClick={() => {
                        setSelectedUserId('');
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-xs bg-slate-100 text-primary font-bold border-b border-slate-200"
                    >
                      Select a User to Inspect...
                      {!selectedUserId && (
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    
                    <div className="max-h-60 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-500">No users match your search</div>
                      ) : filteredUsers.map((u) => (
                        <button
                          key={u.id}
                          onClick={() => {
                            handleSelectUser(u.id);
                            setUserDropdownOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors text-xs cursor-pointer ${
                            selectedUserId === u.id ? 'bg-primary/5' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`truncate ${selectedUserId === u.id ? 'text-primary font-semibold' : 'text-slate-700'}`}>
                              {u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : (u.username || u.email)} ({u.email})
                            </span>
                          </div>
                          {selectedUserId === u.id && (
                            <svg className="w-4 h-4 text-primary shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Activity Timeline — shown when a user is selected */}
          {selectedUserId && (
            <div className="bento-card p-5 sm:p-6 bg-white border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900">Account Activity Timeline</h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {usersList.find((u) => u.id === selectedUserId)?.email || 'Selected Account'}
                  </p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                  userActivities.length > 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {userActivities.length} events
                </span>
              </div>

              {loading ? (
                <div className="py-12 text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : userActivities.length > 0 ? (
                <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
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
                          <p className="text-[10px] text-slate-400 mt-0.5 break-all">
                            IP: {act.ip_address || '—'} {act.user_agent ? `• ${act.user_agent.slice(0, 50)}...` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 sm:text-right">{formatDate(act.created_at)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 text-xs font-medium">No activity logs recorded for this account</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Log Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bento-card bg-white border-slate-200 w-full max-w-xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">API Log Inspector #{selectedLog.id}</h3>
              <button onClick={() => setSelectedLog(null)} className="text-slate-400 hover:text-slate-700">
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
              className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

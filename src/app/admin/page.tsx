'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ActiveUser {
  user_id: string;
  username: string;
  email: string;
  name: string;
  latest_activity: string | null;
  action: string;
}

interface ProviderBalance {
  name: string;
  balance: string;
  currency: string;
}

interface DashboardStats {
  total_users: number;
  active_users_today: number;
  total_orders: number;
  pending_orders: number;
  total_revenue: string;
  total_profit: string;
  today_orders: number;
  today_revenue: string;
  today_profit: string;
  pending_tickets: number;
  total_user_deposits?: string;
  total_user_balances?: string;
  provider_balances?: Record<string, ProviderBalance>;
  active_users_ranked_today?: ActiveUser[];
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      loadStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadStats() {
    if (!token) return;
    setLoading(true);

    const result = await adminApi.getDashboard(token);
    if (result.data) {
      setStats(result.data as DashboardStats);
    }
    setLoading(false);
  }

  const formatTimeAgo = (dateStr: string | null) => {
    if (!dateStr) return 'Active today';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrative Overview
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Live operational monitoring, system liquidity, and user activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadStats}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Live Sync</span>
          </button>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-sm shadow-primary/20"
          >
            <span>User Manager</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* TOP 4 BENTO CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Total Users */}
        <div className="bento-card p-4 sm:p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : stats?.total_users || 0}
            </div>
            
          </div>
        </div>

        {/* Card 2: Active Today */}
        <div className="bento-card p-4 sm:p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Today
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {loading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : stats?.active_users_today || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[10px] text-emerald-600 font-medium">Active sessions</span>
            </div>
          </div>
        </div>

        {/* Card 3: Pending Queue */}
        <div className="bento-card p-4 sm:p-5 flex flex-col justify-between bg-amber-50/60 border-amber-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-700">
              Pending Orders
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center border border-amber-200">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
              {loading ? <div className="h-8 w-16 bg-amber-100 rounded animate-pulse" /> : stats?.pending_orders || 0}
            </div>
            
          </div>
        </div>

        {/* Card 4: Volume / Deposits */}
        <div className="bento-card p-4 sm:p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Deposits
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
              {loading ? (
                <div className="h-8 w-24 bg-slate-100 rounded animate-pulse" />
              ) : (
                formatCurrency(stats?.total_user_deposits || '0')
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIQUIDITY BENTO: Combined User Deposits vs Online Provider Balances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Side 1: Platform User Liabilities */}
        <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Platform User Balances</h2>
            </div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100">
              Users Wallet
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total User Wallet Holding</p>
            <p className="text-3xl font-black text-slate-900">{formatCurrency(stats?.total_user_balances || '0')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Gross Revenue</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{formatCurrency(stats?.total_revenue || '0')}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500">Net Profit</span>
              <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(stats?.total_profit || '0')}</p>
            </div>
          </div>
        </div>

        {/* Side 2: Upstream Provider Balances */}
        <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">Upstream Provider Balances</h2>
            </div>
            <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              APIs
            </span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {stats?.provider_balances && Object.keys(stats.provider_balances).length > 0 ? (
              Object.entries(stats.provider_balances).map(([slug, prov]) => (
                <div
                  key={slug}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-900">{prov.name}</p>
                      <p className="text-[10px] text-slate-500">{slug}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">{prov.balance} {prov.currency}</p>
                    <p className="text-[10px] text-slate-500">Live API balance</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">No active providers configured</div>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE USERS OF THE DAY (Ranked by Latest Activity Time) */}
      <div className="bento-card p-5 sm:p-6 space-y-4 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Users Today</h2>
              <p className="text-[11px] text-slate-500">Ranked by time of latest activity</p>
            </div>
          </div>

          <Link href="/admin/users" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
            <span>All Users</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {stats?.active_users_ranked_today && stats.active_users_ranked_today.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.active_users_ranked_today.map((user, idx) => (
              <div
                key={user.user_id}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-xs border border-primary/20 shrink-0">
                    {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || idx + 1}
                  </div>
                  <div className="min-w-0 truncate">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.name || user.username}</p>
                    <p className="text-[11px] text-slate-500 truncate">@{user.username}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                    {formatTimeAgo(user.latest_activity)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500">No user activity recorded today yet</div>
        )}
      </div>
    </div>
  );
}

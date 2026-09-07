'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';

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
  service_type?: string;
}

interface ServicePerformance {
  name: string;
  orders_count: number;
  revenue: string;
  profit: string;
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
  smm?: {
    total_orders: number;
    pending_orders: number;
    revenue: string;
    profit: string;
    today_orders: number;
    today_revenue: string;
    today_profit: string;
    top_services: ServicePerformance[];
  };
  otp?: {
    total_orders: number;
    received_orders: number;
    pending_orders: number;
    canceled_orders: number;
    expired_orders: number;
    success_rate: number;
    revenue: string;
    profit: string;
    today_orders: number;
    today_revenue: string;
    today_profit: string;
    top_services: ServicePerformance[];
  };
}

export default function AdminDashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'combined' | 'smm' | 'otp'>('combined');

  useEffect(() => {
    if (token) {
      loadStats();
    }
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

  const smmRev = Number(stats?.smm?.revenue || 0);
  const otpRev = Number(stats?.otp?.revenue || 0);
  const totalRev = smmRev + otpRev || 1;
  const smmRevPct = Math.round((smmRev / totalRev) * 100);
  const otpRevPct = Math.round((otpRev / totalRev) * 100);

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Administrative Overview
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5 font-medium">
            Multi-service platform analytics, global liquidity, and operational health.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStats}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-primary' : 'text-slate-500'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Live Sync</span>
          </button>

          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20 cursor-pointer"
          >
            <span>User Manager</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Multi-Service Vertical Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('combined')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'combined'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('smm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'smm'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>SMM</span>
        </button>

        <button
          onClick={() => setActiveTab('otp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'otp'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span>Virtual Numbers</span>
        </button>
      </div>

      {/* TAB 1: COMBINED PLATFORM OVERVIEW */}
      {activeTab === 'combined' && (
        <div className="space-y-6">
          {/* Top 4 Bento KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            {/* Card 1: Gross Platform Revenue */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gross Platform Revenue
                </span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div
                  className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                  title={formatCurrency(stats?.total_revenue || '0')}
                >
                  {loading ? <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" /> : formatCompactCurrency(stats?.total_revenue || '0')}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">All Platforms Combined</p>
              </div>
            </div>

            {/* Card 2: Net Realized Profit */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Net Realized Profit
                </span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div
                  className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight"
                  title={formatCurrency(stats?.total_profit || '0')}
                >
                  {loading ? <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" /> : formatCompactCurrency(stats?.total_profit || '0')}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Net profit</p>
              </div>
            </div>

            {/* Card 3: Total Orders Fulfilled */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Orders
                </span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {loading ? <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse" /> : (stats?.total_orders || 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Placed across all services</p>
              </div>
            </div>

            {/* Card 4: Total User Deposits */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Deposits
                </span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div
                  className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                  title={formatCurrency(stats?.total_user_deposits || '0')}
                >
                  {loading ? <div className="h-8 w-24 bg-slate-100 rounded-lg animate-pulse" /> : formatCompactCurrency(stats?.total_user_deposits || '0')}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Lifetime verified fundings</p>
              </div>
            </div>
          </div>

          {/* Service Vertical Share Strip */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Service Revenue Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Real-time revenue split across active platform</p>
              </div>
              <span className="text-xs font-bold text-slate-500">2 Active Platforms</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${smmRevPct}%` }} className="bg-primary h-full transition-all duration-500" title={`SMM: ${smmRevPct}%`} />
              <div style={{ width: `${otpRevPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Virtual Numbers: ${otpRevPct}%`} />
            </div>

            {/* Legend & Numbers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Social Media Boosts</p>
                    <p className="text-[11px] text-slate-500">{stats?.smm?.total_orders || 0} orders ({smmRevPct}%)</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(stats?.smm?.revenue || '0')}</span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Virtual Numbers</p>
                    <p className="text-[11px] text-slate-500">{stats?.otp?.total_orders || 0} orders ({otpRevPct}%)</p>
                  </div>
                </div>
                <span className="text-sm font-black text-slate-900">{formatCurrency(stats?.otp?.revenue || '0')}</span>
              </div>
            </div>
          </div>

          {/* LIQUIDITY BENTO: Platform Liabilities vs Upstream Reserves */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Side 1: Platform User Liabilities */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Platform User Balances</h2>
                    <p className="text-[11px] text-slate-400">Total circulating user wallet holdings</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-200">
                  Liabilities
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total User Wallet Holding</p>
                <p className="text-3xl font-black text-slate-900">{formatCurrency(stats?.total_user_balances || '0')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 font-medium">Today's Revenue</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">{formatCurrency(stats?.today_revenue || '0')}</p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 font-medium">Today's Profit</span>
                  <p className="text-sm font-black text-emerald-600 mt-0.5">{formatCurrency(stats?.today_profit || '0')}</p>
                </div>
              </div>
            </div>

            {/* Side 2: Upstream Provider Reserves (SMM + ZapOTP) */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900">Upstream Provider Balances</h2>
                    <p className="text-[11px] text-slate-400">Wholesale API float across SMM panels & ZapOTP</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Reserves
                </span>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                {stats?.provider_balances && Object.keys(stats.provider_balances).length > 0 ? (
                  Object.entries(stats.provider_balances).map(([slug, prov]) => (
                    <div
                      key={slug}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-emerald-500/30 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full ${prov.service_type === 'OTP' ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900">{prov.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono uppercase">{slug} &bull; {prov.service_type || 'API'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{prov.balance} {prov.currency}</p>
                        <p className="text-[10px] text-slate-400">Live Float</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">No active upstream providers configured</div>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE USERS OF THE DAY */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900">Active Users Today</h2>
                  <p className="text-[11px] text-slate-400">Ranked by time of latest activity</p>
                </div>
              </div>

              <Link
                href="/admin/users"
                title="Manage All Users"
                className="p-2 rounded-xl bg-slate-100/80 text-slate-600 hover:text-primary hover:bg-primary/10 transition-colors border border-slate-200/80 inline-flex items-center justify-center cursor-pointer shadow-xs"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-black flex items-center justify-center text-xs border border-primary/20 shrink-0">
                        {user.name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || idx + 1}
                      </div>
                      <div className="min-w-0 truncate">
                        <p className="text-xs font-bold text-slate-900 truncate">{user.name || user.username}</p>
                        <p className="text-[11px] text-slate-400 truncate">@{user.username}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full">
                        {formatTimeAgo(user.latest_activity)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-medium">No user activity recorded today yet</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SOCIAL MEDIA BOOSTS (SMM) DEEP DIVE */}
      {activeTab === 'smm' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SMM Total Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2" title={formatCurrency(stats?.smm?.revenue || '0')}>
                {formatCompactCurrency(stats?.smm?.revenue || '0')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Lifetime SMM revenue</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SMM Net Profit</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2" title={formatCurrency(stats?.smm?.profit || '0')}>
                {formatCompactCurrency(stats?.smm?.profit || '0')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Realized wholesale margin</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SMM Placements</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{(stats?.smm?.total_orders || 0).toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">{(stats?.smm?.today_orders || 0)} placed today</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Pending Delivery</span>
              <p className="text-2xl sm:text-3xl font-black text-blue-600 mt-2">{stats?.smm?.pending_orders || 0}</p>
              <p className="text-[11px] text-slate-400 mt-1">Active delivery queue</p>
            </div>
          </div>

          {/* Top 5 SMM Services Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Top Performing SMM Services</h3>
                <p className="text-xs text-slate-400 mt-0.5">Ranked by total customer order volume</p>
              </div>
              <Link href="/admin/orders" className="text-xs font-bold text-primary hover:underline">
                View All Orders &rarr;
              </Link>
            </div>

            {stats?.smm?.top_services && stats.smm.top_services.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {stats.smm.top_services.map((svc, i) => (
                  <div key={i} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-blue-50 text-primary font-black text-xs flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-900 truncate">{svc.name}</p>
                    </div>
                    <div className="flex items-center gap-6 text-right shrink-0">
                      <div>
                        <p className="text-xs font-black text-slate-900">{svc.orders_count.toLocaleString()} orders</p>
                        <p className="text-[10px] text-slate-400">Volume</p>
                      </div>
                      <div>
                        <p className="text-xs font-black text-emerald-600">+{formatCurrency(svc.profit)}</p>
                        <p className="text-[10px] text-slate-400">Profit</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">No SMM service performance data available</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: VIRTUAL NUMBERS (ZAPOTP) DEEP DIVE */}
      {activeTab === 'otp' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">OTP Gross Revenue</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2" title={formatCurrency(stats?.otp?.revenue || '0')}>
                {formatCompactCurrency(stats?.otp?.revenue || '0')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Virtual number rentals</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">OTP Net Profit</span>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2" title={formatCurrency(stats?.otp?.profit || '0')}>
                {formatCompactCurrency(stats?.otp?.profit || '0')}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">From +30% hybrid markup</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Numbers Rented</span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{(stats?.otp?.total_orders || 0).toLocaleString()}</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats?.otp?.today_orders || 0} rented today</p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">SMS Delivery Rate</span>
              <p className="text-2xl sm:text-3xl font-black text-purple-600 mt-2">{stats?.otp?.success_rate || 0}%</p>
              <p className="text-[11px] text-slate-400 mt-1">{stats?.otp?.received_orders || 0} codes delivered</p>
            </div>
          </div>

          {/* OTP Funnel & Top Platforms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Status Funnel */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900">OTP Order Status Breakdown</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-[11px] font-bold text-emerald-700 uppercase">Received (Delivered)</span>
                  <p className="text-2xl font-black text-emerald-700 mt-1">{stats?.otp?.received_orders || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100">
                  <span className="text-[11px] font-bold text-blue-700 uppercase">Listening (Pending)</span>
                  <p className="text-2xl font-black text-blue-700 mt-1">{stats?.otp?.pending_orders || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">User Canceled</span>
                  <p className="text-2xl font-black text-slate-700 mt-1">{stats?.otp?.canceled_orders || 0}</p>
                </div>
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-[11px] font-bold text-rose-700 uppercase">Expired (Auto-Refunded)</span>
                  <p className="text-2xl font-black text-rose-700 mt-1">{stats?.otp?.expired_orders || 0}</p>
                </div>
              </div>
            </div>

            {/* Top Platforms Rented */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-900">Top Rented Verification Services</h3>
                <Link href="/admin/otp" className="text-xs font-bold text-primary hover:underline">
                  OTP Settings &rarr;
                </Link>
              </div>

              {stats?.otp?.top_services && stats.otp.top_services.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {stats.otp.top_services.map((svc, idx) => (
                    <div key={idx} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-700 font-black text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-xs font-bold text-slate-900">{svc.name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900">{svc.orders_count} rented</span>
                        <p className="text-[10px] text-emerald-600 font-bold">+{formatCurrency(svc.profit)} profit</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-400">No virtual number rentals recorded yet</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

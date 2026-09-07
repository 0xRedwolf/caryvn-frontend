'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatCompactCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Recharts dynamically imported with SSR disabled
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart),           { ssr: false });
const Area                = dynamic(() => import('recharts').then(m => m.Area),                { ssr: false });
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false });
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false });
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false });
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

// Types
interface AnalyticsData {
  summary: {
    total_revenue: number;
    total_profit: number;
    smm_revenue?: number;
    smm_profit?: number;
    otp_revenue?: number;
    otp_profit?: number;
    total_users: number;
    total_orders: number;
    smm_orders?: number;
    otp_orders?: number;
    active_orders: number;
    new_users_7d: number;
    revenue_trend: number;
    completion_rate: number;
    avg_order_value: number;
    total_deposits: number;
    web_orders?: number;
    api_orders?: number;
    web_revenue?: number;
    api_revenue?: number;
  };
  otp_metrics?: {
    total_orders: number;
    received_count: number;
    refunded_count: number;
    active_listening: number;
    success_rate: number;
    revenue: number;
    profit: number;
    popular_services?: {
      service_name: string;
      country: string;
      orders: number;
      received: number;
      revenue: number;
      profit: number;
    }[];
    revenue_chart?: { date: string; revenue: number; profit: number; orders: number }[];
  };
  revenue_chart: { date: string; revenue: number; profit: number; orders: number }[];
  combined_chart?: {
    date: string;
    revenue: number;
    profit: number;
    orders: number;
    smm_revenue?: number;
    smm_profit?: number;
    otp_revenue?: number;
    otp_profit?: number;
  }[];
  user_growth_chart: { date: string; users: number }[];
  popular_services: { name: string; platform: string; orders: number; revenue: number; profit: number }[];
  order_status: Record<string, number>;
  revenue_by_provider?: { provider: string; revenue: number; profit: number; orders: number }[];
  source_breakdown?: { source: string; orders: number; revenue: number }[];
  gateway_performance?: {
    gateway: string;
    name: string;
    initiated: number;
    completed: number;
    failed: number;
    pending: number;
    volume: number;
    total_volume: number;
    conversion_rate: number;
  }[];
  top_customers?: {
    id: string;
    email: string;
    name: string;
    orders: number;
    total_spend: number;
    total_profit: number;
  }[];
  platform_margins?: {
    platform: string;
    revenue: number;
    profit: number;
    orders: number;
    margin_rate: number;
  }[];
  service_refund_rates?: {
    service_name: string;
    category: string;
    total_orders: number;
    refunded_orders: number;
    refund_rate: number;
  }[];
  provider_runway?: {
    provider_id: number;
    name: string;
    currency: string;
    orders_7d: number;
    spend_7d_ngn: number;
    daily_burn_ngn: number;
  }[];
}

const STATUS_COLORS: Record<string, string> = {
  completed:   '#2563eb',
  partial:     '#10b981',
  processing:  '#f59e0b',
  in_progress: '#f59e0b',
  pending:     '#64748b',
  canceled:    '#ef4444',
  cancelled:   '#ef4444',
  refunded:    '#8b5cf6',
  failed:      '#f43f5e',
};

const TT_STYLE = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  color: '#0f172a',
  fontSize: '12px',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  padding: '8px 12px',
};

const RANGE_OPTIONS = [
  { label: 'Last 7 Days',  days: 7  },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last Year',    days: 365},
];

// Clean SVG Country Flag with code badge fallback
function CountryFlag({
  code,
  name,
  className = 'w-5 h-3.5',
}: {
  code: string;
  name?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const lc = (code || '').toLowerCase();

  if (imgError || !code) {
    return (
      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0">
        {code}
      </span>
    );
  }

  return (
    <img
      src={`/flags/${lc}.svg`}
      alt={name || code}
      onError={() => setImgError(true)}
      className={`${className} object-cover rounded-xs border border-slate-200/80 shrink-0 shadow-2xs`}
      loading="lazy"
    />
  );
}

export default function AdminAnalyticsPage() {
  const { token } = useAuth();
  const [data, setData]           = useState<AnalyticsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [days, setDays]           = useState(30);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'smm' | 'otp'>('overview');

  useEffect(() => {
    if (token) load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days]);

  async function load(selectedDays: number) {
    if (!token) return;
    setLoading(true);
    const result = await adminApi.getAnalytics(token, selectedDays);
    if (result.data) {
      setData(result.data as AnalyticsData);
    }
    setLoading(false);
  }

  function selectRange(d: number) {
    setDays(d);
    setRangeOpen(false);
  }

  const currentRange = RANGE_OPTIONS.find(r => r.days === days) ?? RANGE_OPTIONS[2];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="h-8 w-60 bg-slate-200 rounded-xl mb-2" />
            <div className="h-4 w-80 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-10 w-40 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-12 w-80 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 bg-slate-100 border border-slate-200/80 rounded-3xl" />
          ))}
        </div>
        <div className="h-80 bg-slate-100 border border-slate-200/80 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-slate-100 border border-slate-200/80 rounded-3xl" />
          <div className="h-72 bg-slate-100 border border-slate-200/80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 p-8 text-center bg-white rounded-3xl border border-slate-200/90">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">Failed to load analytics</h2>
          <p className="text-xs text-slate-500 mt-1">We couldn&apos;t fetch real-time operational telemetry.</p>
        </div>
        <button
          onClick={() => load(days)}
          className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Retry Fetching
        </button>
      </div>
    );
  }

  const { summary } = data;

  // Status donut gradient calculation
  const statusEntries = Object.entries(data.order_status || {});
  const totalSmmOrders = statusEntries.reduce((s, [, v]) => s + v, 0);
  let angle = 0;
  const conicParts = statusEntries.map(([key, count]) => {
    const pct = totalSmmOrders > 0 ? (count / totalSmmOrders) * 100 : 0;
    const color = STATUS_COLORS[key] || '#64748b';
    const start = angle;
    angle += pct;
    return { key, count, pct, color, start };
  });
  const conicGradient = conicParts.length > 0
    ? `conic-gradient(${conicParts.map(p => `${p.color} ${p.start.toFixed(1)}% ${(p.start + p.pct).toFixed(1)}%`).join(', ')})`
    : 'conic-gradient(#e2e8f0 0% 100%)';

  // SMM vs OTP revenue percentages
  const combinedRev = (summary.smm_revenue || 0) + (summary.otp_revenue || 0);
  const smmRevPct = combinedRev > 0 ? Math.round(((summary.smm_revenue || 0) / combinedRev) * 100) : 50;
  const otpRevPct = 100 - smmRevPct;

  const chartData = (data.combined_chart && data.combined_chart.length > 0) ? data.combined_chart : data.revenue_chart;

  return (
    <div className="space-y-6">

      {/* ─── Top Header & Controls ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
            Analytics Studio
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Platform revenue telemetry, double-vertical unit economics & multi-service growth
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Range dropdown */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen(o => !o)}
              className="flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-700 font-bold transition-colors shadow-xs cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{currentRange.label}</span>
              <svg className={`w-3 h-3 text-slate-400 transition-transform ${rangeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {rangeOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                <div className="absolute left-0 top-full mt-1.5 z-20 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl w-44 py-1">
                  {RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => selectRange(opt.days)}
                      className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                        opt.days === days
                          ? 'bg-primary/10 text-primary'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {opt.days === days && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => load(days)}
            className="p-2 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl transition-colors shadow-xs cursor-pointer"
            title="Refresh Telemetry"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Multi-Service Vertical Tabs ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 p-1 bg-slate-200/60 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
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

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: COMBINED OVERVIEW                                                  */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
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
                  title={formatCurrency(summary.total_revenue.toString())}
                >
                  {formatCompactCurrency(summary.total_revenue)}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                    summary.revenue_trend >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {summary.revenue_trend >= 0 ? '+' : ''}{summary.revenue_trend}%
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">vs prior {days}d</span>
                </div>
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
                  title={formatCurrency(summary.total_profit.toString())}
                >
                  {formatCompactCurrency(summary.total_profit)}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Combined margin</p>
              </div>
            </div>

            {/* Card 3: Total Orders */}
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
                  {summary.total_orders.toLocaleString()}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {(summary.smm_orders || 0).toLocaleString()} SMM &bull; {(summary.otp_orders || 0).toLocaleString()} OTP
                </p>
              </div>
            </div>

            {/* Card 4: Verified Deposits */}
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Verified Deposits
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
                  title={formatCurrency(summary.total_deposits.toString())}
                >
                  {formatCompactCurrency(summary.total_deposits)}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Lifetime user deposits</p>
              </div>
            </div>
          </div>

          {/* Service Revenue Share Breakdown */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">Service Revenue Distribution</h3>
                <p className="text-xs text-slate-400 mt-0.5">Proportional split across active vertical channels in current window</p>
              </div>
              <span className="text-xs font-bold text-slate-500">2 Active Verticals</span>
            </div>

            {/* Visual Bar */}
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${smmRevPct}%` }} className="bg-primary h-full transition-all duration-500" title={`SMM: ${smmRevPct}%`} />
              <div style={{ width: `${otpRevPct}%` }} className="bg-emerald-500 h-full transition-all duration-500" title={`Virtual Numbers: ${otpRevPct}%`} />
            </div>

            {/* Subcards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-primary shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Social Media Boosts (SMM)</p>
                    <p className="text-[11px] text-slate-500">{(summary.smm_orders || 0).toLocaleString()} orders ({smmRevPct}%)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900" title={formatCurrency(summary.smm_revenue || 0)}>
                    {formatCompactCurrency(summary.smm_revenue || 0)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">+{formatCompactCurrency(summary.smm_profit || 0)} profit</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-slate-900">Virtual Numbers (ZapOTP)</p>
                    <p className="text-[11px] text-slate-500">{(summary.otp_orders || 0).toLocaleString()} rentals ({otpRevPct}%)</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900" title={formatCurrency(summary.otp_revenue || 0)}>
                    {formatCompactCurrency(summary.otp_revenue || 0)}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">+{formatCompactCurrency(summary.otp_profit || 0)} profit</p>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Daily Revenue & Profit Area Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Combined Platform Performance</h3>
                <p className="text-xs text-slate-400 mt-0.5">Aggregated daily revenue and profit across all services</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  Gross Revenue
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  Net Profit
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gRevCombined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gProfCombined" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10b981" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => formatCompactCurrency(v)}
                    />
                    <Tooltip
                      contentStyle={TT_STYLE}
                      labelFormatter={v => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      formatter={(value, name) => [
                        formatCurrency(Number(value || 0)),
                        name === 'revenue' ? 'Combined Revenue' : name === 'profit' ? 'Net Profit' : String(name),
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#gRevCombined)" dot={false} />
                    <Area type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2.5} fill="url(#gProfCombined)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No daily revenue data recorded for this time window
                </div>
              )}
            </div>
          </div>

          {/* 2-Column: User Growth Chart & Order Channels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* User Growth */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">User Growth & Signups</h3>
                      <p className="text-[11px] text-slate-400">Daily client onboarding rate</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                    +{summary.new_users_7d} this week
                  </span>
                </div>
                <div className="h-56 mt-4">
                  {data.user_growth_chart && data.user_growth_chart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.user_growth_chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gUsers" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#94a3b8"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={v => new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                        />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={TT_STYLE}
                          labelFormatter={v => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                          formatter={(value) => [`${value} new signups`, 'Registrations']}
                        />
                        <Area type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} fill="url(#gUsers)" dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No user registrations in this timeframe
                    </div>
                  )}
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Total Platform Accounts:</span>
                <span className="font-black text-slate-900">{summary.total_users.toLocaleString()}</span>
              </div>
            </div>

            {/* Order Channel: Web Dashboard vs Reseller API */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Placement Channels</h3>
                      <p className="text-[11px] text-slate-400">Web dashboard vs automated API endpoints</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">
                    {((summary.web_orders ?? 0) + (summary.api_orders ?? 0)).toLocaleString()} total
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Web Dashboard</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{(summary.web_orders ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-primary mt-1" title={formatCurrency(summary.web_revenue || 0)}>
                      {formatCompactCurrency(summary.web_revenue || 0)}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">Developer API</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900">{(summary.api_orders ?? 0).toLocaleString()}</p>
                    <p className="text-xs font-bold text-purple-600 mt-1" title={formatCurrency(summary.api_revenue || 0)}>
                      {formatCompactCurrency(summary.api_revenue || 0)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                {(() => {
                  const tot = (summary.web_orders ?? 0) + (summary.api_orders ?? 0);
                  const wp = tot > 0 ? Math.round(((summary.web_orders ?? 0) / tot) * 100) : 50;
                  return (
                    <div className="mt-4">
                      <div className="flex rounded-full overflow-hidden h-2.5 bg-slate-100">
                        <div className="bg-primary transition-all duration-500" style={{ width: `${wp}%` }} />
                        <div className="bg-purple-500 transition-all duration-500" style={{ width: `${100 - wp}%` }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400 font-bold mt-2">
                        <span>Web Clients ({wp}%)</span>
                        <span>API Integrations ({100 - wp}%)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Average Order Size:</span>
                <span className="font-black text-slate-900">{formatCurrency(summary.avg_order_value)}</span>
              </div>
            </div>
          </div>

          {/* Payment Gateway Performance Funnel */}
          {data.gateway_performance && data.gateway_performance.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Payment Gateway Conversion Funnel</h3>
                    <p className="text-[11px] text-slate-400">Real-time deposit checkout conversion rates & completed volume</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Telemetry
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.gateway_performance.map((gw) => (
                  <div
                    key={gw.gateway}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-slate-900 text-xs truncate max-w-44">{gw.name}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                            gw.conversion_rate >= 80
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : gw.conversion_rate >= 50
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {gw.conversion_rate}% Conv.
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-3 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-500 ${
                            gw.conversion_rate >= 80 ? 'bg-emerald-500' : gw.conversion_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(gw.conversion_rate, 100)}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-500 mb-3 bg-white p-2 rounded-xl border border-slate-100 text-center">
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Initiated</span>
                          <span className="font-bold text-slate-800">{gw.initiated}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Success</span>
                          <span className="font-bold text-emerald-600">{gw.completed}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-slate-400 uppercase font-bold">Failed</span>
                          <span className="font-bold text-rose-600">{gw.failed}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-200/60">
                      <span className="text-slate-400 font-medium text-[11px]">Completed Vol:</span>
                      <span className="font-black text-primary" title={formatCurrency(gw.volume.toString())}>
                        {formatCompactCurrency(gw.volume)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIP Customer Leaderboard */}
          {data.top_customers && data.top_customers.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">VIP Clients Leaderboard</h3>
                    <p className="text-[11px] text-slate-400">Top grossing customer accounts in current window</p>
                  </div>
                </div>
                <Link
                  href="/admin/users"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Manage Users &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Client</th>
                      <th className="px-4 py-3 text-center">Orders</th>
                      <th className="px-4 py-3 text-right">Total Spent</th>
                      <th className="px-4 py-3 text-right">Profit Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.top_customers.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-900 truncate max-w-44">
                          <span className="text-slate-400 font-bold mr-2">#{idx + 1}</span>
                          {c.email}
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{c.orders}</td>
                        <td className="px-4 py-3 text-right font-black text-primary" title={formatCurrency(c.total_spend)}>
                          {formatCompactCurrency(c.total_spend)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600" title={formatCurrency(c.total_profit)}>
                          +{formatCompactCurrency(c.total_profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: SMM DEEP DIVE                                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'smm' && (
        <div className="space-y-6">
          {/* SMM 4 Bento KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SMM Total Revenue</span>
              <div className="mt-3">
                <p
                  className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                  title={formatCurrency(summary.smm_revenue || 0)}
                >
                  {formatCompactCurrency(summary.smm_revenue || 0)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Social boosts</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SMM Net Profit</span>
              <div className="mt-3">
                <p
                  className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight"
                  title={formatCurrency(summary.smm_profit || 0)}
                >
                  {formatCompactCurrency(summary.smm_profit || 0)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Net wholesale margin</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SMM Placements</span>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(summary.smm_orders || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Orders in selected timeframe</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Completion Rate</span>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-blue-600 tracking-tight">
                  {summary.completion_rate}%
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Completed vs total placements</p>
              </div>
            </div>
          </div>

          {/* SMM Revenue & Profit Daily Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">SMM Revenue & Profit Velocity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Daily trend for social media marketing orders</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
                  SMM Revenue
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  SMM Profit
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {data.revenue_chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.revenue_chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSmmRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gSmmProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10b981" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => formatCompactCurrency(v)}
                    />
                    <Tooltip
                      contentStyle={TT_STYLE}
                      labelFormatter={v => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      formatter={(value, name) => [
                        formatCurrency(Number(value || 0)),
                        name === 'revenue' ? 'SMM Revenue' : name === 'profit' ? 'SMM Profit' : String(name),
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fill="url(#gSmmRev)" dot={false} />
                    <Area type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2.5} fill="url(#gSmmProf)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No SMM orders placed in this timeframe
                </div>
              )}
            </div>
          </div>

          {/* 2-Column: Top Services & Order Status Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top SMM Services */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">Top Performing SMM Services</h3>
                <span className="text-[11px] text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full font-bold">
                  Last {days} days
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {data.popular_services && data.popular_services.length > 0 ? (
                  data.popular_services.slice(0, 6).map((svc, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-primary font-black text-xs flex items-center justify-center shrink-0">
                          {i + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate max-w-44">{svc.name}</p>
                          <p className="text-[10px] text-slate-400">{svc.orders.toLocaleString()} orders &bull; {svc.platform}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-900">{formatCompactCurrency(svc.revenue)}</p>
                        <p className="text-[10px] text-emerald-600 font-bold">+{formatCompactCurrency(svc.profit)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 py-6 text-center">No SMM service performance data available</p>
                )}
              </div>
            </div>

            {/* SMM Order Status Donut */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-black text-slate-900">SMM Status Distribution</h3>
                  <span className="text-xs font-bold text-slate-500">{totalSmmOrders.toLocaleString()} total</span>
                </div>

                <div className="flex items-center justify-center py-5">
                  <div
                    className="relative w-44 h-44 rounded-full flex items-center justify-center shadow-xs"
                    style={{ background: conicGradient }}
                  >
                    <div className="w-32 h-32 bg-white rounded-full flex flex-col items-center justify-center z-10 shadow-sm">
                      <span className="text-xl font-black text-slate-900">
                        {totalSmmOrders.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold mt-0.5">SMM Orders</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                {conicParts.map(p => (
                  <div key={p.key} className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-600 text-[11px] capitalize truncate">
                      {p.key.replace(/_/g, ' ')} ({p.pct.toFixed(0)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2-Column: Platform Margins & Quality Telemetry */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Platform Margins */}
            {data.platform_margins && data.platform_margins.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Platform Net Margins</h3>
                      <p className="text-[11px] text-slate-400">Profitability by social media channel</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 uppercase">
                    Margins
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Platform</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                        <th className="px-4 py-2.5 text-right">Profit</th>
                        <th className="px-4 py-2.5 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.platform_margins.map((pm, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-slate-900 capitalize">{pm.platform}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-slate-700">{formatCompactCurrency(pm.revenue)}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-emerald-600">{formatCompactCurrency(pm.profit)}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="inline-block bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px] px-2 py-0.5 rounded-md">
                              {pm.margin_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Quality Telemetry */}
            {data.service_refund_rates && data.service_refund_rates.length > 0 && (
              <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">Service Quality Monitor</h3>
                      <p className="text-[11px] text-slate-400">Services with elevated refund/cancel ratios</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                    Alerts
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Service</th>
                        <th className="px-3 py-2.5 text-center">Orders</th>
                        <th className="px-3 py-2.5 text-center">Refunded</th>
                        <th className="px-4 py-2.5 text-right">Refund %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.service_refund_rates.map((sr, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2.5 font-semibold text-slate-900 truncate max-w-44" title={sr.service_name}>
                            {sr.service_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-700 font-semibold">{sr.total_orders}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-rose-600">{sr.refunded_orders}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`inline-block font-bold text-[10px] px-2 py-0.5 rounded-md border ${
                              sr.refund_rate > 30 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                              {sr.refund_rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Upstream Provider Runway & Spend Velocity */}
          {data.provider_runway && data.provider_runway.length > 0 && (
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Upstream Provider Spend Velocity</h3>
                    <p className="text-[11px] text-slate-400">7-day order volume & daily capital burn rate</p>
                  </div>
                </div>
                <Link
                  href="/admin/sync"
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Manage Providers &rarr;
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Provider</th>
                      <th className="px-4 py-2.5 text-center">Orders (7d)</th>
                      <th className="px-4 py-2.5 text-right">Spend (7d)</th>
                      <th className="px-4 py-2.5 text-right">Daily Burn Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.provider_runway.map((pr) => (
                      <tr key={pr.provider_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900">{pr.name}</td>
                        <td className="px-4 py-2.5 text-center font-semibold text-slate-700">{pr.orders_7d}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{formatCompactCurrency(pr.spend_7d_ngn)}</td>
                        <td className="px-4 py-2.5 text-right font-black text-primary">
                          {formatCompactCurrency(pr.daily_burn_ngn)}/day
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: VIRTUAL NUMBERS (ZAPOTP) DEEP DIVE                                 */}
      {/* ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'otp' && (
        <div className="space-y-6">
          {/* OTP 4 Bento KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">OTP Gross Revenue</span>
              <div className="mt-3">
                <p
                  className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight"
                  title={formatCurrency(data.otp_metrics?.revenue || 0)}
                >
                  {formatCompactCurrency(data.otp_metrics?.revenue || 0)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Virtual number rentals</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">OTP Net Margin</span>
              <div className="mt-3">
                <p
                  className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight"
                  title={formatCurrency(data.otp_metrics?.profit || 0)}
                >
                  {formatCompactCurrency(data.otp_metrics?.profit || 0)}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">From hybrid markup</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">Total Rentals</span>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {(data.otp_metrics?.total_orders || 0).toLocaleString()}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">Numbers leased</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
              <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">SMS Delivery Rate</span>
              <div className="mt-3">
                <p className="text-2xl sm:text-3xl font-black text-purple-600 tracking-tight">
                  {data.otp_metrics?.success_rate || 0}%
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">{(data.otp_metrics?.received_count || 0).toLocaleString()} codes verified</p>
              </div>
            </div>
          </div>

          {/* OTP Daily Trend Area Chart */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">Virtual Numbers Daily Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Rental volume, delivered codes, and revenue generation</p>
              </div>
              <div className="flex items-center gap-5">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                  OTP Revenue
                </span>
                <span className="flex items-center gap-2 text-xs font-bold text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                  OTP Net Margin
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              {data.otp_metrics?.revenue_chart && data.otp_metrics.revenue_chart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.otp_metrics.revenue_chart} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gOtpRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                      </linearGradient>
                      <linearGradient id="gOtpProf" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={0.16} />
                        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}    />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis
                      stroke="#94a3b8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => formatCompactCurrency(v)}
                    />
                    <Tooltip
                      contentStyle={TT_STYLE}
                      labelFormatter={v => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                      formatter={(value, name) => [
                        formatCurrency(Number(value || 0)),
                        name === 'revenue' ? 'OTP Revenue' : name === 'profit' ? 'Net Profit' : String(name),
                      ]}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#gOtpRev)" dot={false} />
                    <Area type="monotone" dataKey="profit"  stroke="#8b5cf6" strokeWidth={2.5} fill="url(#gOtpProf)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No virtual number rentals fulfilled during this time window
                </div>
              )}
            </div>
          </div>

          {/* 2-Column: Status Breakdown & Service Guarantee */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Status Breakdown */}
            <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-900">OTP Rental Pipeline</h3>
                <span className="text-xs font-bold text-slate-500">{(data.otp_metrics?.total_orders || 0).toLocaleString()} total</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-700 uppercase">Received (Delivered)</span>
                  <p className="text-2xl font-black text-emerald-800 mt-1">{data.otp_metrics?.received_count || 0}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">SMS code received & verified</p>
                </div>

                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100">
                  <span className="text-[10px] font-bold text-blue-700 uppercase">Active (Listening)</span>
                  <p className="text-2xl font-black text-blue-800 mt-1">{data.otp_metrics?.active_listening || 0}</p>
                  <p className="text-[10px] text-blue-600 mt-0.5">Waiting for incoming SMS</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100">
                  <span className="text-[10px] font-bold text-rose-700 uppercase">Expired (Auto-Refunded)</span>
                  <p className="text-2xl font-black text-rose-800 mt-1">{data.otp_metrics?.refunded_count || 0}</p>
                  <p className="text-[10px] text-rose-600 mt-0.5">100% credited back to client</p>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                  <span className="text-[10px] font-bold text-purple-700 uppercase">Success Rate</span>
                  <p className="text-2xl font-black text-purple-800 mt-1">{data.otp_metrics?.success_rate || 0}%</p>
                  <p className="text-[10px] text-purple-600 mt-0.5">Carrier delivery reliability</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Rented Phone Services Table */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Top Rented Services & Countries</h3>
                  <p className="text-[11px] text-slate-400">Ranked by volume of SMS verifications requested</p>
                </div>
              </div>
              <Link
                href="/admin/orders"
                className="text-xs font-bold text-primary hover:underline"
              >
                View Orders &rarr;
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">Service Name</th>
                    <th className="px-3 py-2.5 text-center">Country</th>
                    <th className="px-3 py-2.5 text-center">Rentals</th>
                    <th className="px-3 py-2.5 text-center">Delivered</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                    <th className="px-4 py-2.5 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.otp_metrics?.popular_services && data.otp_metrics.popular_services.length > 0 ? (
                    data.otp_metrics.popular_services.map((svc, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-2.5 font-bold text-slate-900 capitalize">{svc.service_name}</td>
                        <td className="px-3 py-2.5 text-center">
                          <div className="inline-flex items-center gap-1.5 justify-center">
                            <CountryFlag code={svc.country} className="w-4 h-3" />
                            <span className="font-mono font-bold text-slate-700 uppercase text-xs">{svc.country}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center text-slate-700 font-semibold">{svc.orders}</td>
                        <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{svc.received}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-900">{formatCompactCurrency(svc.revenue)}</td>
                        <td className="px-4 py-2.5 text-right font-black text-emerald-600">+{formatCompactCurrency(svc.profit)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                        No phone service rentals recorded for this timeframe
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

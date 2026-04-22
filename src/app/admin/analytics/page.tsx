'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Recharts, SSR-safe
const AreaChart           = dynamic(() => import('recharts').then(m => m.AreaChart),           { ssr: false });
const Area                = dynamic(() => import('recharts').then(m => m.Area),                { ssr: false });
const XAxis               = dynamic(() => import('recharts').then(m => m.XAxis),               { ssr: false });
const YAxis               = dynamic(() => import('recharts').then(m => m.YAxis),               { ssr: false });
const CartesianGrid       = dynamic(() => import('recharts').then(m => m.CartesianGrid),       { ssr: false });
const Tooltip             = dynamic(() => import('recharts').then(m => m.Tooltip),             { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(m => m.ResponsiveContainer), { ssr: false });

//Types

interface AnalyticsData {
  summary: {
    total_revenue: number;
    total_profit: number;
    total_users: number;
    total_orders: number;
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
  revenue_chart: { date: string; revenue: number; profit: number; orders: number }[];
  user_growth_chart: { date: string; users: number }[];
  popular_services: { name: string; platform: string; orders: number; revenue: number; profit: number }[];
  order_status: Record<string, number>;
  revenue_by_provider?: { provider: string; revenue: number; profit: number; orders: number }[];
  source_breakdown?: { source: string; orders: number; revenue: number }[];
}

// Status color map → drives conic-gradient + legend
const STATUS_COLORS: Record<string, string> = {
  completed:   'var(--color-primary, #2563eb)',
  partial:     '#10b981',
  processing:  '#f59e0b',
  in_progress: '#f59e0b',
  pending:     '#6b7280',
  canceled:    '#ef4444',
  cancelled:   '#ef4444',
  refunded:    '#8b5cf6',
  failed:      '#f43f5e',
};

// Tooltip style matches card background exactly
const TT_STYLE = {
  backgroundColor: 'var(--color-surface-dark, #141417)',
  border: '1px solid var(--color-border-dark, #232326)',
  borderRadius: '8px',
  color: '#e5e1e4',
  fontSize: '12px',
};

// ─── Sparkline paths — one per card, purely decorative ───────────────────────
const SPARKLINES = {
  revenue: 'M0,25 C10,20 20,28 30,15 C40,2 50,18 60,10 C70,2 80,12 90,5 L100,2',
  profit:  'M0,20 C15,25 25,10 40,15 C55,20 70,5 85,10 L100,5',
  users:   'M0,28 C20,25 30,5 50,10 C70,15 80,2 100,5',
  rate:    'M0,5 C20,10 40,5 60,15 C80,25 90,20 100,28',
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  trend?: number;
  trendLabel?: string;
  iconBg: string;
  iconColor: string;
  icon: React.ReactNode;
  sparkColor: string;
  sparkPath: string;
}

function KpiCard({ label, value, trend, trendLabel = 'vs last month', iconBg, iconColor, icon, sparkColor, sparkPath }: KpiProps) {
  const positive = (trend ?? 0) >= 0;
  return (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-6 relative overflow-hidden group transition-all duration-200 hover:border-primary/30">
      {/* Label + Icon row */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{label}</span>
        <div className={`${iconBg} p-1.5 rounded-lg ${iconColor}`}>{icon}</div>
      </div>

      {/* Big number */}
      <div className="text-4xl font-bold tracking-tight text-white mb-3 leading-none">{value}</div>

      {/* Trend badge */}
      {trend !== undefined && (
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded ${
            positive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d={positive ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
            </svg>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-text-secondary">{trendLabel}</span>
        </div>
      )}

      {/* Sparkline — absolutely positioned at the bottom */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg className="w-full h-full" viewBox="0 0 100 30" preserveAspectRatio="none" fill="none" style={{ stroke: sparkColor }}>
          <path d={sparkPath} strokeLinecap="round" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}

// ─── Range Options ────────────────────────────────────────────────────────────

const RANGE_OPTIONS = [
  { label: 'Last 7 Days',  days: 7  },
  { label: 'Last 14 Days', days: 14 },
  { label: 'Last 30 Days', days: 30 },
  { label: 'Last 90 Days', days: 90 },
  { label: 'Last Year',    days: 365},
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [days, setDays]         = useState(30);
  const [rangeOpen, setRangeOpen] = useState(false);

  useEffect(() => {
    if (token) load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, days]);

  async function load(selectedDays: number) {
    if (!token) return;
    setLoading(true);
    const result = await adminApi.getAnalytics(token, selectedDays);
    if (result.data) setData(result.data as AnalyticsData);
    setLoading(false);
  }

  function selectRange(d: number) {
    setDays(d);
    setRangeOpen(false);
  }

  const currentRange = RANGE_OPTIONS.find(r => r.days === days) ?? RANGE_OPTIONS[2];

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-56 bg-border-dark rounded mb-2" />
            <div className="h-4 w-72 bg-border-dark rounded" />
          </div>
          <div className="h-9 w-36 bg-border-dark rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-40 bg-surface-dark border border-border-dark rounded-xl" />)}
        </div>
        <div className="h-80 bg-surface-dark border border-border-dark rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-72 bg-surface-dark border border-border-dark rounded-xl" />
          <div className="h-72 bg-surface-dark border border-border-dark rounded-xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <svg className="w-12 h-12 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-text-secondary">Failed to load analytics data.</p>
        <button onClick={() => load(days)} className="btn-primary px-5 py-2 text-sm">Retry</button>
      </div>
    );
  }

  const { summary } = data;

  // Build conic-gradient for order status donut
  const statusEntries = Object.entries(data.order_status);
  const totalOrders   = statusEntries.reduce((s, [, v]) => s + v, 0);
  let angle = 0;
  const conicParts = statusEntries.map(([key, count]) => {
    const pct   = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
    const color = STATUS_COLORS[key] || '#6b7280';
    const start = angle;
    angle += pct;
    return { key, count, pct, color, start };
  });
  const conicGradient = conicParts.length > 0
    ? `conic-gradient(${conicParts.map(p => `${p.color} ${p.start.toFixed(1)}% ${(p.start + p.pct).toFixed(1)}%`).join(', ')})`
    : 'conic-gradient(var(--color-border-dark) 0% 100%)';

  // Service icon colors cycling
  const SERVICE_ICON_COLORS = [
    { bg: 'bg-primary/10',   text: 'text-primary'    },
    { bg: 'bg-violet-500/10',text: 'text-violet-400' },
    { bg: 'bg-amber-500/10', text: 'text-amber-400'  },
    { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
    { bg: 'bg-pink-500/10',  text: 'text-pink-400'   },
  ];

  return (
    <div className="space-y-6">

      {/* ─── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white leading-tight">Analytics Overview</h1>
          <p className="text-text-secondary text-sm mt-1">Detailed performance metrics for your SMM operations.</p>
        </div>
        <div className="flex items-center gap-3">

          {/* ── Range picker dropdown ── */}
          <div className="relative">
            <button
              onClick={() => setRangeOpen(o => !o)}
              className="flex items-center gap-2 bg-surface-dark border border-border-dark hover:border-primary/40 rounded-lg px-3 py-2 text-sm text-white transition-colors"
            >
              <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {currentRange.label}
              <svg className={`w-3.5 h-3.5 text-text-secondary transition-transform ${rangeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {rangeOpen && (
              <>
                {/* Backdrop */}
                <div className="fixed inset-0 z-10" onClick={() => setRangeOpen(false)} />
                {/* Dropdown */}
                <div className="absolute right-0 top-full mt-1.5 z-20 bg-surface-dark border border-border-dark rounded-xl overflow-hidden shadow-xl min-w-[160px]">
                  {RANGE_OPTIONS.map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => selectRange(opt.days)}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                        opt.days === days
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-white hover:bg-primary/5'
                      }`}
                    >
                      {opt.label}
                      {opt.days === days && (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Refresh */}
          <button
            onClick={() => load(days)}
            className="btn-primary inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <KpiCard
          label="Total Revenue"
          value={formatCurrency(summary.total_revenue.toString())}
          trend={summary.revenue_trend}
          iconBg="bg-primary/10"
          iconColor="text-primary"
          sparkColor="#2563eb"
          sparkPath={SPARKLINES.revenue}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Total Profit"
          value={formatCurrency(summary.total_profit.toString())}
          iconBg="bg-emerald-500/10"
          iconColor="text-emerald-400"
          sparkColor="#10b981"
          sparkPath={SPARKLINES.profit}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          }
        />
        <KpiCard
          label="Total Users"
          value={summary.total_users.toLocaleString()}
          trend={summary.new_users_7d}
          trendLabel="new this week"
          iconBg="bg-violet-500/10"
          iconColor="text-violet-400"
          sparkColor="#8b5cf6"
          sparkPath={SPARKLINES.users}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <KpiCard
          label="Completion Rate"
          value={`${summary.completion_rate}%`}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-400"
          sparkColor="#f59e0b"
          sparkPath={SPARKLINES.rate}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* ─── Revenue vs Profit Area Chart ────────────────────────────────────── */}
      <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
        {/* Header with border-bottom — same as Stitch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-white">Revenue vs Profit</h2>
          <div className="flex items-center gap-5">
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="w-3 h-3 rounded-full bg-primary inline-block" />
              Revenue
            </span>
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
              Profit
            </span>
          </div>
        </div>

        <div className="h-80">
          {data.revenue_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_chart} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0}    />
                  </linearGradient>
                  <linearGradient id="gProf" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#10b981" stopOpacity={0.2}  />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => new Date(String(v)).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
                />
                <YAxis
                  stroke="#4b5563"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={v => `₦${(Number(v ?? 0) / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={TT_STYLE}
                  labelFormatter={v => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(value, name) => [`₦${Number(value).toLocaleString()}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} fill="url(#gRev)"  dot={false} />
                <Area type="monotone" dataKey="profit"  stroke="#10b981" strokeWidth={2} fill="url(#gProf)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-secondary text-sm">No revenue data for the last 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Bottom 2-col: Top Services + Order Status Donut ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Top Services — list style, exactly like Stitch */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-dark">
            <h2 className="text-lg font-semibold text-white">Top Services Growth</h2>
            <span className="text-xs text-text-secondary bg-background-dark border border-border-dark rounded-full px-2.5 py-1">
              Last 30 days
            </span>
          </div>
          <div className="space-y-1">
            {data.popular_services.length > 0 ? data.popular_services.slice(0, 6).map((svc, i) => {
              const col = SERVICE_ICON_COLORS[i % SERVICE_ICON_COLORS.length];
              return (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Coloured square icon */}
                    <div className={`w-10 h-10 rounded-lg ${col.bg} flex items-center justify-center shrink-0 ${col.text}`}>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate max-w-[190px]">{svc.name}</p>
                      <p className="text-xs text-text-secondary">{svc.orders.toLocaleString()} orders · {svc.platform}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-semibold text-white">{formatCurrency(svc.revenue.toString())}</p>
                    <p className="text-xs text-emerald-400 font-medium">{formatCurrency(svc.profit.toString())} profit</p>
                  </div>
                </div>
              );
            }) : (
              <p className="text-text-secondary text-sm py-6 text-center">No service data for the last 30 days</p>
            )}
          </div>
        </div>

        {/* Order Status Donut — CSS conic-gradient, same as Stitch */}
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6 flex flex-col">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-dark">
            <h2 className="text-lg font-semibold text-white">Order Status Distribution</h2>
            <span className="text-text-secondary text-xs">{totalOrders.toLocaleString()} total</span>
          </div>

          {/* Donut + center label — rounded square, not a circle (matches Stitch) */}
          <div className="flex-1 flex items-center justify-center py-4">
            <div
              className="relative w-48 h-48 rounded-[2.5rem] flex items-center justify-center"
              style={{ background: conicGradient }}
            >
              {/* Inner cutout — also a rounded square */}
              <div className="w-36 h-36 bg-surface-dark rounded-[1.75rem] flex flex-col items-center justify-center z-10">
                <span className="text-2xl font-bold text-white leading-none">
                  {totalOrders >= 1000 ? `${(totalOrders / 1000).toFixed(1)}k` : totalOrders}
                </span>
                <span className="text-xs text-text-secondary mt-1">Total Orders</span>
              </div>
            </div>
          </div>

          {/* 2×2 legend — same layout as Stitch */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
            {conicParts.map(p => (
              <div key={p.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="text-text-secondary text-sm capitalize truncate">
                  {p.key.replace(/_/g, ' ')} ({p.pct.toFixed(0)}%)
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ─── Web vs API Source Breakdown ─────────────────────────────────────── */}
      {((summary.web_orders ?? 0) + (summary.api_orders ?? 0)) > 0 && (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-6">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-dark">
            <div>
              <h2 className="text-lg font-semibold text-white">Order Source</h2>
              <p className="text-text-secondary text-xs mt-0.5">Web dashboard vs API resellers (all-time)</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            {/* Web */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">Web</span>
              </div>
              <p className="text-3xl font-bold text-white">{(summary.web_orders ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-secondary mt-1 mb-3">orders placed via dashboard</p>
              <p className="text-primary font-semibold">{formatCurrency((summary.web_revenue ?? 0).toString())}</p>
              {/* Decorative sparkline */}
              <div className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 30" className="w-full h-full" fill="none" stroke="#2563eb" preserveAspectRatio="none">
                  <path d={SPARKLINES.revenue} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            {/* API */}
            <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-5 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-text-secondary">API</span>
              </div>
              <p className="text-3xl font-bold text-white">{(summary.api_orders ?? 0).toLocaleString()}</p>
              <p className="text-xs text-text-secondary mt-1 mb-3">orders placed via reseller API</p>
              <p className="text-violet-400 font-semibold">{formatCurrency((summary.api_revenue ?? 0).toString())}</p>
              <div className="absolute bottom-0 right-0 w-24 h-10 opacity-20 pointer-events-none">
                <svg viewBox="0 0 100 30" className="w-full h-full" fill="none" stroke="#8b5cf6" preserveAspectRatio="none">
                  <path d={SPARKLINES.users} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>
          {/* Proportion bar */}
          {(() => {
            const tot = (summary.web_orders ?? 0) + (summary.api_orders ?? 0);
            const wp  = tot > 0 ? Math.round(((summary.web_orders ?? 0) / tot) * 100) : 50;
            return (
              <div>
                <div className="flex rounded-full overflow-hidden h-2.5 mb-2 bg-border-dark">
                  <div className="bg-primary transition-all duration-700" style={{ width: `${wp}%` }} />
                  <div className="bg-violet-500 transition-all duration-700" style={{ width: `${100 - wp}%` }} />
                </div>
                <div className="flex justify-between text-xs text-text-secondary">
                  <span>Web {wp}%</span>
                  <span>API {100 - wp}%</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ─── Revenue by Provider ─────────────────────────────────────────────── */}
      {data.revenue_by_provider && data.revenue_by_provider.length > 0 && (
        <div className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-border-dark">
            <h2 className="text-lg font-semibold text-white">Revenue by Provider</h2>
            <p className="text-xs text-text-secondary mt-0.5">All-time upstream provider performance</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Provider</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right">Orders</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right">Revenue</th>
                  <th className="px-6 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {data.revenue_by_provider.map((p, i) => (
                  <tr key={i} className="hover:bg-primary/5 transition-colors">
                    <td className="px-6 py-3.5 text-white font-medium">{p.provider}</td>
                    <td className="px-6 py-3.5 text-white text-right font-semibold">{p.orders.toLocaleString()}</td>
                    <td className="px-6 py-3.5 text-white text-right">{formatCurrency(p.revenue.toString())}</td>
                    <td className="px-6 py-3.5 text-emerald-400 text-right font-semibold">{formatCurrency(p.profit.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Bottom Stat Pills (Active Orders / Avg Value / Deposits) ────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Active Orders',    value: summary.active_orders.toLocaleString(),              color: 'text-primary',    path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Avg Order Value',  value: formatCurrency(summary.avg_order_value.toString()),  color: 'text-amber-400',  path: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
          { label: 'Total Deposits',   value: formatCurrency(summary.total_deposits.toString()),   color: 'text-emerald-400',path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
        ].map(c => (
          <div key={c.label} className="bg-surface-dark border border-border-dark rounded-xl p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <svg className={`w-5 h-5 ${c.color}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={c.path} />
              </svg>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase tracking-wide font-semibold">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color} leading-tight mt-0.5`}>{c.value}</p>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}

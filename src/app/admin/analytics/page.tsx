'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import dynamic from 'next/dynamic';

// Dynamically import recharts components (SSR-safe)
const AreaChart = dynamic(() => import('recharts').then(mod => mod.AreaChart), { ssr: false });
const Area = dynamic(() => import('recharts').then(mod => mod.Area), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });

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
  };
  revenue_chart: { date: string; revenue: number; profit: number; orders: number }[];
  user_growth_chart: { date: string; users: number }[];
  popular_services: { name: string; platform: string; orders: number; revenue: number; profit: number }[];
  order_status: Record<string, number>;
}


const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308',
  processing: '#3b82f6',
  completed: '#10b981',
  partial: '#f97316',
  cancelled: '#ef4444',
  refunded: '#8b5cf6',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

export default function AnalyticsPage() {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    if (!token) return;
    const result = await adminApi.getAnalytics(token);
    if (result.data) {
      setData(result.data as AnalyticsData);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">Failed to load analytics data</p>
      </div>
    );
  }

  const { summary } = data;

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(summary.total_revenue.toString()),
      trend: summary.revenue_trend,
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Total Profit',
      value: formatCurrency(summary.total_profit.toString()),
      icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Total Users',
      value: summary.total_users.toLocaleString(),
      sub: `+${summary.new_users_7d} this week`,
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Total Orders',
      value: summary.total_orders.toLocaleString(),
      sub: `${summary.completion_rate}% completion`,
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
  ];

  // Prepare order status data for pie chart
  const orderStatusData = Object.entries(data.order_status).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Analytics</h1>
        <p className="text-text-secondary">Platform performance overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card) => (
          <div key={card.label} className="bg-surface-dark rounded-xl border border-border-dark p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <svg className={`w-5 h-5 ${card.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={card.icon} />
                </svg>
              </div>
              {card.trend !== undefined && card.trend !== 0 && (
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  card.trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-400'
                }`}>
                  {card.trend > 0 ? '+' : ''}{card.trend}%
                </span>
              )}
            </div>
            <p className={`text-2xl font-bold ${
              card.label === 'Total Revenue' ? 'analytics-revenue-text' : card.label === 'Total Profit' ? 'text-emerald-500' : card.label === 'Avg Order Value' ? 'analytics-avg-text' : 'text-white'
            }`}>{card.value}</p>
            <p className="text-text-secondary text-sm mt-1">
              {card.sub || card.label}
            </p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-1">Revenue (Last 30 Days)</h2>
        <p className="text-text-secondary text-sm mb-4">Daily revenue and profit breakdown</p>
        <div className="h-[300px]">
          {data.revenue_chart.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_chart}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v) => new Date(String(v)).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => {
                  const num = Number(v ?? 0)
                  return `₦${(num / 1000).toFixed(0)}k`
                }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  formatter={(value, name) => [`₦${Number(value).toLocaleString()}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                />
                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revenueGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#10b981" fill="url(#profitGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-text-secondary">No revenue data for the last 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* User Growth + Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* User Growth */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <h2 className="text-lg font-semibold text-white mb-1">User Growth</h2>
          <p className="text-text-secondary text-sm mb-4">New registrations (30 days)</p>
          <div className="h-[220px]">
            {data.user_growth_chart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.user_growth_chart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    stroke="#64748b"
                    fontSize={11}
                    tickFormatter={(v) => new Date(String(v)).toLocaleDateString('en', { day: 'numeric' })}
                  />
                  <YAxis stroke="#64748b" fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                    labelFormatter={(v) => new Date(String(v)).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  />
                  <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-text-secondary">No user growth data</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Order Status</h2>
          <p className="text-text-secondary text-sm mb-4">Distribution by status</p>
          <div className="h-[220px]">
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => {
                      const pct = Number(percent ?? 0) * 100
                      return `${name ?? ''} ${pct.toFixed(0)}%`
                    }}
                    labelLine={false}
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell
                        key={entry.name}
                        fill={STATUS_COLORS[entry.name.toLowerCase()] || PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-text-secondary">No order data</p>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4">
            {orderStatusData.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[item.name.toLowerCase()] || PIE_COLORS[i % PIE_COLORS.length] }}
                />
                <span className="text-text-secondary text-xs">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Services */}
      <div className="bg-surface-dark rounded-xl border border-border-dark mb-6">
        <div className="p-5 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-white">Top Services (30 Days)</h2>
        </div>
        {data.popular_services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-text-secondary text-xs uppercase tracking-wider">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Platform</th>
                  <th className="px-5 py-3 text-right">Orders</th>
                  <th className="px-5 py-3 text-right">Revenue</th>
                  <th className="px-5 py-3 text-right">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {data.popular_services.map((service, index) => (
                  <tr key={index} className="hover:bg-primary/5 transition-colors">
                    <td className="px-5 py-3 text-text-secondary">{index + 1}</td>
                    <td className="px-5 py-3 text-white text-sm max-w-[250px] truncate">{service.name}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                        {service.platform}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white font-medium">{service.orders}</td>
                    <td className="px-5 py-3 text-right text-white">{formatCurrency(service.revenue.toString())}</td>
                    <td className="px-5 py-3 text-right text-emerald-500">{formatCurrency(service.profit.toString())}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No service data for the last 30 days</p>
          </div>
        )}
      </div>

      {/* Extra Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-surface-dark rounded-xl border border-border-dark p-5 text-center">
          <p className="text-text-secondary text-sm">Active Orders</p>
          <p className="text-2xl font-bold text-primary mt-1">{summary.active_orders}</p>
        </div>
        <div className="bg-surface-dark rounded-xl border border-border-dark p-5 text-center">
          <p className="text-text-secondary text-sm">Avg Order Value</p>
          <p className="text-2xl font-bold text-white mt-1">{formatCurrency(summary.avg_order_value.toString())}</p>
        </div>
        <div className="bg-surface-dark rounded-xl border border-border-dark p-5 text-center">
          <p className="text-text-secondary text-sm">Total Deposits</p>
          <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(summary.total_deposits.toString())}</p>
        </div>
      </div>
    </div>
  );
}

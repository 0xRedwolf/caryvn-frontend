'use client';

import React, { useState, useEffect } from 'react';
import { OTPOrder, OTPProviderSetting, adminOtpApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

// Custom Caryvn Status Dropdown
const OTP_STATUS_LIST = [
  { value: '', label: 'All Statuses' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'CANCELED', label: 'Canceled' },
];

function StatusDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selectedLabel = OTP_STATUS_LIST.find((s) => s.value === value)?.label || 'All Statuses';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:border-primary/40 transition-all shadow-xs min-w-32.5 justify-between cursor-pointer"
      >
        <span>{selectedLabel}</span>
        <svg
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-44 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden py-1">
          {OTP_STATUS_LIST.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => {
                onChange(s.value);
                setOpen(false);
              }}
              className={`w-full px-4 py-2 text-left text-xs font-semibold transition-colors cursor-pointer ${
                value === s.value
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function AdminOTPPage() {
  const [settings, setSettings] = useState<OTPProviderSetting | null>(null);
  const [balanceData, setBalanceData] = useState<{ username: string; balance: number; currency: string } | null>(null);
  const [orders, setOrders] = useState<OTPOrder[]>([]);
  const [analytics, setAnalytics] = useState<{
    total_orders: number;
    received_count: number;
    refunded_count: number;
    success_rate: number;
    total_profit: number;
  }>({
    total_orders: 0,
    received_count: 0,
    refunded_count: 0,
    success_rate: 0,
    total_profit: 0,
  });

  // Settings form state
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [markupPct, setMarkupPct] = useState('30.00');
  const [minMargin, setMinMargin] = useState('150.00');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('15000.00');

  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [refreshingBalance, setRefreshingBalance] = useState(false);

  // Load Settings and Upstream Balance
  const loadSettingsAndBalance = async () => {
    const token = localStorage.getItem('caryvn_token') || '';
    try {
      const sRes = await adminOtpApi.getSettings(token);
      if (sRes.data) {
        setSettings(sRes.data);
        setApiKey(sRes.data.api_key || '');
        setBaseUrl(sRes.data.base_url || 'https://zapotp.com/account/api/v1');
        setIsActive(sRes.data.is_active);
        setMarkupPct(String(sRes.data.markup_percentage));
        setMinMargin(String(sRes.data.min_margin));
        setLowBalanceThreshold(String(sRes.data.low_balance_threshold));
      }

      setRefreshingBalance(true);
      const bRes = await adminOtpApi.getBalance(token);
      if (bRes.data?.data) {
        setBalanceData(bRes.data.data);
      }
    } catch (err) {
      console.error('Error loading admin OTP data:', err);
    } finally {
      setRefreshingBalance(false);
    }
  };

  // Load Orders
  const loadOrders = async () => {
    setLoadingOrders(true);
    const token = localStorage.getItem('caryvn_token') || '';
    try {
      const res = await adminOtpApi.getOrders(
        {
          search: searchQuery || undefined,
          status: statusFilter || undefined,
        },
        token
      );
      if (res.data) {
        setOrders(res.data.results || []);
        if (res.data.analytics) {
          setAnalytics(res.data.analytics);
        }
      }
    } catch (err) {
      console.error('Error loading admin OTP orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadSettingsAndBalance();
    loadOrders();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSaveSuccess(false);
    setSaveError(null);

    const token = localStorage.getItem('caryvn_token') || '';
    try {
      const res = await adminOtpApi.updateSettings(
        {
          api_key: apiKey,
          base_url: baseUrl,
          is_active: isActive,
          markup_percentage: markupPct,
          min_margin: minMargin,
          low_balance_threshold: lowBalanceThreshold,
        },
        token
      );

      if (res.error) {
        setSaveError(res.error);
      } else if (res.data) {
        setSettings(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setSaveError(err.message || 'Failed to save settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Virtual Numbers & ZapOTP Management
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure upstream ZapOTP API connectivity, hybrid profit markups, and monitor global verification orders.
          </p>
        </div>

        <button
          onClick={loadSettingsAndBalance}
          disabled={refreshingBalance}
          className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-xs shrink-0 inline-flex items-center gap-2"
        >
          <svg
            className={`w-4 h-4 ${refreshingBalance ? 'animate-spin text-primary' : 'text-slate-500'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Sync Upstream Float</span>
        </button>
      </div>

      {/* Upstream Balance & Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Float Balance Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            ZapOTP Upstream Float
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600">
              {balanceData ? formatCurrency(balanceData.balance) : '₦0.00'}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-emerald-100 text-emerald-800">
              Live NGN
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Threshold alert at {formatCurrency(Number(lowBalanceThreshold || 15000))}
          </p>
        </div>

        {/* Total Orders */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Total Numbers Rented
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {analytics.total_orders.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-slate-500">Orders</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {analytics.received_count} delivered, {analytics.refunded_count} refunded
          </p>
        </div>

        {/* Success Rate */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Delivery Success Rate
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600">
              {analytics.success_rate}%
            </span>
            <span className="text-xs font-bold text-slate-500">Rate</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Completed without expiration
          </p>
        </div>

        {/* Total Profit */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Net Caryvn Profit
          </span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {formatCurrency(analytics.total_profit)}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-primary">
              Realized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Total user charge minus ZapOTP costs
          </p>
        </div>
      </div>

      {/* Settings Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>ZapOTP Provider & Pricing Engine</span>
        </h2>

        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* API Key */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                ZapOTP Bearer API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your zapotp API Bearer token..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Obtained from zapotp.com/account/api_docs
              </p>
            </div>

            {/* Base URL */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                ZapOTP Base API URL
              </label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://zapotp.com/account/api/v1"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              />
            </div>

            {/* Markup Percentage */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Markup Percentage (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={markupPct}
                  onChange={(e) => setMarkupPct(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-8 font-bold"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">%</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                E.g. 30.00 adds +30% profit margin to base wholesale cost.
              </p>
            </div>

            {/* Min Profit Margin Floor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Minimum Profit Margin Floor (₦)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={minMargin}
                  onChange={(e) => setMinMargin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-8 font-bold"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">₦</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Guarantees at least ₦150 profit per number even on low-cost services.
              </p>
            </div>

            {/* Low Balance Alert Threshold */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Low Balance Alert Threshold (₦)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={lowBalanceThreshold}
                  onChange={(e) => setLowBalanceThreshold(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all pr-8 font-bold"
                />
                <span className="absolute right-3.5 top-2.5 text-slate-400 font-bold text-sm">₦</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Fires an Admin Notification when ZapOTP float falls below this amount.
              </p>
            </div>

            {/* Master Toggle */}
            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="is_active_toggle"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-5 h-5 rounded text-primary focus:ring-primary cursor-pointer"
              />
              <label htmlFor="is_active_toggle" className="text-sm font-bold text-slate-800 cursor-pointer">
                Enable Virtual Numbers service for users
              </label>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingSettings}
              className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-xs"
            >
              {savingSettings ? 'Saving Settings...' : 'Save Configuration'}
            </button>

            {saveSuccess && (
              <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
                Saved successfully!
              </span>
            )}

            {saveError && (
              <span className="text-rose-600 text-xs font-bold">
                {saveError}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Global Orders Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Global Virtual Number Orders
            </h2>
            <p className="text-xs text-slate-500">
              Complete audit history of customer rentals, verification codes, costs, and profit.
            </p>
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search user, number, order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-56"
            />
            <StatusDropdown
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setTimeout(loadOrders, 50);
              }}
            />
            <button
              onClick={loadOrders}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
            >
              Filter
            </button>
          </div>
        </div>

        {loadingOrders ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No virtual number orders found matching your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Service & Country</th>
                  <th className="px-6 py-3.5">Phone Number</th>
                  <th className="px-6 py-3.5">Code</th>
                  <th className="px-6 py-3.5">Cost</th>
                  <th className="px-6 py-3.5">User Charge</th>
                  <th className="px-6 py-3.5">Profit</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5">
                      <p className="font-bold text-slate-900">{o.user_username || 'User'}</p>
                      <p className="text-[11px] text-slate-400">{o.user_email}</p>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <CountryFlag code={o.country} className="w-5 h-3.5" />
                        <span className="font-bold text-slate-800">{o.service_name}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">({o.country})</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-700">
                      {o.phone_number}
                    </td>
                    <td className="px-6 py-3.5 font-mono">
                      {o.sms_code ? (
                        <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded">
                          {o.sms_code}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {formatCurrency(o.provider_cost || 0)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {formatCurrency(o.user_charge)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-emerald-600">
                      +{formatCurrency(o.profit || 0)}
                    </td>
                    <td className="px-6 py-3.5">
                      {o.status === 'RECEIVED' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Received
                        </span>
                      ) : o.status === 'PENDING' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                          {o.formatted_status || o.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 whitespace-nowrap">
                      {formatDate(o.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

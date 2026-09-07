'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi, adminOtpApi, OTPOrder } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Order {
  id: string;
  user_email: string;
  service_name: string;
  link: string;
  quantity: number;
  charge: string;
  profit: string;
  status: string;
  source?: string;
  start_count?: number | null;
  remains?: number | null;
  service_has_refill?: boolean;
  provider_order_id?: string;
  created_at: string;
}

const STATUS_LIST = ['All', 'pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled', 'failed'];
const OTP_STATUS_LIST = ['All', 'RECEIVED', 'PENDING', 'EXPIRED', 'CANCELED'];

function getOtpStatusBadge(status: string): string {
  switch (status?.toUpperCase()) {
    case 'RECEIVED':
    case 'COMPLETED':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'PENDING':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'EXPIRED':
      return 'bg-slate-100 text-slate-600 border-slate-200';
    case 'CANCELED':
    case 'CANCELLED':
    case 'REFUNDED':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

// Clean SVG Country Flag with automatic code badge fallback
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
      <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 shrink-0 uppercase">
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

// Custom dropdown component
function StatusDropdown({
  value,
  onChange,
  options = STATUS_LIST,
}: {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary/40 transition-all shadow-xs min-w-35 justify-between cursor-pointer"
      >
        <span className="capitalize">{value === 'All' || !value ? 'All Statuses' : value.replace('_', ' ')}</span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden py-1">
          {options.map((s) => (
            <button
              key={s}
              onClick={() => { onChange(s === 'All' ? '' : s); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-xs font-semibold capitalize transition-colors cursor-pointer ${
                (value === s || (!value && s === 'All'))
                  ? 'bg-primary/5 text-primary'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {s === 'All' ? 'All Statuses' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'web' | 'api'>('all');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 50;
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState<string | null>(null);
  const [refillLoading, setRefillLoading] = useState<string | null>(null);
  const [refreshLoading, setRefreshLoading] = useState<string | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Multi-service vertical tab
  const [verticalTab, setVerticalTab] = useState<'smm' | 'otp'>('smm');

  // OTP Orders State
  const [otpOrders, setOtpOrders] = useState<OTPOrder[]>([]);
  const [otpTotal, setOtpTotal] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpSearch, setOtpSearch] = useState('');
  const [otpStatusFilter, setOtpStatusFilter] = useState('');
  const [otpPage, setOtpPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (token) loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter, sourceFilter, search, offset]);

  useEffect(() => {
    if (token) loadOtpOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, otpPage, otpStatusFilter, otpSearch]);

  useEffect(() => { setOffset(0); }, [statusFilter, sourceFilter, search]);
  useEffect(() => { setOtpPage(1); }, [otpStatusFilter, otpSearch]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  async function loadOtpOrders() {
    if (!token) return;
    setOtpLoading(true);
    const result = await adminOtpApi.getOrders(
      {
        page: otpPage,
        status: otpStatusFilter || undefined,
        search: otpSearch || undefined,
      },
      token
    );
    if (result.data) {
      setOtpOrders(result.data.results || []);
      setOtpTotal(result.data.count || 0);
    }
    setOtpLoading(false);
  }

  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  async function loadOrders() {
    if (!token) return;
    setLoading(true);
    const result = await adminApi.getOrders(token, {
      status: statusFilter === 'All' ? undefined : statusFilter,
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      search: search || undefined,
      limit: PAGE_SIZE,
      offset,
    });
    if (result.data) {
      const data = result.data as { orders: Order[]; total: number };
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
    setSelectedOrders(new Set());
  }

  const handleDeleteOrder = async (orderId: string) => {
    if (!token) return;
    setDeleteLoading(true);
    const result = await adminApi.deleteOrder(orderId, token);
    setDeleteLoading(false);
    setDeleteConfirm(null);
    if (result.data) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      setTotal(prev => prev - 1);
      setActionResult({ type: 'success', message: 'Order deleted' });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to delete' });
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    if (!token) return;
    setCompleteLoading(orderId);
    const result = await adminApi.markOrderCompleted(orderId, token);
    setCompleteLoading(null);
    if (result.data) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
      setActionResult({ type: 'success', message: 'Order marked as completed' });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to mark order' });
    }
  };

  const handleRefill = async (orderId: string) => {
    if (!token) return;
    setRefillLoading(orderId);
    const result = await adminApi.refillOrder(orderId, token);
    setRefillLoading(null);
    if (result.data) {
      const data = result.data as { message?: string };
      setActionResult({ type: 'success', message: data.message || 'Refill requested' });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to refill' });
    }
  };

  const handleForceRefresh = async (orderId: string) => {
    if (!token) return;
    setRefreshLoading(orderId);
    const result = await adminApi.checkOrderStatus([orderId], token);
    setRefreshLoading(null);
    if (result.data) {
      const data = result.data as { updated: number; skipped: number; errors: string[] };
      if (data.updated > 0) {
        setActionResult({ type: 'success', message: 'Status updated from provider' });
        loadOrders();
      } else if (data.errors?.length > 0) {
        setActionResult({ type: 'error', message: data.errors[0] });
      } else {
        setActionResult({ type: 'success', message: 'Status already up-to-date' });
      }
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to refresh' });
    }
  };

  const toggleSelectAll = () => {
    setSelectedOrders(selectedOrders.size === orders.length ? new Set() : new Set(orders.map(o => o.id)));
  };

  const toggleSelectOrder = (id: string) => {
    const s = new Set(selectedOrders);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedOrders(s);
  };

  const handleBulkRefresh = async () => {
    if (!token || selectedOrders.size === 0) return;
    setBulkActionLoading(true);
    const result = await adminApi.checkOrderStatus(Array.from(selectedOrders), token);
    setBulkActionLoading(false);
    if (result.data) {
      const data = result.data as { updated: number; skipped: number; errors: string[] };
      setActionResult({ type: 'success', message: `Updated ${data.updated} orders. Skipped ${data.skipped}.` + (data.errors?.length ? ` (${data.errors.length} errors)` : '') });
      setSelectedOrders(new Set());
      loadOrders();
    } else {
      setActionResult({ type: 'error', message: result.error || 'Bulk refresh failed' });
    }
  };

  const handleBulkMarkCompleted = async () => {
    if (!token || selectedOrders.size === 0) return;
    if (!confirm(`Mark ${selectedOrders.size} orders as completed?`)) return;
    setBulkActionLoading(true);
    let ok = 0, fail = 0;
    for (const id of Array.from(selectedOrders)) {
      const res = await adminApi.markOrderCompleted(id, token);
      res.data ? ok++ : fail++;
    }
    setBulkActionLoading(false);
    if (ok > 0) {
      setActionResult({ type: 'success', message: `Marked ${ok} completed.${fail > 0 ? ` Failed: ${fail}` : ''}` });
      setSelectedOrders(new Set());
      loadOrders();
    } else {
      setActionResult({ type: 'error', message: `Failed to mark orders (${fail} failed)` });
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;
  const otpTotalPages = Math.ceil(otpTotal / 20);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {verticalTab === 'smm'
              ? `${total.toLocaleString()} total SMM orders`
              : `${otpTotal.toLocaleString()} total virtual number rentals`}
          </p>
        </div>
        <button
          onClick={verticalTab === 'smm' ? loadOrders : loadOtpOrders}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Service Vertical Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setVerticalTab('smm')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            verticalTab === 'smm'
              ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          SMM Boosts
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            verticalTab === 'smm' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {total}
          </span>
        </button>

        <button
          onClick={() => setVerticalTab('otp')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
            verticalTab === 'otp'
              ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/20'
              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Virtual Numbers
          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
            verticalTab === 'otp' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
          }`}>
            {otpTotal}
          </span>
        </button>
      </div>

      {verticalTab === 'smm' ? (
        <>
          {/* Source Tabs (All / Web / API) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-fit">
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Channels
            </button>
            <button
              onClick={() => setSourceFilter('web')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'web'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${sourceFilter === 'web' ? 'text-blue-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Web Orders
            </button>
            <button
              onClick={() => setSourceFilter('api')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sourceFilter === 'api'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <svg className={`w-3.5 h-3.5 ${sourceFilter === 'api' ? 'text-cyan-600' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              API Orders
            </button>
          </div>

          {/* Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by user, service, or order ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs transition"
              />
            </div>
            <StatusDropdown value={statusFilter} onChange={setStatusFilter} />
          </div>

          {/* Toast */}
          {actionResult && (
            <div className={`p-4 rounded-xl text-sm font-medium border ${
              actionResult.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {actionResult.message}
            </div>
          )}

          {/* Bulk Action Bar */}
          {selectedOrders.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-primary font-bold text-sm">{selectedOrders.size} orders selected</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleBulkRefresh}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {bulkActionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Sync Status
                </button>
                <button
                  onClick={handleBulkMarkCompleted}
                  disabled={bulkActionLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {bulkActionLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  Mark Completed
                </button>
                <button
                  onClick={() => setSelectedOrders(new Set())}
                  disabled={bulkActionLoading}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Select All row (visible only on desktop, for mobile cards we handle per-card) */}
          {!loading && orders.length > 0 && (
            <div className="hidden sm:flex items-center gap-3 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                  checked={orders.length > 0 && selectedOrders.size === orders.length}
                  onChange={toggleSelectAll}
                />
                <span className="text-xs text-slate-500 font-medium">Select all on page</span>
              </label>
            </div>
          )}

          {/* Orders — Mobile cards / Desktop table */}
          {loading ? (
            <div className="bento-card p-12 bg-white border border-slate-200 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : orders.length === 0 ? (
            <div className="bento-card p-12 bg-white border border-slate-200 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-slate-500 text-sm">No orders found for these filters</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="sm:hidden space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`bento-card p-4 bg-white border transition-all ${selectedOrders.has(order.id) ? 'border-primary/30 bg-primary/5' : 'border-slate-200'}`}
                  >
                    {/* Card Top Row */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 shrink-0"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => toggleSelectOrder(order.id)}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-black text-slate-900 font-mono text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
                            {order.source === 'api' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
                                API
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{order.user_email}</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Service name */}
                    <p className="text-xs text-slate-700 font-medium mb-3 leading-snug line-clamp-2">{order.service_name}</p>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                        <p className="text-[10px] text-slate-500 mb-0.5">Qty</p>
                        <p className="text-xs font-black text-slate-900">{order.quantity.toLocaleString()}</p>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                        <p className="text-[10px] text-slate-500 mb-0.5">Charge</p>
                        <p className="text-xs font-black text-primary">{formatCurrency(order.charge)}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-2.5 text-center border border-emerald-100">
                        <p className="text-[10px] text-slate-500 mb-0.5">Profit</p>
                        <p className="text-xs font-black text-emerald-700">{formatCurrency(order.profit)}</p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">{formatDate(order.created_at)}</span>
                      <div className="flex items-center gap-1.5">
                        {['pending', 'processing', 'in_progress'].includes(order.status) && (
                          <>
                            <button
                              onClick={() => handleForceRefresh(order.id)}
                              disabled={refreshLoading === order.id}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-200 disabled:opacity-50"
                              title="Force Refresh"
                            >
                              {refreshLoading === order.id
                                ? <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin block" />
                                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                              }
                            </button>
                            <button
                              onClick={() => handleMarkCompleted(order.id)}
                              disabled={completeLoading === order.id}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors border border-emerald-200 disabled:opacity-50"
                              title="Mark Completed"
                            >
                              {completeLoading === order.id
                                ? <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin block" />
                                : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                              }
                            </button>
                          </>
                        )}
                        {order.service_has_refill && order.status === 'completed' && (
                          <button
                            onClick={() => handleRefill(order.id)}
                            disabled={refillLoading === order.id}
                            className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20 disabled:opacity-50"
                            title="Refill"
                          >
                            {refillLoading === order.id
                              ? <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                            }
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors border border-red-200"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="py-3 px-4 w-12">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                          checked={orders.length > 0 && selectedOrders.size === orders.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">ID</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Service</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Qty</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Charge</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Profit</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Provider</th>
                      <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="py-3 px-4 w-10" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id} className={`hover:bg-slate-50 group transition-colors ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}>
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4"
                            checked={selectedOrders.has(order.id)}
                            onChange={() => toggleSelectOrder(order.id)}
                          />
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-700" title={order.id}>
                              {order.id.slice(0, 8).toUpperCase()}
                            </span>
                            {order.source === 'api' && (
                              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
                                API
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-600 truncate max-w-32 block">{order.user_email}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-800 font-medium truncate max-w-48 block">{order.service_name}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-800 font-semibold">{order.quantity.toLocaleString()}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-primary font-semibold">{formatCurrency(order.charge)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-emerald-700 font-bold">{formatCurrency(order.profit)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold w-fit ${getStatusColor(order.status)}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                            {(order.start_count !== null && order.start_count !== undefined || order.remains !== null && order.remains !== undefined) && (
                              <div className="flex gap-2 text-[10px] text-slate-400">
                                {order.start_count !== null && order.start_count !== undefined && <span>S: <span className="text-slate-700 font-medium">{order.start_count}</span></span>}
                                {order.remains !== null && order.remains !== undefined && <span>R: <span className="text-slate-700 font-medium">{order.remains}</span></span>}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          {order.provider_order_id ? (
                            <span className="text-emerald-600 text-xs font-medium inline-flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              {order.provider_order_id}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-xs text-slate-500">{formatDate(order.created_at)}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1">
                            {['pending', 'processing', 'in_progress'].includes(order.status) && (
                              <>
                                <button onClick={() => handleForceRefresh(order.id)} disabled={refreshLoading === order.id} className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50" title="Force Refresh">
                                  {refreshLoading === order.id
                                    ? <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin block" />
                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                  }
                                </button>
                                <button onClick={() => handleMarkCompleted(order.id)} disabled={completeLoading === order.id} className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors disabled:opacity-50" title="Mark Completed">
                                  {completeLoading === order.id
                                    ? <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin block" />
                                    : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  }
                                </button>
                              </>
                            )}
                            {order.service_has_refill && order.status === 'completed' && (
                              <button onClick={() => handleRefill(order.id)} disabled={refillLoading === order.id} className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50" title="Refill">
                                {refillLoading === order.id
                                  ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
                                  : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                }
                              </button>
                            )}
                            <button onClick={() => setDeleteConfirm(order.id)} className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-all" title="Delete">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* SMM Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-slate-500 text-sm">
                Page {currentPage} of {totalPages} · {total.toLocaleString()} orders
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  disabled={offset === 0}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  disabled={offset + PAGE_SIZE >= total}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* OTP Filters Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search by customer email, service, phone number, or ID..."
                value={otpSearch}
                onChange={(e) => setOtpSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs transition"
              />
            </div>
            <StatusDropdown
              value={otpStatusFilter}
              onChange={setOtpStatusFilter}
              options={OTP_STATUS_LIST}
            />
          </div>

          {/* OTP Order List */}
          {otpLoading ? (
            <div className="bento-card bg-white border border-slate-200 p-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : otpOrders.length === 0 ? (
            <div className="bento-card bg-white border border-slate-200 p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-900 font-bold text-base mb-1">No Virtual Number Rentals Found</p>
              <p className="text-slate-500 text-sm">No orders match your filter criteria.</p>
            </div>
          ) : (
            <>
              {/* Mobile: Cards */}
              <div className="sm:hidden space-y-3">
                {otpOrders.map((order) => {
                  const profitNum = typeof order.profit === 'number' ? order.profit : parseFloat(String(order.profit || '0'));
                  return (
                    <div key={order.id} className="bento-card bg-white border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono text-xs font-bold text-slate-900 truncate">#{order.id.slice(0, 8)}</span>
                          <button
                            onClick={() => copyToClipboard(order.id, order.id)}
                            className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                            title="Copy Full ID"
                          >
                            {copiedId === order.id ? (
                              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            )}
                          </button>
                        </div>
                        <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getOtpStatusBadge(order.status)}`}>
                          {order.formatted_status || order.status}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{order.user_email || '—'}</p>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <CountryFlag code={order.country} />
                          <span className="font-semibold">{order.service_name}</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Phone</p>
                          <p className="font-mono text-xs font-bold text-slate-800">{order.phone_number}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right">SMS Code</p>
                          {order.sms_code ? (
                            <span className="font-mono text-xs font-black text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {order.sms_code}
                            </span>
                          ) : order.status === 'PENDING' ? (
                            <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Waiting
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-400">{formatDate(order.created_at)}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">₦{parseFloat(String(order.user_charge || 0)).toLocaleString()}</span>
                          {profitNum > 0 && (
                            <span className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              +₦{profitNum.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block bento-card bg-white border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Order ID</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Customer</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Service / Country</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Phone Number</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">SMS / OTP</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Financials</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {otpOrders.map((order) => {
                      const profitNum = typeof order.profit === 'number' ? order.profit : parseFloat(String(order.profit || '0'));
                      const chargeNum = typeof order.user_charge === 'number' ? order.user_charge : parseFloat(String(order.user_charge || '0'));
                      const costNum = typeof order.provider_cost === 'number' ? order.provider_cost : parseFloat(String(order.provider_cost || '0'));
                      return (
                        <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900">#{order.id.slice(0, 8)}</span>
                              <button
                                onClick={() => copyToClipboard(order.id, order.id)}
                                className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                                title="Copy Order ID"
                              >
                                {copiedId === order.id ? (
                                  <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="text-slate-900 font-semibold text-xs truncate max-w-37.5" title={order.user_email}>{order.user_email || '—'}</p>
                            <p className="text-slate-400 text-[11px]">@{order.user_username || 'user'}</p>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-2">
                              <CountryFlag code={order.country} />
                              <span className="font-medium text-xs text-slate-900">{order.service_name}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 capitalize">{order.rental_type} rental</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-semibold text-slate-800">{order.phone_number}</span>
                              <button
                                onClick={() => copyToClipboard(order.phone_number, `p-${order.id}`)}
                                className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                                title="Copy Phone"
                              >
                                {copiedId === `p-${order.id}` ? (
                                  <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            {order.sms_code ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-black text-emerald-600 tracking-wider bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  {order.sms_code}
                                </span>
                                <button
                                  onClick={() => copyToClipboard(order.sms_code!, `c-${order.id}`)}
                                  className="text-slate-400 hover:text-primary transition-colors p-1 cursor-pointer"
                                  title="Copy SMS Code"
                                >
                                  {copiedId === `c-${order.id}` ? (
                                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                  ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                  )}
                                </button>
                              </div>
                            ) : order.status === 'PENDING' ? (
                              <span className="text-xs font-semibold text-amber-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                Waiting for SMS
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="font-mono text-xs font-bold text-slate-800">
                              ₦{chargeNum.toLocaleString()}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-[10px]">
                              {costNum > 0 && <span className="text-slate-400">Cost: ₦{costNum.toLocaleString()}</span>}
                              {profitNum > 0 && (
                                <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded">
                                  +₦{profitNum.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getOtpStatusBadge(order.status)}`}>
                              {order.formatted_status || order.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(order.created_at)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* OTP Pagination */}
              {otpTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-sm">
                    Page {otpPage} of {otpTotalPages} · {otpTotal.toLocaleString()} rentals
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOtpPage((p) => Math.max(1, p - 1))}
                      disabled={otpPage === 1}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setOtpPage((p) => p + 1)}
                      disabled={otpPage >= otpTotalPages}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl p-6 w-full max-w-sm">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 text-center mb-2">Delete Order</h3>
            <p className="text-slate-500 text-sm text-center mb-6">
              This action is permanent and cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

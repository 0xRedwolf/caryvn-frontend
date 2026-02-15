'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
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
  provider_order_id?: string;
  created_at: string;
}

const statusFilters = ['All', 'pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled', 'failed'];

export default function AdminOrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, statusFilter, search]);

  // Auto-dismiss action results
  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);

    const result = await adminApi.getOrders(token, {
      status: statusFilter === 'All' ? undefined : statusFilter,
      search: search || undefined,
      limit: 100,
    });

    if (result.data) {
      const data = result.data as { orders: Order[]; total: number };
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  const toggleSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  const handleCancelRefund = async () => {
    if (!token || selectedOrders.size === 0) return;
    setActionLoading('cancel');
    const result = await adminApi.cancelRefundOrders(Array.from(selectedOrders), token);
    setActionLoading('');
    if (result.data) {
      const data = result.data as { refunded: number; skipped: number; errors: string[] };
      setActionResult({
        type: data.errors.length > 0 ? 'error' : 'success',
        message: `Refunded ${data.refunded}, skipped ${data.skipped}${data.errors.length > 0 ? `. Errors: ${data.errors.join(', ')}` : ''}`,
      });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed' });
    }
    setSelectedOrders(new Set());
    loadOrders();
  };

  const handleRetry = async () => {
    if (!token || selectedOrders.size === 0) return;
    setActionLoading('retry');
    const result = await adminApi.retryOrders(Array.from(selectedOrders), token);
    setActionLoading('');
    if (result.data) {
      const data = result.data as { retried: number; failed: number; errors: string[] };
      setActionResult({
        type: data.errors.length > 0 ? 'error' : 'success',
        message: `Retried ${data.retried}, failed ${data.failed}${data.errors.length > 0 ? `. Errors: ${data.errors.join(', ')}` : ''}`,
      });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed' });
    }
    setSelectedOrders(new Set());
    loadOrders();
  };

  const handleCheckStatus = async () => {
    if (!token || selectedOrders.size === 0) return;
    setActionLoading('check');
    const result = await adminApi.checkOrderStatus(Array.from(selectedOrders), token);
    setActionLoading('');
    if (result.data) {
      const data = result.data as { updated: number; skipped: number; errors: string[] };
      setActionResult({
        type: data.errors.length > 0 ? 'error' : 'success',
        message: `Updated ${data.updated}, skipped ${data.skipped}${data.errors.length > 0 ? `. Errors: ${data.errors.join(', ')}` : ''}`,
      });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed' });
    }
    setSelectedOrders(new Set());
    loadOrders();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-text-secondary">{total} total orders</p>
        </div>
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input max-w-xs"
        />
      </div>

      {/* Action Result Banner */}
      {actionResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          actionResult.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {actionResult.message}
        </div>
      )}

      {/* Action Bar */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-3 bg-surface-darker rounded-xl border border-primary/30 flex flex-wrap items-center gap-3">
          <span className="text-white text-sm font-medium">{selectedOrders.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={handleCancelRefund}
              disabled={!!actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'cancel' ? '...' : '🔄 Cancel & Refund'}
            </button>
            <button
              onClick={handleRetry}
              disabled={!!actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'retry' ? '...' : '🔁 Retry with Provider'}
            </button>
            <button
              onClick={handleCheckStatus}
              disabled={!!actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'check' ? '...' : '📊 Check Status'}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === s
                ? 'bg-primary text-white'
                : 'bg-surface-dark text-text-secondary hover:text-white border border-border-dark'
            }`}
          >
            {s === 'All' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-surface-dark rounded-xl border border-border-dark">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedOrders.size === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border-dark"
                    />
                  </th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">ID</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">User</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Service</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Qty</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Charge</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Profit</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Status</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Provider</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className={`border-b border-border-dark hover:bg-surface-darker/50 ${selectedOrders.has(order.id) ? 'bg-primary/5' : ''}`}>
                    <td className="py-4 px-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="rounded border-border-dark"
                      />
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white font-mono text-sm">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary text-sm">{order.user_email}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white text-sm truncate max-w-[200px] block">{order.service_name}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{order.quantity.toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{formatCurrency(order.charge)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-emerald-500 font-medium">{formatCurrency(order.profit)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {order.provider_order_id ? (
                        <span className="text-emerald-500 text-xs">✓ {order.provider_order_id}</span>
                      ) : (
                        <span className="text-amber-500 text-xs">⚠ None</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary text-sm">{formatDate(order.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
}

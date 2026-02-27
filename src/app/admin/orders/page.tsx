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
  start_count?: number | null;
  remains?: number | null;
  service_has_refill?: boolean;
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
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState<string | null>(null);
  const [refillLoading, setRefillLoading] = useState<string | null>(null);

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
      setActionResult({ type: 'success', message: data.message || 'Refill requested successfully' });
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to request refill' });
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Orders</h1>
          <p className="text-text-secondary">{total} total orders</p>
        </div>
        <input
          type="text"
          placeholder="Search orders..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:max-w-xs"
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
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">ID</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">User</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Service</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Qty</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Charge</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Profit</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Status / Stats</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Provider</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Date</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium w-10"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border-dark hover:bg-surface-darker/50 group">
                    <td className="py-4 px-4">
                      <span className="text-white font-mono text-sm">{order.id.slice(0, 8)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary text-sm truncate max-w-[120px] md:max-w-xs block">{order.user_email}</span>
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
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 rounded text-xs font-medium w-fit ${getStatusColor(order.status)}`}>
                          {order.status.replace('_', ' ')}
                        </span>
                        {(order.start_count !== null || order.remains !== null) && (
                          <div className="flex gap-2 text-[10px] text-text-secondary mt-1">
                            {order.start_count !== null && <span>S: <span className="text-white">{order.start_count}</span></span>}
                            {order.remains !== null && <span>R: <span className="text-white">{order.remains}</span></span>}
                          </div>
                        )}
                      </div>
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
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        {/* Complete Button (if pending/processing) */}
                        {['pending', 'processing', 'in_progress'].includes(order.status) && (
                          <button
                            onClick={() => handleMarkCompleted(order.id)}
                            disabled={completeLoading === order.id}
                            className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
                            title="Force Mark Completed"
                          >
                            {completeLoading === order.id ? (
                              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        {/* Refill Button (if eligible) */}
                        {order.service_has_refill && order.status.toLowerCase() === 'completed' && (
                          <button
                            onClick={() => handleRefill(order.id)}
                            disabled={refillLoading === order.id}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors disabled:opacity-50"
                            title="Request Refill"
                          >
                            {refillLoading === order.id ? (
                              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                          </button>
                        )}
                        
                        {/* Desktop Delete: icon on hover */}
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="hidden lg:block opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                          title="Delete order"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        {/* Mobile Delete: always visible */}
                        <button
                          onClick={() => setDeleteConfirm(order.id)}
                          className="lg:hidden p-1.5 rounded-lg text-red-400 hover:bg-red-500/10"
                          title="Delete order"
                        >
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
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No orders found</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete Order</h3>
            <p className="text-text-secondary text-sm mb-6">
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-darker text-text-secondary border border-border-dark hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteOrder(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
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

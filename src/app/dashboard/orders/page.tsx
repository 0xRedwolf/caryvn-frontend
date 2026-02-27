'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';

interface Order {
  id: string;
  service_name: string;
  link: string;
  quantity: number;
  charge: string;
  status: string;
  start_count?: number | null;
  remains?: number | null;
  service_has_refill?: boolean;
  created_at: string;
}

const statusFilters = ['All', 'pending', 'processing', 'in_progress', 'completed', 'partial', 'canceled'];

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Refill state
  const [refillLoading, setRefillLoading] = useState<string | null>(null);
  const [refillMessage, setRefillMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token, statusFilter]);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);

    const result = await ordersApi.getOrders(token, {
      status: statusFilter === 'All' ? undefined : statusFilter,
      limit: 100,
    });

    if (result.data) {
      const data = result.data as { orders: Order[] };
      setOrders(data.orders || []);
    }

    setLoading(false);
  };

  const handleHideOrder = async (orderId: string) => {
    if (!token) return;
    setDeleteLoading(true);
    const result = await ordersApi.hideOrder(orderId, token);
    setDeleteLoading(false);
    setDeleteConfirm(null);
    if (result.data) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const handleRefill = async (orderId: string) => {
    if (!token) return;
    setRefillLoading(orderId);
    setRefillMessage(null);
    
    const result = await ordersApi.requestRefill(orderId, token);
    setRefillLoading(null);
    
    if (result.data) {
      const data = result.data as { message?: string };
      setRefillMessage({ type: 'success', text: data.message || 'Refill requested successfully!' });
    } else {
      setRefillMessage({ type: 'error', text: result.error || 'Failed to request refill.' });
    }
    
    // Auto-clear message after 5 seconds
    setTimeout(() => setRefillMessage(null), 5000);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">My Orders</h1>
        <p className="text-text-secondary">View and track all your orders</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {statusFilters.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === status
                ? 'bg-primary text-white'
                : 'bg-surface-dark text-text-secondary hover:text-white border border-border-dark'
            }`}
          >
            {status === 'All' ? 'All' : status.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Refill Feedback Message */}
      {refillMessage && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 border ${
          refillMessage.type === 'success' 
            ? 'bg-green-500/10 border-green-500/20 text-green-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          <div className="mt-0.5">
            {refillMessage.type === 'success' ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium">{refillMessage.text}</p>
          <button 
            onClick={() => setRefillMessage(null)}
            className="ml-auto opacity-70 hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length > 0 ? (
          <div className="divide-y divide-border-dark">
            {orders.map((order) => (
              <div key={order.id} className="p-4 relative">
                {/* Delete X button — top right */}
                <button
                  onClick={() => setDeleteConfirm(order.id)}
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', borderRadius: '4px', color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                  title="Remove from history"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div style={{ paddingRight: '24px' }} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-medium text-sm truncate">{order.service_name}</p>
                    <a
                      href={order.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-secondary text-xs truncate block hover:text-primary transition-colors"
                    >
                      {order.link}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="hidden md:block text-right">
                      <p className="text-white text-sm">{order.quantity.toLocaleString()}</p>
                      <p className="text-text-secondary text-xs">qty</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-medium text-sm">{formatCurrency(order.charge)}</p>
                      <p className="text-text-secondary text-xs">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Status & Actions Footer */}
                <div className="mt-4 pt-3 border-t border-border-dark flex items-center justify-between flex-wrap gap-3">
                  <div className="flex gap-4 items-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                    
                    {order.start_count !== null && order.start_count !== undefined && (
                      <span className="text-xs text-text-secondary">Start: <span className="text-white">{order.start_count}</span></span>
                    )}
                    {order.remains !== null && order.remains !== undefined && (
                      <span className="text-xs text-text-secondary">Remains: <span className="text-white">{order.remains}</span></span>
                    )}
                  </div>

                  {order.service_has_refill && order.status.toLowerCase() === 'completed' && (
                    <button
                      onClick={() => handleRefill(order.id)}
                      disabled={refillLoading === order.id}
                      className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {refillLoading === order.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      )}
                      Refill
                    </button>
                  )}
                </div>
              </div>
            ))}
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
            <h3 className="text-lg font-bold text-white mb-2">Remove Order</h3>
            <p className="text-text-secondary text-sm mb-6">
              This will remove the order from your history. It only hides it from your view, it won&apos;t affect anything else.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-darker text-text-secondary border border-border-dark hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleHideOrder(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

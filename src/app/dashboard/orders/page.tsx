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
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
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

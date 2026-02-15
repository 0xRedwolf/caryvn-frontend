'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/api';
import { OrderRow } from '@/components/Cards';
import { getStatusColor } from '@/lib/utils';

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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Service</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Link</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Quantity</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Charge</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Status</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <OrderRow key={order.id} order={order} />
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

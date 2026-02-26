'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi, ordersApi } from '@/lib/api';
import { StatsCard, StatsCardSkeleton, OrderRow } from '@/components/Cards';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: string;
  service_name: string;
  link: string;
  quantity: number;
  charge: string;
  status: string;
  created_at: string;
}

interface Stats {
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
}

export default function DashboardPage() {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerSetRef = useRef<HTMLDivElement>(null);
  const [tickerPaused, setTickerPaused] = useState(false);

  // JS-based ticker for pixel-perfect looping
  useEffect(() => {
    let offset = 0;
    let animId: number;
    const speed = window.innerWidth < 768 ? 0.3 : 0.5;

    const animate = () => {
      if (!tickerRef.current || !tickerSetRef.current) return;
      if (!tickerPaused) {
        const setWidth = tickerSetRef.current.offsetWidth;
        offset -= speed;
        if (Math.abs(offset) >= setWidth) {
          offset += setWidth;
        }
        tickerRef.current.style.transform = `translateX(${offset}px)`;
      }
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [tickerPaused]);

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token]);

  const loadDashboardData = async () => {
    if (!token) return;

    // Load orders
    const ordersResult = await ordersApi.getOrders(token, { limit: 5 });
    if (ordersResult.data) {
      const data = ordersResult.data as { orders: Order[]; total: number };
      setOrders(data.orders || []);
      
      // Calculate stats from orders
      const allOrdersResult = await ordersApi.getOrders(token, { limit: 1000 });
      if (allOrdersResult.data) {
        const allData = allOrdersResult.data as { orders: Order[]; total: number };
        const allOrders = allData.orders || [];
        setStats({
          totalOrders: allOrders.length,
          activeOrders: allOrders.filter(o => ['pending', 'processing', 'in_progress'].includes(o.status)).length,
          completedOrders: allOrders.filter(o => ['completed', 'partial'].includes(o.status)).length,
        });
      }
    }

    setLoading(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 min-w-0 overflow-hidden">
        <h1 className="text-2xl font-bold text-white mb-1 truncate break-words">
          Welcome back, <span className="gradient-text">{user?.username || user?.first_name || user?.email?.split('@')[0]}</span>!
        </h1>
        <p className="text-text-secondary truncate">
          Here's an overview of your account
        </p>
      </div>

      {/* Scrolling Announcement Ticker */}
      <div className="mb-8 overflow-hidden rounded-xl border border-border-dark bg-surface-dark">
        <div className="flex items-center">
          {/* Label */}
          <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-primary/10 border-r border-border-dark">
            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span className="text-primary text-xs font-semibold whitespace-nowrap">News</span>
          </div>
          {/* Scrolling area */}
          <div
            className="overflow-hidden relative flex-1 min-w-0"
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}
          >
            <div ref={tickerRef} className="flex items-center py-2.5 whitespace-nowrap" style={{ willChange: 'transform' }}>
              <div ref={tickerSetRef} className="flex items-center shrink-0">
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
              </div>
              {/* Duplicate set for seamless loop */}
              <div className="flex items-center shrink-0">
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
                <span className="inline-flex items-center gap-1.5 text-text-secondary text-sm mr-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  New services added, Buy Foreign Numbers on <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">zapotp.com</a> ⚡
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <StatsCardSkeleton key={i} />)
        ) : (
          <>
            <StatsCard
              title="Balance"
              value={formatCurrency(user?.balance || '0')}
              valueClassName="text-primary"
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatsCard
              title="Active Orders"
              value={stats?.activeOrders || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatsCard
              title="Completed"
              value={stats?.completedOrders || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/dashboard/new-order"
          className="bg-surface-dark rounded-xl border border-border-dark p-5 flex items-center gap-4 card-hover"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">New Order</h3>
            <p className="text-text-secondary text-sm">Browse services</p>
          </div>
        </Link>

        <Link
          href="/dashboard/wallet"
          className="bg-surface-dark rounded-xl border border-border-dark p-5 flex items-center gap-4 card-hover"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Add Funds</h3>
            <p className="text-text-secondary text-sm">Top up wallet</p>
          </div>
        </Link>

        <Link
          href="/dashboard/tickets"
          className="bg-surface-dark rounded-xl border border-border-dark p-5 flex items-center gap-4 card-hover"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-medium">Get Support</h3>
            <p className="text-text-secondary text-sm">Open a ticket</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        <div className="flex items-center justify-between p-5 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
          <Link href="/dashboard/orders" className="text-primary text-sm hover:underline">
            View All →
          </Link>
        </div>
        
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
          <div className="p-8 flex flex-col items-center justify-center">
            <p className="text-text-secondary mb-4">No orders yet</p>
            <Link href="/dashboard/new-order" className="btn-primary inline-flex items-center justify-center">
              Browse Services
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

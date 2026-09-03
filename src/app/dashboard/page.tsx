'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/api';
import DashboardPopup from '@/components/DashboardPopup';
import { formatCurrency, formatDate } from '@/lib/utils';
import CountUpBalance from '@/components/CountUpBalance';

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
  const { user, token, refreshUser } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const tickerRef = useRef<HTMLDivElement>(null);
  const tickerSetRef = useRef<HTMLDivElement>(null);
  const [tickerPaused, setTickerPaused] = useState(false);

  // Smooth announcement ticker
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadDashboardData() {
    if (!token) return;

    const ordersResult = await ordersApi.getOrders(token, { limit: 5 });
    if (ordersResult.data) {
      const data = ordersResult.data as { orders: Order[] };
      setOrders(data.orders || []);

      const allOrdersResult = await ordersApi.getOrders(token, { limit: 1000 });
      if (allOrdersResult.data) {
        const allData = allOrdersResult.data as { orders: Order[] };
        const allOrders = allData.orders || [];
        setStats({
          totalOrders: allOrders.length,
          activeOrders: allOrders.filter((o) => ['pending', 'processing', 'in_progress'].includes(o.status)).length,
          completedOrders: allOrders.filter((o) => ['completed', 'partial'].includes(o.status)).length,
        });
      }
    }

    setLoading(false);
  }

  const handleRefresh = async () => {
    if (isRefreshingBalance) return;
    setIsRefreshingBalance(true);
    await refreshUser();
    setTimeout(() => setIsRefreshingBalance(false), 500);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-300';
      case 'processing':
      case 'in_progress':
        return 'bg-blue-100 text-blue-700 border border-blue-300 animate-pulse';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border border-amber-300';
      case 'canceled':
      case 'failed':
        return 'bg-red-100 text-red-700 border border-red-300';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-300';
    }
  };

  return (
    <div className="space-y-6 text-slate-900">
      <DashboardPopup />

      {/* Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back,{' '}
            <span className="text-primary font-black">
              {user?.username || user?.first_name || user?.email?.split('@')[0]}
            </span>{' '}
            👋
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Your real-time account overview and service hub.
          </p>
        </div>

        <Link
          href="/dashboard/new-order"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-bold hover:bg-primary-hover transition-all shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Order</span>
        </Link>
      </div>

      {/* Scrolling News Ticker */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex items-center">
          <div className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 bg-primary text-white">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2.5}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <span className="text-[11px] font-black uppercase tracking-wider">Updates</span>
          </div>

          <div
            className="overflow-hidden relative flex-1 min-w-0"
            onMouseEnter={() => setTickerPaused(true)}
            onMouseLeave={() => setTickerPaused(false)}
          >
            <div ref={tickerRef} className="flex items-center py-2 whitespace-nowrap" style={{ willChange: 'transform' }}>
              <div ref={tickerSetRef} className="flex items-center shrink-0">
                <span className="inline-flex items-center gap-2 text-slate-600 text-xs mr-8">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-ping" />
                  Instant automatic order processing running 24/7
                </span>
                <span className="inline-flex items-center gap-2 text-slate-600 text-xs mr-8">
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                  NEW: Binance Pay and On-Chain Crypto Deposits available
                </span>
                <span className="inline-flex items-center gap-2 text-slate-600 text-xs mr-8">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Get Foreign Numbers for OTPs on{' '}
                  <a href="https://zapotp.com/login" target="_blank" rel="noopener noreferrer" className="text-primary font-bold hover:underline">
                    zapotp.com
                  </a>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BENTO GRID (2x2 / 4-Col Adaptive Architecture) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Tile 1: Hero Balance Card — clean white, primary blue balance text */}
        <div className="sm:col-span-2 bento-card p-6 bg-white border border-primary/20 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Wallet Balance
              </span>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshingBalance}
              className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors"
              title="Refresh Balance"
            >
              <svg
                className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin text-primary' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
              {loading ? (
                <div className="h-12 w-48 bg-blue-50 rounded-lg animate-pulse" />
              ) : (
                <CountUpBalance value={user?.balance || '0'} />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Available for order execution</p>
          </div>

          <Link
            href="/dashboard/wallet"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Deposit Funds</span>
          </Link>
        </div>

        {/* Tile 2: Active Orders Bento */}
        <div className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Orders
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-primary flex items-center justify-center border border-blue-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : stats?.activeOrders || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[11px] text-blue-600 font-medium">Currently delivering</span>
            </div>
          </div>

          <Link href="/dashboard/orders" className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
            <span>Track Progress</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Tile 3: Completed Orders Bento */}
        <div className="bento-card p-5 flex flex-col justify-between bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>

          <div className="my-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" /> : stats?.completedOrders || 0}
            </div>
            <p className="text-[11px] text-emerald-600 font-medium">Successfully delivered</p>
          </div>

          <Link href="/dashboard/orders" className="text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1">
            <span>Order History</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bento-card p-5 sm:p-6 bg-white border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Recent Orders</h2>
          </div>

          <Link
            href="/dashboard/orders"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View All</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : orders.length > 0 ? (
          <>
            {/* Mobile View: Luxury Order Cards */}
            <div className="block md:hidden space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-bold text-slate-900 line-clamp-2">{order.service_name}</p>
                    <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 truncate">
                    <span className="opacity-70">Target:</span> {order.link}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                    <div className="text-slate-500">
                      Qty: <span className="text-slate-900 font-semibold">{order.quantity.toLocaleString()}</span>
                    </div>
                    <div className="text-primary font-bold">{formatCurrency(order.charge)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View: Clean Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="py-3 px-3">Service</th>
                    <th className="py-3 px-3">Link</th>
                    <th className="py-3 px-3">Quantity</th>
                    <th className="py-3 px-3">Charge</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 font-medium text-slate-900 max-w-xs truncate">{order.service_name}</td>
                      <td className="py-3.5 px-3 text-slate-500 max-w-xs truncate">{order.link}</td>
                      <td className="py-3.5 px-3 text-slate-900 font-semibold">{order.quantity.toLocaleString()}</td>
                      <td className="py-3.5 px-3 font-bold text-primary">{formatCurrency(order.charge)}</td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">{formatDate(order.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="p-8 text-center space-y-3">
            <p className="text-slate-500 text-sm">No orders placed yet</p>
            <Link
              href="/dashboard/new-order"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
            >
              Browse Services
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Logo from '@/components/Logo';
import TawkTo from '@/components/TawkTo';
import WhatsAppButton from '@/components/WhatsAppButton';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import { useActivityTracker } from '@/hooks/useActivityTracker';

const sidebarLinks = [
  { name: 'Dashboard', href: '/dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'New Order', href: '/dashboard/new-order', icon: 'M12 4v16m8-8H4' },
  { name: 'My Orders', href: '/dashboard/orders', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { name: 'Wallet', href: '/dashboard/wallet', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
];

const openTawkChat = () => {
  if (window.Tawk_API?.showWidget) window.Tawk_API.showWidget();
  // Toggle open — Tawk.to exposes maximize()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window.Tawk_API as any)?.maximize?.();
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout, refreshUser, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  useActivityTracker();

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500); // Give the spin animation time to complete visually
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen bg-background-dark flex ${sidebarOpen ? 'overflow-hidden h-screen' : ''}`}>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`w-64 bg-surface-darker border-r border-border-dark flex flex-col fixed h-screen z-50 transition-transform duration-300 overflow-y-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-border-dark">
            <Link href="/dashboard" className="flex items-center justify-start flex-1">
              <Logo width={220} height={48} />
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              {/* Close button on mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-text-secondary hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Balance */}
          <div className="p-4 border-b border-border-dark">
            <div className="bg-surface-dark rounded-xl p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-text-secondary text-xs">Balance</p>
                <button 
                  onClick={handleRefreshBalance}
                  disabled={isRefreshing}
                  className="text-text-secondary hover:text-white transition-colors"
                  title="Refresh Balance"
                >
                  <svg 
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
              <p className="text-primary text-2xl font-bold">{formatCurrency(user?.balance || '0')}</p>
              <Link href="/dashboard/wallet" className="text-primary text-xs hover:underline mt-2 inline-block">
                Add Funds →
              </Link>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-text-secondary hover:text-white hover:bg-surface-dark'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                    </svg>
                    {link.name}
                  </Link>
                  {/* External link — after Wallet */}
                  {link.href === '/dashboard/wallet' && (
                    <a
                      href="https://zapotp.com/login"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-secondary hover:text-white hover:bg-surface-dark mt-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      Get Foreign Numbers
                    </a>
                  )}
                </div>
              );
            })}

            {/* Support — opens Tawk.to live chat */}
            <button
              onClick={() => { setSidebarOpen(false); openTawkChat(); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-text-secondary hover:text-white hover:bg-surface-dark"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Live Support
            </button>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-border-dark">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                {user?.first_name?.[0] || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {user?.first_name || user?.email?.split('@')[0]}
                </p>
                <p className="text-text-secondary text-xs truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-600 hover:text-white transition-colors text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div className="lg:hidden sticky top-0 z-30 h-16 bg-surface-darker border-b border-border-dark flex items-center px-4 gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-text-secondary hover:text-white"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Link href="/dashboard" className="flex items-center justify-start flex-1">
              <Logo width={200} height={36} />
            </Link>
            <ThemeToggle />
          </div>
          <div className="p-4 sm:p-6 lg:p-8 min-w-0 overflow-hidden">
            {/* Low Balance Warning Banner */}
            {!isLoading && user && parseFloat(user.balance) < 500 && (
              <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-amber-500 font-bold text-sm">Low Balance Warning</h3>
                    <p className="text-text-secondary text-xs mt-0.5">
                      Your balance is getting low ({formatCurrency(user.balance)}). Please top up to keep ordering services.
                    </p>
                  </div>
                </div>
                <Link 
                  href="/dashboard/wallet"
                  className="whitespace-nowrap px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
                >
                  Add Funds
                </Link>
              </div>
            )}
            {children}
          </div>
        </main>

      </div>
      {/* Floating WhatsApp DM button */}
      <WhatsAppButton />
      {/* Tawk.to live chat widget; loads once for the whole dashboard */}
      <TawkTo />
    </ProtectedRoute>
  );
}

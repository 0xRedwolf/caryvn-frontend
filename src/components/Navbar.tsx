'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import Logo from '@/components/Logo';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-nav h-20 flex items-center justify-center">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer">
          <Logo width={240} height={80} />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Home
          </Link>
          <Link
            href="/services"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            Services
          </Link>
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/api-docs"
            className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
          >
            API Docs
          </Link>
        </div>

        {/* Auth Buttons */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-400">
                <span className="text-primary font-medium">
                  {formatCurrency(user?.balance || '0')}
                </span>
              </div>
              <Link
                href="/dashboard"
                className="hidden sm:flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                {user?.first_name || user?.email?.split('@')[0]}
              </Link>
              <button
                onClick={logout}
                className="flex h-9 px-4 items-center justify-center rounded-lg bg-surface-dark border border-border-dark text-sm font-medium text-slate-300 hover:text-white transition-all"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex h-9 px-4 items-center justify-center rounded-lg text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="flex h-9 px-4 items-center justify-center rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold shadow-lg shadow-primary/20 transition-all transform hover:scale-105"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-surface-darker border-b border-border-dark">
          <div className="px-4 py-4 space-y-3">
            <Link
              href="/"
              className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-dark transition-colors"
            >
              Home
            </Link>
            <Link
              href="/services"
              className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-dark transition-colors"
            >
              Services
            </Link>
            {isAuthenticated && (
              <Link
                href="/dashboard"
                className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-dark transition-colors"
              >
                Dashboard
              </Link>
            )}
            <Link
              href="/api-docs"
              className="block px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-surface-dark transition-colors"
            >
              API Docs
            </Link>
            {/* Theme toggle in mobile menu */}
            <div className="flex items-center justify-between px-3 py-2 rounded-lg text-slate-300">
              <span className="text-sm">Theme</span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';
import Logo from '@/components/Logo';
import MobileProfileDropdown from '@/components/MobileProfileDropdown';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [dropdownOpen]);

  const navLinks = [
    {
      name: 'Home',
      href: '/',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Services',
      href: '/services',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      name: 'Virtual Numbers',
      href: '/dashboard/virtual-numbers',
      badge: 'OTP',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
    },
    {
      name: 'About',
      href: '/about',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'FAQ',
      href: '/faq',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Blog',
      href: '/blog',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
    },
    {
      name: 'API Docs',
      href: '/api-docs',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md h-16 flex items-center justify-center border-b border-slate-200">
      <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Mobile Left: Custom Hamburger Dropdown Button */}
        <div className="md:hidden relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((prev) => !prev)}
            type="button"
            aria-label="Navigation menu"
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              dropdownOpen
                ? 'bg-blue-50 text-primary border-blue-200'
                : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border-slate-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {dropdownOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Backdrop for Mobile Dropdown */}
          {dropdownOpen && (
            <div
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-2xs md:hidden"
              onClick={() => setDropdownOpen(false)}
            />
          )}

          {/* Clean Floating Dropdown Menu (Matches MobileProfileDropdown behavior) */}
          {dropdownOpen && (
            <div className="absolute left-0 top-12 z-50 w-72 max-h-[85vh] overflow-y-auto rounded-2xl bg-white border border-slate-200 shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header inside dropdown */}
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
                {isAuthenticated ? (
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : user?.username || 'My Account'}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mb-2">
                      @{user?.username || 'user'}
                    </p>
                    <div className="p-2 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        Balance
                      </span>
                      <span className="text-xs font-bold text-primary">
                        {formatCurrency(user?.balance || '0')}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs font-bold text-slate-900 mb-0.5">Welcome to Caryvn</p>
                    <p className="text-[11px] text-slate-500 mb-2">Grow socials & verify accounts instantly</p>
                    <div className="flex gap-2">
                      <Link
                        href="/login"
                        onClick={() => setDropdownOpen(false)}
                        className="flex-1 py-1.5 text-center rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
                      >
                        Login
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setDropdownOpen(false)}
                        className="flex-1 py-1.5 text-center rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-all"
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <div className="py-2 px-2 space-y-0.5">
                {isAuthenticated && (
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold text-primary bg-blue-50 mb-1"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>Dashboard</span>
                    </div>
                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-primary text-white">
                      ACTIVE
                    </span>
                  </Link>
                )}

                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.name}
                      href={link.href}
                      onClick={() => setDropdownOpen(false)}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-primary font-bold'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={isActive ? 'text-primary' : 'text-slate-400'}>
                          {link.icon}
                        </span>
                        <span className="truncate">{link.name}</span>
                      </div>
                      {link.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-black rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {link.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Logout Option if Authenticated */}
              {isAuthenticated && (
                <div className="pt-2 border-t border-slate-100 px-2 pb-1">
                  <button
                    onClick={async () => {
                      setDropdownOpen(false);
                      await logout();
                    }}
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Logo (Centered on mobile, left on desktop) */}
        <div className="flex-1 md:flex-none flex items-center justify-center md:justify-start">
          <Link href="/" className="flex items-center cursor-pointer">
            <Logo width={140} height={36} />
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6 ml-8 flex-1">
          <Link
            href="/"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Home
          </Link>
          <Link
            href="/services"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/services' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Services
          </Link>
          <Link
            href="/dashboard/virtual-numbers"
            className={`flex items-center gap-1.5 text-sm font-semibold transition-colors ${
              pathname.startsWith('/dashboard/virtual-numbers') ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Virtual Numbers</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              OTP
            </span>
          </Link>
          <Link
            href="/about"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/about' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            About
          </Link>
          <Link
            href="/faq"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/faq' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            FAQ
          </Link>
          <Link
            href="/blog"
            className={`text-sm font-semibold transition-colors ${
              pathname.startsWith('/blog') ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blog
          </Link>
          {isAuthenticated && (
            <Link
              href="/dashboard"
              className={`text-sm font-semibold transition-colors ${
                pathname === '/dashboard' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard
            </Link>
          )}
          <Link
            href="/api-docs"
            className={`text-sm font-semibold transition-colors ${
              pathname === '/api-docs' ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            API Docs
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              {/* Desktop Balance Badge */}
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-500 font-medium">Balance:</span>
                <span className="text-primary font-black">
                  {formatCurrency(user?.balance || '0')}
                </span>
              </div>

              {/* Desktop Dashboard Button */}
              <Link
                href="/dashboard"
                className="hidden md:flex h-9 px-4 items-center justify-center rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all shadow-xs"
              >
                Dashboard
              </Link>

              {/* Mobile Profile Dropdown on Right */}
              <div className="md:hidden">
                <MobileProfileDropdown user={user} logout={logout} />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="flex h-9 px-4 items-center justify-center rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary/90 transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="hidden sm:flex h-9 px-4 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold hover:bg-slate-50 transition-all"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

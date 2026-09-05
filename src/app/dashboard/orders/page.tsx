'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import TrustpilotPopup, { shouldShowReviewPopup } from '@/components/TrustpilotPopup';

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
  avg_completion_time?: string;
  created_at: string;
}

const statusFilters = [
  { key: 'All', label: 'All Orders' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'processing', label: 'Processing' },
  { key: 'pending', label: 'Pending' },
  { key: 'completed', label: 'Completed' },
  { key: 'partial', label: 'Partial' },
  { key: 'canceled', label: 'Canceled' },
];

function getPlatformIcon(serviceName: string) {
  const s = serviceName.toLowerCase();
  if (s.includes('instagram')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200/80 text-pink-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" strokeWidth="2" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  if (s.includes('tiktok')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 461 512.235" fill="none">
          <g fillRule="nonzero">
            <path fill="#2DCCD3" d="M370.934 98.964c19.378 19.981 43.543 32.158 67.898 37.7v-15.005c-22.884-1.621-46.823-8.822-67.898-22.695zM230.952 0v335.533c0 43.959-31.593 72.234-70.009 72.234-12.743 0-24.844-2.978-35.363-8.483 13.346 17.041 34.421 26.843 57.531 26.843 38.417 0 70.01-28.275 70.01-72.272V18.322h60.886C312.348 12.479 310.99 6.371 309.934 0h-78.982zM181 195.062v-16.627c-7.691-1.281-15.382-1.696-21.753-1.696C72.573 176.739 0 246.296 0 332.555c0 56.626 27.559 105.033 69.444 133.685-29.18-28.953-47.276-69.481-47.276-115.362 0-86.109 72.347-155.628 158.832-155.816z" />
            <path fill="#F1204A" d="M318.87 329.991c0 107.144-81.96 163.921-159.209 163.921-33.44 0-64.505-10.103-90.217-27.672 28.879 28.652 68.616 45.995 112.385 45.995 77.248 0 159.208-56.777 159.208-163.921V173.723c-7.69-5.203-15.08-11.272-22.167-18.36v174.628zm-193.289 69.294c-9.426-11.914-15.043-27.334-15.043-45.43 0-50.782 39.698-77.624 92.629-72.045v-85.052c-7.69-1.282-15.381-1.697-21.79-1.697H181v68.389c-52.931-5.542-92.63 21.263-92.63 72.083 0 29.707 15.193 52.252 37.211 63.752zm313.251-262.621v63.525c-35.174 0-68.464-6.711-97.795-26.466 34.157 34.157 75.59 44.826 119.963 44.826v-78.567a137.713 137.713 0 01-22.168-3.318zm-67.898-37.701c-18.737-19.265-33.026-45.806-38.832-80.641h-18.095c10.329 37.663 31.592 63.94 56.927 80.641z" />
            <path fill="#0f172a" d="M159.661 493.912c77.248 0 159.209-56.777 159.209-163.921V155.364c7.088 7.087 14.477 13.157 22.168 18.359 29.33 19.755 62.62 26.466 97.794 26.466v-63.525c-24.354-5.542-48.52-17.72-67.898-37.7-25.335-16.702-46.597-42.979-56.928-80.641H253.12v335.533c0 43.996-31.593 72.271-70.009 72.271-23.111 0-44.185-9.801-57.531-26.842-22.017-11.499-37.21-34.044-37.21-63.751 0-50.821 39.698-77.626 92.63-72.084v-68.388c-86.485.189-158.832 69.708-158.832 155.815 0 45.882 18.096 86.409 47.277 115.363 25.711 17.569 56.776 27.672 90.216 27.672z" />
          </g>
        </svg>
      </span>
    );
  }
  if (s.includes('youtube')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-red-50 border border-red-200/80 text-red-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      </span>
    );
  }
  if (s.includes('facebook')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </span>
    );
  }
  if (s.includes('threads')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 512 512">
          <g transform="translate(51, 51) scale(0.8, 0.8)">
            <path d="M 377.433594 237.300781 C 375.226562 236.246094 372.988281 235.226562 370.71875 234.253906 C 366.765625 161.433594 326.976562 119.746094 260.164062 119.320312 C 259.863281 119.316406 259.5625 119.316406 259.257812 119.316406 C 219.296875 119.316406 186.0625 136.375 165.605469 167.414062 L 202.347656 192.621094 C 217.632812 169.433594 241.613281 164.492188 259.277344 164.492188 C 259.480469 164.492188 259.683594 164.492188 259.886719 164.496094 C 281.886719 164.636719 298.484375 171.03125 309.230469 183.503906 C 317.046875 192.585938 322.277344 205.132812 324.867188 220.96875 C 305.363281 217.65625 284.269531 216.636719 261.71875 217.929688 C 198.199219 221.585938 157.363281 258.632812 160.105469 310.113281 C 161.496094 336.222656 174.507812 358.6875 196.734375 373.363281 C 215.527344 385.769531 239.730469 391.835938 264.886719 390.460938 C 298.105469 388.640625 324.167969 375.964844 342.347656 352.789062 C 356.15625 335.1875 364.890625 312.382812 368.746094 283.644531 C 384.578125 293.199219 396.3125 305.769531 402.792969 320.886719 C 413.8125 346.578125 414.453125 388.800781 380.003906 423.222656 C 349.820312 453.375 313.535156 466.421875 258.703125 466.824219 C 197.878906 466.375 151.875 446.867188 121.96875 408.84375 C 93.960938 373.242188 79.488281 321.820312 78.945312 256 C 79.488281 190.179688 93.960938 138.757812 121.96875 103.152344 C 151.875 65.132812 197.878906 45.625 258.703125 45.175781 C 319.96875 45.628906 366.769531 65.230469 397.824219 103.433594 C 413.050781 122.167969 424.53125 145.730469 432.097656 173.199219 L 475.15625 161.710938 C 465.984375 127.898438 451.550781 98.761719 431.90625 74.597656 C 392.097656 25.617188 333.871094 0.519531 258.851562 0 L 258.550781 0 C 183.683594 0.519531 126.113281 25.710938 87.433594 74.878906 C 53.019531 118.628906 35.265625 179.507812 34.667969 255.820312 L 34.667969 256.179688 C 35.265625 332.492188 53.019531 393.371094 87.433594 437.121094 C 126.113281 486.289062 183.683594 511.484375 258.550781 512 L 258.851562 512 C 325.414062 511.539062 372.332031 494.113281 410.980469 455.496094 C 461.550781 404.976562 460.027344 341.652344 443.359375 302.777344 C 431.402344 274.898438 408.605469 252.257812 377.433594 237.300781 Z M 262.507812 345.351562 C 234.667969 346.921875 205.746094 334.425781 204.320312 307.660156 C 203.261719 287.8125 218.441406 265.667969 264.214844 263.03125 C 269.457031 262.730469 274.601562 262.582031 279.65625 262.582031 C 296.28125 262.582031 311.835938 264.195312 325.980469 267.289062 C 320.703125 333.160156 289.765625 343.855469 262.507812 345.351562 Z M 262.507812 345.351562" />
          </g>
        </svg>
      </span>
    );
  }
  if (s.includes('twitter') || s.startsWith('x ') || s.includes(' x ') || s.includes('x.com') || s.includes('twitter/x') || s.includes('x/twitter')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </span>
    );
  }
  if (s.includes('discord')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-[#5865F2]/10 border border-[#5865F2]/30 text-[#5865F2] flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 fill-current" viewBox="0 0 512 388.049">
          <path fillRule="nonzero" d="M433.713 32.491A424.231 424.231 0 00328.061.005c-4.953 8.873-9.488 18.156-13.492 27.509a393.937 393.937 0 00-58.629-4.408c-19.594 0-39.284 1.489-58.637 4.37-3.952-9.33-8.543-18.581-13.525-27.476-36.435 6.212-72.045 17.196-105.676 32.555-66.867 98.92-84.988 195.368-75.928 290.446a425.967 425.967 0 00129.563 65.03c10.447-14.103 19.806-29.116 27.752-44.74a273.827 273.827 0 01-43.716-20.862c3.665-2.658 7.249-5.396 10.712-8.055 40.496 19.019 84.745 28.94 129.514 28.94 44.77 0 89.019-9.921 129.517-28.943 3.504 2.86 7.088 5.598 10.712 8.055a275.576 275.576 0 01-43.796 20.918 311.49 311.49 0 0027.752 44.705 424.235 424.235 0 00129.65-65.019l-.011.011c10.632-110.26-18.162-205.822-76.11-290.55zM170.948 264.529c-25.249 0-46.11-22.914-46.11-51.104 0-28.189 20.135-51.304 46.029-51.304 25.895 0 46.592 23.115 46.15 51.304-.443 28.19-20.336 51.104-46.069 51.104zm170.102 0c-25.29 0-46.069-22.914-46.069-51.104 0-28.189 20.135-51.304 46.069-51.304s46.472 23.115 46.029 51.304c-.443 28.19-20.296 51.104-46.029 51.104z" />
        </svg>
      </span>
    );
  }
  if (s.includes('kick')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-[#53FC18]/15 border border-[#53FC18]/40 text-[#0f172a] flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 fill-[#0f172a]" viewBox="0 0 512 512">
          <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" />
        </svg>
      </span>
    );
  }
  if (s.includes('telegram')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
        </svg>
      </span>
    );
  }
  if (s.includes('spotify')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
      </span>
    );
  }
  if (s.includes('whatsapp')) {
    return (
      <span className="w-8 h-8 rounded-xl bg-green-50 border border-green-200/80 text-green-600 flex items-center justify-center shrink-0">
        <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </span>
    );
  }

  // Fallback Globe
  return (
    <span className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center shrink-0">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    </span>
  );
}

function OrdersContent() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showReviewPopup, setShowReviewPopup] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refill state
  const [refillLoading, setRefillLoading] = useState<string | null>(null);
  const [refillMessage, setRefillMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, statusFilter]);

  // Trustpilot review popup: trigger 3s after landing from a fresh purchase
  useEffect(() => {
    if (searchParams.get('review') === '1') {
      router.replace('/dashboard/orders', { scroll: false });
      const t = setTimeout(() => {
        if (shouldShowReviewPopup()) {
          setShowReviewPopup(true);
        }
      }, 3000);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadOrders() {
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
  }

  const handleCopyOrderId = (id: string) => {
    const cleanId = String(id).slice(0, 8).toUpperCase();
    navigator.clipboard.writeText(cleanId);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleHideOrder = async (orderId: string) => {
    if (!token) return;
    setDeleteLoading(true);
    const result = await ordersApi.hideOrder(orderId, token);
    setDeleteLoading(false);
    setDeleteConfirm(null);
    if (result.data) {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
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

    setTimeout(() => setRefillMessage(null), 5000);
  };

  // Client-side search filter
  const filteredOrders = useMemo(() => {
    if (!search.trim()) return orders;
    const q = search.toLowerCase().trim();
    return orders.filter(
      (o) =>
        o.service_name.toLowerCase().includes(q) ||
        o.link.toLowerCase().includes(q) ||
        String(o.id).toLowerCase().includes(q)
    );
  }, [orders, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const total = orders.length;
    const active = orders.filter((o) => ['pending', 'processing', 'in_progress'].includes(o.status.toLowerCase())).length;
    const completed = orders.filter((o) => o.status.toLowerCase() === 'completed').length;
    const totalSpent = orders.reduce((acc, curr) => acc + (parseFloat(curr.charge) || 0), 0);
    return { total, active, completed, totalSpent };
  }, [orders]);

  return (
    <div className="space-y-6 text-slate-900 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Track live delivery progress, monitor order completion, and request instant refills.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="Refresh Orders"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <Link
            href="/dashboard/new-order"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>New Order</span>
          </Link>
        </div>
      </div>

      {/* Bento Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{metrics.total.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Lifetime placements</p>
        </div>

        {/* Delivering / In Progress */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active</span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center relative">
              {metrics.active > 0 && (
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-blue-400 opacity-75 top-1 right-1" />
              )}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600">{metrics.active.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Delivering right now</p>
        </div>

        {/* Completed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed</span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600">{metrics.completed.toLocaleString()}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Successfully fulfilled</p>
        </div>

        {/* Total Spent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Spent</span>
            <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{formatCurrency(metrics.totalSpent)}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Investment value</p>
        </div>
      </div>

      {/* Refill Feedback Message */}
      {refillMessage && (
        <div
          className={`p-4 rounded-2xl flex items-start gap-3 border animate-in fade-in duration-150 ${
            refillMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="mt-0.5 shrink-0">
            {refillMessage.type === 'success' ? (
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold flex-1 leading-relaxed">{refillMessage.text}</p>
          <button
            type="button"
            onClick={() => setRefillMessage(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search orders by service name, order ID, or target link…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {statusFilters.map((f) => {
            const isActive = statusFilter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-500">Loading your orders...</p>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredOrders.map((order) => {
              const delivered =
                order.start_count != null && order.remains != null ? order.quantity - order.remains : null;
              const progress =
                delivered !== null ? Math.min(100, Math.max(0, (delivered / order.quantity) * 100)) : null;
              const showProgress =
                progress !== null && ['in_progress', 'processing', 'partial'].includes(order.status.toLowerCase());
              const statusLower = order.status.toLowerCase();

              return (
                <div
                  key={order.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors relative group"
                >
                  {/* Top Row: Platform Icon, Service Name, ID, Price */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {getPlatformIcon(order.service_name)}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                            {order.service_name}
                          </h3>

                          {/* Order ID Badge */}
                          <button
                            type="button"
                            onClick={() => handleCopyOrderId(order.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-mono font-bold text-slate-600 transition-colors cursor-pointer"
                            title="Click to copy ID"
                          >
                            <span>#{String(order.id).slice(0, 8).toUpperCase()}</span>
                            {copiedId === order.id ? (
                              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        {/* Link */}
                        <a
                          href={order.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-primary transition-colors max-w-full truncate"
                          title={order.link}
                        >
                          <svg className="w-3 h-3 shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span className="truncate">{order.link}</span>
                        </a>
                      </div>
                    </div>

                    {/* Quantity & Charge */}
                    <div className="text-right shrink-0 flex items-center gap-4">
                      <div className="hidden sm:block">
                        <p className="text-xs sm:text-sm font-black text-slate-900">{order.quantity.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Quantity</p>
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm font-black text-slate-900">{formatCurrency(order.charge)}</p>
                        <p className="text-[10px] font-bold text-slate-400">{formatDate(order.created_at)}</p>
                      </div>

                      {/* Hide Order X Button */}
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(order.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove from history"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar (if in progress / partial) */}
                  {showProgress && (
                    <div className="mt-3.5 pt-3 border-t border-slate-100">
                      <div className="flex justify-between text-[11px] font-bold text-slate-600 mb-1.5">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                          Delivery Progress
                        </span>
                        <span>
                          {delivered!.toLocaleString()} / {order.quantity.toLocaleString()} ({Math.round(progress!)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Bottom Strip: Status & Counts & Actions */}
                  <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      {/* Status Badges with Live Radar Pulse */}
                      {statusLower === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Completed</span>
                        </span>
                      )}

                      {(statusLower === 'in_progress' || statusLower === 'processing') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200/80">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                          </span>
                          <span>{order.status.replace('_', ' ')}</span>
                        </span>
                      )}

                      {statusLower === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200/80">
                          <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Pending</span>
                        </span>
                      )}

                      {statusLower === 'partial' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-teal-50 text-teal-700 border border-teal-200/80">
                          <span>Partial</span>
                        </span>
                      )}

                      {['canceled', 'cancelled', 'refunded', 'failed'].includes(statusLower) && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200/80">
                          <span>{order.status.replace('_', ' ')}</span>
                        </span>
                      )}

                      {/* Numeric Metrics */}
                      {order.start_count !== null && order.start_count !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                          Start: <strong className="text-slate-900">{order.start_count.toLocaleString()}</strong>
                        </span>
                      )}
                      {order.remains !== null && order.remains !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600">
                          Remains: <strong className="text-slate-900">{order.remains.toLocaleString()}</strong>
                        </span>
                      )}
                      {order.avg_completion_time && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-600 hidden md:inline">
                          Est. Speed: <strong className="text-slate-900">{order.avg_completion_time}</strong>
                        </span>
                      )}
                    </div>

                    {/* Refill Button */}
                    {order.service_has_refill && statusLower === 'completed' && (
                      <button
                        type="button"
                        onClick={() => handleRefill(order.id)}
                        disabled={refillLoading === order.id}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
                      >
                        {refillLoading === order.id ? (
                          <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        )}
                        <span>Request Refill</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 px-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-900 mb-1">No orders found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-5 font-medium">
              {search
                ? `No results matching "${search}". Try clearing your search query.`
                : `You haven't placed any orders in this category yet.`}
            </p>
            <Link
              href="/dashboard/new-order"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-black shadow-md shadow-primary/20 transition-all cursor-pointer"
            >
              <span>Explore Services & Place Order</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Remove Order from View</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              This will hide the order from your history list. It will not cancel active delivery or affect your account balance.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Keep Order
              </button>
              <button
                type="button"
                onClick={() => handleHideOrder(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {deleteLoading ? 'Removing...' : 'Yes, Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trustpilot Review Popup */}
      {showReviewPopup && <TrustpilotPopup onClose={() => setShowReviewPopup(false)} />}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-semibold text-slate-400">Loading Orders...</p>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}

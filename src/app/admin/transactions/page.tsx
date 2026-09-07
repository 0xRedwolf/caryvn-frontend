'use client';

import React, { useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface AdminTransaction {
  id: string;
  user_email: string;
  user_username: string;
  type: string;
  amount: string;
  description: string;
  status: string;
  payment_gateway: string;
  payment_reference: string | null;
  has_proof: boolean;
  created_at: string;
}

const GATEWAY_META: Record<string, { label: string; color: string; dot: string }> = {
  squad:               { label: 'Squad',       color: 'bg-violet-50 text-violet-700 border-violet-200',   dot: 'bg-violet-500' },
  nexapay:             { label: 'NexaPay',     color: 'bg-indigo-50 text-indigo-700 border-indigo-200',   dot: 'bg-indigo-500' },
  manual:              { label: 'Bank',         color: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500' },
  binance_pay:         { label: 'Binance Pay',  color: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500' },
  on_chain_usdt_trc20: { label: 'USDT-TRC20',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
  on_chain_usdt_bep20: { label: 'USDT-BEP20',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200',dot: 'bg-emerald-500' },
  on_chain_sol:        { label: 'USDC-SOL',     color: 'bg-purple-50 text-purple-700 border-purple-200',   dot: 'bg-purple-500' },
  '':                  { label: 'Internal',     color: 'bg-slate-100 text-slate-600 border-slate-200',     dot: 'bg-slate-400' },
};

const STATUS_META: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  success: { label: 'Success', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  failed:  { label: 'Failed',  color: 'bg-red-50 text-red-700 border-red-200' },
};

const GATEWAYS = ['', 'squad', 'nexapay', 'manual', 'binance_pay', 'on_chain_usdt_trc20', 'on_chain_usdt_bep20', 'on_chain_sol'];
const STATUSES = ['', 'pending', 'success', 'failed'];
const PAGE_SIZE = 50;

// Re-usable Custom Select dropdown
function CustomSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const selected = options.find(o => o.value === value);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary/40 transition-all shadow-xs"
      >
        <span className={selected?.value ? 'text-slate-900' : 'text-slate-400'}>
          {selected?.value ? selected.label : placeholder}
        </span>
        <svg className={`w-4 h-4 text-slate-400 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-40 bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden py-1">
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                value === opt.value ? 'bg-primary/5 text-primary' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center text-[10px] font-bold px-2.5 py-1 rounded-lg border ${color}`}>
      {label}
    </span>
  );
}

function getTxCategoryMeta(tx: AdminTransaction): { label: string; color: string; icon: ReactNode } {
  const desc = (tx.description || '').toLowerCase();
  if (desc.includes('virtual number') || desc.includes('otp')) {
    return {
      label: 'Virtual Number',
      color: 'bg-primary/5 text-primary border-primary/20',
      icon: (
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    };
  }
  if (tx.type === 'refund' || desc.includes('refund')) {
    return {
      label: 'Refund',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: (
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      ),
    };
  }
  if (tx.type === 'deposit') {
    return {
      label: 'Deposit',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: (
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    };
  }
  return {
    label: 'SMM Boost',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: (
      <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };
}

export default function AdminTransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [failConfirmTx, setFailConfirmTx] = useState<string | null>(null);
  const [failLoading, setFailLoading] = useState(false);
  const [forceVerifyTx, setForceVerifyTx] = useState<{ id: string; amount: string; ref: string | null; error: string } | null>(null);
  const [forceLoading, setForceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<'all' | 'deposit' | 'smm' | 'otp'>('all');
  const [search, setSearch] = useState('');
  const [gateway, setGateway] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const res = await adminApi.getAllTransactions(token, {
      search: search || undefined,
      gateway: gateway || undefined,
      status: txStatus || undefined,
      category: category === 'all' ? undefined : category,
      limit: PAGE_SIZE,
      offset,
    });
    if (res.data) {
      const d = res.data as { transactions: AdminTransaction[]; total: number };
      setTransactions(d.transactions);
      setTotal(d.total);
    }
    setLoading(false);
  }, [token, search, gateway, txStatus, category, offset]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [category, offset]);

  useEffect(() => { setOffset(0); }, [search, gateway, txStatus, category]);

  const handleVerify = async (tx: AdminTransaction) => {
    if (!token) return;
    setActionLoading(`verify-${tx.id}`);
    const res = await adminApi.verifyTransaction(tx.id, token);
    setActionLoading(null);
    if (res.error) {
      if (tx.payment_gateway === 'nexapay' || (res as any).can_force) {
        setForceVerifyTx({
          id: tx.id,
          amount: tx.amount,
          ref: tx.payment_reference,
          error: res.error,
        });
      } else {
        showToast('error', res.error);
      }
    } else {
      showToast('success', `Payment verified and credited ₦${parseFloat(tx.amount).toLocaleString()}`);
      load();
    }
  };

  const handleConfirmForceVerify = async () => {
    if (!token || !forceVerifyTx) return;
    setForceLoading(true);
    const res = await adminApi.verifyTransaction(forceVerifyTx.id, token, undefined, true);
    setForceLoading(false);
    if (res.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Payment approved and credited ₦${parseFloat(forceVerifyTx.amount).toLocaleString()}`);
      setForceVerifyTx(null);
      load();
    }
  };

  const handleFail = (txId: string) => {
    setFailConfirmTx(txId);
  };

  const handleConfirmFail = async () => {
    if (!token || !failConfirmTx) return;
    setFailLoading(true);
    const txId = failConfirmTx;
    setActionLoading(`fail-${txId}`);
    const res = await adminApi.failTransaction(txId, token);
    setActionLoading(null);
    setFailLoading(false);
    setFailConfirmTx(null);
    if (res.error) {
      showToast('error', res.error);
    } else {
      showToast('success', 'Transaction marked as failed');
      load();
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  const gatewayOptions = [
    { value: '', label: 'All Methods' },
    ...GATEWAYS.filter(g => g).map(g => ({ value: g, label: GATEWAY_META[g]?.label ?? g })),
  ];

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...STATUSES.filter(s => s).map(s => ({ value: s, label: STATUS_META[s]?.label ?? s })),
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">All Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{total.toLocaleString()} total transactions</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary transition-all shadow-xs cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {[
          {
            id: 'all',
            label: 'All Transactions',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            ),
          },
          {
            id: 'deposit',
            label: 'Deposits',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ),
          },
          {
            id: 'smm',
            label: 'Social Media Boosts',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ),
          },
          {
            id: 'otp',
            label: 'Virtual Numbers',
            icon: (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ),
          },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategory(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
              category === tab.id
                ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/20'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          toast.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
        }`}>
          {toast.text}
        </div>
      )}

      {/* Filters */}
      <div className="space-y-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by email, username, reference, or service…"
            className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-xs transition"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-3">
          <CustomSelect
            value={gateway}
            onChange={setGateway}
            options={gatewayOptions}
            placeholder="All Methods"
          />
          <CustomSelect
            value={txStatus}
            onChange={setTxStatus}
            options={statusOptions}
            placeholder="All Statuses"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bento-card bg-white border border-slate-200 p-12 flex justify-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="bento-card bg-white border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm">No transactions found.</p>
        </div>
      ) : (
        <>
          {/* Mobile: Cards */}
          <div className="sm:hidden space-y-3">
            {transactions.map(tx => {
              const gMeta = GATEWAY_META[tx.payment_gateway] ?? GATEWAY_META[''];
              const sMeta = STATUS_META[tx.status] ?? { label: tx.status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
              const cMeta = getTxCategoryMeta(tx);
              const isPending = tx.status === 'pending';
              const isSquad = tx.payment_gateway === 'squad';
              const isNexaPay = tx.payment_gateway === 'nexapay';

              return (
                <div key={tx.id} className="bento-card bg-white border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{tx.user_email}</p>
                      <p className="text-[11px] text-slate-500">@{tx.user_username}</p>
                    </div>
                    <Badge label={sMeta.label} color={sMeta.color} />
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cMeta.color}`}>
                      {cMeta.icon}
                      {cMeta.label}
                    </span>
                    {tx.description && (
                      <span className="text-xs text-slate-600 truncate max-w-50" title={tx.description}>
                        {tx.description}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${gMeta.dot}`} />
                      <Badge label={gMeta.label} color={gMeta.color} />
                    </div>
                    <span className={`font-black font-mono text-base ${tx.type === 'deposit' ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {tx.type === 'deposit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {tx.payment_reference && (
                    <div className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg truncate">
                      {tx.payment_reference}
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">{formatDate(tx.created_at)}</span>
                    <div className="flex items-center gap-1.5">
                      {isSquad && isPending && (
                        <button
                          onClick={() => handleVerify(tx)}
                          disabled={actionLoading === `verify-${tx.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Query Squad status"
                        >
                          <svg className={`w-3.5 h-3.5 ${actionLoading === `verify-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Query
                        </button>
                      )}
                      {isNexaPay && isPending && (
                        <button
                          onClick={() => handleVerify(tx)}
                          disabled={actionLoading === `verify-${tx.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Query NexaPay status"
                        >
                          <svg className={`w-3.5 h-3.5 ${actionLoading === `verify-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Query
                        </button>
                      )}
                      {isPending && (
                        <button
                          onClick={() => handleFail(tx.id)}
                          disabled={actionLoading === `fail-${tx.id}`}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          title="Mark as Failed"
                        >
                          <svg className={`w-3.5 h-3.5 ${actionLoading === `fail-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Fail
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Service / Type</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Method</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wide w-24 min-w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => {
                  const gMeta = GATEWAY_META[tx.payment_gateway] ?? { label: tx.payment_gateway || 'Internal', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
                  const sMeta = STATUS_META[tx.status] ?? { label: tx.status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                  const cMeta = getTxCategoryMeta(tx);
                  const isSquad = tx.payment_gateway === 'squad';
                  const isNexaPay = tx.payment_gateway === 'nexapay';
                  const isPending = tx.status === 'pending';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-slate-900 font-semibold text-xs">{tx.user_email}</p>
                        <p className="text-slate-400 text-[11px]">@{tx.user_username}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cMeta.color}`}>
                            {cMeta.icon}
                            {cMeta.label}
                          </span>
                        </div>
                        {tx.description && (
                          <p className="text-slate-600 text-xs truncate max-w-50" title={tx.description}>
                            {tx.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge label={gMeta.label} color={gMeta.color} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`font-bold font-mono text-sm ${tx.type === 'deposit' ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge label={sMeta.label} color={sMeta.color} />
                      </td>
                      <td className="px-4 py-3.5">
                        {tx.payment_reference ? (
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded truncate max-w-35 block" title={tx.payment_reference}>
                            {tx.payment_reference}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right">
                        <div className="flex items-center gap-1.5 justify-end">
                          {isSquad && isPending && (
                            <button
                              onClick={() => handleVerify(tx)}
                              disabled={actionLoading === `verify-${tx.id}`}
                              className="p-2 rounded-lg bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Query Squad status"
                            >
                              <svg className={`w-3.5 h-3.5 ${actionLoading === `verify-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          {isNexaPay && isPending && (
                            <button
                              onClick={() => handleVerify(tx)}
                              disabled={actionLoading === `verify-${tx.id}`}
                              className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Query NexaPay status"
                            >
                              <svg className={`w-3.5 h-3.5 ${actionLoading === `verify-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => handleFail(tx.id)}
                              disabled={actionLoading === `fail-${tx.id}`}
                              className="p-2 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
                              title="Mark as Failed"
                            >
                              <svg className={`w-3.5 h-3.5 ${actionLoading === `fail-${tx.id}` ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-slate-500 text-sm">
            Page {currentPage} of {totalPages} · {total.toLocaleString()} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Fail Transaction Confirmation Modal */}
      {failConfirmTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">Mark Transaction as Failed</h3>
            <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to mark this pending transaction as failed? This will terminate the deposit record and prevent wallet crediting.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setFailConfirmTx(null)}
                disabled={failLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmFail}
                disabled={failLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {failLoading ? 'Failing...' : 'Yes, Mark Failed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Verify / Manual Approval Modal for NexaPay / Unverified Gateways */}
      {forceVerifyTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-8 max-w-md w-full text-center ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">NexaPay Query Result</h3>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4 text-left">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gateway Response</div>
              <div className="text-xs font-semibold text-rose-600 font-mono break-all">{forceVerifyTx.error}</div>
              {forceVerifyTx.ref && (
                <div className="text-[11px] text-slate-500 mt-1 font-mono">Ref: {forceVerifyTx.ref}</div>
              )}
            </div>
            <p className="text-xs text-slate-600 mb-6 leading-relaxed text-left">
              NexaPay upstream query did not confirm this transaction (e.g. upstream 401 or waiting for bank transfer). If you have verified this payment in your NexaPay merchant dashboard, you can force approve and credit the user immediately.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForceVerifyTx(null)}
                disabled={forceLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmForceVerify}
                disabled={forceLoading}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {forceLoading ? 'Approving...' : `Force Credit ₦${parseFloat(forceVerifyTx.amount).toLocaleString()}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

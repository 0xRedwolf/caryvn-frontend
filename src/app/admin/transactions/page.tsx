'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
        <div className="absolute top-full left-0 mt-1.5 w-full min-w-[160px] bg-white rounded-2xl border border-slate-200 shadow-xl z-30 overflow-hidden py-1">
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

export default function AdminTransactionsPage() {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
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
      limit: PAGE_SIZE,
      offset,
    });
    if (res.data) {
      const d = res.data as { transactions: AdminTransaction[]; total: number };
      setTransactions(d.transactions);
      setTotal(d.total);
    }
    setLoading(false);
  }, [token, search, gateway, txStatus, offset]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  useEffect(() => { setOffset(0); }, [search, gateway, txStatus]);

  const handleVerify = async (tx: AdminTransaction) => {
    if (!token) return;
    setActionLoading(`verify-${tx.id}`);
    const res = await adminApi.verifyTransaction(tx.id, token);
    setActionLoading(null);
    if (res.error) {
      showToast('error', res.error);
    } else {
      showToast('success', `Transaction verified and credited ₦${tx.amount}`);
      load();
    }
  };

  const handleFail = async (txId: string) => {
    if (!token || !confirm('Mark this transaction as failed?')) return;
    setActionLoading(`fail-${txId}`);
    const res = await adminApi.failTransaction(txId, token);
    setActionLoading(null);
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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700 hover:border-primary/40 hover:text-primary transition-all shadow-xs"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
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
            placeholder="Search by email, username, or reference…"
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
              const isPending = tx.status === 'pending';
              const isSquad = tx.payment_gateway === 'squad';

              return (
                <div key={tx.id} className="bento-card bg-white border border-slate-200 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{tx.user_email}</p>
                      <p className="text-[11px] text-slate-500">@{tx.user_username}</p>
                    </div>
                    <Badge label={sMeta.label} color={sMeta.color} />
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
                    <div className="flex gap-2">
                      {isSquad && isPending && (
                        <button
                          onClick={() => handleVerify(tx)}
                          disabled={actionLoading === `verify-${tx.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `verify-${tx.id}` ? '…' : 'Query Squad'}
                        </button>
                      )}
                      {isPending && (
                        <button
                          onClick={() => handleFail(tx.id)}
                          disabled={actionLoading === `fail-${tx.id}`}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === `fail-${tx.id}` ? '…' : 'Fail'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Method</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Reference</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => {
                  const gMeta = GATEWAY_META[tx.payment_gateway] ?? { label: tx.payment_gateway || 'Internal', color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
                  const sMeta = STATUS_META[tx.status] ?? { label: tx.status, color: 'bg-slate-100 text-slate-600 border-slate-200' };
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
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1 rounded truncate max-w-[140px] block" title={tx.payment_reference}>
                            {tx.payment_reference}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2 justify-end">
                          {isSquad && isPending && (
                            <button
                              onClick={() => handleVerify(tx)}
                              disabled={actionLoading === `verify-${tx.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-violet-50 text-violet-700 border border-violet-200 hover:bg-violet-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `verify-${tx.id}` ? '…' : 'Query Squad'}
                            </button>
                          )}
                          {isNexaPay && isPending && (
                            <button
                              onClick={() => handleVerify(tx)}
                              disabled={actionLoading === `verify-${tx.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `verify-${tx.id}` ? '…' : 'Verify NexaPay'}
                            </button>
                          )}
                          {isPending && (
                            <button
                              onClick={() => handleFail(tx.id)}
                              disabled={actionLoading === `fail-${tx.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `fail-${tx.id}` ? '…' : 'Fail'}
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
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

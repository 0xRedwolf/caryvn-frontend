'use client';

import { useState, useEffect, useCallback } from 'react';
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

const GATEWAY_META: Record<string, { label: string; color: string }> = {
  squad:               { label: 'Squad',       color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
  manual:              { label: 'Bank',         color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  binance_pay:         { label: 'Binance Pay',  color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  on_chain_usdt_trc20: { label: 'USDT-TRC20',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  on_chain_usdt_bep20: { label: 'USDT-BEP20',  color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  on_chain_sol:        { label: 'USDC-SOL',     color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  '':                  { label: 'Internal',     color: 'bg-surface-darker text-text-secondary border-border-dark' },
};

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  failed:  'bg-red-500/10 text-red-400 border-red-500/20',
};

const GATEWAYS = ['', 'squad', 'manual', 'binance_pay', 'on_chain_usdt_trc20', 'on_chain_usdt_bep20', 'on_chain_sol'];
const STATUSES = ['', 'pending', 'success', 'failed'];
const PAGE_SIZE = 50;

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${color}`}>
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

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filters change
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">All Transactions</h1>
          <p className="text-text-secondary text-sm">
            {total.toLocaleString()} total transactions
          </p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
          {toast.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="Search by email, username, or reference…"
          className="input w-full text-base py-3"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-3">
          <select className="input flex-1 text-base py-3" value={gateway} onChange={e => setGateway(e.target.value)}>
            <option value="">All Methods</option>
            {GATEWAYS.filter(g => g).map(g => (
              <option key={g} value={g}>{GATEWAY_META[g]?.label ?? g}</option>
            ))}
          </select>
          <select className="input flex-1 text-base py-3" value={txStatus} onChange={e => setTxStatus(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.filter(s => s).map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-10 text-center text-text-secondary">No transactions found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-dark bg-surface-darker/50">
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">User</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Method</th>
                  <th className="text-right px-4 py-3 text-text-secondary font-medium">Amount</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium hidden md:table-cell">Reference</th>
                  <th className="text-left px-4 py-3 text-text-secondary font-medium hidden lg:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-dark">
                {transactions.map(tx => {
                  const gMeta = GATEWAY_META[tx.payment_gateway] ?? { label: tx.payment_gateway || 'Internal', color: 'bg-surface-darker text-text-secondary border-border-dark' };
                  const sMeta = STATUS_COLOR[tx.status] ?? 'bg-surface-darker text-text-secondary border-border-dark';
                  const isSquad = tx.payment_gateway === 'squad';
                  const isPending = tx.status === 'pending';
                  return (
                    <tr key={tx.id} className="hover:bg-surface-darker/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-white font-medium">{tx.user_email}</p>
                        <p className="text-text-secondary text-xs">@{tx.user_username}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={gMeta.label} color={gMeta.color} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-semibold font-mono ${tx.type === 'deposit' ? 'text-emerald-400' : 'text-text-secondary'}`}>
                          {tx.type === 'deposit' ? '+' : '-'}₦{parseFloat(tx.amount).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={tx.status} color={sMeta} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {tx.payment_reference ? (
                          <span className="font-mono text-xs text-text-secondary bg-surface-darker px-2 py-1 rounded truncate max-w-[140px] block" title={tx.payment_reference}>
                            {tx.payment_reference}
                          </span>
                        ) : (
                          <span className="text-text-secondary text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-text-secondary text-xs">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {/* Squad: re-query and auto-approve */}
                          {isSquad && isPending && (
                            <button
                              onClick={() => handleVerify(tx)}
                              disabled={actionLoading === `verify-${tx.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-colors disabled:opacity-50"
                            >
                              {actionLoading === `verify-${tx.id}` ? '…' : 'Query Squad'}
                            </button>
                          )}
                          {/* Any pending: mark as failed */}
                          {isPending && (
                            <button
                              onClick={() => handleFail(tx.id)}
                              disabled={actionLoading === `fail-${tx.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
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
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-text-secondary text-sm">
            Page {currentPage} of {totalPages} · {total} results
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-4 py-2 rounded-lg border border-border-dark text-text-secondary hover:text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="px-4 py-2 rounded-lg border border-border-dark text-text-secondary hover:text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PendingDeposit {
  id: string;
  amount: string;
  payment_proof: string | null;
  payment_gateway: string;
  payment_reference: string | null;
  user_email: string;
  created_at: string;
  status: string;
}

const CRYPTO_GATEWAYS = new Set([
  'binance_pay', 'on_chain_usdt_trc20', 'on_chain_usdt_bep20', 'on_chain_sol',
]);

const GATEWAY_META: Record<string, { label: string; color: string; isCrypto: boolean }> = {
  manual:              { label: 'Bank Transfer',  color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',    isCrypto: false },
  binance_pay:         { label: 'Binance Pay',    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', isCrypto: true  },
  on_chain_usdt_trc20: { label: 'USDT-TRC20',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', isCrypto: true },
  on_chain_usdt_bep20: { label: 'USDT-BEP20',     color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', isCrypto: true },
  on_chain_sol:        { label: 'USDC-SOL',         color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',   isCrypto: true },
};

function MethodBadge({ gateway }: { gateway: string }) {
  const meta = GATEWAY_META[gateway] ?? { label: gateway, color: 'bg-surface-darker text-text-secondary border-border-dark', isCrypto: false };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${meta.color}`}>
      {meta.label}
    </span>
  );
}

// Modal for approving crypto deposits — requires admin to input the naira equivalent
function CryptoApprovalModal({
  deposit,
  onConfirm,
  onCancel,
  loading,
}: {
  deposit: PendingDeposit;
  onConfirm: (creditNaira: number) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [creditNaira, setCreditNaira] = useState('');
  const usdAmount = parseFloat(deposit.amount);
  const nairaAmount = parseFloat(creditNaira);
  const impliedRate = !isNaN(nairaAmount) && nairaAmount > 0 && !isNaN(usdAmount) && usdAmount > 0
    ? (nairaAmount / usdAmount).toLocaleString('en-NG', { maximumFractionDigits: 2 })
    : null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Approve Crypto Deposit</h3>
            <p className="text-text-secondary text-sm">{deposit.user_email}</p>
          </div>
        </div>

        {/* Deposit summary */}
        <div className="bg-surface-darker rounded-xl border border-border-dark p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Method</span>
            <MethodBadge gateway={deposit.payment_gateway} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Deposited (USD)</span>
            <span className="text-white font-semibold font-mono">${usdAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</span>
          </div>
          {deposit.payment_reference && (
            <div className="flex items-start justify-between gap-3">
              <span className="text-text-secondary text-sm flex-shrink-0">
                {deposit.payment_gateway === 'binance_pay' ? 'Order ID' : 'TXID'}
              </span>
              <span className="text-white text-xs font-mono bg-surface-dark rounded px-2 py-1 truncate max-w-[170px]" title={deposit.payment_reference}>
                {deposit.payment_reference}
              </span>
            </div>
          )}
        </div>

        {/* Naira credit input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-1.5">
            Amount to Credit <span className="text-text-secondary font-normal">(₦)</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
            <input
              type="number"
              className="input w-full pl-9 font-mono text-center"
              placeholder="e.g. 15000"
              min="1"
              value={creditNaira}
              onChange={(e) => setCreditNaira(e.target.value)}
            />
          </div>
        </div>

        {/* Live implied rate */}
        <div className={`rounded-xl border px-4 py-3 mb-5 transition-all ${impliedRate ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-surface-darker border-border-dark'}`}>
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Implied Rate</span>
            {impliedRate ? (
              <span className="text-emerald-400 font-semibold font-mono">₦{impliedRate} / $1 USDT</span>
            ) : (
              <span className="text-text-secondary/50 text-sm italic">enter amount above</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border-dark text-text-secondary hover:text-white text-sm transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => { if (!isNaN(nairaAmount) && nairaAmount > 0) onConfirm(nairaAmount); }}
            disabled={loading || isNaN(nairaAmount) || nairaAmount <= 0}
            className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Crediting...</>
              : `Credit ₦${isNaN(nairaAmount) ? '0' : nairaAmount.toLocaleString()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPendingDepositsPage() {
  const { token } = useAuth();
  const [deposits, setDeposits] = useState<PendingDeposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [cryptoApprovalTarget, setCryptoApprovalTarget] = useState<PendingDeposit | null>(null);

  useEffect(() => {
    if (token) loadDeposits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadDeposits() {
    setLoading(true);
    const res = await adminApi.getPendingDeposits(token!);
    if (res.data) setDeposits(res.data as PendingDeposit[]);
    setLoading(false);
  };

  const handleApproveClick = (deposit: PendingDeposit) => {
    if (CRYPTO_GATEWAYS.has(deposit.payment_gateway)) {
      // Crypto: open modal first
      setCryptoApprovalTarget(deposit);
    } else {
      // Bank transfer: approve directly
      handleVerify(deposit.id);
    }
  };

  const handleVerify = async (id: string, creditNaira?: number) => {
    if (!token) return;
    setActionLoading(`verify-${id}`);
    const res = await adminApi.verifyTransaction(id, token, creditNaira);
    setActionLoading(null);
    setCryptoApprovalTarget(null);
    if (!res.error) {
      setDeposits(prev => prev.filter(d => d.id !== id));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleFail = async (id: string) => {
    if (!token) return;
    if (!confirm('Reject this deposit? The proof image will be permanently deleted.')) return;
    setActionLoading(`fail-${id}`);
    const res = await adminApi.failTransaction(id, token);
    setActionLoading(null);
    if (!res.error) {
      setDeposits(prev => prev.filter(d => d.id !== id));
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Manual Deposits</h1>
          <p className="text-text-secondary">Verify and approve manual user top-ups</p>
        </div>
        <button onClick={loadDeposits} className="btn-secondary flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {deposits.length === 0 ? (
        <div className="bg-surface-dark border border-border-dark rounded-xl p-8 text-center">
          <svg className="w-12 h-12 text-text-secondary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-white mb-1">No Pending Deposits</h3>
          <p className="text-text-secondary text-sm">All manual top-ups have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deposits.map(deposit => {
            const isCrypto = CRYPTO_GATEWAYS.has(deposit.payment_gateway);
            return (
              <div key={deposit.id} className="bg-surface-dark border border-border-dark rounded-xl overflow-hidden flex flex-col">

                {/* Proof image / placeholder */}
                <div
                  className={`h-48 w-full bg-surface-darker relative border-b border-border-dark group ${deposit.payment_proof ? 'cursor-pointer' : ''}`}
                  onClick={() => deposit.payment_proof && setSelectedImage(deposit.payment_proof)}
                >
                  {deposit.payment_proof ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={deposit.payment_proof} alt="Payment Proof" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary">
                      <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm">No Screenshot</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col gap-3">
                  {/* Amount + method */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-text-secondary mb-0.5">
                        {isCrypto ? 'Deposited' : 'Amount'}
                      </p>
                      {isCrypto ? (
                        <p className="text-xl font-bold text-amber-400">
                          ${parseFloat(deposit.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })} USDT
                        </p>
                      ) : (
                        <p className="text-xl font-bold text-emerald-400">{formatCurrency(deposit.amount)}</p>
                      )}
                    </div>
                    <MethodBadge gateway={deposit.payment_gateway} />
                  </div>

                  {/* Crypto notice */}
                  {isCrypto && (
                    <p className="text-xs text-amber-400/80 bg-amber-500/5 border border-amber-500/15 rounded-lg px-3 py-2">
                      ⚡ You will set the ₦ credit amount when approving
                    </p>
                  )}

                  {/* User */}
                  <div>
                    <p className="text-xs text-text-secondary mb-0.5">User</p>
                    <p className="text-sm text-white font-medium truncate">{deposit.user_email}</p>
                  </div>

                  {/* TXID / Order ID */}
                  {deposit.payment_reference && (
                    <div>
                      <p className="text-xs text-text-secondary mb-0.5">
                        {deposit.payment_gateway === 'binance_pay' ? 'Order ID' : 'TXID / Reference'}
                      </p>
                      <p className="text-xs text-white font-mono bg-surface-darker rounded px-2 py-1 truncate" title={deposit.payment_reference}>
                        {deposit.payment_reference}
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-text-secondary">{formatDate(deposit.created_at)}</p>

                  {/* Actions */}
                  <div className="mt-auto grid grid-cols-2 gap-3 pt-3 border-t border-border-dark">
                    <button
                      onClick={() => handleFail(deposit.id)}
                      disabled={actionLoading !== null}
                      className="py-2 px-3 rounded-lg text-sm font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `fail-${deposit.id}` ? 'Rejecting...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApproveClick(deposit)}
                      disabled={actionLoading !== null}
                      className="py-2 px-3 rounded-lg text-sm font-medium bg-emerald-500 text-white hover:bg-emerald-600 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `verify-${deposit.id}` ? 'Approving...' : isCrypto ? 'Set & Approve →' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Payment Proof"
              className="max-w-full max-h-full object-contain cursor-default"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Crypto Approval Modal */}
      {cryptoApprovalTarget && (
        <CryptoApprovalModal
          deposit={cryptoApprovalTarget}
          loading={actionLoading === `verify-${cryptoApprovalTarget.id}`}
          onConfirm={(naira) => handleVerify(cryptoApprovalTarget.id, naira)}
          onCancel={() => setCryptoApprovalTarget(null)}
        />
      )}
    </div>
  );
}

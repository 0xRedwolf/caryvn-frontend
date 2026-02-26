'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  balance_after: string;
  status?: string;
  created_at: string;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

export default function WalletPage() {
  const { user, token, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadTransactions();
      checkPendingPayment();
    }
  }, [token]);

  const checkPendingPayment = async () => {
    if (!token) return;
    const pendingRef = sessionStorage.getItem('pending_payment_ref');
    if (!pendingRef) return;

    try {
      const result = await walletApi.verifyTopup(pendingRef, token);
      if (result.data) {
        const data = result.data as { status: string };
        if (data.status === 'success') {
          sessionStorage.removeItem('pending_payment_ref');
          await refreshUser();
          loadTransactions();
        }
      }
    } catch {
      // Silently fail — will retry on next load
    }
  };

  const loadTransactions = async () => {
    if (!token) return;

    const result = await walletApi.getTransactions(token, 50, 0);
    if (result.data) {
      const data = result.data as { transactions: Transaction[] };
      setTransactions(data.transactions || []);
    }
    setLoading(false);
  };

  const handleHideTransaction = async (txId: string) => {
    if (!token) return;
    setDeleteLoading(true);
    const result = await walletApi.hideTransaction(txId, token);
    setDeleteLoading(false);
    setDeleteConfirm(null);
    if (result.data) {
      setTransactions(prev => prev.filter(tx => tx.id !== txId));
    }
  };

  const handleTopup = async () => {
    if (!token || !topupAmount) return;

    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 100) {
      setTopupError('Minimum top-up amount is ₦100');
      return;
    }
    if (amount > 500000) {
      setTopupError('Maximum top-up amount is ₦500,000');
      return;
    }

    setTopupLoading(true);
    setTopupError('');

    const callbackUrl = `${window.location.origin}/dashboard/wallet/payment-callback`;

    const result = await walletApi.initiateTopup(amount, callbackUrl, token);

    if (result.error) {
      setTopupError(result.error);
      setTopupLoading(false);
      return;
    }

    const data = result.data as { checkout_url: string; reference: string };
    if (data?.checkout_url) {
      window.location.href = data.checkout_url;
    } else {
      setTopupError('Failed to get payment link. Please try again.');
      setTopupLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'refund':
        return 'text-emerald-500';
      case 'charge':
        return 'text-red-400';
      default:
        return 'text-text-secondary';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { dot: string; text: string; bg: string; label: string }> = {
      success: { dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' },
      pending: { dot: 'bg-amber-500', text: 'text-amber-500', bg: 'bg-amber-500/10', label: 'Pending' },
      processing: { dot: 'bg-blue-500', text: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Processing' },
      failed: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', label: 'Failed' },
      canceled: { dot: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10', label: 'Canceled' },
    };
    const config = statusConfig[status || 'success'] || statusConfig.success;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Wallet</h1>
        <p className="text-text-secondary">Manage your balance and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl border border-primary/20 p-8 mb-8">
        <p className="text-text-secondary mb-2">Available Balance</p>
        <p className="text-4xl font-bold text-white mb-6">{formatCurrency(user?.balance || '0')}</p>
        <button
          className="btn-primary"
          onClick={() => {
            setShowTopup(true);
            setTopupError('');
            setTopupAmount('');
          }}
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Top Up Wallet
        </button>
      </div>

      {/* Top-Up Modal */}
      {showTopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark rounded-2xl border border-border-dark w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => { setShowTopup(false); setTopupLoading(false); }}
              className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Top Up Wallet</h2>
            <p className="text-text-secondary text-sm mb-6">Add funds via Squad payment gateway</p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              {PRESET_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  onClick={() => { setTopupAmount(amount.toString()); setTopupError(''); }}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                    topupAmount === amount.toString()
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border-dark bg-surface-darker text-text-secondary hover:border-primary/50 hover:text-white'
                  }`}
                >
                  ₦{amount.toLocaleString()}
                </button>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-text-secondary text-sm mb-1.5 block">Or enter custom amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
                <input
                  type="number"
                  className="input w-full"
                  style={{ paddingLeft: '2.5rem' }}
                  placeholder="5000"
                  min="100"
                  max="500000"
                  value={topupAmount}
                  onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }}
                />
              </div>
              <p className="text-text-secondary text-xs mt-1.5">Min: ₦100 · Max: ₦500,000</p>
            </div>

            {topupError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {topupError}
              </div>
            )}

            <button
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {topupLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Connecting to Squad...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Deposit{topupAmount ? ` ₦${parseFloat(topupAmount).toLocaleString()}` : ''} with Squad
                </>
              )}
            </button>

            <div className="flex items-center gap-2 mt-4 justify-center">
              <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-text-secondary text-xs">Secured by Squad Payment Gateway</p>
            </div>
          </div>
        </div>
      )}

      {/* Transactions */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        <div className="p-5 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-border-dark">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-4 relative">
                {/* Delete X button — top right */}
                <button
                  onClick={() => setDeleteConfirm(tx.id)}
                  style={{ position: 'absolute', top: '8px', right: '8px', padding: '4px', borderRadius: '4px', color: '#6b7280', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                  title="Remove from history"
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div style={{ paddingRight: '24px' }} className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 hidden md:flex items-center justify-center ${
                      tx.type === 'deposit' || tx.type === 'refund' 
                        ? 'bg-emerald-500/10' 
                        : 'bg-red-500/10'
                    }`}>
                      <svg 
                        className={`w-5 h-5 ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-emerald-500' : 'text-red-400'}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d={tx.type === 'deposit' || tx.type === 'refund' 
                            ? 'M12 4v16m0-16l-4 4m4-4l4 4' 
                            : 'M12 20V4m0 16l4-4m-4 4l-4-4'
                          } 
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium capitalize">{tx.type}</p>
                      <p className="text-text-secondary text-sm truncate">{tx.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-medium ${getTypeColor(tx.type)}`}>
                        {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-text-secondary text-xs">{formatDate(tx.created_at)}</p>
                    </div>
                    <div className="w-28 flex justify-end">
                      {getStatusBadge(tx.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary">No transactions yet</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Remove Transaction</h3>
            <p className="text-text-secondary text-sm mb-6">
              This will remove the transaction from your history. This only hides it from your view, it won&apos;t affect your balance.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-darker text-text-secondary border border-border-dark hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleHideTransaction(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

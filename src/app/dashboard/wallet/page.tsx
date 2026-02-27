'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { walletApi, adminApi } from '@/lib/api';
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Manual transfer states
  const [topupMethod, setTopupMethod] = useState<'automatic' | 'manual'>('automatic');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [siteSettings, setSiteSettings] = useState<{
    manual_bank_name?: string;
    manual_account_name?: string;
    manual_account_number?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadTransactions();
      checkPendingPayment();
      loadSettings();
    }
  }, [token]);

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500); // Give the spin animation time
  };

  const loadSettings = async () => {
    if (!token) return;
    try {
      const res = await adminApi.getSiteSettings(token);
      if (res.data) {
        setSiteSettings(res.data as any);
      }
    } catch (err) {
      console.error('Failed to load site settings', err);
    }
  };

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

    if (topupMethod === 'automatic') {
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
    } else {
      // Manual topup
      if (!proofFile) {
        setTopupError('Please upload a proof of payment.');
        setTopupLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append('amount', amount.toString());
      formData.append('payment_proof', proofFile);

      const result = await walletApi.initiateManualTopup(formData, token);
      
      setTopupLoading(false);
      
      if (result.error) {
        setTopupError(result.error);
        return;
      }

      // Success! Reset states and refresh txs
      setShowTopup(false);
      setTopupAmount('');
      setProofFile(null);
      setTopupMethod('automatic');
      await loadTransactions();
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
        <div className="flex items-center gap-3 mb-2">
          <p className="text-text-secondary">Available Balance</p>
          <button 
            onClick={handleRefreshBalance}
            disabled={isRefreshing}
            className="text-text-secondary hover:text-white transition-colors"
            title="Refresh Balance"
          >
            <svg 
              className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
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

            <h2 className="text-xl font-bold text-white mb-4">Top Up Wallet</h2>
            
            {/* Method Tabs */}
            <div className="flex bg-surface-darker p-1 rounded-xl mb-6">
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  topupMethod === 'automatic'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setTopupMethod('automatic')}
              >
                Automatic (Squad)
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  topupMethod === 'manual'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setTopupMethod('manual')}
              >
                Manual Transfer
              </button>
            </div>

            {topupMethod === 'manual' && siteSettings && (
              <div className="bg-surface-darker border border-border-dark rounded-xl p-4 mb-6">
                <h4 className="text-sm font-medium text-white mb-3">Transfer Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Bank Name:</span>
                    <span className="text-white font-medium">{siteSettings.manual_bank_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Account Name:</span>
                    <span className="text-white font-medium">{siteSettings.manual_account_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Account Number:</span>
                    <span className="text-primary font-mono font-medium">{siteSettings.manual_account_number || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}

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
              <label className="text-text-secondary text-sm mb-1.5 block">Amount (₦)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
                <input
                  type="number"
                  className="input w-full pl-10 text-center"
                  placeholder="5000"
                  min="100"
                  max="500000"
                  value={topupAmount}
                  onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }}
                />
              </div>
              <p className="text-text-secondary text-xs mt-1.5">Min: ₦100 · Max: ₦500,000</p>
            </div>
            
            {topupMethod === 'manual' && (
              <div className="mb-6">
                 <label className="text-text-secondary text-sm mb-1.5 block">Payment Proof (Screenshot)</label>
                 <input 
                   type="file" 
                   ref={fileInputRef}
                   accept="image/*,application/pdf"
                   className="hidden"
                   onChange={(e) => {
                     const file = e.target.files?.[0];
                     if (file) setProofFile(file);
                   }}
                 />
                 <div 
                   onClick={() => fileInputRef.current?.click()}
                   className="border-2 border-dashed border-border-dark rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface-darker/50"
                 >
                   {proofFile ? (
                     <div className="flex flex-col items-center">
                       <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <span className="text-sm font-medium text-white truncate max-w-full px-4">{proofFile.name}</span>
                       <span className="text-xs text-text-secondary mt-1">Click to change</span>
                     </div>
                   ) : (
                     <div className="flex flex-col items-center py-2">
                       <svg className="w-8 h-8 text-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                       </svg>
                       <span className="text-sm text-text-secondary">Click to upload proof</span>
                       <span className="text-xs text-text-secondary/70 mt-1">JPG, PNG, PDF up to 5MB</span>
                     </div>
                   )}
                 </div>
              </div>
            )}

            {topupError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">
                {topupError}
              </div>
            )}

            <button
              onClick={handleTopup}
              disabled={topupLoading || !topupAmount || (topupMethod === 'manual' && !proofFile)}
              className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {topupLoading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {topupMethod === 'automatic' 
                    ? `Deposit${topupAmount ? ` ₦${parseFloat(topupAmount).toLocaleString()}` : ''} with Squad`
                    : `Submit Proof to Admin`
                  }
                </>
              )}
            </button>

            {topupMethod === 'automatic' && (
              <div className="flex items-center gap-2 mt-4 justify-center">
                <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-text-secondary text-xs">Secured by Squad Payment Gateway</p>
              </div>
            )}
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

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

interface SiteSettings {
  manual_bank_name?: string;
  manual_account_name?: string;
  manual_account_number?: string;
  binance_pay_id?: string;
  binance_pay_qr?: string | null;
  crypto_usdt_trc20?: string;
  crypto_usdt_bep20?: string;
  crypto_sol?: string;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];

type TopupMethod = 'automatic' | 'manual' | 'crypto';
type CryptoMethod = 'binance_pay' | 'on_chain';
type CryptoToken = 'usdt_trc20' | 'usdt_bep20' | 'sol';

const TOKEN_LABELS: Record<CryptoToken, { label: string; network: string; color: string }> = {
  usdt_trc20: { label: 'USDT-TRC20', network: 'Tron (TRC20)', color: 'text-emerald-400' },
  usdt_bep20: { label: 'USDT-BEP20', network: 'BNB Smart Chain (BEP20)', color: 'text-amber-400' },
  sol:        { label: 'USDC-SOL',   network: 'Solana (USDC)',           color: 'text-purple-400' },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} className={`flex-shrink-0 text-xs px-2.5 py-1 rounded-lg border transition-colors ${copied ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-border-dark bg-surface-darker text-text-secondary hover:text-white hover:border-primary/50'}`}>
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function WalletPage() {
  const { user, token, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const [topupSuccess, setTopupSuccess] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Method tabs
  const [topupMethod, setTopupMethod] = useState<TopupMethod>('automatic');

  // Manual bank
  const [proofFile, setProofFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crypto
  const [cryptoMethod, setCryptoMethod] = useState<CryptoMethod>('binance_pay');
  const [cryptoStep, setCryptoStep] = useState<1 | 2>(1);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cryptoToken, setCryptoToken] = useState<CryptoToken>('usdt_trc20');
  const [cryptoReferenceId, setCryptoReferenceId] = useState('');
  const [cryptoProofFile, setCryptoProofFile] = useState<File | null>(null);
  const cryptoFileInputRef = useRef<HTMLInputElement>(null);

  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (token) {
      loadTransactions();
      checkPendingPayment();
      loadSettings();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleRefreshBalance = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await refreshUser();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  async function loadSettings() {
    if (!token) return;
    try {
      const res = await adminApi.getSiteSettings(token);
      if (res.data) setSiteSettings(res.data as SiteSettings);
    } catch (err) {
      console.error('Failed to load site settings', err);
    }
  };

  async function checkPendingPayment() {
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
    } catch { /* silently fail */ }
  };

  async function loadTransactions() {
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
    if (result.data) setTransactions(prev => prev.filter(tx => tx.id !== txId));
  };

  const resetTopup = () => {
    setShowTopup(false);
    setTopupLoading(false);
    setTopupAmount('');
    setTopupError('');
    setTopupSuccess('');
    setProofFile(null);
    setTopupMethod('automatic');
    setCryptoMethod('binance_pay');
    setCryptoStep(1);
    setCryptoReferenceId('');
    setCryptoProofFile(null);
    setShowConfirmModal(false);
  };

  // ── Automatic (Squad) topup ──────────────────────────────────────────────
  const handleAutomaticTopup = async () => {
    if (!token || !topupAmount) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 100) { setTopupError('Minimum top-up amount is ₦100'); return; }
    if (amount > 500000) { setTopupError('Maximum top-up amount is ₦500,000'); return; }
    setTopupLoading(true);
    setTopupError('');
    const callbackUrl = `${window.location.origin}/dashboard/wallet/payment-callback`;
    const result = await walletApi.initiateTopup(amount, callbackUrl, token);
    if (result.error) { setTopupError(result.error); setTopupLoading(false); return; }
    const data = result.data as { checkout_url: string; reference: string };
    if (data?.checkout_url) { window.location.href = data.checkout_url; }
    else { setTopupError('Failed to get payment link. Please try again.'); setTopupLoading(false); }
  };

  // ── Manual bank topup ────────────────────────────────────────────────────
  const handleManualTopup = async () => {
    if (!token || !topupAmount || !proofFile) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 100) { setTopupError('Minimum top-up amount is ₦100'); return; }
    setTopupLoading(true);
    setTopupError('');
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('payment_proof', proofFile);
    const result = await walletApi.initiateManualTopup(formData, token);
    setTopupLoading(false);
    if (result.error) { setTopupError(result.error); return; }
    setTopupSuccess('Payment proof submitted! Admin will review shortly.');
    await loadTransactions();
  };

  // ── Crypto topup ─────────────────────────────────────────────────────────
  const handleCryptoSubmit = async () => {
    if (!token) return;
    if (!cryptoReferenceId.trim()) {
      setTopupError(cryptoMethod === 'binance_pay' ? 'Please enter your Binance Order ID' : 'Please enter the Transaction ID (TXID)');
      return;
    }
    if (cryptoMethod === 'on_chain' && !cryptoProofFile) {
      setTopupError('Please upload a screenshot of the transaction');
      return;
    }
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 2) {
      setTopupError('Minimum crypto deposit is $2 USDT');
      return;
    }
    setTopupLoading(true);
    setTopupError('');
    const formData = new FormData();
    formData.append('method', cryptoMethod);
    formData.append('amount', amount.toString());
    formData.append('reference_id', cryptoReferenceId.trim());
    if (cryptoMethod === 'on_chain') {
      formData.append('token', cryptoToken);
      if (cryptoProofFile) formData.append('payment_proof', cryptoProofFile);
    }
    const result = await walletApi.initiateCryptoTopup(formData, token);
    setTopupLoading(false);
    if (result.error) { setTopupError(result.error); return; }
    setTopupSuccess('Crypto deposit submitted! Admin will review and credit your account shortly.');
    await loadTransactions();
  };

  const activeWalletAddress = (): string => {
    if (!siteSettings) return '';
    if (cryptoToken === 'usdt_trc20') return siteSettings.crypto_usdt_trc20 || '';
    if (cryptoToken === 'usdt_bep20') return siteSettings.crypto_usdt_bep20 || '';
    if (cryptoToken === 'sol') return siteSettings.crypto_sol || '';
    return '';
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': case 'refund': return 'text-emerald-500';
      case 'charge': return 'text-red-400';
      default: return 'text-text-secondary';
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { dot: string; text: string; bg: string; label: string }> = {
      success:    { dot: 'bg-emerald-500', text: 'text-emerald-500', bg: 'bg-emerald-500/10', label: 'Completed' },
      pending:    { dot: 'bg-amber-500',   text: 'text-amber-500',   bg: 'bg-amber-500/10',   label: 'Pending' },
      processing: { dot: 'bg-blue-500',    text: 'text-blue-500',    bg: 'bg-blue-500/10',    label: 'Processing' },
      failed:     { dot: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Failed' },
      canceled:   { dot: 'bg-red-500',     text: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Canceled' },
    };
    const config = statusConfig[status || 'success'] || statusConfig.success;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const TabBtn = ({ id, label }: { id: TopupMethod; label: string }) => (
    <button
      className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${topupMethod === id ? 'bg-primary text-white shadow-sm' : 'text-text-secondary hover:text-white hover:bg-white/5'}`}
      onClick={() => { setTopupMethod(id); setTopupError(''); setTopupSuccess(''); }}
    >
      {label}
    </button>
  );

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
          <button onClick={handleRefreshBalance} disabled={isRefreshing} className="text-text-secondary hover:text-white transition-colors" title="Refresh Balance">
            <svg className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
        <p className="text-4xl font-bold text-white mb-6">{formatCurrency(user?.balance || '0')}</p>
        <button className="btn-primary" onClick={() => { setShowTopup(true); setTopupError(''); setTopupAmount(''); }}>
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Top Up Wallet
        </button>
      </div>

      {/* ── Top-Up Modal ─────────────────────────────────────────────────── */}
      {showTopup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-dark rounded-2xl border border-border-dark w-full max-w-md p-6 relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <button onClick={resetTopup} className="absolute top-4 right-4 text-text-secondary hover:text-white transition-colors z-10">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-xl font-bold text-white mb-4">Top Up Wallet</h2>

            {/* Method Tabs */}
            <div className="flex bg-surface-darker p-1 rounded-xl mb-5 gap-1">
              <TabBtn id="automatic" label="Auto (Squad)" />
              <TabBtn id="manual"    label="Bank Transfer" />
              <TabBtn id="crypto"    label="Crypto" />
            </div>

            {/* ── Success Banner ───────────────────────── */}
            {topupSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-4 mb-4 text-sm flex gap-3 items-start">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-medium">Submitted Successfully</p>
                  <p className="text-emerald-400/80 text-xs mt-0.5">{topupSuccess}</p>
                </div>
              </div>
            )}

            {/* ── AUTOMATIC TAB ───────────────────────── */}
            {topupMethod === 'automatic' && !topupSuccess && (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRESET_AMOUNTS.map(a => (
                    <button key={a}
                      onClick={() => { setTopupAmount(a.toString()); setTopupError(''); }}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${topupAmount === a.toString() ? 'border-primary bg-primary/10 text-primary' : 'border-border-dark bg-surface-darker text-text-secondary hover:border-primary/50 hover:text-white'}`}
                    >₦{a.toLocaleString()}</button>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-text-secondary text-sm mb-1.5 block">Amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
                    <input type="number" className="input w-full pl-10 text-center" placeholder="5000" min="100" max="500000"
                      value={topupAmount} onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }} />
                  </div>
                  <p className="text-text-secondary text-xs mt-1.5">Min: ₦100 · Max: ₦500,000</p>
                </div>
                {topupError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{topupError}</div>}
                <button onClick={handleAutomaticTopup} disabled={topupLoading || !topupAmount}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {topupLoading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
                    : `Deposit${topupAmount ? ` ₦${parseFloat(topupAmount).toLocaleString()}` : ''} with Squad`}
                </button>
                <div className="flex items-center gap-2 mt-4 justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p className="text-text-secondary text-xs">Secured by Squad Payment Gateway</p>
                </div>
              </>
            )}

            {/* ── MANUAL BANK TAB ─────────────────────── */}
            {topupMethod === 'manual' && !topupSuccess && (
              <>
                {siteSettings && (
                  <div className="bg-surface-darker border border-border-dark rounded-xl p-4 mb-5">
                    <h4 className="text-sm font-medium text-white mb-3">Transfer Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-text-secondary">Bank:</span><span className="text-white font-medium">{siteSettings.manual_bank_name || 'N/A'}</span></div>
                      <div className="flex justify-between"><span className="text-text-secondary">Account Name:</span><span className="text-white font-medium">{siteSettings.manual_account_name || 'N/A'}</span></div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-text-secondary">Account No:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-mono font-medium">{siteSettings.manual_account_number || 'N/A'}</span>
                          {siteSettings.manual_account_number && <CopyButton value={siteSettings.manual_account_number} />}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {PRESET_AMOUNTS.map(a => (
                    <button key={a} onClick={() => { setTopupAmount(a.toString()); setTopupError(''); }}
                      className={`py-3 rounded-xl border text-sm font-medium transition-all ${topupAmount === a.toString() ? 'border-primary bg-primary/10 text-primary' : 'border-border-dark bg-surface-darker text-text-secondary hover:border-primary/50 hover:text-white'}`}
                    >₦{a.toLocaleString()}</button>
                  ))}
                </div>
                <div className="mb-4">
                  <label className="text-text-secondary text-sm mb-1.5 block">Amount (₦)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">₦</span>
                    <input type="number" className="input w-full pl-10 text-center" placeholder="5000" min="100"
                      value={topupAmount} onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }} />
                  </div>
                </div>
                <div className="mb-5">
                  <label className="text-text-secondary text-sm mb-1.5 block">Payment Proof (Screenshot)</label>
                  <input type="file" ref={fileInputRef} accept="image/jpeg,image/png,application/pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) setProofFile(f); }} />
                  <div onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border-dark rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface-darker/50">
                    {proofFile ? (
                      <div className="flex flex-col items-center">
                        <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <span className="text-sm font-medium text-white truncate max-w-full px-4">{proofFile.name}</span>
                        <span className="text-xs text-text-secondary mt-1">Click to change</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-2">
                        <svg className="w-8 h-8 text-text-secondary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        <span className="text-sm text-text-secondary">Click to upload proof</span>
                        <span className="text-xs text-text-secondary/70 mt-1">JPG, PNG, PDF up to 5MB</span>
                      </div>
                    )}
                  </div>
                </div>
                {topupError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{topupError}</div>}
                <button onClick={handleManualTopup} disabled={topupLoading || !topupAmount || !proofFile}
                  className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {topupLoading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</> : 'Submit Proof to Admin'}
                </button>
              </>
            )}

            {/* ── CRYPTO TAB ──────────────────────────── */}
            {topupMethod === 'crypto' && !topupSuccess && (
              <>
                {/* Crypto sub-method buttons */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  {(['binance_pay', 'on_chain'] as CryptoMethod[]).map(m => (
                    <button key={m}
                      onClick={() => { setCryptoMethod(m); setCryptoStep(1); setTopupError(''); setCryptoReferenceId(''); setCryptoProofFile(null); }}
                      className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${cryptoMethod === m ? 'border-amber-500/50 bg-amber-500/10 text-amber-400' : 'border-border-dark bg-surface-darker text-text-secondary hover:text-white hover:border-border-dark/80'}`}
                    >
                      {m === 'binance_pay' ? 'Binance Pay' : 'On-Chain'}
                    </button>
                  ))}
                </div>

                {/* Amount field */}
                <div className="mb-5">
                  <label className="text-text-secondary text-sm mb-1.5 block">Amount (USDT)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary font-medium">$</span>
                    <input type="number" className="input w-full pl-10 text-center" placeholder="10" min="2" step="0.01"
                      value={topupAmount} onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }} />
                  </div>
                  <p className="text-text-secondary text-xs mt-1">Min: $2 USDT</p>
                </div>

                {/* ── BINANCE PAY FLOW ── */}
                {cryptoMethod === 'binance_pay' && (
                  <>
                    {/* Progress bar */}
                    <div className="flex items-center gap-2 mb-5">
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${cryptoStep === 1 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                        {cryptoStep === 1 ? '① Make Payment' : '✓ Payment Made'}
                      </div>
                      <div className="flex-1 h-px bg-border-dark" />
                      <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${cryptoStep === 2 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-surface-darker text-text-secondary border border-border-dark'}`}>
                        ② Verify Payment
                      </div>
                    </div>

                    {cryptoStep === 1 ? (
                      <>
                        {/* Step 1: Show Binance ID + QR */}
                        <div className="bg-surface-darker border border-border-dark rounded-xl p-4 mb-5 space-y-4">
                          <div>
                            <p className="text-xs text-text-secondary mb-2">Binance Pay ID</p>
                            <div className="flex items-center gap-2">
                              <span className="flex-1 font-mono text-white text-sm bg-surface-dark rounded-lg px-3 py-2 truncate">
                                {siteSettings?.binance_pay_id || 'Not configured'}
                              </span>
                              {siteSettings?.binance_pay_id && <CopyButton value={siteSettings.binance_pay_id} />}
                            </div>
                          </div>
                          {siteSettings?.binance_pay_qr && (
                            <div className="text-center">
                              <p className="text-xs text-text-secondary mb-2">Scan QR Code</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={siteSettings.binance_pay_qr} alt="Binance Pay QR" className="mx-auto h-36 w-36 rounded-xl object-contain border border-border-dark bg-white p-1" />
                            </div>
                          )}
                          <p className="text-xs text-text-secondary text-center">
                            Send exactly <span className="text-amber-400 font-medium">${topupAmount || '...'} USDT</span> to the Binance ID above
                          </p>
                        </div>
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={!topupAmount || parseFloat(topupAmount) < 2}
                          className="w-full py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          I&apos;ve Completed the Payment →
                        </button>
                      </>
                    ) : (
                      <>
                        {/* Step 2: Enter Order ID */}
                        <div className="mb-5">
                          <label className="text-text-secondary text-sm mb-1.5 block">Binance Order ID</label>
                          <input
                            type="text" className="input w-full font-mono"
                            placeholder="e.g. 12345678901234"
                            value={cryptoReferenceId}
                            onChange={(e) => { setCryptoReferenceId(e.target.value); setTopupError(''); }}
                          />
                          <p className="text-xs text-text-secondary mt-1.5">Found in Binance App → Pay → Order History</p>
                        </div>
                        {topupError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{topupError}</div>}
                        <div className="flex gap-3">
                          <button onClick={() => { setCryptoStep(1); setTopupError(''); }} className="px-4 py-3 rounded-xl border border-border-dark text-text-secondary hover:text-white text-sm transition-colors">
                            ← Back
                          </button>
                          <button onClick={handleCryptoSubmit} disabled={topupLoading || !cryptoReferenceId.trim()}
                            className="flex-1 btn-primary py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {topupLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : 'Verify Payment'}
                          </button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* ── ON-CHAIN FLOW ── */}
                {cryptoMethod === 'on_chain' && (
                  <>
                    {/* Token selector */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {(Object.entries(TOKEN_LABELS) as [CryptoToken, typeof TOKEN_LABELS[CryptoToken]][]).map(([key, meta]) => (
                        <button key={key}
                          onClick={() => setCryptoToken(key)}
                          className={`py-2 px-1 rounded-xl border text-xs font-medium transition-all text-center ${cryptoToken === key ? `border-primary/50 bg-primary/10 ${meta.color}` : 'border-border-dark bg-surface-darker text-text-secondary hover:text-white'}`}
                        >{meta.label}</button>
                      ))}
                    </div>

                    {/* Wallet address */}
                    <div className="bg-surface-darker border border-border-dark rounded-xl p-4 mb-4 space-y-3">
                      <div>
                        <p className="text-xs text-text-secondary mb-1">Network</p>
                        <p className={`text-sm font-medium ${TOKEN_LABELS[cryptoToken].color}`}>{TOKEN_LABELS[cryptoToken].network}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary mb-2">Wallet Address</p>
                        <div className="flex items-center gap-2">
                          <span className="flex-1 font-mono text-white text-xs bg-surface-dark rounded-lg px-3 py-2 truncate">
                            {activeWalletAddress() || 'Not configured'}
                          </span>
                          {activeWalletAddress() && <CopyButton value={activeWalletAddress()} />}
                        </div>
                      </div>
                      <p className="text-xs text-red-400/80 font-bold">⚠ Only send {TOKEN_LABELS[cryptoToken].label} on the {TOKEN_LABELS[cryptoToken].network} network</p>
                    </div>

                    {/* TXID */}
                    <div className="mb-4">
                      <label className="text-text-secondary text-sm mb-1.5 block">Transaction ID (TXID)</label>
                      <input type="text" className="input w-full font-mono text-sm" placeholder="Paste TXID from your wallet..."
                        value={cryptoReferenceId}
                        onChange={(e) => { setCryptoReferenceId(e.target.value); setTopupError(''); }} />
                    </div>

                    {/* Screenshot upload */}
                    <div className="mb-5">
                      <label className="text-text-secondary text-sm mb-1.5 block">Transaction Screenshot</label>
                      <input type="file" ref={cryptoFileInputRef} accept="image/jpeg,image/png" className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) setCryptoProofFile(f); }} />
                      <div onClick={() => cryptoFileInputRef.current?.click()}
                        className="border-2 border-dashed border-border-dark rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-colors bg-surface-darker/50">
                        {cryptoProofFile ? (
                          <div className="flex flex-col items-center">
                            <svg className="w-7 h-7 text-emerald-500 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium text-white truncate max-w-full px-4">{cryptoProofFile.name}</span>
                            <span className="text-xs text-text-secondary mt-1">Click to change</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-1">
                            <svg className="w-7 h-7 text-text-secondary mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                            <span className="text-sm text-text-secondary">Upload screenshot (JPG/PNG)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {topupError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 mb-4 text-sm">{topupError}</div>}
                    <button onClick={handleCryptoSubmit} disabled={topupLoading || !cryptoReferenceId.trim() || !cryptoProofFile || !topupAmount}
                      className="btn-primary w-full py-3.5 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                      {topupLoading ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Submitting...</> : 'Submit for Admin Review'}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Close button shown after success */}
            {topupSuccess && (
              <button onClick={resetTopup} className="btn-primary w-full mt-2">Close</button>
            )}
          </div>
        </div>
      )}

      {/* ── Binance Pay Confirmation Modal ───────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Confirm Transfer</h3>
                <p className="text-text-secondary text-sm">Have you completed the Binance Pay transfer?</p>
              </div>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              Make sure you have sent <span className="text-amber-400 font-semibold">${topupAmount} USDT</span> to the Binance Pay ID before proceeding. Incorrect submissions may delay your deposit.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-border-dark text-text-secondary hover:text-white text-sm transition-colors">
                Go Back
              </button>
              <button
                onClick={() => { setShowConfirmModal(false); setCryptoStep(2); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 hover:bg-amber-500/30 text-sm font-medium transition-colors"
              >
                Yes, I&apos;ve Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transactions ─────────────────────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        <div className="p-5 border-b border-border-dark">
          <h2 className="text-lg font-semibold text-white">Transaction History</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-border-dark">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 relative cursor-pointer hover:bg-white/[0.02] active:bg-white/5 transition-colors"
                onClick={() => setSelectedTx(tx)}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(tx.id); }}
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
                    <div className={`w-10 h-10 rounded-lg flex-shrink-0 hidden md:flex items-center justify-center ${tx.type === 'deposit' || tx.type === 'refund' ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                      <svg className={`w-5 h-5 ${tx.type === 'deposit' || tx.type === 'refund' ? 'text-emerald-500' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tx.type === 'deposit' || tx.type === 'refund' ? 'M12 4v16m0-16l-4 4m4-4l4 4' : 'M12 20V4m0 16l4-4m-4 4l-4-4'} />
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
                    <div className="w-28 flex justify-end">{getStatusBadge(tx.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center"><p className="text-text-secondary">No transactions yet</p></div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Remove Transaction</h3>
            <p className="text-text-secondary text-sm mb-6">This will remove the transaction from your history. This only hides it from your view, it won&apos;t affect your balance.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-darker text-text-secondary border border-border-dark hover:text-white transition-colors">Cancel</button>
              <button onClick={() => handleHideTransaction(deleteConfirm)} disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50">
                {deleteLoading ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction Detail Sheet ──────────────────────────────────────── */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-surface-dark border border-border-dark w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl p-6 animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull handle (mobile) */}
            <div className="w-10 h-1 bg-border-dark rounded-full mx-auto mb-5 sm:hidden" />

            {/* Icon + type */}
            <div className="flex items-center gap-4 mb-5">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                selectedTx.type === 'deposit' || selectedTx.type === 'refund' ? 'bg-emerald-500/10' : 'bg-red-500/10'
              }`}>
                <svg className={`w-6 h-6 ${
                  selectedTx.type === 'deposit' || selectedTx.type === 'refund' ? 'text-emerald-500' : 'text-red-400'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d={selectedTx.type === 'deposit' || selectedTx.type === 'refund'
                      ? 'M12 4v16m0-16l-4 4m4-4l4 4'
                      : 'M12 20V4m0 16l4-4m-4 4l-4-4'} />
                </svg>
              </div>
              <div>
                <p className="text-white font-semibold capitalize text-lg">{selectedTx.type}</p>
                <p className="text-text-secondary text-sm">{formatDate(selectedTx.created_at)}</p>
              </div>
              <div className="ml-auto">{getStatusBadge(selectedTx.status)}</div>
            </div>

            {/* Full description */}
            <div className="bg-surface-darker border border-border-dark rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-text-secondary mb-1">Description</p>
              <p className="text-white text-sm leading-relaxed">{selectedTx.description}</p>
            </div>

            {/* Amount + balance after */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-surface-darker border border-border-dark rounded-xl px-4 py-3">
                <p className="text-xs text-text-secondary mb-1">Amount</p>
                <p className={`font-semibold font-mono ${getTypeColor(selectedTx.type)}`}>
                  {parseFloat(selectedTx.amount) >= 0 ? '+' : ''}{formatCurrency(selectedTx.amount)}
                </p>
              </div>
              <div className="bg-surface-darker border border-border-dark rounded-xl px-4 py-3">
                <p className="text-xs text-text-secondary mb-1">Balance After</p>
                <p className="text-white font-semibold font-mono">{formatCurrency(selectedTx.balance_after)}</p>
              </div>
            </div>

            <button
              onClick={() => setSelectedTx(null)}
              className="w-full py-3 rounded-xl border border-border-dark text-text-secondary hover:text-white text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

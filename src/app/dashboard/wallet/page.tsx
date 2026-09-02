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
  payment_gateway?: string;
  payment_reference?: string;
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
  // Payment method toggles
  squad_enabled?: boolean;
  nexapay_enabled?: boolean;
  manual_bank_enabled?: boolean;
  crypto_enabled?: boolean;
}

interface NexaPaySession {
  reference: string;
  amount: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  expires_at?: string;
  created_time: number;
}

const PRESET_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000];
const TX_PAGE_SIZE = 20;

type TopupMethod = 'automatic' | 'manual' | 'crypto';
type AutoSubMethod = 'nexapay' | 'squad';
type CryptoMethod = 'binance_pay' | 'on_chain';
type CryptoToken = 'usdt_trc20' | 'usdt_bep20' | 'sol';

const TOKEN_LABELS: Record<CryptoToken, { label: string; network: string; color: string; bg: string }> = {
  usdt_trc20: { label: 'USDT-TRC20', network: 'Tron (TRC20)', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  usdt_bep20: { label: 'USDT-BEP20', network: 'BNB Smart Chain (BEP20)', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  sol:        { label: 'USDC-SOL',   network: 'Solana (USDC)',           color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const copy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
        copied
          ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          <span>Copied</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy</span>
        </>
      )}
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
  const [txOffset, setTxOffset] = useState(0);
  const [txTotal, setTxTotal] = useState(0);

  // Method selection
  const [topupMethod, setTopupMethod] = useState<TopupMethod>('automatic');
  const [autoSubMethod, setAutoSubMethod] = useState<AutoSubMethod>('nexapay');

  // NexaPay Active Session state
  const [nexaSession, setNexaSession] = useState<NexaPaySession | null>(null);
  const [nexaTimeLeft, setNexaTimeLeft] = useState<number>(1800); // 30 minutes in seconds

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

  // NexaPay countdown timer
  useEffect(() => {
    if (!nexaSession) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - nexaSession.created_time) / 1000);
      const remaining = Math.max(0, 1800 - elapsed);
      setNexaTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [nexaSession]);

  // NexaPay Auto-Polling for payment confirmation
  useEffect(() => {
    if (!nexaSession || !token) return;
    let isCancelled = false;

    const pollStatus = async () => {
      try {
        const res = await walletApi.checkNexaPayStatus(nexaSession.reference, token);
        if (isCancelled) return;
        if (res.data) {
          const data = res.data as { status: string; amount?: string };
          if (data.status === 'success') {
            setTopupSuccess(`₦${parseFloat(nexaSession.amount).toLocaleString()} received! Your wallet has been credited.`);
            setNexaSession(null);
            await refreshUser();
            loadTransactions();
          }
        }
      } catch {
        /* poll silently */
      }
    };

    const pollInterval = setInterval(pollStatus, 4000);
    return () => {
      isCancelled = true;
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nexaSession, token]);

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
      if (res.data) {
        const s = res.data as SiteSettings;
        setSiteSettings(s);
        // Default sub-method based on what is active
        if (s.nexapay_enabled !== false) {
          setAutoSubMethod('nexapay');
        } else if (s.squad_enabled !== false) {
          setAutoSubMethod('squad');
        }
      }
    } catch (err) {
      console.error('Failed to load site settings', err);
    }
  }

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
  }

  async function loadTransactions(offset = 0) {
    if (!token) return;
    const result = await walletApi.getTransactions(token, TX_PAGE_SIZE, offset);
    if (result.data) {
      const data = result.data as { transactions: Transaction[]; total: number };
      setTransactions(data.transactions || []);
      setTxTotal(data.total || 0);
      setTxOffset(offset);
    }
    setLoading(false);
  }

  const handleHideTransaction = async (txId: string) => {
    if (!token) return;
    setDeleteLoading(true);
    const result = await walletApi.hideTransaction(txId, token);
    setDeleteLoading(false);
    setDeleteConfirm(null);
    if (result.data) setTransactions(prev => prev.filter(tx => tx.id !== txId));
  };

  const isAutomaticAvailable = () => {
    if (!siteSettings) return true;
    return siteSettings.squad_enabled !== false || siteSettings.nexapay_enabled !== false;
  };

  const firstEnabledMethod = (s: SiteSettings | null): TopupMethod => {
    if (!s) return 'automatic';
    if (s.squad_enabled !== false || s.nexapay_enabled !== false) return 'automatic';
    if (s.manual_bank_enabled !== false) return 'manual';
    return 'crypto';
  };

  const resetTopup = () => {
    setShowTopup(false);
    setTopupLoading(false);
    setTopupAmount('');
    setTopupError('');
    setTopupSuccess('');
    setProofFile(null);
    setNexaSession(null);
    setTopupMethod(firstEnabledMethod(siteSettings));
    setCryptoMethod('binance_pay');
    setCryptoStep(1);
    setCryptoReferenceId('');
    setCryptoProofFile(null);
    setShowConfirmModal(false);
  };

  // ── Automatic Top-Up Handler ─────────────────────────────────────────────
  const handleAutomaticTopup = async () => {
    if (!token || !topupAmount) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 500) { setTopupError('Minimum top-up amount is ₦500'); return; }
    if (amount > 500000) { setTopupError('Maximum top-up amount is ₦500,000'); return; }
    setTopupLoading(true);
    setTopupError('');

    if (autoSubMethod === 'nexapay') {
      // NexaPay virtual account flow
      try {
        const result = await walletApi.initiateNexaPayTopup(amount, token);
        setTopupLoading(false);
        if (result.error) {
          setTopupError(result.error);
          return;
        }
        const data = result.data as {
          reference: string;
          amount: string;
          bank_name: string;
          account_number: string;
          account_name: string;
          expires_at?: string;
        };
        setNexaSession({
          reference: data.reference,
          amount: data.amount,
          bank_name: data.bank_name,
          account_number: data.account_number,
          account_name: data.account_name,
          expires_at: data.expires_at,
          created_time: Date.now(),
        });
        setNexaTimeLeft(1800);
      } catch (err: unknown) {
        setTopupLoading(false);
        setTopupError(err instanceof Error ? err.message : 'Failed to generate account');
      }
    } else {
      // Squad card checkout redirect
      const callbackUrl = `${window.location.origin}/dashboard/wallet/payment-callback`;
      const result = await walletApi.initiateTopup(amount, callbackUrl, token);
      if (result.error) { setTopupError(result.error); setTopupLoading(false); return; }
      const data = result.data as { checkout_url: string; reference: string };
      if (data?.checkout_url) {
        sessionStorage.setItem('pending_payment_ref', data.reference);
        window.location.href = data.checkout_url;
      } else {
        setTopupError('Failed to get payment link. Please try again.');
        setTopupLoading(false);
      }
    }
  };

  // ── Manual bank topup ────────────────────────────────────────────────────
  const handleManualTopup = async () => {
    if (!token || !topupAmount || !proofFile) return;
    const amount = parseFloat(topupAmount);
    if (isNaN(amount) || amount < 500) { setTopupError('Minimum deposit is ₦500'); return; }
    setTopupLoading(true);
    setTopupError('');
    const formData = new FormData();
    formData.append('amount', amount.toString());
    formData.append('payment_proof', proofFile);
    const result = await walletApi.initiateManualTopup(formData, token);
    setTopupLoading(false);
    if (result.error) { setTopupError(result.error); return; }
    setTopupSuccess('Payment proof submitted! Admin will review and credit your wallet shortly.');
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

  const getStatusBadge = (status?: string) => {
    const statusConfig: Record<string, { dot: string; text: string; bg: string; label: string }> = {
      success:    { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border border-emerald-200/60', label: 'Completed' },
      pending:    { dot: 'bg-amber-500',   text: 'text-amber-700',   bg: 'bg-amber-50 border border-amber-200/60',     label: 'Pending' },
      processing: { dot: 'bg-blue-500',    text: 'text-blue-700',    bg: 'bg-blue-50 border border-blue-200/60',       label: 'Processing' },
      failed:     { dot: 'bg-rose-500',    text: 'text-rose-700',    bg: 'bg-rose-50 border border-rose-200/60',       label: 'Failed' },
      canceled:   { dot: 'bg-slate-400',   text: 'text-slate-600',   bg: 'bg-slate-100 border border-slate-200',      label: 'Canceled' },
    };
    const config = statusConfig[status || 'success'] || statusConfig.success;
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
        {config.label}
      </span>
    );
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      {/* ── Page Title Header ────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Wallet & Balance</h1>
        <p className="text-slate-500 text-sm mt-1">Fund your account and view complete financial transaction history</p>
      </div>

      {/* ── Available Funds Card (Consistent with Dashboard Balance Card) ── */}
      <div className="rounded-2xl p-6 bg-white border border-primary/20 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Available Funds
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefreshBalance}
            disabled={isRefreshing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-blue-50 transition-colors"
            title="Refresh Balance"
          >
            <svg
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <div className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
            {formatCurrency(user?.balance || '0')}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setTopupMethod(firstEnabledMethod(siteSettings));
            setShowTopup(true);
            setTopupError('');
            setTopupAmount('');
            setNexaSession(null);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-black hover:bg-primary-hover transition-all shadow-md shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Top Up Balance</span>
        </button>
      </div>

      {/* ── Top-Up Modal ─────────────────────────────────────────────────── */}
      {showTopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden relative max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Top Up Wallet</h2>
                <p className="text-xs text-slate-500 mt-0.5">Select your preferred payment method</p>
              </div>
              <button
                type="button"
                onClick={resetTopup}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Primary Method Tabs (Exact previous wordings: Automatic, Manual, Crypto - No emojis) */}
              {!nexaSession && !topupSuccess && (
                <div className="grid grid-cols-3 gap-1.5 p-1.5 rounded-xl bg-slate-100 border border-slate-200/60">
                  {isAutomaticAvailable() && (
                    <button
                      type="button"
                      onClick={() => { setTopupMethod('automatic'); setTopupError(''); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        topupMethod === 'automatic'
                          ? 'bg-white text-primary shadow-xs border border-slate-200/70'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Automatic
                    </button>
                  )}
                  {siteSettings?.manual_bank_enabled !== false && (
                    <button
                      type="button"
                      onClick={() => { setTopupMethod('manual'); setTopupError(''); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        topupMethod === 'manual'
                          ? 'bg-white text-primary shadow-xs border border-slate-200/70'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Manual
                    </button>
                  )}
                  {siteSettings?.crypto_enabled !== false && (
                    <button
                      type="button"
                      onClick={() => { setTopupMethod('crypto'); setTopupError(''); }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        topupMethod === 'crypto'
                          ? 'bg-white text-primary shadow-xs border border-slate-200/70'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Crypto
                    </button>
                  )}
                </div>
              )}

              {/* ── Success Celebration Banner ─────────────────────────────── */}
              {topupSuccess && (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-emerald-950">Deposit Complete</h3>
                    <p className="text-xs text-emerald-700 mt-1 max-w-sm mx-auto">{topupSuccess}</p>
                  </div>
                  <button
                    type="button"
                    onClick={resetTopup}
                    className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-xs transition-colors"
                  >
                    Done & View Balance
                  </button>
                </div>
              )}

              {/* ── AUTOMATIC TAB ────────────────────────────────────────── */}
              {topupMethod === 'automatic' && isAutomaticAvailable() && !topupSuccess && (
                <>
                  {/* NexaPay Active Session Card (If generated) */}
                  {nexaSession ? (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Live listening status */}
                      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
                          </span>
                          <div>
                            <p className="text-xs font-bold text-slate-900">Awaiting Bank Transfer</p>
                            <p className="text-[11px] text-slate-600">Transfer exact amount via any Nigerian banking app</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className={`font-mono text-sm font-bold ${nexaTimeLeft < 300 ? 'text-rose-600' : 'text-slate-800'}`}>
                            {formatTimer(nexaTimeLeft)}
                          </span>
                        </div>
                      </div>

                      {/* Bank Details Display Card */}
                      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs text-slate-500 font-medium">Bank Name</span>
                          <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
                            {nexaSession.bank_name || 'VFD Microfinance Bank'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs text-slate-500 font-medium block">Account Number</span>
                            <span className="text-xl font-extrabold font-mono text-primary tracking-wider">
                              {nexaSession.account_number}
                            </span>
                          </div>
                          <CopyButton value={nexaSession.account_number} />
                        </div>

                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <span className="text-xs text-slate-500 font-medium">Account Name</span>
                          <span className="text-xs font-bold text-slate-800 text-right">
                            {nexaSession.account_name || 'Caryvn Services'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-medium">Exact Amount</span>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-extrabold text-slate-900 font-mono">
                              ₦{parseFloat(nexaSession.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </span>
                            <CopyButton value={nexaSession.amount} />
                          </div>
                        </div>
                      </div>

                      {/* Alert banner with SVG icon */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
                        <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>
                          Transfer <strong>exactly ₦{parseFloat(nexaSession.amount).toLocaleString()}</strong> to this account. Your balance will credit automatically within seconds.
                        </span>
                      </div>

                      {topupError && (
                        <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2">
                          <svg className="w-4 h-4 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{topupError}</span>
                        </div>
                      )}

                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => setNexaSession(null)}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
                        >
                          Cancel / Back
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            setTopupLoading(true);
                            try {
                              const res = await walletApi.checkNexaPayStatus(nexaSession.reference, token!);
                              if (res.data && (res.data as { status: string }).status === 'success') {
                                setTopupSuccess('Deposit confirmed!');
                                setNexaSession(null);
                                await refreshUser();
                                loadTransactions();
                              } else {
                                setTopupError('Transfer not detected yet. Please allow a moment for bank network processing.');
                                setTimeout(() => setTopupError(''), 4000);
                              }
                            } catch {
                              setTopupError('Status check timed out. Retrying...');
                              setTimeout(() => setTopupError(''), 3000);
                            }
                            setTopupLoading(false);
                          }}
                          disabled={topupLoading}
                          className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
                        >
                          {topupLoading ? (
                            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          ) : (
                            'Check Status Now'
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Topup Form: Sub-method choice (identical to Crypto sub-selection) & amount inputs */
                    <div className="space-y-5">
                      {/* Sub-method Choice (NexaPay vs Squad - clean 2-button grid repeating Crypto style) */}
                      {siteSettings?.squad_enabled !== false && siteSettings?.nexapay_enabled !== false && (
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200/60">
                          <button
                            type="button"
                            onClick={() => { setAutoSubMethod('nexapay'); setTopupError(''); }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              autoSubMethod === 'nexapay'
                                ? 'bg-white text-primary shadow-xs border border-slate-200/70'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            NexaPay
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAutoSubMethod('squad'); setTopupError(''); }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              autoSubMethod === 'squad'
                                ? 'bg-white text-primary shadow-xs border border-slate-200/70'
                                : 'text-slate-500 hover:text-slate-800'
                            }`}
                          >
                            Squad
                          </button>
                        </div>
                      )}

                      {/* Presets */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-2 block">Quick Amount</label>
                        <div className="grid grid-cols-3 gap-2">
                          {PRESET_AMOUNTS.map(a => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => { setTopupAmount(a.toString()); setTopupError(''); }}
                              className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all ${
                                topupAmount === a.toString()
                                  ? 'border-primary bg-blue-50 text-primary shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                              }`}
                            >
                              ₦{a.toLocaleString()}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Amount input */}
                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Amount (₦)</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                          <input
                            type="number"
                            min="500"
                            max="500000"
                            placeholder="5000"
                            value={topupAmount}
                            onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }}
                            className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-white"
                          />
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Min: ₦500 · Max: ₦500,000</p>
                      </div>

                      {topupError && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                          {topupError}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleAutomaticTopup}
                        disabled={topupLoading || !topupAmount}
                        className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {topupLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : autoSubMethod === 'nexapay' ? (
                          `Deposit${topupAmount ? ` ₦${parseFloat(topupAmount).toLocaleString()}` : ''} with NexaPay`
                        ) : (
                          `Deposit${topupAmount ? ` ₦${parseFloat(topupAmount).toLocaleString()}` : ''} with Squad`
                        )}
                      </button>

                      <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
                        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        <span>Secured by Automated Payment Gateway</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── MANUAL BANK TAB ──────────────────────────────────────── */}
              {topupMethod === 'manual' && siteSettings?.manual_bank_enabled !== false && !topupSuccess && (
                <div className="space-y-4">
                  {/* Account display */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Bank:</span>
                      <span className="font-bold text-slate-800">{siteSettings?.manual_bank_name || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Account Name:</span>
                      <span className="font-bold text-slate-800">{siteSettings?.manual_account_name || 'N/A'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="text-slate-500 font-medium">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-sm text-primary">
                          {siteSettings?.manual_account_number || 'N/A'}
                        </span>
                        {siteSettings?.manual_account_number && <CopyButton value={siteSettings.manual_account_number} />}
                      </div>
                    </div>
                  </div>

                  {/* Presets */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-2 block">Quick Amount</label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_AMOUNTS.map(a => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => { setTopupAmount(a.toString()); setTopupError(''); }}
                          className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                            topupAmount === a.toString()
                              ? 'border-primary bg-blue-50 text-primary shadow-xs'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          ₦{a.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Transfer Amount (₦)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₦</span>
                      <input
                        type="number"
                        min="500"
                        placeholder="5000"
                        value={topupAmount}
                        onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }}
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                  </div>

                  {/* File Upload with strict SVG icon */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Payment Screenshot / Receipt</label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg,image/png,application/pdf"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setProofFile(f); }}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/60 transition-colors"
                    >
                      {proofFile ? (
                        <div className="flex flex-col items-center py-1">
                          <svg className="w-6 h-6 text-emerald-600 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-full px-2">{proofFile.name}</span>
                          <span className="text-[11px] text-primary mt-1 font-medium">Click to change</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-2">
                          <svg className="w-7 h-7 text-slate-400 mb-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span className="text-xs font-bold text-slate-700">Click to upload transfer receipt</span>
                          <span className="text-[11px] text-slate-400 mt-0.5">JPG, PNG, PDF up to 5MB</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {topupError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {topupError}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleManualTopup}
                    disabled={topupLoading || !topupAmount || !proofFile}
                    className="w-full py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-sm shadow-xs transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {topupLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      'Submit Proof for Approval'
                    )}
                  </button>
                </div>
              )}

              {/* ── CRYPTO TAB ───────────────────────────────────────────── */}
              {topupMethod === 'crypto' && siteSettings?.crypto_enabled !== false && !topupSuccess && (
                <div className="space-y-4">
                  {/* Sub method tabs without emojis */}
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 border border-slate-200/60">
                    {(['binance_pay', 'on_chain'] as CryptoMethod[]).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => {
                          setCryptoMethod(m);
                          setCryptoStep(1);
                          setTopupError('');
                          setCryptoReferenceId('');
                          setCryptoProofFile(null);
                        }}
                        className={`py-2 text-xs font-bold rounded-lg transition-all ${
                          cryptoMethod === m
                            ? 'bg-white text-slate-900 shadow-xs border border-slate-200/70'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {m === 'binance_pay' ? 'Binance Pay' : 'On-Chain'}
                      </button>
                    ))}
                  </div>

                  {/* Amount field */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">Amount (USDT)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                      <input
                        type="number"
                        min="2"
                        step="0.01"
                        placeholder="10"
                        value={topupAmount}
                        onChange={(e) => { setTopupAmount(e.target.value); setTopupError(''); }}
                        className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm focus:outline-none focus:border-primary bg-white"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Min: $2 USDT</p>
                  </div>

                  {/* Binance Pay Flow */}
                  {cryptoMethod === 'binance_pay' && (
                    <div className="space-y-3.5">
                      {cryptoStep === 1 ? (
                        <>
                          <div className="rounded-xl border border-amber-200/70 bg-amber-50/50 p-4 space-y-3">
                            <div>
                              <p className="text-xs text-amber-800 font-semibold">Binance Pay ID</p>
                              <div className="flex items-center justify-between gap-2 mt-1">
                                <span className="font-mono font-bold text-sm text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                                  {siteSettings?.binance_pay_id || 'Not configured'}
                                </span>
                                {siteSettings?.binance_pay_id && <CopyButton value={siteSettings.binance_pay_id} />}
                              </div>
                            </div>
                            {siteSettings?.binance_pay_qr && (
                              <div className="text-center pt-2">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={siteSettings.binance_pay_qr}
                                  alt="Binance Pay QR"
                                  className="mx-auto h-32 w-32 rounded-xl object-contain border border-slate-200 bg-white p-1"
                                />
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowConfirmModal(true)}
                            disabled={!topupAmount || parseFloat(topupAmount) < 2}
                            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shadow-xs disabled:opacity-50"
                          >
                            I&apos;ve Completed the Payment
                          </button>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Binance Order ID</label>
                            <input
                              type="text"
                              placeholder="e.g. 123456789012"
                              value={cryptoReferenceId}
                              onChange={(e) => { setCryptoReferenceId(e.target.value); setTopupError(''); }}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-primary bg-white"
                            />
                            <p className="text-[11px] text-slate-400 mt-1">Found in Binance App → Pay → Order History</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setCryptoStep(1)}
                              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Back
                            </button>
                            <button
                              type="button"
                              onClick={handleCryptoSubmit}
                              disabled={topupLoading || !cryptoReferenceId.trim()}
                              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
                            >
                              {topupLoading ? 'Submitting...' : 'Verify Payment'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* On-Chain Flow */}
                  {cryptoMethod === 'on_chain' && (
                    <div className="space-y-3.5">
                      {/* Token Picker */}
                      <div className="grid grid-cols-3 gap-1.5">
                        {(Object.entries(TOKEN_LABELS) as [CryptoToken, typeof TOKEN_LABELS[CryptoToken]][]).map(([key, meta]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setCryptoToken(key)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                              cryptoToken === key
                                ? `${meta.bg} ${meta.color} shadow-xs`
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {meta.label}
                          </button>
                        ))}
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Network:</span>
                          <span className="font-bold text-slate-800">{TOKEN_LABELS[cryptoToken].network}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs block mb-1">Wallet Address:</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[11px] text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded truncate flex-1">
                              {activeWalletAddress() || 'Not configured'}
                            </span>
                            {activeWalletAddress() && <CopyButton value={activeWalletAddress()} />}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Transaction ID (TXID)</label>
                        <input
                          type="text"
                          placeholder="Paste TXID from wallet..."
                          value={cryptoReferenceId}
                          onChange={(e) => { setCryptoReferenceId(e.target.value); setTopupError(''); }}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono text-xs focus:outline-none focus:border-primary bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 mb-1.5 block">Transaction Screenshot</label>
                        <input
                          type="file"
                          ref={cryptoFileInputRef}
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) setCryptoProofFile(f); }}
                        />
                        <div
                          onClick={() => cryptoFileInputRef.current?.click()}
                          className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-xl p-3 text-center cursor-pointer bg-white transition-colors"
                        >
                          {cryptoProofFile ? (
                            <span className="text-xs font-bold text-slate-800 truncate block">{cryptoProofFile.name}</span>
                          ) : (
                            <span className="text-xs text-slate-500 font-medium">Click to upload screenshot</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleCryptoSubmit}
                        disabled={topupLoading || !cryptoReferenceId.trim() || !cryptoProofFile}
                        className="w-full py-3 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs transition-all disabled:opacity-50"
                      >
                        {topupLoading ? 'Submitting...' : 'Submit for Admin Review'}
                      </button>
                    </div>
                  )}

                  {topupError && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                      {topupError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Binance Pay Confirmation Modal ───────────────────────────────── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Binance Transfer</h3>
            <p className="text-xs text-slate-500 mb-5">
              Make sure you have sent <span className="font-bold text-amber-600">${topupAmount} USDT</span> to the Binance Pay ID before proceeding.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={() => { setShowConfirmModal(false); setCryptoStep(2); }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold"
              >
                Yes, I&apos;ve Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Transaction History Section (Restored titles & badge) ─────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
          <div>
            <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Your history of transactions</p>
          </div>
          <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">
            {txTotal} total
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 mt-2">Loading transactions...</p>
          </div>
        ) : transactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => {
              const isPositive = tx.type === 'deposit' || tx.type === 'refund' || parseFloat(tx.amount) > 0;
              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTx(tx)}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isPositive ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                    }`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d={isPositive ? 'M12 4v16m0-16l-4 4m4-4l4 4' : 'M12 20V4m0 16l4-4m-4 4l-4-4'}
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 capitalize flex items-center gap-2">
                        {tx.type}
                        {tx.payment_gateway && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">
                            {tx.payment_gateway}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 truncate max-w-xs sm:max-w-md mt-0.5">{tx.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className={`font-mono text-sm font-extrabold ${isPositive ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {isPositive ? '+' : ''}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>

                    <div className="hidden sm:block">
                      {getStatusBadge(tx.status)}
                    </div>

                    {/* Delete action */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(tx.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                      title="Hide from history"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-700">No transactions recorded yet</p>
            <p className="text-xs text-slate-400 mt-1">Fund your wallet to get started placing orders</p>
          </div>
        )}

        {/* Pagination */}
        {txTotal > TX_PAGE_SIZE && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
            <span>
              Page {Math.floor(txOffset / TX_PAGE_SIZE) + 1} of {Math.ceil(txTotal / TX_PAGE_SIZE)}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => loadTransactions(Math.max(0, txOffset - TX_PAGE_SIZE))}
                disabled={txOffset === 0}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => loadTransactions(txOffset + TX_PAGE_SIZE)}
                disabled={txOffset + TX_PAGE_SIZE >= txTotal}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Transaction Details Modal ────────────────────────────────────── */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Receipt</span>
              {getStatusBadge(selectedTx.status)}
            </div>

            <div className="space-y-1 text-center py-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Transaction Amount</p>
              <p className="text-3xl font-black font-mono text-slate-900">
                {parseFloat(selectedTx.amount) >= 0 ? '+' : ''}{formatCurrency(selectedTx.amount)}
              </p>
              <p className="text-xs text-slate-400 capitalize">{selectedTx.type}</p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-semibold text-slate-800">{formatDate(selectedTx.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Balance After</span>
                <span className="font-semibold font-mono text-slate-800">{formatCurrency(selectedTx.balance_after)}</span>
              </div>
              {selectedTx.payment_gateway && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway</span>
                  <span className="font-semibold text-slate-800 capitalize">{selectedTx.payment_gateway}</span>
                </div>
              )}
              {selectedTx.payment_reference && (
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                  <span className="text-slate-500">Reference</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[11px] text-slate-700 truncate max-w-32.5">
                      {selectedTx.payment_reference}
                    </span>
                    <CopyButton value={selectedTx.payment_reference} />
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-3">
              <span className="font-bold text-slate-700 block mb-0.5">Description:</span>
              <p className="text-slate-600 leading-relaxed">{selectedTx.description}</p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedTx(null)}
              className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Hide Confirmation Modal ───────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-bold text-slate-900 mb-1">Hide Transaction?</h3>
            <p className="text-xs text-slate-500 mb-5">
              This will remove the transaction from your history view. It will not affect your wallet balance.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleHideTransaction(deleteConfirm)}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors"
              >
                {deleteLoading ? 'Hiding...' : 'Yes, Hide'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

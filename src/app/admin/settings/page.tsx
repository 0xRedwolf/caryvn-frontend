'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface SiteSettings {
  show_inactive_services: boolean;
  manual_bank_name: string;
  manual_account_name: string;
  manual_account_number: string;
  // Crypto
  binance_pay_id: string;
  binance_pay_qr: string | null;
  crypto_usdt_trc20: string;
  crypto_usdt_bep20: string;
  crypto_sol: string;
  // Payment method toggles
  squad_enabled: boolean;
  nexapay_enabled: boolean;
  manual_bank_enabled: boolean;
  crypto_enabled: boolean;
  provider_balance_alert_threshold: string;
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [savingCrypto, setSavingCrypto] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [testingAlert, setTestingAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState({ type: '', text: '' });
  const [exportingUsers, setExportingUsers] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    show_inactive_services: false,
    manual_bank_name: '',
    manual_account_name: '',
    manual_account_number: '',
    binance_pay_id: '',
    binance_pay_qr: null,
    crypto_usdt_trc20: '',
    crypto_usdt_bep20: '',
    crypto_sol: '',
    squad_enabled: true,
    nexapay_enabled: true,
    manual_bank_enabled: true,
    crypto_enabled: true,
    provider_balance_alert_threshold: '15.00',
  });
  const [bankMessage, setBankMessage] = useState({ type: '', text: '' });
  const [cryptoMessage, setCryptoMessage] = useState({ type: '', text: '' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadSettings() {
    setLoading(true);
    const res = await adminApi.getSiteSettings(token!);
    if (res.data) {
      const data = res.data as Partial<SiteSettings>;
      setSettings({
        show_inactive_services: data.show_inactive_services || false,
        manual_bank_name: data.manual_bank_name || '',
        manual_account_name: data.manual_account_name || '',
        manual_account_number: data.manual_account_number || '',
        binance_pay_id: data.binance_pay_id || '',
        binance_pay_qr: data.binance_pay_qr || null,
        crypto_usdt_trc20: data.crypto_usdt_trc20 || '',
        crypto_usdt_bep20: data.crypto_usdt_bep20 || '',
        crypto_sol: data.crypto_sol || '',
        squad_enabled: data.squad_enabled !== false,
        nexapay_enabled: data.nexapay_enabled !== false,
        manual_bank_enabled: data.manual_bank_enabled !== false,
        crypto_enabled: data.crypto_enabled !== false,
        provider_balance_alert_threshold: (data as unknown as { provider_balance_alert_threshold?: string }).provider_balance_alert_threshold || '15.00',
      });
    }
    setLoading(false);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingBank(true);
    setBankMessage({ type: '', text: '' });
    const payload = {
      manual_bank_name: settings.manual_bank_name,
      manual_account_name: settings.manual_account_name,
      manual_account_number: settings.manual_account_number,
    };
    const res = await adminApi.updateSiteSettings(payload, token);
    setSavingBank(false);
    if (res.error) {
      setBankMessage({ type: 'error', text: res.error });
    } else {
      setBankMessage({ type: 'success', text: 'Bank details saved successfully' });
      setTimeout(() => setBankMessage({ type: '', text: '' }), 3000);
    }
  };

  const handleSaveCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingCrypto(true);
    setCryptoMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('binance_pay_id', settings.binance_pay_id);
    formData.append('crypto_usdt_trc20', settings.crypto_usdt_trc20);
    formData.append('crypto_usdt_bep20', settings.crypto_usdt_bep20);
    formData.append('crypto_sol', settings.crypto_sol);
    if (qrFile) {
      formData.append('binance_pay_qr', qrFile);
    }

    const res = await adminApi.updateCryptoSettings(formData, token);
    setSavingCrypto(false);
    if (res.error) {
      setCryptoMessage({ type: 'error', text: res.error });
    } else {
      setCryptoMessage({ type: 'success', text: 'Crypto settings saved successfully' });
      const data = res.data as Partial<SiteSettings>;
      if (data?.binance_pay_qr) {
        setSettings(prev => ({ ...prev, binance_pay_qr: data.binance_pay_qr! }));
      }
      setQrFile(null);
      setTimeout(() => setCryptoMessage({ type: '', text: '' }), 3000);
    }
  };

  const toggleShowInactive = async () => {
    if (!token) return;
    const res = await adminApi.toggleShowInactiveServices(token);
    if (!res.error) {
      setSettings({ ...settings, show_inactive_services: !settings.show_inactive_services });
    }
  };

  const togglePaymentMethod = async (field: 'squad_enabled' | 'nexapay_enabled' | 'manual_bank_enabled' | 'crypto_enabled') => {
    if (!token) return;
    const newValue = !settings[field];
    const res = await adminApi.updateSiteSettings({ [field]: newValue }, token);
    if (!res.error) {
      setSettings(prev => ({ ...prev, [field]: newValue }));
    }
  };

  const handleSaveAlertThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSavingAlerts(true);
    setAlertMessage({ type: '', text: '' });
    const res = await adminApi.updateSiteSettings(
      { provider_balance_alert_threshold: settings.provider_balance_alert_threshold },
      token
    );
    setSavingAlerts(false);
    if (res.error) {
      setAlertMessage({ type: 'error', text: res.error });
    } else {
      setAlertMessage({ type: 'success', text: 'Alert threshold updated successfully!' });
      setTimeout(() => setAlertMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleTriggerTestAlert = async () => {
    if (!token) return;
    setTestingAlert(true);
    try {
      const res = await adminApi.triggerTestNotification(token);
      if (res.data) {
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('Test Alert: Low Balance at Provider', {
              body: 'Test notification triggered successfully! Browser desktop alerts are functioning properly.',
              icon: '/favicon.ico',
            });
          } else if (Notification.permission === 'default') {
            await Notification.requestPermission();
          }
        }
        setAlertMessage({ type: 'success', text: 'Test alert generated! Check the top bell icon or desktop notifications.' });
        setTimeout(() => setAlertMessage({ type: '', text: '' }), 5000);
      }
    } catch {
      setAlertMessage({ type: 'error', text: 'Failed to generate test notification.' });
    }
    setTestingAlert(false);
  };

  const alertClass = (type: string) =>
    `p-4 rounded-xl text-sm font-medium ${type === 'error'
      ? 'bg-red-500/10 text-red-500 border border-red-500/20'
      : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
    }`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Site Settings</h1>
          <p className="text-text-secondary">Manage global application configurations</p>
        </div>
        <button
          onClick={async () => {
            if (!token) return;
            setExportingUsers(true);
            await adminApi.exportUsersCSV(token);
            setExportingUsers(false);
          }}
          disabled={exportingUsers}
          className="btn-primary shrink-0 flex items-center gap-2"
          title="Export Users (CSV)"
        >
          {exportingUsers ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          )}
          <span className="hidden sm:inline">
            {exportingUsers ? 'Exporting...' : 'Export Users (CSV)'}
          </span>
        </button>
      </div>

      {/* ── Manual Bank Deposit ─────────────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark bg-surface-darker/50">
          <h2 className="text-lg font-semibold text-white">Manual Bank Deposit</h2>
          <p className="text-text-secondary text-sm">Bank account users transfer to when using Manual Bank Deposit.</p>
        </div>
        {bankMessage.text && <div className={`mx-6 mt-4 ${alertClass(bankMessage.type)}`}>{bankMessage.text}</div>}
        <form onSubmit={handleSaveBank} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Bank Name</label>
              <input type="text" className="input w-full" placeholder="e.g. Opay, Moniepoint"
                value={settings.manual_bank_name}
                onChange={(e) => setSettings({ ...settings, manual_bank_name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Number</label>
              <input type="text" className="input w-full font-mono" placeholder="0123456789"
                value={settings.manual_account_number}
                onChange={(e) => setSettings({ ...settings, manual_account_number: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Name</label>
              <input type="text" className="input w-full" placeholder="John Doe"
                value={settings.manual_account_name}
                onChange={(e) => setSettings({ ...settings, manual_account_name: e.target.value })} />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" disabled={savingBank} className="btn-primary">
              {savingBank ? 'Saving...' : 'Save Bank Details'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Crypto Deposit Configuration ────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark bg-surface-darker/50 flex items-center gap-3">
          {/* Bitcoin icon */}
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.5 2C6.26 2 2 6.26 2 11.5S6.26 21 11.5 21 21 16.74 21 11.5 16.74 2 11.5 2zm.75 13.5h-1.5v-1.5H9.25v1.5h-1.5V9.25h1.5v1.5h1.5V9.25h1.5a2.25 2.25 0 0 1 0 4.5h-.75v.75h.75v1zm0-4.5H9.25V9.25h3a.75.75 0 0 1 0 1.75z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Crypto Deposit Configuration</h2>
            <p className="text-text-secondary text-sm">Binance Pay ID and on-chain wallet addresses shown to users.</p>
          </div>
        </div>

        {cryptoMessage.text && <div className={`mx-6 mt-4 ${alertClass(cryptoMessage.type)}`}>{cryptoMessage.text}</div>}

        <form onSubmit={handleSaveCrypto} className="p-6 space-y-6">

          {/* Binance Pay */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              Binance Pay
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Binance Pay ID</label>
                <input type="text" className="input w-full font-mono" placeholder="e.g. 123456789"
                  value={settings.binance_pay_id}
                  onChange={(e) => setSettings({ ...settings, binance_pay_id: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">QR Code Image</label>
                <input type="file" ref={qrInputRef} accept="image/*" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setQrFile(f); }} />
                <div
                  onClick={() => qrInputRef.current?.click()}
                  className="border-2 border-dashed border-border-dark rounded-xl p-3 text-center cursor-pointer hover:border-amber-500/50 transition-colors bg-surface-darker/50"
                >
                  {qrFile ? (
                    <p className="text-sm text-white truncate">{qrFile?.name}<span className="text-text-secondary text-xs ml-2">— click to change</span></p>
                  ) : settings.binance_pay_qr ? (
                    <p className="text-sm text-emerald-400">✓ QR uploaded<span className="text-text-secondary text-xs ml-2">— click to replace</span></p>
                  ) : (
                    <p className="text-sm text-text-secondary">Click to upload QR image</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* On-Chain Addresses */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
              On-Chain Wallet Addresses
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">USDT-TRC20 (Tron) Address</label>
                <input type="text" className="input w-full font-mono text-sm" placeholder="TXxxx..."
                  value={settings.crypto_usdt_trc20}
                  onChange={(e) => setSettings({ ...settings, crypto_usdt_trc20: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">USDT-BEP20 (BSC) Address</label>
                <input type="text" className="input w-full font-mono text-sm" placeholder="0xxxx..."
                  value={settings.crypto_usdt_bep20}
                  onChange={(e) => setSettings({ ...settings, crypto_usdt_bep20: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">USDC (Solana) Address</label>
                <input type="text" className="input w-full font-mono text-sm" placeholder="USDC Solana address..."
                  value={settings.crypto_sol}
                  onChange={(e) => setSettings({ ...settings, crypto_sol: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={savingCrypto} className="btn-primary">
              {savingCrypto ? 'Saving...' : 'Save Crypto Details'}
            </button>
          </div>
        </form>
      </div>

      {/* ── Toggle Inactive Services ─────────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Show Inactive Services</h2>
            <p className="text-text-secondary text-sm">Toggle whether regular users can see deactivated SMM services.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={settings.show_inactive_services} onChange={toggleShowInactive} />
            <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none"></div>
          </label>
        </div>
      </div>

      {/* ── Payment Methods ───────────────────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark bg-surface-darker/50">
          <h2 className="text-lg font-semibold text-white">Payment Methods</h2>
          <p className="text-text-secondary text-sm">Enable or disable payment methods available to users on the wallet top-up page.</p>
        </div>
        <div className="divide-y divide-border-dark">
          {/* Squad */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Squad (Automatic / Card)</p>
              <p className="text-text-secondary text-sm">Online card payments processed instantly via Squad.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${settings.squad_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {settings.squad_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.squad_enabled} onChange={() => togglePaymentMethod('squad_enabled')} />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
          {/* NexaPay */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">NexaPay (Automatic / Virtual Bank Account)</p>
              <p className="text-text-secondary text-sm">Automated bank transfer with dynamic virtual accounts via NexaPay.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${settings.nexapay_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {settings.nexapay_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.nexapay_enabled} onChange={() => togglePaymentMethod('nexapay_enabled')} />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
          {/* Manual Bank */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Manual Bank Transfer</p>
              <p className="text-text-secondary text-sm">Users transfer manually and upload a payment proof for admin review.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${settings.manual_bank_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {settings.manual_bank_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.manual_bank_enabled} onChange={() => togglePaymentMethod('manual_bank_enabled')} />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
          {/* Crypto */}
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Crypto (Binance Pay / On-Chain)</p>
              <p className="text-text-secondary text-sm">Users deposit using Binance Pay or on-chain wallets (USDT, SOL).</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${settings.crypto_enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {settings.crypto_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={settings.crypto_enabled} onChange={() => togglePaymentMethod('crypto_enabled')} />
                <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:after:translate-x-full peer-focus:outline-none"></div>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Provider Low-Balance Alerts ──────────────────────────────────── */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark bg-surface-darker/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Provider Low-Balance Alerts</h2>
            <p className="text-text-secondary text-sm">
              Receive in-app alerts and native desktop notifications before orders from connected resellers and users fail.
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveAlertThreshold} className="p-6 space-y-4">
          {alertMessage.text && <div className={alertClass(alertMessage.type)}>{alertMessage.text}</div>}

          <div>
            <label className="text-text-secondary text-xs mb-1.5 block font-medium">
              Alert Trigger Threshold ($ USD)
            </label>
            <div className="relative max-w-xs flex items-center rounded-xl bg-slate-50 border border-slate-200 overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition shadow-xs">
              <span className="pl-4 pr-2 font-bold text-slate-500 text-sm select-none shrink-0">$</span>
              <input
                type="number"
                step="0.01"
                min="1"
                className="w-full py-2.5 pr-2 bg-transparent font-mono text-sm text-center font-bold text-slate-900 focus:outline-none placeholder-slate-400"
                placeholder="15.00"
                value={settings.provider_balance_alert_threshold}
                onChange={(e) => setSettings({ ...settings, provider_balance_alert_threshold: e.target.value })}
              />
              <span className="pr-4 pl-1 text-xs font-bold text-slate-400 select-none shrink-0">USD</span>
            </div>
            <p className="text-text-secondary text-xs mt-1.5 leading-relaxed">
              When any active upstream provider&apos;s balance drops below this amount, your Admin Panel will trigger a desktop notification and display a prominent warning banner.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={handleTriggerTestAlert}
              disabled={testingAlert}
              className="px-4 py-2.5 rounded-xl border border-border-dark bg-surface-darker text-text-secondary hover:text-white hover:border-primary/50 text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              {testingAlert ? 'Testing...' : 'Send Test Desktop Notification'}
            </button>

            <button
              type="submit"
              disabled={savingAlerts}
              className="btn-primary cursor-pointer text-xs"
            >
              {savingAlerts ? 'Saving...' : 'Save Alert Threshold'}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}

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
}

export default function AdminSettingsPage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingBank, setSavingBank] = useState(false);
  const [savingCrypto, setSavingCrypto] = useState(false);
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
  });
  const [bankMessage, setBankMessage] = useState({ type: '', text: '' });
  const [cryptoMessage, setCryptoMessage] = useState({ type: '', text: '' });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (token) loadSettings();
  }, [token]);

  const loadSettings = async () => {
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
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Site Settings</h1>
        <p className="text-text-secondary">Manage global application configurations</p>
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
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
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
                    <p className="text-sm text-white truncate">{qrFile.name}<span className="text-text-secondary text-xs ml-2">— click to change</span></p>
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
            <div className="w-11 h-6 bg-surface-darker peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border-dark"></div>
          </label>
        </div>
      </div>

    </div>
  );
}

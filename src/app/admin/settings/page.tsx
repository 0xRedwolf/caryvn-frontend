'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface SiteSettings {
  show_inactive_services: boolean;
  manual_bank_name: string;
  manual_account_name: string;
  manual_account_number: string;
}

export default function AdminSettingsPage() {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SiteSettings>({
    show_inactive_services: false,
    manual_bank_name: '',
    manual_account_name: '',
    manual_account_number: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

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
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    const payload = {
      manual_bank_name: settings.manual_bank_name,
      manual_account_name: settings.manual_account_name,
      manual_account_number: settings.manual_account_number,
    };
    
    const res = await adminApi.updateSiteSettings(payload, token);
    setSaving(false);
    
    if (res.error) {
      setMessage({ type: 'error', text: res.error });
    } else {
      setMessage({ type: 'success', text: 'Settings saved successfully' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    }
  };

  const toggleShowInactive = async () => {
    if (!token) return;
    const res = await adminApi.toggleShowInactiveServices(token);
    if (!res.error) {
      setSettings({ ...settings, show_inactive_services: !settings.show_inactive_services });
    }
  };

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
      
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'error' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
          'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
        }`}>
          {message.text}
        </div>
      )}

      {/* Manual Deposit Bank Account */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-border-dark bg-surface-darker/50">
          <h2 className="text-lg font-semibold text-white">Manual Deposit Configuration</h2>
          <p className="text-text-secondary text-sm">Set the bank account users will transfer funds to when selecting Manual Deposit.</p>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Bank Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="e.g. Opay, Moniepoint"
                value={settings.manual_bank_name}
                onChange={(e) => setSettings({ ...settings, manual_bank_name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Number</label>
              <input
                type="text"
                className="input w-full font-mono"
                placeholder="0123456789"
                value={settings.manual_account_number}
                onChange={(e) => setSettings({ ...settings, manual_account_number: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Account Name</label>
              <input
                type="text"
                className="input w-full"
                placeholder="John Doe"
                value={settings.manual_account_name}
                onChange={(e) => setSettings({ ...settings, manual_account_name: e.target.value })}
              />
            </div>
          </div>
          <div className="pt-2">
             <button type="submit" disabled={saving} className="btn-primary">
               {saving ? 'Saving...' : 'Save Bank Details'}
             </button>
          </div>
        </form>
      </div>

      {/* Toggle Inactive Services */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Show Inactive Services</h2>
            <p className="text-text-secondary text-sm">Toggle whether regular users can see deactivated SMM services in their feed.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={settings.show_inactive_services}
              onChange={toggleShowInactive} 
            />
            <div className="w-11 h-6 bg-surface-darker peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-text-secondary peer-checked:after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary border border-border-dark"></div>
          </label>
        </div>
      </div>
      
    </div>
  );
}

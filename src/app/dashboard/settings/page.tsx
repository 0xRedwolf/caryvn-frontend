'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';
import ActiveSessionsCard from '@/components/dashboard/ActiveSessionsCard';

const RESELLER_ENDPOINT = 'https://api.caryvn.com/api/v2/';

export default function SettingsPage() {
  const { user, token, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    username: user?.username || '',
  });
  const [passwords, setPasswords] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [apiKeyGenerating, setApiKeyGenerating] = useState(false);
  const [localApiKey, setLocalApiKey] = useState<string | null>(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showCopied = (field: string) => {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setProfileSaving(true);
    setMessage({ type: '', text: '' });
    const result = await authApi.updateProfile(profile, token);
    if (result.data) {
      await refreshUser();
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
    }
    setProfileSaving(false);
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (passwords.new_password !== passwords.confirm_password) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPasswordSaving(true);
    setMessage({ type: '', text: '' });
    const result = await authApi.changePassword({
      old_password: passwords.old_password,
      new_password: passwords.new_password,
    }, token);
    if (result.data) {
      setPasswords({ old_password: '', new_password: '', confirm_password: '' });
      setMessage({ type: 'success', text: 'Password changed successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to change password' });
    }
    setPasswordSaving(false);
  };

  const handleGenerateApiKey = async () => {
    if (!token) return;
    setApiKeyGenerating(true);
    const result = await authApi.generateApiKey(token);
    if (result.data) {
      const data = result.data as { api_key?: string };
      if (data.api_key) setLocalApiKey(data.api_key);
      await refreshUser();
      setMessage({ type: 'success', text: 'API key generated, copy it below.' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to generate API key' });
    }
    setApiKeyGenerating(false);
  };

  const handleCopyApiKey = async () => {
    const key = user?.api_key || localApiKey;
    if (key) {
      const success = await copyToClipboard(key);
      if (success) showCopied('apikey');
    }
  };

  const handleCopyText = async (text: string, field: string) => {
    await copyToClipboard(text);
    showCopied(field);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-1">Settings & Security</h1>
        <p className="text-slate-500 text-sm">Manage your profile, password credentials, active sessions, and API access.</p>
      </div>

      {/* Global alert */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">First Name</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={profileSaving}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {profileSaving ? 'Saving Changes...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-5">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Current Password</label>
              <input
                type="password"
                value={passwords.old_password}
                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">New Password</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                required
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordSaving}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {passwordSaving ? 'Updating Password...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Active Devices & Security Card */}
        <ActiveSessionsCard />

        {/* API Key Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold text-slate-900">Developer API Key</h2>
            <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
              REST API
            </span>
          </div>
          <p className="text-slate-500 text-sm mb-6">Use this key to access the Caryvn API programmatically or connect to reseller scripts.</p>

          {(() => {
            const activeKey = user?.api_key || localApiKey;
            return activeKey ? (
              <div className="space-y-4 max-w-xl">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeKey}
                    readOnly
                    onClick={handleCopyApiKey}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 font-mono text-xs sm:text-sm rounded-xl px-4 py-3 cursor-pointer select-all"
                    aria-label="API Key"
                    title="Click to copy"
                  />
                  <button
                    onClick={handleCopyApiKey}
                    className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    aria-label="Copy API key"
                  >
                    {copiedField === 'apikey' ? (
                      <>
                        <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">Click the field or the button to copy your API key.</p>
                <button
                  onClick={handleGenerateApiKey}
                  disabled={apiKeyGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {apiKeyGenerating ? 'Regenerating...' : 'Regenerate API Key'}
                </button>
              </div>
            ) : (
              <button
                onClick={handleGenerateApiKey}
                disabled={apiKeyGenerating}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {apiKeyGenerating ? 'Generating...' : 'Generate API Key'}
              </button>
            );
          })()}
        </div>

        {/* Reseller API Documentation Card */}
        {(user?.api_key || localApiKey) && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-slate-900">Reseller API Specs</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                SMM Panel API v2
              </span>
            </div>
            <p className="text-slate-500 text-sm mb-6">
              Integrate Caryvn as an upstream provider for your own SMM panel. Compatible with all standard reseller software.
            </p>

            {/* Endpoint */}
            <div className="mb-5 max-w-xl">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">Endpoint URL</label>
              <div className="flex items-center gap-2">
                <code className="bg-slate-50 border border-slate-200 text-slate-800 flex-1 rounded-xl px-4 py-3 font-mono text-xs sm:text-sm break-all">
                  POST {RESELLER_ENDPOINT}
                </code>
                <button
                  onClick={() => handleCopyText(RESELLER_ENDPOINT, 'endpoint')}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs px-4 py-3 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  {copiedField === 'endpoint' ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Content-Type: <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-xs">application/x-www-form-urlencoded</code>
              </p>
            </div>

            {/* Actions table */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-3">Supported Actions</label>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="text-left px-4 py-3 text-slate-600 font-bold text-xs uppercase tracking-wide">action=</th>
                      <th className="text-left px-4 py-3 text-slate-600 font-bold text-xs uppercase tracking-wide">Required params</th>
                      <th className="text-left px-4 py-3 text-slate-600 font-bold text-xs uppercase tracking-wide">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { action: 'services', params: '—', returns: 'Array of active services' },
                      { action: 'add', params: 'service, link, quantity', returns: '{ order: 123 }' },
                      { action: 'status', params: 'order', returns: 'Order status object' },
                      { action: 'balance', params: '—', returns: '{ balance, currency }' },
                      { action: 'refill', params: 'order', returns: '{ refill: id }' },
                    ].map((row) => (
                      <tr key={row.action} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <code className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold px-2 py-0.5 rounded-md">
                            {row.action}
                          </code>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-mono text-xs">{row.params}</td>
                        <td className="px-4 py-3 text-slate-600 text-xs">{row.returns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* curl example */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-2">
                cURL Integration Example
              </label>
              <div className="relative group max-w-xl">
                <pre className="bg-slate-900 text-slate-100 rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre">{`curl -X POST ${RESELLER_ENDPOINT} \\
  -d "key=${user?.api_key || localApiKey}" \\
  -d "action=add" \\
  -d "service=1" \\
  -d "link=https://instagram.com/yourpage" \\
  -d "quantity=1000"`}</pre>
                <button
                  onClick={() => handleCopyText(
                    `curl -X POST ${RESELLER_ENDPOINT} \\\n  -d "key=${user?.api_key || localApiKey}" \\\n  -d "action=add" \\\n  -d "service=1" \\\n  -d "link=https://instagram.com/yourpage" \\\n  -d "quantity=1000"`,
                    'curl'
                  )}
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-xs cursor-pointer"
                >
                  {copiedField === 'curl' ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

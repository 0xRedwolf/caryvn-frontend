'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';

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
      // Capture the key directly from response for instant display
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-text-secondary">Manage your account settings</p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-8">
        {/* Profile Settings */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Profile Information</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Email</label>
              <input type="email" value={user?.email || ''} disabled className="input opacity-50 cursor-not-allowed" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">First Name</label>
                <input type="text" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input type="text" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Username</label>
              <input type="text" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} className="input" />
            </div>
            <button type="submit" disabled={profileSaving} className="btn-primary disabled:opacity-50">
              {profileSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Password Settings */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Change Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Current Password</label>
              <input type="password" value={passwords.old_password} onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">New Password</label>
              <input type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
              <input type="password" value={passwords.confirm_password} onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} required className="input" />
            </div>
            <button type="submit" disabled={passwordSaving} className="btn-primary disabled:opacity-50">
              {passwordSaving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* API Key */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
          <h2 className="text-lg font-semibold text-white mb-2">API Key</h2>
          <p className="text-text-secondary text-sm mb-6">Use this key to access the Caryvn API programmatically.</p>

          {(() => {
            const activeKey = user?.api_key || localApiKey;
            return activeKey ? (
              <div className="space-y-3">
                {/* Key field + always-visible copy button */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={activeKey}
                    readOnly
                    onClick={handleCopyApiKey}
                    className="input font-mono text-sm flex-1 min-w-0 cursor-pointer select-all"
                    aria-label="API Key"
                    title="Click to copy"
                  />
                  <button
                    onClick={handleCopyApiKey}
                    className="btn-secondary shrink-0 h-auto! px-4 py-3 rounded-lg inline-flex items-center gap-1.5 text-sm font-semibold leading-none!"
                    aria-label="Copy API key"
                  >
                    {copiedField === 'apikey' ? (
                      <>
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-text-secondary">Tap the field or the button to copy your key.</p>
                {/* Regenerate pill */}
                <button
                  onClick={handleGenerateApiKey}
                  disabled={apiKeyGenerating}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-1.5 rounded-full border border-border-dark text-text-secondary hover:text-white hover:border-primary transition-colors disabled:opacity-50"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {apiKeyGenerating ? 'Generating...' : 'Regenerate Key'}
                </button>
              </div>
            ) : (
              <button onClick={handleGenerateApiKey} disabled={apiKeyGenerating} className="btn-primary disabled:opacity-50">
                {apiKeyGenerating ? 'Generating...' : 'Generate API Key'}
              </button>
            );
          })()}
        </div>

        {/* Reseller API Documentation */}
        {(user?.api_key || localApiKey) && (
          <div className="bg-surface-dark rounded-xl border border-border-dark p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-white">Reseller API</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold border api-badge">
                SMM Panel API v2
              </span>
            </div>
            <p className="text-text-secondary text-sm mb-6">
              Integrate Caryvn as an upstream provider for your own SMM panel.
              Compatible with all standard SMM panel reseller scripts and self-hosted software.
            </p>

            {/* Endpoint */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">Endpoint</label>
              <div className="flex items-center gap-2">
                <code className="api-code flex-1 rounded-lg px-4 py-3 font-mono text-sm break-all">
                  POST {RESELLER_ENDPOINT}
                </code>
                <button
                  onClick={() => handleCopyText(RESELLER_ENDPOINT, 'endpoint')}
                  className="btn-secondary text-xs px-4 h-auto! py-3 rounded-lg min-w-[64px]"
                >
                  {copiedField === 'endpoint' ? '✓' : 'Copy'}
                </button>
              </div>
              <p className="text-xs text-text-secondary mt-2">
                Content-Type: <code className="api-inline-code px-1.5 py-0.5 rounded text-xs">application/x-www-form-urlencoded</code>
              </p>
            </div>

            {/* Actions table */}
            <div className="mb-5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-3">Supported Actions</label>
              <div className="overflow-x-auto rounded-lg border border-border-dark">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-dark api-table-header">
                      <th className="text-left px-4 py-3 text-text-secondary font-semibold text-xs uppercase tracking-wide">action=</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-semibold text-xs uppercase tracking-wide">Required params</th>
                      <th className="text-left px-4 py-3 text-text-secondary font-semibold text-xs uppercase tracking-wide">Returns</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-dark">
                    {[
                      { action: 'services', params: '—', returns: 'Array of active services' },
                      { action: 'add', params: 'service, link, quantity', returns: '{ order: 123 }' },
                      { action: 'status', params: 'order', returns: 'Order status object' },
                      { action: 'balance', params: '—', returns: '{ balance, currency }' },
                      { action: 'refill', params: 'order', returns: '{ refill: id }' },
                    ].map((row) => (
                      <tr key={row.action} className="hover:bg-surface-dark/50 transition-colors">
                        <td className="px-4 py-3">
                          <code className="api-action-badge text-xs font-semibold px-2 py-0.5 rounded-md">{row.action}</code>
                        </td>
                        <td className="px-4 py-3 text-text-secondary font-mono text-xs">{row.params}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{row.returns}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* curl example */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
                Example — Place an Order
              </label>
              <div className="relative group">
                <pre className="api-code rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed whitespace-pre">{`curl -X POST ${RESELLER_ENDPOINT} \\
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
                  className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity btn-secondary text-xs px-3 py-1.5 h-auto! rounded-full"
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

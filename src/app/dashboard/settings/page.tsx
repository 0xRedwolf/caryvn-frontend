'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { authApi } from '@/lib/api';
import { copyToClipboard } from '@/lib/utils';

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
  const [message, setMessage] = useState({ type: '', text: '' });

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
      await refreshUser();
      setMessage({ type: 'success', text: 'API key generated successfully' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Failed to generate API key' });
    }
    setApiKeyGenerating(false);
  };

  const handleCopyApiKey = async () => {
    if (user?.api_key) {
      const success = await copyToClipboard(user.api_key);
      if (success) {
        setMessage({ type: 'success', text: 'API key copied to clipboard' });
      }
    }
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
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input opacity-50 cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">First Name</label>
                <input
                  type="text"
                  value={profile.first_name}
                  onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white mb-2">Last Name</label>
                <input
                  type="text"
                  value={profile.last_name}
                  onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="input"
              />
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
              <input
                type="password"
                value={passwords.old_password}
                onChange={(e) => setPasswords({ ...passwords, old_password: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">New Password</label>
              <input
                type="password"
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                required
                className="input"
              />
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
          
          {user?.api_key ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={user.api_key}
                  readOnly
                  className="input font-mono text-sm flex-1"
                />
                <button onClick={handleCopyApiKey} className="btn-secondary h-12 px-4">
                  Copy
                </button>
              </div>
              <button
                onClick={handleGenerateApiKey}
                disabled={apiKeyGenerating}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                {apiKeyGenerating ? 'Generating...' : 'Regenerate Key'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleGenerateApiKey}
              disabled={apiKeyGenerating}
              className="btn-primary disabled:opacity-50"
            >
              {apiKeyGenerating ? 'Generating...' : 'Generate API Key'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

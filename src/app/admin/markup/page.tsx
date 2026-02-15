'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface MarkupRule {
  id: number;
  name: string;
  level: string;
  platform: string | null;
  category: number | null;
  service: number | null;
  percentage: string;
  fixed_addition: string;
  is_active: boolean;
  priority: number;
}

export default function AdminMarkupPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level: 'global',
    platform: '',
    category: '',
    percentage: '20',
    fixed_addition: '0',
    priority: 0,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (token) {
      loadRules();
    }
  }, [token]);

  const loadRules = async () => {
    if (!token) return;

    const result = await adminApi.getMarkupRules(token);
    if (result.data) {
      setRules(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);
    
    // Auto-generate name if not provided
    const ruleName = formData.name || `${formData.level} ${formData.percentage}%`;
    
    const result = await adminApi.createMarkupRule({
      name: ruleName,
      level: formData.level,
      platform: formData.platform || '',
      percentage: parseFloat(formData.percentage) || 0,
      fixed_addition: parseFloat(formData.fixed_addition) || 0,
      priority: formData.priority,
      is_active: true,
    }, token);

    if (result.data) {
      setShowForm(false);
      setFormData({
        name: '',
        level: 'global',
        platform: '',
        category: '',
        percentage: '20',
        fixed_addition: '0',
        priority: 0,
      });
      loadRules();
    }
    setSaving(false);
  };

  const handleDelete = async (ruleId: number) => {
    if (!token || !confirm('Delete this markup rule?')) return;

    await adminApi.deleteMarkupRule(ruleId, token);
    loadRules();
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      global: 'bg-purple-500/10 text-purple-500',
      platform: 'bg-blue-500/10 text-blue-500',
      category: 'bg-amber-500/10 text-amber-500',
      service: 'bg-emerald-500/10 text-emerald-500',
    };
    return colors[level] || 'bg-slate-500/10 text-slate-400';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Markup Rules</h1>
          <p className="text-text-secondary">Configure pricing and profit margins</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary">
          Add Rule
        </button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6">
        <p className="text-blue-400 text-sm">
          <strong>Markup Priority:</strong> Service → Category → Platform → Global. 
          Higher priority rules override lower ones.
        </p>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Markup Rule</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                className="select"
              >
                <option value="global">Global (all services)</option>
                <option value="platform">Platform (e.g., Instagram)</option>
                <option value="category">Category</option>
              </select>
            </div>

            {formData.level === 'platform' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Platform</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="input"
                  placeholder="e.g., Instagram"
                />
              </div>
            )}

            {formData.level === 'category' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input"
                  placeholder="e.g., Followers"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">Percentage Markup (%)</label>
              <input
                type="number"
                value={formData.percentage}
                onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                className="input"
                step="0.01"
                min="0"
                placeholder="e.g., 20 for 20%"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Fixed Addition (₦)</label>
              <input
                type="number"
                value={formData.fixed_addition}
                onChange={(e) => setFormData({ ...formData, fixed_addition: e.target.value })}
                className="input"
                step="0.01"
                min="0"
                placeholder="Optional fixed amount to add"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Priority</label>
              <input
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                className="input"
                min="0"
                max="100"
                placeholder="0-100 (higher = more important)"
              />
              <p className="text-text-secondary text-xs mt-1">Higher priority rules override lower ones</p>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Level</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Target</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Markup</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Priority</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Status</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border-dark hover:bg-primary/5 transition-colors">
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadge(rule.level)}`}>
                        {rule.level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">
                        {rule.platform || (rule.category ? `Category #${rule.category}` : 'All Services')}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-primary font-medium">
                        {parseFloat(rule.percentage) > 0 && `${rule.percentage}%`}
                        {parseFloat(rule.percentage) > 0 && parseFloat(rule.fixed_addition) > 0 && ' + '}
                        {parseFloat(rule.fixed_addition) > 0 && `₦${rule.fixed_addition}`}
                        {parseFloat(rule.percentage) === 0 && parseFloat(rule.fixed_addition) === 0 && '0%'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{rule.priority}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        rule.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary mb-4">No markup rules configured</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              Create Your First Rule
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  category_name: string | null;
  service: number | null;
  percentage: string;
  fixed_addition: string;
  is_active: boolean;
  priority: number;
}

interface ServiceOption {
  id: number;
  name: string;
  category_name: string;
}

export default function AdminMarkupPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    level: 'global',
    platform: '',
    category: '',
    service_id: '',
    percentage: '20',
    fixed_addition: '0',
    priority: 0,
  });
  const [saving, setSaving] = useState(false);
  const [toggleLoading, setToggleLoading] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadRules();
      loadCategories();
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function loadRules() {
    if (!token) return;
    const result = await adminApi.getMarkupRules(token);
    if (result.data) {
      setRules(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  };

  async function loadCategories() {
    if (!token) return;
    const result = await adminApi.getServiceCategories(token);
    if (result.data) {
      const d = result.data as { categories: string[] };
      setCategories(d.categories || []);
    }
  };

  async function loadServices() {
    if (!token) return;
    const result = await adminApi.getAllServices(token);
    if (result.data) {
      const d = result.data as { services: ServiceOption[] };
      setServices(d.services || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSaving(true);

    const ruleName = formData.name || `${formData.level} ${formData.percentage}%`;

    const payload: Record<string, unknown> = {
      name: ruleName,
      level: formData.level,
      platform: formData.platform || '',
      category_name: formData.level === 'category' ? formData.category : '',
      service: formData.level === 'service' && formData.service_id ? parseInt(formData.service_id) : null,
      percentage: parseFloat(formData.percentage) || 0,
      fixed_addition: parseFloat(formData.fixed_addition) || 0,
      priority: formData.priority,
      is_active: true,
    };

    const result = await adminApi.createMarkupRule(payload, token);

    if (result.data) {
      setShowForm(false);
      setFormData({ name: '', level: 'global', platform: '', category: '', service_id: '', percentage: '20', fixed_addition: '0', priority: 0 });
      loadRules();
    }
    setSaving(false);
  };

  const handleDelete = async (ruleId: number) => {
    if (!token || !confirm('Delete this markup rule?')) return;
    await adminApi.deleteMarkupRule(ruleId, token);
    loadRules();
  };

  const handleTogglePause = async (rule: MarkupRule) => {
    if (!token) return;
    setToggleLoading(rule.id);
    await adminApi.updateMarkupRule(rule.id, { is_active: !rule.is_active }, token);
    setToggleLoading(null);
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

  const filteredServices = serviceSearch
    ? services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    : services.slice(0, 30);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
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
          <strong>Markup Priority:</strong> The rule with the highest <strong>Priority number</strong> always wins.
          Set Service rules to priority 30, Category to 20, Platform to 10, Global to 0 for the standard hierarchy.
        </p>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">New Markup Rule</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Rule Name (optional)</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="Auto-generated if blank"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Level</label>
              <select
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: e.target.value, category: '', platform: '', service_id: '' })}
                className="select"
              >
                <option value="global">Global (all services)</option>
                <option value="platform">Platform (e.g., Instagram)</option>
                <option value="category">Category (specific category)</option>
                <option value="service">Service (single service)</option>
              </select>
            </div>

            {formData.level === 'platform' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Platform Name</label>
                <input
                  type="text"
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="input"
                  placeholder="e.g., Instagram, TikTok"
                />
              </div>
            )}

            {formData.level === 'category' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="select"
                  required
                >
                  <option value="">— Select a category —</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <p className="text-text-secondary text-xs mt-1">Populated from your actual service database</p>
              </div>
            )}

            {formData.level === 'service' && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">Service</label>
                <input
                  type="text"
                  placeholder="Search services..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="input mb-2"
                />
                <select
                  value={formData.service_id}
                  onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                  className="select"
                  required
                  size={5}
                >
                  <option value="">— Select a service —</option>
                  {filteredServices.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
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
                max="1000"
                placeholder="0-1000 (higher = wins)"
              />
              <p className="text-text-secondary text-xs mt-1">Recommended: Service=30, Category=20, Platform=10, Global=0</p>
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
                  <tr key={rule.id} className={`border-b border-border-dark transition-colors ${rule.is_active ? 'hover:bg-primary/5' : 'opacity-50 hover:opacity-70'}`}>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelBadge(rule.level)}`}>
                        {rule.level}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">
                        {rule.platform ||
                          (rule.category_name ? `Category: ${rule.category_name}` :
                            rule.category ? `Category #${rule.category}` : 'All Services')}
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
                          : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleTogglePause(rule)}
                          disabled={toggleLoading === rule.id}
                          className={`text-xs font-medium transition-colors ${rule.is_active ? 'text-amber-400 hover:text-amber-300' : 'text-emerald-400 hover:text-emerald-300'}`}
                        >
                          {toggleLoading === rule.id ? '…' : rule.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Delete
                        </button>
                      </div>
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

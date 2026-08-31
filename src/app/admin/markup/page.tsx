'use client';

import { useState, useEffect, useRef } from 'react';
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

const LEVEL_META: Record<string, { label: string; color: string }> = {
  global:   { label: 'Global',   color: 'bg-purple-50 text-purple-700 border-purple-200' },
  platform: { label: 'Platform', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  category: { label: 'Category', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  service:  { label: 'Service',  color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

// Simple custom select used inside the form
function FormSelect({
  value,
  onChange,
  children,
  required,
  size,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  required?: boolean;
  size?: number;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        size={size}
        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition appearance-none"
      >
        {children}
      </select>
      {!size && (
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      )}
    </div>
  );
}

export default function AdminMarkupPage() {
  const { token } = useAuth();
  const [rules, setRules] = useState<MarkupRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [serviceSearch, setServiceSearch] = useState('');
  const formRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (showForm && formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [showForm]);

  async function loadRules() {
    if (!token) return;
    const result = await adminApi.getMarkupRules(token);
    if (result.data) {
      setRules(Array.isArray(result.data) ? result.data : []);
    }
    setLoading(false);
  }

  async function loadCategories() {
    if (!token) return;
    const result = await adminApi.getServiceCategories(token);
    if (result.data) {
      const d = result.data as { categories: string[] };
      setCategories(d.categories || []);
    }
  }

  async function loadServices() {
    if (!token) return;
    const result = await adminApi.getAllServices(token);
    if (result.data) {
      const d = result.data as { services: ServiceOption[] };
      setServices(d.services || []);
    }
  }

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

  const filteredServices = serviceSearch
    ? services.filter(s => s.name.toLowerCase().includes(serviceSearch.toLowerCase()))
    : services.slice(0, 30);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Markup Rules</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure pricing margins and profit rules</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Rule
        </button>
      </div>

      {/* Priority Info Banner */}
      <div className="flex gap-3 items-start p-4 rounded-2xl bg-blue-50 border border-blue-200">
        <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-blue-700 text-xs leading-relaxed">
          <strong className="font-bold">Priority System:</strong> The rule with the highest priority number always wins.
          Recommended: Service = 30, Category = 20, Platform = 10, Global = 0.
        </p>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <div ref={formRef} className="bento-card bg-white border border-slate-200 shadow-xs p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black text-slate-900">New Markup Rule</h2>
            <button
              onClick={() => setShowForm(false)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Rule Name <span className="text-slate-400 font-normal">(optional)</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder-slate-400"
                  placeholder="Auto-generated if blank"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Level</label>
                <FormSelect
                  value={formData.level}
                  onChange={(v) => setFormData({ ...formData, level: v, category: '', platform: '', service_id: '' })}
                >
                  <option value="global">Global (all services)</option>
                  <option value="platform">Platform (e.g., Instagram)</option>
                  <option value="category">Category (specific category)</option>
                  <option value="service">Service (single service)</option>
                </FormSelect>
              </div>

              {formData.level === 'platform' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Platform Name</label>
                  <input
                    type="text"
                    value={formData.platform}
                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder-slate-400"
                    placeholder="e.g., Instagram, TikTok"
                  />
                </div>
              )}

              {formData.level === 'category' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Category</label>
                  <FormSelect
                    value={formData.category}
                    onChange={(v) => setFormData({ ...formData, category: v })}
                    required
                  >
                    <option value="">— Select a category —</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </FormSelect>
                  <p className="text-slate-400 text-[11px] mt-1">Populated from your service database</p>
                </div>
              )}

              {formData.level === 'service' && (
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Service</label>
                  <input
                    type="text"
                    placeholder="Search services..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder-slate-400 mb-2"
                  />
                  <FormSelect
                    value={formData.service_id}
                    onChange={(v) => setFormData({ ...formData, service_id: v })}
                    required
                    size={5}
                  >
                    <option value="">— Select a service —</option>
                    {filteredServices.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </FormSelect>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Percentage Markup (%)</label>
                <input
                  type="number"
                  value={formData.percentage}
                  onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 20 for 20%"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Fixed Addition (₦)</label>
                <input
                  type="number"
                  value={formData.fixed_addition}
                  onChange={(e) => setFormData({ ...formData, fixed_addition: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  step="0.01"
                  min="0"
                  placeholder="Optional fixed amount to add"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Priority</label>
                <input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
                  min="0"
                  max="1000"
                  placeholder="0-1000 (higher = wins)"
                />
                <p className="text-slate-400 text-[11px] mt-1">Service=30 · Category=20 · Platform=10 · Global=0</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Create Rule'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="bento-card bg-white border border-slate-200 p-12 text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : rules.length === 0 ? (
        <div className="bento-card bg-white border border-slate-200 p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-slate-500 text-sm mb-4">No markup rules configured</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            {rules.map((rule) => {
              const levelMeta = LEVEL_META[rule.level] ?? { label: rule.level, color: 'bg-slate-100 text-slate-600 border-slate-200' };
              return (
                <div key={rule.id} className={`bento-card bg-white border border-slate-200 p-4 transition-opacity ${rule.is_active ? 'opacity-100' : 'opacity-50'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{rule.name}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Priority: {rule.priority}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${levelMeta.color}`}>
                      {levelMeta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-slate-50 rounded-xl p-2.5 text-center border border-slate-100">
                      <p className="text-[10px] text-slate-400 mb-0.5">Target</p>
                      <p className="text-[11px] font-bold text-slate-700 truncate">
                        {rule.platform || rule.category_name || (rule.category ? `#${rule.category}` : 'All')}
                      </p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-2.5 text-center border border-blue-100">
                      <p className="text-[10px] text-slate-400 mb-0.5">Markup</p>
                      <p className="text-[11px] font-black text-primary">
                        {parseFloat(rule.percentage) > 0 && `${rule.percentage}%`}
                        {parseFloat(rule.percentage) > 0 && parseFloat(rule.fixed_addition) > 0 && ' + '}
                        {parseFloat(rule.fixed_addition) > 0 && `₦${rule.fixed_addition}`}
                        {parseFloat(rule.percentage) === 0 && parseFloat(rule.fixed_addition) === 0 && '0%'}
                      </p>
                    </div>
                    <div className={`rounded-xl p-2.5 text-center border ${rule.is_active ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-[10px] text-slate-400 mb-0.5">Status</p>
                      <p className={`text-[11px] font-black ${rule.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {rule.is_active ? 'Active' : 'Paused'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleTogglePause(rule)}
                      disabled={toggleLoading === rule.id}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                        rule.is_active
                          ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      }`}
                    >
                      {toggleLoading === rule.id ? '...' : rule.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Level</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Target</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Markup</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Priority</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="py-3 px-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rules.map((rule) => {
                  const levelMeta = LEVEL_META[rule.level] ?? { label: rule.level, color: 'bg-slate-100 text-slate-600 border-slate-200' };
                  return (
                    <tr key={rule.id} className={`hover:bg-slate-50 transition-colors ${!rule.is_active ? 'opacity-50' : ''}`}>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-900 text-xs">{rule.name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${levelMeta.color}`}>
                          {levelMeta.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700">
                          {rule.platform ||
                            (rule.category_name ? rule.category_name :
                              rule.category ? `Category #${rule.category}` : 'All Services')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-primary font-bold">
                          {parseFloat(rule.percentage) > 0 && `${rule.percentage}%`}
                          {parseFloat(rule.percentage) > 0 && parseFloat(rule.fixed_addition) > 0 && ' + '}
                          {parseFloat(rule.fixed_addition) > 0 && `₦${rule.fixed_addition}`}
                          {parseFloat(rule.percentage) === 0 && parseFloat(rule.fixed_addition) === 0 && '0%'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-700 font-medium">{rule.priority}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                          rule.is_active
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {rule.is_active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleTogglePause(rule)}
                            disabled={toggleLoading === rule.id}
                            className={`text-xs font-bold transition-colors ${
                              rule.is_active
                                ? 'text-amber-600 hover:text-amber-700'
                                : 'text-emerald-600 hover:text-emerald-700'
                            }`}
                          >
                            {toggleLoading === rule.id ? '…' : rule.is_active ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

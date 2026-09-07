'use client';

import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/utils';

interface Service {
  id: number;
  external_id: number;
  name: string;
  category_name: string;
  user_rate: string;
  min_quantity: number;
  max_quantity: number;
  is_active: boolean;
  provider_is_active: boolean;
  has_refill: boolean;
  has_cancel: boolean;
  provider_name: string;
}

interface Provider {
  id: number;
  name: string;
  slug: string;
  api_url: string;
  currency: string;
  exchange_rate: string;
  is_active: boolean;
  show_inactive_services: boolean;
  sort_order: number;
  service_count: number;
  active_service_count: number;
}

export default function AdminSyncPage() {
  const { token } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncingServices, setSyncingServices] = useState<string | null>(null);
  const [syncingOrders, setSyncingOrders] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');
  const [serviceSearch, setServiceSearch] = useState('');
  const [showOnlyAvailableUpstream, setShowOnlyAvailableUpstream] = useState(false);
  const [showOnlyDeadUpstream, setShowOnlyDeadUpstream] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Bulk Toggling State
  const [selectedServices, setSelectedServices] = useState<Set<number>>(new Set());
  const [bulkToggling, setBulkToggling] = useState(false);

  useEffect(() => {
    setSelectedServices(new Set());
  }, [activeTab, selectedProvider, serviceSearch]);

  // Add Provider State
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [newProviderForm, setNewProviderForm] = useState({ name: '', api_url: '', api_key: '', currency: 'USD', exchange_rate: '1.0' });
  const [addingProvider, setAddingProvider] = useState(false);

  // Exchange rate editing
  const [editingRate, setEditingRate] = useState<string | null>(null);
  const [rateValue, setRateValue] = useState('');
  const [savingRate, setSavingRate] = useState(false);

  useEffect(() => {
    if (token) {
      loadData(true);
    }
  }, [token]);

  async function loadData(showLoader = true) {
    if (!token) return;
    if (showLoader) setLoading(true);

    const [providersRes, servicesRes] = await Promise.all([
      adminApi.getProviders(token),
      adminApi.getAllServices(token),
    ]);

    if (providersRes.data) {
      const provs = (providersRes.data as { providers: Provider[] }).providers || [];
      setProviders(provs);
      if (provs.length > 0 && !selectedProvider) {
        setSelectedProvider(provs[0].slug);
      }
    }

    if (servicesRes.data) {
      const data = servicesRes.data as { services: Service[] };
      setServices(data.services || []);
    }

    setLoading(false);
  }

  const currentProvider = useMemo(
    () => providers.find(p => p.slug === selectedProvider),
    [providers, selectedProvider]
  );

  // Filter services by selected provider and active/inactive tab
  const filteredServices = useMemo(() => {
    let filtered = services.filter(s => s.provider_name === currentProvider?.name);

    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.is_active);
      if (showOnlyDeadUpstream) {
        filtered = filtered.filter(s => !s.provider_is_active);
      }
    } else {
      filtered = filtered.filter(s => !s.is_active);
      if (showOnlyAvailableUpstream) {
        filtered = filtered.filter(s => s.provider_is_active);
      }
    }

    if (serviceSearch) {
      const search = serviceSearch.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(search) ||
        s.category_name.toLowerCase().includes(search) ||
        String(s.external_id).includes(serviceSearch)
      );
    }

    return filtered;
  }, [services, currentProvider, activeTab, serviceSearch, showOnlyAvailableUpstream, showOnlyDeadUpstream]);

  const activeCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && s.is_active).length,
    [services, currentProvider]
  );
  const inactiveCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && !s.is_active).length,
    [services, currentProvider]
  );
  const deadUpstreamCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && s.is_active && !s.provider_is_active).length,
    [services, currentProvider]
  );
  const availableUpstreamCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && !s.is_active && s.provider_is_active).length,
    [services, currentProvider]
  );

  const handleSyncServices = async (providerSlug: string) => {
    if (!token) return;
    setSyncingServices(providerSlug);
    setMessage('');
    setError('');

    const result = await adminApi.syncServices(token, providerSlug);
    if (result.data) {
      const data = result.data as { message: string };
      setMessage(data.message);
      loadData(false);
    } else {
      setError(result.error || 'Failed to sync services');
    }
    setSyncingServices(null);
  };

  const handleSyncOrders = async (providerSlug: string) => {
    if (!token) return;
    setSyncingOrders(providerSlug);
    setMessage('');
    setError('');

    const result = await adminApi.syncOrders(token);
    if (result.data) {
      const data = result.data as { message: string };
      setMessage(data.message);
    } else {
      setError(result.error || 'Failed to sync orders');
    }
    setSyncingOrders(null);
  };

  const handleToggleActive = async (serviceId: number, currentActive: boolean) => {
    if (!token) return;
    setTogglingId(serviceId);
    const result = await adminApi.toggleServiceActive(serviceId, token);
    setTogglingId(null);
    if (result.data) {
      setServices(prev =>
        prev.map(s => s.id === serviceId ? { ...s, is_active: !currentActive } : s)
      );
    }
  };

  const handleToggleShowInactive = async (providerSlug: string) => {
    if (!token) return;
    const result = await adminApi.toggleProviderShowInactive(providerSlug, token);
    if (result.data) {
      const data = result.data as { show_inactive_services: boolean };
      setProviders(prev =>
        prev.map(p => p.slug === providerSlug ? { ...p, show_inactive_services: data.show_inactive_services } : p)
      );
    }
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingProvider(true);
    setError('');
    setMessage('');

    const result = await adminApi.createProvider(newProviderForm, token);
    setAddingProvider(false);

    if (result.data) {
      setMessage('Provider added successfully');
      setShowAddProvider(false);
      setNewProviderForm({ name: '', api_url: '', api_key: '', currency: 'USD', exchange_rate: '1.0' });
      loadData(true);
    } else {
      setError(result.error || 'Failed to add provider');
    }
  };

  const handleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const handleToggleSelect = (id: number) => {
    const newSet = new Set(selectedServices);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedServices(newSet);
  };

  const handleBulkToggle = async (isActive: boolean) => {
    if (!token || selectedServices.size === 0) return;
    setBulkToggling(true);
    const result = await adminApi.bulkToggleServiceActive(Array.from(selectedServices), isActive, token);
    setBulkToggling(false);
    
    if (result.data) {
      setMessage(`Successfully ${isActive ? 'activated' : 'deactivated'} ${selectedServices.size} services.`);
      setSelectedServices(new Set());
      loadData(false);
    } else {
      setError(result.error || 'Failed to bulk toggle services');
    }
  };

  const handleToggleProviderActive = async (providerSlug: string, isActive: boolean) => {
    if (!token) return;
    const result = await adminApi.updateProvider(providerSlug, { is_active: !isActive }, token);
    if (result.data) {
      loadData(false);
    }
  };

  const handleSaveExchangeRate = async (providerSlug: string) => {
    if (!token || !rateValue) return;
    setSavingRate(true);
    const result = await adminApi.updateProvider(providerSlug, { exchange_rate: rateValue }, token);
    if (result.data) {
      const data = result.data as { provider: { exchange_rate: string } };
      setProviders(prev =>
        prev.map(p => p.slug === providerSlug ? { ...p, exchange_rate: data.provider.exchange_rate } : p)
      );
      setMessage(`Exchange rate updated to ${data.provider.exchange_rate}`);
      setEditingRate(null);
    } else {
      setError(result.error || 'Failed to update exchange rate');
    }
    setSavingRate(false);
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-semibold text-slate-400">Loading service providers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Service Providers & Sync</h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage upstream catalog feeds, sync rates, and toggle services from connected SMM providers.
          </p>
        </div>
        <button
          onClick={() => setShowAddProvider(true)}
          className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          + Add New Provider
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex justify-between items-center shadow-xs">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-600 hover:text-emerald-900 ml-4 font-bold cursor-pointer">✕</button>
        </div>
      )}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex justify-between items-center shadow-xs">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-rose-600 hover:text-rose-900 ml-4 font-bold cursor-pointer">✕</button>
        </div>
      )}

      {/* Provider Tabs */}
      <div className="flex flex-wrap gap-2">
        {providers.map(provider => {
          const isSelected = selectedProvider === provider.slug;
          return (
            <button
              key={provider.slug}
              onClick={() => { setSelectedProvider(provider.slug); setActiveTab('active'); setServiceSearch(''); }}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-md shadow-primary/20 ring-2 ring-primary/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900 shadow-2xs'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${provider.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
              <span>{provider.name}</span>
              <span className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>({provider.currency})</span>
            </button>
          );
        })}
      </div>

      {/* Selected Provider Content */}
      {currentProvider && (
        <div className="space-y-6">
          {/* Provider Controls Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6">
            <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-slate-100">
              {/* Sync Buttons */}
              <button
                onClick={() => handleSyncServices(currentProvider.slug)}
                disabled={syncingServices === currentProvider.slug}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {syncingServices === currentProvider.slug ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Syncing Catalog...
                  </span>
                ) : (
                  <>
                    <span>Sync Services</span>
                  </>
                )}
              </button>

              <button
                onClick={() => handleSyncOrders(currentProvider.slug)}
                disabled={syncingOrders === currentProvider.slug}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-50 text-primary border border-blue-200 hover:bg-blue-100 shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                {syncingOrders === currentProvider.slug ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Syncing Orders...
                  </span>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Sync Orders Status</span>
                  </>
                )}
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Provider Master Toggle */}
              <button
                onClick={() => handleToggleProviderActive(currentProvider.slug, currentProvider.is_active)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  currentProvider.is_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                    : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${currentProvider.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span>{currentProvider.is_active ? 'Provider Active' : 'Provider Disabled'}</span>
              </button>
            </div>

            {/* Provider Settings Metadata Row */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600">
              {/* Exchange Rate */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Exchange Rate:</span>
                {editingRate === currentProvider.slug ? (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">1 {currentProvider.currency} =</span>
                    <input
                      type="number"
                      step="0.01"
                      value={rateValue}
                      onChange={e => setRateValue(e.target.value)}
                      className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold"
                      autoFocus
                    />
                    <span>NGN</span>
                    <button
                      onClick={() => handleSaveExchangeRate(currentProvider.slug)}
                      disabled={savingRate}
                      className="px-2.5 py-1 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 cursor-pointer"
                    >
                      {savingRate ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingRate(null)}
                      className="px-2.5 py-1 bg-slate-100 text-slate-600 font-bold rounded-lg hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingRate(currentProvider.slug); setRateValue(currentProvider.exchange_rate); }}
                    className="font-bold text-slate-900 hover:text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>
                      {currentProvider.currency === 'NGN'
                        ? '1.00 (Native NGN)'
                        : `1 ${currentProvider.currency} = ₦${currentProvider.exchange_rate}`}
                    </span>
                    {currentProvider.currency !== 'NGN' && (
                      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {/* Show Inactive Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Show Inactive in User Storefront:</span>
                <button
                  type="button"
                  onClick={() => handleToggleShowInactive(currentProvider.slug)}
                  className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
                    currentProvider.show_inactive_services ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-xs ${
                    currentProvider.show_inactive_services ? 'translate-x-4' : ''
                  }`} />
                </button>
              </div>

              {/* Counts */}
              <div className="text-slate-500 font-medium">
                Active: <span className="font-black text-slate-900">{activeCount}</span> | Inactive: <span className="font-black text-slate-900">{inactiveCount}</span>
              </div>
            </div>
          </div>

          {/* Sub Tabs: Active vs Inactive Services & Smart Upstream Toggles */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Primary Active / Inactive Switcher */}
              <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl w-fit">
                <button
                  onClick={() => {
                    setActiveTab('active');
                    setSelectedServices(new Set());
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'active'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Active Services ({activeCount})
                </button>
                <button
                  onClick={() => {
                    setActiveTab('inactive');
                    setSelectedServices(new Set());
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'inactive'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Inactive / Disabled ({inactiveCount})
                </button>
              </div>

              {/* Smart Upstream Filtering Toggle (Context-Aware) */}
              {activeTab === 'active' ? (
                <button
                  type="button"
                  onClick={() => setShowOnlyDeadUpstream(!showOnlyDeadUpstream)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                    showOnlyDeadUpstream
                      ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs ring-2 ring-rose-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Show active Caryvn services that are disabled or removed upstream"
                >
                  <span className={`w-2 h-2 rounded-full ${showOnlyDeadUpstream ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`} />
                  <span>Dead Upstream</span>
                  {deadUpstreamCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      showOnlyDeadUpstream ? 'bg-rose-200 text-rose-800' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {deadUpstreamCount}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOnlyAvailableUpstream(!showOnlyAvailableUpstream)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                    showOnlyAvailableUpstream
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs ring-2 ring-emerald-100'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                  title="Show inactive Caryvn services that are available and healthy upstream"
                >
                  <span className={`w-2 h-2 rounded-full ${showOnlyAvailableUpstream ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span>Available Upstream</span>
                  {availableUpstreamCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      showOnlyAvailableUpstream ? 'bg-emerald-200 text-emerald-800' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {availableUpstreamCount}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* Search filter */}
            <input
              type="text"
              placeholder="Search service name, ID, category..."
              value={serviceSearch}
              onChange={e => setServiceSearch(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-72 shadow-2xs"
            />
          </div>

          {/* Smart Bulk Action Strip (Only the relevant action is shown) */}
          {selectedServices.size > 0 && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="text-xs font-black text-primary">
                  {selectedServices.size} {selectedServices.size === 1 ? 'service' : 'services'} selected
                </span>
              </div>

              {activeTab === 'active' ? (
                <button
                  onClick={() => handleBulkToggle(false)}
                  disabled={bulkToggling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <span>Deactivate Selected</span>
                </button>
              ) : (
                <button
                  onClick={() => handleBulkToggle(true)}
                  disabled={bulkToggling}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Activate Selected</span>
                </button>
              )}
            </div>
          )}

          {/* Services Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={filteredServices.length > 0 && selectedServices.size === filteredServices.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                />
                <span>Select All ({filteredServices.length})</span>
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                No services match your filters.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredServices.map(service => (
                  <div
                    key={service.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedServices.has(service.id)}
                        onChange={() => handleToggleSelect(service.id)}
                        className="w-4 h-4 mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{service.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">ID #{service.external_id}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{service.category_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-end sm:self-center">
                      <div className="text-right">
                        <p className="font-black text-slate-900">{formatCurrency(service.user_rate)}</p>
                        <p className="text-[10px] text-slate-400">per 1,000</p>
                      </div>

                      <button
                        onClick={() => handleToggleActive(service.id, service.is_active)}
                        disabled={togglingId === service.id}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                          service.is_active
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {togglingId === service.id ? '...' : service.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200 shadow-2xl overflow-hidden ring-1 ring-black/5 animate-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-base font-black text-slate-900">Add New SMM Provider</h2>
              <button 
                onClick={() => setShowAddProvider(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddProvider} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Provider Name</label>
                <input 
                  type="text" 
                  required 
                  value={newProviderForm.name}
                  onChange={e => setNewProviderForm({...newProviderForm, name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="e.g. SMMRocket"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">API URL (must end with /)</label>
                <input 
                  type="url" 
                  required 
                  value={newProviderForm.api_url}
                  onChange={e => setNewProviderForm({...newProviderForm, api_url: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  placeholder="https://smmrocket.com/api/v2/"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">API Key</label>
                <input 
                  type="text" 
                  required 
                  value={newProviderForm.api_key}
                  onChange={e => setNewProviderForm({...newProviderForm, api_key: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-primary/20" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                  <input 
                    type="text" 
                    required 
                    value={newProviderForm.currency}
                    onChange={e => setNewProviderForm({...newProviderForm, currency: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                    placeholder="USD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Rate to NGN</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={newProviderForm.exchange_rate}
                    onChange={e => setNewProviderForm({...newProviderForm, exchange_rate: String(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/20" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingProvider}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {addingProvider ? 'Adding...' : 'Add Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

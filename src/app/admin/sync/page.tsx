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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  };

  const currentProvider = useMemo(
    () => providers.find(p => p.slug === selectedProvider),
    [providers, selectedProvider]
  );

  // Filter services by selected provider and active/inactive tab
  const filteredServices = useMemo(() => {
    let filtered = services.filter(s => s.provider_name === currentProvider?.name);

    if (activeTab === 'active') {
      filtered = filtered.filter(s => s.is_active);
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
  }, [services, currentProvider, activeTab, serviceSearch, showOnlyAvailableUpstream]);

  const activeCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && s.is_active).length,
    [services, currentProvider]
  );
  const inactiveCount = useMemo(
    () => services.filter(s => s.provider_name === currentProvider?.name && !s.is_active).length,
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

    const result = await adminApi.syncOrders(token, providerSlug);
    if (result.data) {
      const data = result.data as { updated: number; errors: number };
      setMessage(`Orders synced: ${data.updated} updated, ${data.errors} errors`);
    } else {
      setError(result.error || 'Failed to sync orders');
    }
    setSyncingOrders(null);
  };

  const handleAddProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setAddingProvider(true);
    setError('');
    
    const result = await adminApi.createProvider(newProviderForm, token);
    
    setAddingProvider(false);
    if (result.data) {
      setMessage(`Provider ${newProviderForm.name} added successfully!`);
      setShowAddProvider(false);
      setNewProviderForm({ name: '', api_url: '', api_key: '', currency: 'USD', exchange_rate: '1.0' });
      loadData(false);
    } else {
      setError(result.error || 'Failed to add provider');
    }
  };

  const handleToggleService = async (serviceId: number) => {
    if (!token) return;
    setTogglingId(serviceId);

    const result = await adminApi.toggleServiceActive(serviceId, token);
    if (result.data) {
      const data = result.data as { is_active: boolean };
      setServices(prev =>
        prev.map(s => s.id === serviceId ? { ...s, is_active: data.is_active } : s)
      );
    }
    setTogglingId(null);
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

  const toggleSelectAll = () => {
    if (selectedServices.size === filteredServices.length) {
      setSelectedServices(new Set());
    } else {
      setSelectedServices(new Set(filteredServices.map(s => s.id)));
    }
  };

  const toggleSelectService = (id: number) => {
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
      <div className="py-12 text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-text-secondary">Loading providers...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Service Providers</h1>
          <p className="text-text-secondary text-sm mt-1">
            Manage services from multiple SMM providers
          </p>
        </div>
        <button
          onClick={() => setShowAddProvider(true)}
          className="btn-primary px-5 py-2.5 text-sm"
        >
          + Add New Provider
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex justify-between items-center">
          {message}
          <button onClick={() => setMessage('')} className="text-emerald-500 hover:text-emerald-300 ml-4">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex justify-between items-center">
          {error}
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-300 ml-4">✕</button>
        </div>
      )}

      {/* Provider Tabs */}
      <div className="flex gap-2 mb-6">
        {providers.map(provider => (
          <button
            key={provider.slug}
            onClick={() => { setSelectedProvider(provider.slug); setActiveTab('active'); setServiceSearch(''); }}
            className={`px-5 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              selectedProvider === provider.slug
                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                : 'bg-surface-dark text-text-secondary border border-border-dark hover:text-white hover:border-primary/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${provider.is_active ? 'bg-emerald-400' : 'bg-red-400'}`} />
            {provider.name}
            <span className="text-xs opacity-70">({provider.currency})</span>
          </button>
        ))}
      </div>

      {/* Selected Provider Content */}
      {currentProvider && (
        <div className="space-y-6">
          {/* Provider Controls Card */}
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              {/* Sync Buttons */}
              <button
                onClick={() => handleSyncServices(currentProvider.slug)}
                disabled={syncingServices === currentProvider.slug}
                className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
              >
                {syncingServices === currentProvider.slug ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  'Sync Services'
                )}
              </button>

              <button
                onClick={() => handleSyncOrders(currentProvider.slug)}
                disabled={syncingOrders === currentProvider.slug}
                className="px-5 py-2.5 text-sm rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-all disabled:opacity-50"
              >
                {syncingOrders === currentProvider.slug ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                    Syncing...
                  </span>
                ) : (
                  'Sync Orders'
                )}
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Provider On/Off */}
              <button
                onClick={() => handleToggleProviderActive(currentProvider.slug, currentProvider.is_active)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  currentProvider.is_active
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                }`}
              >
                {currentProvider.is_active ? 'Provider Active' : 'Provider Off'}
              </button>
            </div>

            {/* Provider Info Row */}
            <div className="flex flex-wrap gap-6 text-sm">
              {/* Exchange Rate */}
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Exchange Rate:</span>
                {editingRate === currentProvider.slug ? (
                  <div className="flex items-center gap-2">
                    <span className="text-text-secondary">1 {currentProvider.currency} =</span>
                    <input
                      type="number"
                      step="0.01"
                      value={rateValue}
                      onChange={e => setRateValue(e.target.value)}
                      className="input w-28 h-8 text-sm"
                      autoFocus
                    />
                    <span className="text-text-secondary">NGN</span>
                    <button
                      onClick={() => handleSaveExchangeRate(currentProvider.slug)}
                      disabled={savingRate}
                      className="px-3 py-1 rounded bg-primary text-white text-xs hover:bg-primary-hover disabled:opacity-50"
                    >
                      {savingRate ? '...' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingRate(null)}
                      className="px-3 py-1 rounded bg-surface-darker text-text-secondary text-xs hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditingRate(currentProvider.slug); setRateValue(currentProvider.exchange_rate); }}
                    className="text-white font-medium hover:text-primary transition-colors"
                  >
                    {currentProvider.currency === 'NGN'
                      ? '1.00 (native)'
                      : `1 ${currentProvider.currency} = ${currentProvider.exchange_rate} NGN`}
                    {currentProvider.currency !== 'NGN' && <span className="ml-1 text-text-secondary text-xs">✏️</span>}
                  </button>
                )}
              </div>

              {/* Show Inactive Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-text-secondary">Show inactive to users:</span>
                <button
                  onClick={() => handleToggleShowInactive(currentProvider.slug)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    currentProvider.show_inactive_services ? 'bg-primary' : 'bg-surface-darker border border-border-dark'
                  }`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    currentProvider.show_inactive_services ? 'translate-x-5' : ''
                  }`} />
                </button>
              </div>

              {/* Service Counts */}
              <div className="text-text-secondary">
                <span className="text-emerald-400 font-medium">{activeCount}</span> active
                <span className="mx-1">·</span>
                <span className="text-amber-400 font-medium">{inactiveCount}</span> inactive
              </div>
            </div>
          </div>

          {/* Active/Inactive Tabs + Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <div className="flex bg-surface-dark rounded-full border border-border-dark p-1 w-fit">
              <button
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'active'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                ACTIVE ({activeCount})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  activeTab === 'inactive'
                    ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                INACTIVE ({inactiveCount})
              </button>
            </div>

            <div className="flex-1 flex gap-4">
              <input
                type="text"
                placeholder="Search services..."
                value={serviceSearch}
                onChange={e => setServiceSearch(e.target.value)}
                className="input w-full max-w-md h-10 text-sm"
              />
              
              {activeTab === 'inactive' && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-text-secondary font-bold">Available Upstream</span>
                  <button
                    onClick={() => setShowOnlyAvailableUpstream(!showOnlyAvailableUpstream)}
                    className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                      showOnlyAvailableUpstream ? 'bg-emerald-500' : 'bg-surface-darker border border-border-dark'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                      showOnlyAvailableUpstream ? 'translate-x-4' : ''
                    }`} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bulk Action Bar */}
          {filteredServices.length > 0 && (
            <div className="bg-surface-darker rounded-xl border border-border-dark p-3 flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={toggleSelectAll}>
                <input 
                  type="checkbox" 
                  className="rounded border-border-dark bg-surface-dark text-primary focus:ring-primary h-4 w-4"
                  checked={selectedServices.size === filteredServices.length}
                  onChange={toggleSelectAll}
                />
                <span className="text-sm text-text-secondary select-none">
                  Select All ({filteredServices.length})
                </span>
              </div>
              
              {selectedServices.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-primary font-bold text-sm mr-2">{selectedServices.size} selected</span>
                  <button
                    onClick={() => handleBulkToggle(activeTab === 'inactive')}
                    disabled={bulkToggling}
                    className="px-4 py-1.5 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {bulkToggling ? '...' : (activeTab === 'active' ? 'Mass Deactivate' : 'Mass Activate')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Service List */}
          <div className="space-y-2">
            {filteredServices.length === 0 ? (
              <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center">
                <p className="text-text-secondary">
                  {serviceSearch
                    ? 'No services match your search'
                    : activeTab === 'active'
                    ? 'No active services. Sync to fetch from provider.'
                    : 'No inactive services.'}
                </p>
              </div>
            ) : (
              filteredServices.map(service => (
                <div
                  key={service.id}
                  className={`bg-surface-dark rounded-xl border p-4 flex items-center justify-between gap-4 transition-colors ${selectedServices.has(service.id) ? 'border-primary/50 bg-primary/5' : 'border-border-dark hover:border-primary/20'}`}
                >
                  <div className="shrink-0">
                    <input 
                      type="checkbox" 
                      className="rounded border-border-dark bg-surface-darker text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                      checked={selectedServices.has(service.id)}
                      onChange={() => toggleSelectService(service.id)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-secondary text-xs font-mono">#{service.external_id}</span>
                      <span className="text-text-secondary text-xs">·</span>
                      <span className="text-text-secondary text-xs">{service.category_name}</span>
                      
                      {/* Provider Status Badges (only really needed in Inactive tab) */}
                      {!service.is_active && service.provider_is_active && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-medium border border-emerald-500/20">
                          Available
                        </span>
                      )}
                      {!service.provider_is_active && (
                        <span className="ml-2 px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-medium border border-red-500/20">
                          Dead
                        </span>
                      )}
                    </div>
                    <p className="text-white text-sm font-medium truncate">{service.name}</p>
                    <div className="flex items-center gap-3 mt-1  text-xs">
                      <span className="text-primary font-medium">{formatCurrency(service.user_rate)} /1k</span>
                      <span className="text-text-secondary">Min: {service.min_quantity}</span>
                      <span className="text-text-secondary">Max: {service.max_quantity.toLocaleString()}</span>
                      {service.has_refill && <span className="text-emerald-400">♻️ Refill</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleService(service.id)}
                    disabled={togglingId === service.id}
                    className={`px-4 py-2 rounded-lg text-xs font-medium transition-all shrink-0 ${
                      service.is_active
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                    }`}
                  >
                    {togglingId === service.id ? '...' : activeTab === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {providers.length === 0 && (
        <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center">
          <p className="text-text-secondary mb-4">No providers configured yet.</p>
          <button
            onClick={() => setShowAddProvider(true)}
            className="btn-primary px-5 py-2.5 text-sm"
          >
            + Add Your First Provider
          </button>
        </div>
      )}

      {/* Add Provider Modal */}
      {showAddProvider && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface-darker w-full max-w-md rounded-2xl border border-border-dark shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-border-dark flex justify-between items-center bg-surface-dark/50">
              <h2 className="text-lg font-semibold text-white">Add New Provider</h2>
              <button 
                onClick={() => setShowAddProvider(false)}
                className="text-text-secondary hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleAddProvider} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Provider Name</label>
                <input 
                  type="text" 
                  required 
                  value={newProviderForm.name}
                  onChange={e => setNewProviderForm({...newProviderForm, name: e.target.value})}
                  className="input w-full" 
                  placeholder="e.g. SMMRocket"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">API URL (must end with /)</label>
                <input 
                  type="url" 
                  required 
                  value={newProviderForm.api_url}
                  onChange={e => setNewProviderForm({...newProviderForm, api_url: e.target.value})}
                  className="input w-full" 
                  placeholder="https://smmrocket.com/api/v2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">API Key</label>
                <input 
                  type="text" 
                  required 
                  value={newProviderForm.api_key}
                  onChange={e => setNewProviderForm({...newProviderForm, api_key: e.target.value})}
                  className="input w-full" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Provider Currency</label>
                  <input 
                    type="text" 
                    required 
                    value={newProviderForm.currency}
                    onChange={e => setNewProviderForm({...newProviderForm, currency: e.target.value})}
                    className="input w-full" 
                    placeholder="USD"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1">Exchange Rate to NGN</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required 
                    value={newProviderForm.exchange_rate}
                    onChange={e => setNewProviderForm({...newProviderForm, exchange_rate: String(e.target.value)})}
                    className="input w-full" 
                  />
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setShowAddProvider(false)}
                  className="px-4 py-2 rounded-lg text-sm text-text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={addingProvider}
                  className="btn-primary px-6 py-2 text-sm disabled:opacity-50"
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

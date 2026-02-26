'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

interface Service {
  id: number;
  provider_id: number;
  name: string;
  category_name: string;
  user_rate: string;
  is_active: boolean;
}

export default function AdminSyncPage() {
  const { token } = useAuth();
  
  // Sync State
  const [syncingServices, setSyncingServices] = useState(false);
  const [servicesResult, setServicesResult] = useState<{ success: boolean; message: string } | null>(null);
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [ordersResult, setOrdersResult] = useState<{ success: boolean; message: string } | null>(null);

  // Service management
  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [serviceSearch, setServiceSearch] = useState('');
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'inactive'>('active');

  // Site settings
  const [showInactiveToUsers, setShowInactiveToUsers] = useState(false);
  const [togglingMaster, setTogglingMaster] = useState(false);

  useEffect(() => {
    if (token) {
      loadServices();
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    if (!token) return;
    const result = await adminApi.getSiteSettings(token);
    if (result.data) {
      const data = result.data as { show_inactive_services: boolean };
      setShowInactiveToUsers(data.show_inactive_services);
    }
  };

  const handleToggleMaster = async () => {
    if (!token) return;
    setTogglingMaster(true);
    const result = await adminApi.toggleShowInactiveServices(token);
    if (result.data) {
      const data = result.data as { show_inactive_services: boolean };
      setShowInactiveToUsers(data.show_inactive_services);
    }
    setTogglingMaster(false);
  };

  const handleSyncServices = async () => {
    if (!token) return;
    setSyncingServices(true);
    setServicesResult(null);
    const response = await adminApi.syncServices(token);
    if (response.data) {
      const data = response.data as { synced?: number; count?: number; message: string };
      setServicesResult({ success: true, message: data.message || `Synced ${data.count || data.synced || 0} services` });
      loadServices();
    } else {
      setServicesResult({ success: false, message: response.error || 'Failed to sync services' });
    }
    setSyncingServices(false);
  };

  const handleSyncOrders = async () => {
    if (!token) return;
    setSyncingOrders(true);
    setOrdersResult(null);
    const response = await adminApi.syncOrders(token);
    if (response.data) {
      const data = response.data as { updated: number; errors: number };
      setOrdersResult({ success: true, message: `${data.updated} updated, ${data.errors} errors` });
    } else {
      setOrdersResult({ success: false, message: response.error || 'Failed to sync orders' });
    }
    setSyncingOrders(false);
  };

  const loadServices = async () => {
    if (!token) return;
    setServicesLoading(true);
    const result = await adminApi.getAllServices(token);
    if (result.data) {
      const data = result.data as { services?: Service[] } | Service[];
      setServices(Array.isArray(data) ? data : data.services || []);
    }
    setServicesLoading(false);
  };

  const handleToggleService = async (serviceId: number) => {
    if (!token) return;
    setTogglingId(serviceId);
    const result = await adminApi.toggleServiceActive(serviceId, token);
    if (result.data) {
      const data = result.data as { is_active: boolean };
      setServices(prev =>
        prev.map(s => s.provider_id === serviceId ? { ...s, is_active: data.is_active } : s)
      );
    }
    setTogglingId(null);
  };

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    s.category_name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
    String(s.provider_id).includes(serviceSearch)
  );

  const activeServices = filtered.filter(s => s.is_active);
  const inactiveServices = filtered.filter(s => !s.is_active);
  const displayedServices = activeTab === 'active' ? activeServices : inactiveServices;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Sync &amp; Services</h1>
        <p className="text-text-secondary">Synchronize data and manage service visibility</p>
      </div>

      {/* Sync Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold">Sync Services</h2>
              <p className="text-text-secondary text-xs">Fetch latest from provider</p>
            </div>
          </div>
          {servicesResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium text-center ${servicesResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {servicesResult.message}
            </div>
          )}
          <button onClick={handleSyncServices} disabled={syncingServices} className="btn-primary w-full mt-auto disabled:opacity-50">
            {syncingServices ? 'Syncing...' : 'Sync Services'}
          </button>
        </div>

        <div className="bg-surface-dark rounded-xl border border-border-dark p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-white font-semibold">Sync Orders</h2>
              <p className="text-text-secondary text-xs">Update pending order statuses</p>
            </div>
          </div>
          {ordersResult && (
            <div className={`mb-4 p-3 rounded-lg text-sm font-medium text-center ${ordersResult.success ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
              {ordersResult.message}
            </div>
          )}
          <button onClick={handleSyncOrders} disabled={syncingOrders} className="w-full px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 mt-auto">
            {syncingOrders ? 'Syncing...' : 'Sync Orders'}
          </button>
        </div>
      </div>

      {/* Service Management */}
      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        {/* Header with pill selector + search */}
        <div className="p-4 border-b border-border-dark space-y-3">
          {/* Pill selector */}
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-darker rounded-full p-1 flex-1 sm:flex-none">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'active'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Active ({activeServices.length})
              </button>
              <button
                onClick={() => setActiveTab('inactive')}
                className={`flex-1 sm:flex-none px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === 'inactive'
                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                Inactive ({inactiveServices.length})
              </button>
            </div>
          </div>

          {/* Master toggle — only visible on inactive tab */}
          {activeTab === 'inactive' && (
            <div className="flex items-center justify-between bg-surface-darker rounded-lg px-3 py-2.5">
              <div>
                <p className="text-white text-sm font-medium">Show all to users</p>
                <p className="text-text-secondary text-xs">Make inactive services visible to users too</p>
              </div>
              <button
                onClick={handleToggleMaster}
                disabled={togglingMaster}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                  showInactiveToUsers ? 'bg-amber-500' : 'bg-surface-dark border border-border-dark'
                } ${togglingMaster ? 'opacity-50' : ''}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    showInactiveToUsers ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {/* Search */}
          <input
            type="text"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder="Search by name, category, or ID..."
            className="w-full px-4 py-3 rounded-lg bg-surface-darker border border-border-dark text-white placeholder-text-secondary text-sm focus:outline-none focus:border-primary"
          />
        </div>

        {/* Service list */}
        {servicesLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="max-h-[500px] overflow-y-auto">
            {displayedServices.length > 0 ? (
              displayedServices.map((service) => (
                <div
                  key={service.provider_id}
                  className="flex items-center justify-between px-4 py-3 border-b border-border-dark/50 hover:bg-surface-darker/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-xs font-mono">#{service.provider_id}</span>
                      <span className={`text-sm font-medium truncate ${service.is_active ? 'text-white' : 'text-text-secondary'}`}>
                        {service.name}
                      </span>
                    </div>
                    <span className="text-text-secondary text-xs">{service.category_name}</span>
                  </div>
                  <button
                    onClick={() => handleToggleService(service.provider_id)}
                    disabled={togglingId === service.provider_id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50 ${
                      activeTab === 'active'
                        ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20'
                        : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
                    }`}
                  >
                    {togglingId === service.provider_id ? '...' : activeTab === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-text-secondary text-sm">
                No {activeTab} services {serviceSearch && 'match your search'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

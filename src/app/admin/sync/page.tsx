'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';

export default function AdminSyncPage() {
  const { token } = useAuth();
  
  // Services Sync State
  const [syncingServices, setSyncingServices] = useState(false);
  const [servicesResult, setServicesResult] = useState<{ success: boolean; message: string } | null>(null);

  // Orders Sync State
  const [syncingOrders, setSyncingOrders] = useState(false);
  const [ordersResult, setOrdersResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSyncServices = async () => {
    if (!token) return;

    setSyncingServices(true);
    setServicesResult(null);

    const response = await adminApi.syncServices(token);
    
    if (response.data) {
      const data = response.data as { synced?: number; count?: number; message: string };
      setServicesResult({
        success: true,
        message: data.message || `Successfully synced ${data.count || data.synced || 0} services`,
      });
    } else {
      setServicesResult({
        success: false,
        message: response.error || 'Failed to sync services',
      });
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
      setOrdersResult({
        success: true,
        message: `Synced orders: ${data.updated} updated, ${data.errors} errors`,
      });
    } else {
      setOrdersResult({
        success: false,
        message: response.error || 'Failed to sync orders',
      });
    }

    setSyncingOrders(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">Sync Data</h1>
        <p className="text-text-secondary">Synchronize platform data with SMM provider</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sync Services Card */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </div>

          <h2 className="text-white text-lg font-semibold mb-2">Sync Services & Prices</h2>
          <p className="text-text-secondary text-sm mb-6 flex-grow">
            Fetch the latest services and prices from the provider. 
            Updates existing services and adds new ones.
          </p>

          {servicesResult && (
            <div className={`w-full mb-6 p-3 rounded-lg text-sm font-medium ${
              servicesResult.success 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {servicesResult.message}
            </div>
          )}

          <button
            onClick={handleSyncServices}
            disabled={syncingServices}
            className="btn-primary w-full disabled:opacity-50"
          >
            {syncingServices ? 'Syncing Services...' : 'Sync Services'}
          </button>
        </div>

        {/* Sync Orders Card */}
        <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>

          <h2 className="text-white text-lg font-semibold mb-2">Sync Active Orders</h2>
          <p className="text-text-secondary text-sm mb-6 flex-grow">
            Update statuses for all pending, processing, and in-progress orders.
            Useful if orders seem stuck.
          </p>

          {ordersResult && (
            <div className={`w-full mb-6 p-3 rounded-lg text-sm font-medium ${
              ordersResult.success 
                ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}>
              {ordersResult.message}
            </div>
          )}

          <button
            onClick={handleSyncOrders}
            disabled={syncingOrders}
            className="w-full px-4 py-2 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncingOrders ? 'Syncing Orders...' : 'Sync Orders'}
          </button>
        </div>
      </div>
    </div>
  );
}

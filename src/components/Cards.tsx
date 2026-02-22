'use client';

import { formatCurrency, getStatusColor } from '@/lib/utils';

interface ServiceCardProps {
  service: {
    id: number;
    provider_id: number;
    name: string;
    category_name: string;
    user_rate: string;
    min_quantity: number;
    max_quantity: number;
    has_refill: boolean;
    has_cancel: boolean;
    is_featured?: boolean;
  };
  onOrder?: (service: ServiceCardProps['service']) => void;
}

export default function ServiceCard({ service, onOrder }: ServiceCardProps) {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-dark p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
            {service.name}
          </h3>
          <p className="text-text-secondary text-xs mt-1">{service.category_name}</p>
        </div>
        {service.is_featured && (
          <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
            Featured
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 mb-4">
        {service.has_refill && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-500">
            Refill
          </span>
        )}
        {service.has_cancel && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/10 text-amber-500">
            Cancel
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-primary text-xl font-bold">
            {formatCurrency(service.user_rate)}
          </p>
          <p className="text-text-secondary text-xs">per 1000</p>
        </div>
        <div className="text-right">
          <p className="text-text-secondary text-xs">
            Min: {service.min_quantity.toLocaleString()}
          </p>
          <p className="text-text-secondary text-xs">
            Max: {service.max_quantity.toLocaleString()}
          </p>
        </div>
      </div>

      {onOrder && (
        <button
          onClick={() => onOrder(service)}
          className="w-full mt-4 h-10 rounded-lg bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-all"
        >
          Order Now
        </button>
      )}
    </div>
  );
}

// Stats Card Component
interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: string;
  positive?: boolean;
  valueClassName?: string;
}

export function StatsCard({ title, value, icon, change, positive, valueClassName }: StatsCardProps) {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-dark p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-text-secondary text-sm">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </div>
      <p className={`text-2xl font-bold ${valueClassName || 'text-white'}`}>{value}</p>
      {change && (
        <p className={`text-xs mt-1 ${positive ? 'text-emerald-500' : 'text-red-500'}`}>
          {positive ? '↑' : '↓'} {change}
        </p>
      )}
    </div>
  );
}

// Order Row Component
interface OrderRowProps {
  order: {
    id: string;
    service_name: string;
    link: string;
    quantity: number;
    charge: string;
    status: string;
    created_at: string;
  };
  onClick?: () => void;
}

export function OrderRow({ order, onClick }: OrderRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`border-b border-border-dark hover:bg-surface-dark/50 transition-colors ${onClick ? 'cursor-pointer' : ''}`}
    >
      <td className="py-4 px-4">
        <p className="text-white text-sm font-medium truncate max-w-[200px]">
          {order.service_name}
        </p>
      </td>
      <td className="py-4 px-4">
        <p className="text-text-secondary text-sm truncate max-w-[150px]">{order.link}</p>
      </td>
      <td className="py-4 px-4">
        <p className="text-white text-sm">{order.quantity.toLocaleString()}</p>
      </td>
      <td className="py-4 px-4">
        <p className="text-white text-sm">{formatCurrency(order.charge)}</p>
      </td>
      <td className="py-4 px-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
          {order.status.replace('_', ' ')}
        </span>
      </td>
      <td className="py-4 px-4">
        <p className="text-text-secondary text-sm">
          {new Date(order.created_at).toLocaleDateString()}
        </p>
      </td>
    </tr>
  );
}

// Skeleton Components
export function ServiceCardSkeleton() {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-dark p-5">
      <div className="skeleton h-4 w-3/4 rounded mb-2" />
      <div className="skeleton h-3 w-1/2 rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-5 w-12 rounded" />
        <div className="skeleton h-5 w-12 rounded" />
      </div>
      <div className="skeleton h-6 w-20 rounded mb-1" />
      <div className="skeleton h-3 w-16 rounded" />
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="bg-surface-dark rounded-xl border border-border-dark p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="skeleton h-4 w-20 rounded" />
        <div className="skeleton h-10 w-10 rounded-lg" />
      </div>
      <div className="skeleton h-8 w-24 rounded" />
    </div>
  );
}

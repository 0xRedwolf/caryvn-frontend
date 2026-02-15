/**
 * Utility functions for Caryvn.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency amount.
 */
export function formatCurrency(amount: number | string, currency = 'NGN'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Format number with commas.
 */
export function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return new Intl.NumberFormat('en-US').format(n);
}

/**
 * Format date for display.
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/**
 * Format relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * Calculate order price from rate and quantity.
 */
export function calculatePrice(rate: number | string, quantity: number): number {
  const r = typeof rate === 'string' ? parseFloat(rate) : rate;
  return (r / 1000) * quantity;
}

/**
 * Validate URL format.
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

/**
 * Get status color class.
 */
export function getStatusColor(status: string): string {
  const statusMap: Record<string, string> = {
    completed: 'status-completed',
    partial: 'status-completed',
    pending: 'status-pending',
    processing: 'status-processing',
    in_progress: 'status-processing',
    canceled: 'status-canceled',
    cancelled: 'status-canceled',
    refunded: 'status-canceled',
    failed: 'status-canceled',
  };
  return statusMap[status.toLowerCase()] || 'status-pending';
}

/**
 * Get platform icon name for a category.
 */
export function getPlatformIcon(category: string): string {
  const categoryLower = category.toLowerCase();
  if (categoryLower.includes('instagram')) return 'camera';
  if (categoryLower.includes('tiktok')) return 'music';
  if (categoryLower.includes('youtube')) return 'play';
  if (categoryLower.includes('facebook')) return 'thumbs-up';
  if (categoryLower.includes('twitter') || categoryLower.includes('x ')) return 'at-sign';
  if (categoryLower.includes('telegram')) return 'send';
  if (categoryLower.includes('spotify')) return 'music';
  if (categoryLower.includes('linkedin')) return 'linkedin';
  return 'globe';
}

/**
 * Get platform color for badges.
 */
export function getPlatformColor(platform: string): string {
  const platformLower = platform.toLowerCase();
  const colors: Record<string, string> = {
    instagram: 'bg-pink-500/10 text-pink-500',
    tiktok: 'bg-white/10 text-white',
    youtube: 'bg-red-500/10 text-red-500',
    facebook: 'bg-blue-500/10 text-blue-500',
    twitter: 'bg-sky-500/10 text-sky-500',
    telegram: 'bg-blue-400/10 text-blue-400',
    spotify: 'bg-green-500/10 text-green-500',
  };
  
  for (const [key, value] of Object.entries(colors)) {
    if (platformLower.includes(key)) return value;
  }
  return 'bg-slate-500/10 text-slate-400';
}

/**
 * Debounce function.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Copy text to clipboard.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

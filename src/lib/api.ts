/**
 * API utilities for Caryvn frontend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown> | FormData;
  token?: string | null;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export const SESSION_EXPIRED_EVENT = 'caryvn_session_expired';
export const TOKEN_REFRESHED_EVENT = 'caryvn_token_refreshed';

// Singleton promise to prevent parallel refresh race condition with token rotation
let isRefreshingPromise: Promise<string | null> | null = null;

async function getNewAccessToken(): Promise<string | null> {
  if (isRefreshingPromise) {
    return isRefreshingPromise;
  }

  isRefreshingPromise = (async () => {
    try {
      if (typeof window === 'undefined') return null;
      const storedRefresh = localStorage.getItem('caryvn_refresh');
      if (!storedRefresh) return null;

      const res = await fetch(`${API_URL}/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: storedRefresh }),
        credentials: 'include',
      });

      if (!res.ok) {
        // Refresh token failed or expired — notify session expired
        window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { reason: 'token_expired' } }));
        return null;
      }

      const data = await res.json().catch(() => ({}));
      if (data?.access) {
        localStorage.setItem('caryvn_token', data.access);
        if (data.refresh) {
          localStorage.setItem('caryvn_refresh', data.refresh);
        }
        window.dispatchEvent(new CustomEvent(TOKEN_REFRESHED_EVENT, { detail: { access: data.access } }));
        return data.access as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshingPromise = null;
    }
  })();

  return isRefreshingPromise;
}

/**
 * Make an API request to the Django backend.
 */
export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {};

  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
      credentials: 'include',
      cache: 'no-store', // Fix: Prevent Next.js from caching API responses (avoids stale prices)
    });

    const data = await response.json().catch(() => ({}));

    // If 401 Unauthorized due to expired access token, attempt transparent silent refresh
    const isTokenError = response.status === 401 && (
      data.code === 'token_not_valid' ||
      (typeof data.detail === 'string' && data.detail.toLowerCase().includes('token'))
    );

    if (isTokenError && endpoint !== '/token/refresh/' && endpoint !== '/auth/login/' && endpoint !== '/auth/register/') {
      const newAccessToken = await getNewAccessToken();
      if (newAccessToken) {
        // Re-execute original request with new access token
        return api<T>(endpoint, {
          ...options,
          token: newAccessToken,
        });
      }
    }

    if (!response.ok) {
      let errorMessage = data.error || data.detail;
      if (!errorMessage && typeof data === 'object' && data !== null) {
        const entries = Object.entries(data);
        if (entries.length > 0) {
          const [field, errorVal] = entries[0];
          const msg = Array.isArray(errorVal) ? errorVal[0] : String(errorVal);
          errorMessage = field === 'non_field_errors' ? msg : `${field}: ${msg}`;
        }
      }
      return {
        error: errorMessage || 'An error occurred',
        status: response.status,
      };
    }

    return { data, status: response.status };
  } catch (error) {
    console.error('API Error:', error);
    return {
      error: 'Network error. Please try again.',
      status: 0,
    };
  }
}

// Auth API
export const authApi = {
  register: (data: { email: string; username: string; password: string; password2: string; first_name?: string; last_name?: string }) =>
    api('/auth/register/', { method: 'POST', body: data as unknown as Record<string, unknown> }),

  login: (data: { login: string; password: string }) =>
    api('/auth/login/', { method: 'POST', body: data as unknown as Record<string, unknown> }),

  logout: (refreshToken: string, token: string) =>
    api('/auth/logout/', { method: 'POST', body: { refresh: refreshToken }, token }),

  getProfile: (token: string) =>
    api('/auth/profile/', { token }),

  updateProfile: (data: { first_name?: string; last_name?: string; username?: string }, token: string) =>
    api('/auth/profile/', { method: 'PATCH', body: data, token }),

  changePassword: (data: { old_password: string; new_password: string }, token: string) =>
    api('/auth/change-password/', { method: 'POST', body: data, token }),

  generateApiKey: (token: string) =>
    api('/auth/api-key/', { method: 'POST', token }),

  refreshToken: (refreshToken: string) =>
    api('/token/refresh/', { method: 'POST', body: { refresh: refreshToken } }),

  requestPasswordReset: (email: string) =>
    api('/auth/password-reset/', { method: 'POST', body: { email } }),

  confirmPasswordReset: (data: Record<string, string>) =>
    api('/auth/password-reset/confirm/', { method: 'POST', body: data }),
};

// Wallet API
export const walletApi = {
  getWallet: (token: string) =>
    api('/wallet/', { token }),

  getTransactions: (token: string, limit = 20, offset = 0) =>
    api(`/wallet/transactions/?limit=${limit}&offset=${offset}`, { token }),

  initiateTopup: (amount: number, callbackUrl: string, token: string) =>
    api('/wallet/topup/initiate/', {
      method: 'POST',
      body: { amount, callback_url: callbackUrl },
      token,
    }),

  initiateManualTopup: (data: FormData, token: string) =>
    api('/wallet/topup/manual/', {
      method: 'POST',
      body: data, // Note: fetch naturally handles FormData directly, 'api' utility needs to allow FormData body
      token,
    }),

  initiateCryptoTopup: (data: FormData, token: string) =>
    api('/wallet/topup/crypto/', {
      method: 'POST',
      body: data,
      token,
    }),

  verifyTopup: (reference: string, token: string) =>
    api(`/wallet/topup/verify/?reference=${reference}`, { token }),

  initiateNexaPayTopup: (amount: number | string, token: string) =>
    api('/wallet/topup/nexapay/initiate/', {
      method: 'POST',
      body: { amount },
      token,
    }),

  checkNexaPayStatus: (reference: string, token: string) =>
    api(`/wallet/topup/nexapay/status/?reference=${encodeURIComponent(reference)}`, { token }),

  hideTransaction: (transactionId: string, token: string) =>
    api(`/wallet/transactions/${transactionId}/hide/`, { method: 'POST', token }),
};

// Services API
export const servicesApi = {
  getServices: (params?: { platform?: string; category?: string; search?: string; featured?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.featured) searchParams.set('featured', 'true');
    const query = searchParams.toString();
    return api(`/services/${query ? `?${query}` : ''}`);
  },

  getService: (serviceId: number) =>
    api(`/services/${serviceId}/`),
};

// Orders API
export const ordersApi = {
  createOrder: (data: { service_id: number; link: string; quantity: number; comments?: string }, token: string) =>
    api('/orders/create/', { method: 'POST', body: data, token }),

  checkProviderBalance: (data: { service_id: number; quantity: number }, token: string) =>
    api('/orders/check-provider-balance/', { method: 'POST', body: data, token }),

  getOrders: (token: string, params?: { status?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return api(`/orders/${query ? `?${query}` : ''}`, { token });
  },

  getOrder: (orderId: string, token: string) =>
    api(`/orders/${orderId}/`, { token }),

  requestRefill: (orderId: string, token: string) =>
    api(`/orders/${orderId}/refill/`, { method: 'POST', token }),

  hideOrder: (orderId: string, token: string) =>
    api(`/orders/${orderId}/hide/`, { method: 'POST', token }),
};

// Tickets API
export const ticketsApi = {
  getTickets: (token: string) =>
    api('/tickets/', { token }),

  createTicket: (data: { subject: string; message: string; priority?: string; order_id?: string }, token: string) =>
    api('/tickets/', { method: 'POST', body: data, token }),

  getTicket: (ticketId: string, token: string) =>
    api(`/tickets/${ticketId}/`, { token }),

  replyTicket: (ticketId: string, message: string, token: string) =>
    api(`/tickets/${ticketId}/`, { method: 'POST', body: { message }, token }),
};

// Admin API
export const adminApi = {
  getDashboard: (token: string) =>
    api('/admin/dashboard/', { token }),

  getUsers: (token: string, params?: { search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return api(`/admin/users/${query ? `?${query}` : ''}`, { token });
  },

  getOrders: (token: string, params?: { status?: string; user?: string; search?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.user) searchParams.set('user', params.user);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return api(`/admin/orders/${query ? `?${query}` : ''}`, { token });
  },

  getMarkupRules: (token: string) =>
    api('/admin/markup-rules/', { token }),

  getServiceCategories: (token: string) =>
    api('/admin/service-categories/', { token }),

  createMarkupRule: (data: Record<string, unknown>, token: string) =>
    api('/admin/markup-rules/', { method: 'POST', body: data, token }),

  updateMarkupRule: (ruleId: number, data: Record<string, unknown>, token: string) =>
    api(`/admin/markup-rules/${ruleId}/`, { method: 'PATCH', body: data, token }),

  deleteMarkupRule: (ruleId: number, token: string) =>
    api(`/admin/markup-rules/${ruleId}/`, { method: 'DELETE', token }),

  getLogs: (token: string, params?: { action?: string; limit?: number; offset?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.action) searchParams.set('action', params.action);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return api(`/admin/logs/${query ? `?${query}` : ''}`, { token });
  },

  syncServices: (token: string, providerSlug?: string) =>
    api('/admin/sync-services/', { method: 'POST', body: providerSlug ? { provider_slug: providerSlug } : {}, token }),

  syncOrders: (token: string, providerSlug?: string) =>
    api('/admin/sync-orders/', { method: 'POST', body: providerSlug ? { provider_slug: providerSlug } : {}, token }),

  getAnalytics: (token: string, days: number = 30) =>
    api(`/admin/analytics/?days=${days}`, { token }),

  // Order management actions
  cancelRefundOrders: (orderIds: string[], token: string) =>
    api('/admin/orders/cancel-refund/', { method: 'POST', body: { order_ids: orderIds }, token }),

  retryOrders: (orderIds: string[], token: string) =>
    api('/admin/orders/retry/', { method: 'POST', body: { order_ids: orderIds }, token }),

  checkOrderStatus: (orderIds: string[], token: string) =>
    api('/admin/orders/check-status/', { method: 'POST', body: { order_ids: orderIds }, token }),

  markOrderCompleted: (orderId: string, token: string) =>
    api(`/admin/orders/${orderId}/mark-completed/`, { method: 'POST', token }),

  refillOrder: (orderId: string, token: string) =>
    api(`/admin/orders/${orderId}/refill/`, { method: 'POST', token }),

  // User management actions
  toggleUserActive: (userId: string, token: string) =>
    api(`/admin/users/${userId}/toggle-active/`, { method: 'POST', token }),

  adjustUserBalance: (userId: string, action: 'credit' | 'deduct', amount: number, token: string) =>
    api(`/admin/users/${userId}/adjust-balance/`, { method: 'POST', body: { action, amount }, token }),

  getUserTransactions: (userId: string, token: string) =>
    api(`/admin/users/${userId}/transactions/`, { token }),

  getAllTransactions: (token: string, params?: { search?: string; gateway?: string; status?: string; limit?: number; offset?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.gateway) qs.set('gateway', params.gateway);
    if (params?.status) qs.set('status', params.status);
    if (params?.limit !== undefined) qs.set('limit', String(params.limit));
    if (params?.offset !== undefined) qs.set('offset', String(params.offset));
    return api(`/admin/transactions/?${qs.toString()}`, { token });
  },

  getPendingDeposits: (token: string) =>
    api('/admin/transactions/pending/', { token }),

  getPendingDepositsCount: (token: string) =>
    api('/admin/transactions/pending/count/', { token }),

  verifyTransaction: (transactionId: string, token: string, creditAmount?: number) =>
    api(`/admin/transactions/${transactionId}/verify/`, {
      method: 'POST',
      body: creditAmount !== undefined ? { credit_amount: creditAmount } : undefined,
      token,
    }),

  requeryTransaction: (transactionId: string, token: string) =>
    api(`/admin/transactions/${transactionId}/requery/`, { token }),

  failTransaction: (transactionId: string, token: string) =>
    api(`/admin/transactions/${transactionId}/fail/`, { method: 'POST', token }),

  getUserActivity: (userId: string, token: string, limit = 100) =>
    api(`/admin/users/${userId}/activity/?limit=${limit}`, { token }),

  getTickets: (token: string) =>
    api('/admin/tickets/', { token }),

  getTicket: (ticketId: string, token: string) =>
    api(`/admin/tickets/${ticketId}/`, { token }),

  getPendingTicketsCount: (token: string) =>
    api('/admin/tickets/pending/count/', { token }),

  replyTicket: (ticketId: string, action: 'reply' | 'close', message?: string, token?: string) =>
    api(`/admin/tickets/${ticketId}/`, { method: 'POST', body: { action, message }, token }),

  deleteUser: (userId: string, token: string) =>
    api(`/admin/users/${userId}/delete/`, { method: 'DELETE', token }),

  deleteLog: (logId: number, token: string) =>
    api(`/admin/logs/${logId}/delete/`, { method: 'DELETE', token }),

  deleteOrder: (orderId: string, token: string) =>
    api(`/admin/orders/${orderId}/delete/`, { method: 'DELETE', token }),

  toggleServiceActive: (serviceId: number, token: string) =>
    api(`/admin/services/${serviceId}/toggle-active/`, { method: 'POST', token }),

  bulkToggleServiceActive: (serviceIds: number[], isActive: boolean, token: string) =>
    api('/admin/services/bulk-toggle-active/', { method: 'POST', body: { service_ids: serviceIds, is_active: isActive }, token }),

  getAllServices: (token: string) =>
    api('/services/?include_inactive=true', { token }),

  getSiteSettings: (token: string) =>
    api('/settings/', { token }),
    
  updateSiteSettings: (data: Record<string, unknown>, token: string) =>
    api('/settings/', { method: 'POST', body: data, token }),

  toggleShowInactiveServices: (token: string) =>
    api('/admin/settings/toggle-show-inactive/', { method: 'POST', token }),

  updateCryptoSettings: (data: FormData, token: string) =>
    api('/settings/', { method: 'POST', body: data, token }),

  // Provider management
  getProviders: (token: string) =>
    api('/admin/providers/', { token }),

  createProvider: (data: Record<string, unknown>, token: string) =>
    api('/admin/providers/', { method: 'POST', body: data, token }),


  updateProvider: (slug: string, data: Record<string, unknown>, token: string) =>
    api(`/admin/providers/${slug}/`, { method: 'PATCH', body: data, token }),

  toggleProviderShowInactive: (slug: string, token: string) =>
    api(`/admin/providers/${slug}/toggle-show-inactive/`, { method: 'POST', token }),

  exportUsersCSV: async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/admin/users/export-csv/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to export CSV');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'users_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      return { success: true };
    } catch (error) {
      console.error('Export Error:', error);
      return { error: 'Failed to export CSV.' };
    }
  },

  // Popup & Ads Management
  getPopups: (token: string) =>
    api<PopupCard[]>('/admin/popups/', { token }),

  createPopup: (data: Partial<PopupCard> | FormData, token: string) =>
    api<PopupCard>('/admin/popups/', { method: 'POST', body: data as any, token }),

  updatePopup: (popupId: number, data: Partial<PopupCard> | FormData, token: string) =>
    api<PopupCard>(`/admin/popups/${popupId}/`, { method: 'PATCH', body: data as any, token }),

  deletePopup: (popupId: number, token: string) =>
    api(`/admin/popups/${popupId}/`, { method: 'DELETE', token }),

  togglePopupActive: (popupId: number, token: string) =>
    api<{ id: number; is_active: boolean; message: string }>(`/admin/popups/${popupId}/toggle-active/`, {
      method: 'POST',
      token,
    }),

  uploadPopupImage: async (file: File, token: string): Promise<{ url?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/admin/popups/upload-image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.error || 'Failed to upload ad image' };
      }
      const data = await res.json();
      return { url: data.url };
    } catch (e: any) {
      return { error: e.message || 'Ad image upload error' };
    }
  },

  // Notifications API
  getNotifications: (token: string) =>
    api('/admin/notifications/', { token }),

  markNotificationRead: (token: string, notificationId?: string, markAll: boolean = false) =>
    api('/admin/notifications/', {
      method: 'POST',
      body: markAll ? { all: true } : { notification_id: notificationId },
      token,
    }),

  triggerTestNotification: (token: string) =>
    api('/admin/notifications/test/', { method: 'POST', token }),
};

// Activity Tracking API
export const activityApi = {
  logPageVisit: (page: string, token: string) =>
    api('/activity/', { method: 'POST', body: { page, action: 'page_visit' }, token }),
};

// Popups & Ads API
export interface PopupCard {
  id: number;
  title: string;
  description: string;
  image?: string;
  action_url?: string;
  action_text?: string;
  placement_type: 'POPUP' | 'BANNER';
  impressions_count: number;
  clicks_count: number;
  order: number;
  is_active: boolean;
  created_at?: string;
}

export const popupsApi = {
  getActivePopups: (token: string, placement?: 'POPUP' | 'BANNER') => {
    const qs = placement ? `?placement=${placement}` : '';
    return api<PopupCard[]>(`/popups/active/${qs}`, { token });
  },
  trackImpression: (popupId: number) =>
    api<{ status: string }>(`/popups/${popupId}/impression/`, { method: 'POST' }),
  trackClick: (popupId: number) =>
    api<{ status: string }>(`/popups/${popupId}/click/`, { method: 'POST' }),
};

// =============================================================================
// Blog CMS Interfaces & APIs
// =============================================================================

export interface BlogAuthor {
  id: string;
  name: string;
  role: string;
  avatar_url?: string;
  bio?: string;
  social_x?: string;
  social_linkedin?: string;
  posts_count?: number;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  posts_count?: number;
}

export interface BlogPostItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image?: string;
  author_name: string;
  author_avatar?: string;
  category_name: string;
  category_slug: string;
  status: 'DRAFT' | 'PUBLISHED';
  featured: boolean;
  read_time: string;
  views_count: number;
  published_at: string;
  created_at: string;
}

export interface BlogPostDetail extends BlogPostItem {
  content: string;
  author?: BlogAuthor;
  category?: BlogCategory;
  author_id?: string;
  category_id?: string;
  seo_title?: string;
  seo_description?: string;
  canonical_url?: string;
  focus_keyword?: string;
  faqs?: Array<{ q: string; a: string }>;
  cta_title?: string;
  cta_description?: string;
  cta_button_text?: string;
  cta_url?: string;
  related_posts?: BlogPostItem[];
}

export const blogApi = {
  getPosts: (params?: { category?: string; q?: string; page?: number; featured?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    if (params?.featured) query.set('featured', 'true');
    const qs = query.toString();
    return api<any>(`/blog/${qs ? `?${qs}` : ''}`);
  },
  getPostBySlug: (slug: string) =>
    api<BlogPostDetail>(`/blog/${slug}/`),
  getCategories: () =>
    api<BlogCategory[]>('/blog/categories/'),
  getAuthors: () =>
    api<BlogAuthor[]>('/blog/authors/'),
};

export const adminBlogApi = {
  getPosts: (token: string, params?: { status?: string; q?: string; page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.q) query.set('q', params.q);
    if (params?.page) query.set('page', String(params.page));
    const qs = query.toString();
    return api<any>(`/admin/blog/posts/${qs ? `?${qs}` : ''}`, { token });
  },
  getPost: (id: string, token: string) =>
    api<BlogPostDetail>(`/admin/blog/posts/${id}/`, { token }),
  createPost: (data: any, token: string) =>
    api<BlogPostDetail>('/admin/blog/posts/', { method: 'POST', body: data, token }),
  updatePost: (id: string, data: any, token: string) =>
    api<BlogPostDetail>(`/admin/blog/posts/${id}/`, { method: 'PUT', body: data, token }),
  deletePost: (id: string, token: string) =>
    api(`/admin/blog/posts/${id}/`, { method: 'DELETE', token }),
  uploadImage: async (file: File, token: string): Promise<{ url?: string; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(`${API_URL}/admin/blog/upload-image/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return { error: err.error || 'Failed to upload image' };
      }
      const data = await res.json();
      return { url: data.url };
    } catch (e: any) {
      return { error: e.message || 'Image upload error' };
    }
  },
  getAuthors: (token: string) =>
    api<BlogAuthor[]>('/admin/blog/authors/', { token }),
  createAuthor: (data: any, token: string) =>
    api<BlogAuthor>('/admin/blog/authors/', { method: 'POST', body: data, token }),
  updateAuthor: (id: string, data: any, token: string) =>
    api<BlogAuthor>(`/admin/blog/authors/${id}/`, { method: 'PUT', body: data, token }),
  deleteAuthor: (id: string, token: string) =>
    api(`/admin/blog/authors/${id}/`, { method: 'DELETE', token }),
  getCategories: (token: string) =>
    api<BlogCategory[]>('/admin/blog/categories/', { token }),
  createCategory: (data: any, token: string) =>
    api<BlogCategory>('/admin/blog/categories/', { method: 'POST', body: data, token }),
  updateCategory: (id: string, data: any, token: string) =>
    api<BlogCategory>(`/admin/blog/categories/${id}/`, { method: 'PUT', body: data, token }),
  deleteCategory: (id: string, token: string) =>
    api(`/admin/blog/categories/${id}/`, { method: 'DELETE', token }),
};


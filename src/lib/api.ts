/**
 * API utilities for Caryvn frontend.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: Record<string, unknown>;
  token?: string | null;
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

/**
 * Make an API request to the Django backend.
 */
export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<ApiResponse<T>> {
  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        error: data.error || data.detail || 'An error occurred',
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
  register: (data: { email: string; password: string; password2: string; first_name?: string; last_name?: string }) =>
    api('/auth/register/', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    api('/auth/login/', { method: 'POST', body: data }),

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

  verifyTopup: (reference: string, token: string) =>
    api(`/wallet/topup/verify/?reference=${reference}`, { token }),
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

  syncServices: (token: string) =>
    api('/admin/sync-services/', { method: 'POST', token }),

  syncOrders: (token: string) =>
    api('/admin/sync-orders/', { method: 'POST', token }),

  getAnalytics: (token: string) =>
    api('/admin/analytics/', { token }),

  // Order management actions
  cancelRefundOrders: (orderIds: string[], token: string) =>
    api('/admin/orders/cancel-refund/', { method: 'POST', body: { order_ids: orderIds }, token }),

  retryOrders: (orderIds: string[], token: string) =>
    api('/admin/orders/retry/', { method: 'POST', body: { order_ids: orderIds }, token }),

  checkOrderStatus: (orderIds: string[], token: string) =>
    api('/admin/orders/check-status/', { method: 'POST', body: { order_ids: orderIds }, token }),

  // User management actions
  toggleUserActive: (userId: string, token: string) =>
    api(`/admin/users/${userId}/toggle-active/`, { method: 'POST', token }),

  getUserTransactions: (userId: string, token: string) =>
    api(`/admin/users/${userId}/transactions/`, { token }),
};

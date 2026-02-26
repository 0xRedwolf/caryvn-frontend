'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Activity {
  id: string;
  action: string;
  page: string;
  metadata: Record<string, unknown>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  balance: string;
  total_orders: number;
  is_active: boolean;
  date_joined: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: string;
  description: string;
  balance_after: string;
  status: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Transaction modal state
  const [txModalUser, setTxModalUser] = useState<string | null>(null);
  const [txModalEmail, setTxModalEmail] = useState('');
  const [txModalBalance, setTxModalBalance] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  // Activity modal state
  const [actModalUser, setActModalUser] = useState<string | null>(null);
  const [actModalEmail, setActModalEmail] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const actPollRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (token) {
      loadUsers();
    }
  }, [token, search]);

  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  const loadUsers = async () => {
    if (!token) return;
    setLoading(true);

    const result = await adminApi.getUsers(token, {
      search: search || undefined,
      limit: 50,
    });

    if (result.data) {
      const data = result.data as { users: User[]; total: number };
      setUsers(data.users || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  const handleToggleActive = async (userId: string, email: string) => {
    if (!token) return;
    setActionLoading(userId);
    const result = await adminApi.toggleUserActive(userId, token);
    setActionLoading('');
    if (result.data) {
      const data = result.data as { message: string; is_active: boolean };
      setActionResult({ type: 'success', message: `${email}: ${data.message}` });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: data.is_active } : u));
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed' });
    }
  };

  const handleViewTransactions = async (userId: string, email: string) => {
    if (!token) return;
    setTxModalUser(userId);
    setTxModalEmail(email);
    setTxLoading(true);
    const result = await adminApi.getUserTransactions(userId, token);
    setTxLoading(false);
    if (result.data) {
      const data = result.data as { transactions: Transaction[]; balance: string };
      setTransactions(data.transactions || []);
      setTxModalBalance(data.balance || '0');
    }
  };

  const fetchActivity = useCallback(async (userId: string) => {
    if (!token) return;
    const result = await adminApi.getUserActivity(userId, token);
    if (result.data) {
      const data = result.data as { activities: Activity[] };
      setActivities(data.activities || []);
    }
  }, [token]);

  const handleViewActivity = async (userId: string, email: string) => {
    if (!token) return;
    setActModalUser(userId);
    setActModalEmail(email);
    setActLoading(true);
    await fetchActivity(userId);
    setActLoading(false);

    // Start polling every 5 seconds
    if (actPollRef.current) clearInterval(actPollRef.current);
    actPollRef.current = setInterval(() => fetchActivity(userId), 5000);
  };

  const closeActivityModal = () => {
    setActModalUser(null);
    setActivities([]);
    if (actPollRef.current) {
      clearInterval(actPollRef.current);
      actPollRef.current = null;
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (actPollRef.current) clearInterval(actPollRef.current);
    };
  }, []);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deposit': return 'text-emerald-500';
      case 'charge': return 'text-red-400';
      case 'refund': return 'text-blue-400';
      case 'bonus': return 'text-amber-400';
      default: return 'text-text-secondary';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'page_visit': return '📄';
      case 'click': return '👆';
      case 'order': return '🛒';
      case 'login': return '🔑';
      default: return '⚡';
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'page_visit': return 'Page Visit';
      case 'click': return 'Click';
      case 'order': return 'Order';
      case 'login': return 'Login';
      default: return action;
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
          <p className="text-text-secondary">{total} registered users</p>
        </div>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-full sm:max-w-xs"
        />
      </div>

      {/* Action Result Banner */}
      {actionResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${
          actionResult.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {actionResult.message}
        </div>
      )}

      <div className="bg-surface-dark rounded-xl border border-border-dark">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-dark text-left">
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">User</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Balance</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Orders</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Status</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Joined</th>
                  <th className="py-3 px-4 text-text-secondary text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-border-dark hover:bg-surface-darker/50">
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-white font-medium">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-text-secondary text-sm truncate max-w-[150px] md:max-w-xs">{user.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-primary font-medium">{formatCurrency(user.balance)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-white">{user.total_orders}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_active 
                          ? 'bg-emerald-500/10 text-emerald-500' 
                          : 'bg-red-500/10 text-red-500'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-text-secondary text-sm">{formatDate(user.date_joined)}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTransactions(user.id, user.email)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                        >
                          Transactions
                        </button>
                        <button
                          onClick={() => handleViewActivity(user.id, user.email)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                        >
                          Activity
                        </button>
                        <button
                          onClick={() => handleToggleActive(user.id, user.email)}
                          disabled={actionLoading === user.id}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                            user.is_active
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                          }`}
                        >
                          {actionLoading === user.id ? '...' : user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(user)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-all bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
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
            <p className="text-text-secondary">No users found</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {txModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="p-6 border-b border-border-dark flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Transactions</h2>
                <p className="text-text-secondary text-sm">{txModalEmail} · Balance: {formatCurrency(txModalBalance)}</p>
              </div>
              <button
                onClick={() => { setTxModalUser(null); setTransactions([]); }}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {txLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-darker/50 border border-border-dark">
                      <div>
                        <span className={`text-xs font-bold uppercase ${getTypeColor(tx.type)}`}>{tx.type}</span>
                        <p className="text-text-secondary text-xs mt-0.5">{tx.description}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium text-sm ${parseFloat(tx.amount) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </p>
                        <p className="text-text-secondary text-xs">{formatDate(tx.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">No transactions found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {actModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="p-6 border-b border-border-dark flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">User Activity</h2>
                <p className="text-text-secondary text-sm">
                  {actModalEmail}
                  <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    Live — refreshing every 5s
                  </span>
                </p>
              </div>
              <button
                onClick={closeActivityModal}
                className="text-text-secondary hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {actLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map((act) => (
                    <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg bg-surface-darker/50 border border-border-dark">
                      <span className="text-lg mt-0.5">{getActionIcon(act.action)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase text-primary">{getActionLabel(act.action)}</span>
                          <span className="text-white font-medium text-sm truncate">{act.page}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          {act.ip_address && (
                            <span className="text-text-secondary text-xs">IP: {act.ip_address}</span>
                          )}
                          <span className="text-text-secondary text-xs">{formatDate(act.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-secondary text-center py-8">No activity recorded yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-2">Delete User Permanently</h3>
            <p className="text-text-secondary text-sm mb-2">
              This will permanently delete <span className="text-white font-medium">{deleteConfirm.email}</span> and all their data (orders, wallet, transactions).
            </p>
            <p className="text-red-400 text-xs mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-surface-darker text-text-secondary border border-border-dark hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!token) return;
                  setDeleteLoading(true);
                  const result = await adminApi.deleteUser(deleteConfirm.id, token);
                  setDeleteLoading(false);
                  if (result.data) {
                    setUsers(prev => prev.filter(u => u.id !== deleteConfirm.id));
                    setTotal(prev => prev - 1);
                    setActionResult({ type: 'success', message: `User ${deleteConfirm.email} permanently deleted` });
                  } else {
                    setActionResult({ type: 'error', message: result.error || 'Failed to delete user' });
                  }
                  setDeleteConfirm(null);
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                {deleteLoading ? 'Deleting...' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  username: string;
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState('');
  const [actionResult, setActionResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const PAGE_SIZE = 20;

  // Transaction modal state
  const [txModalUser, setTxModalUser] = useState<string | null>(null);
  const [txModalEmail, setTxModalEmail] = useState('');
  const [txModalBalance, setTxModalBalance] = useState('');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [txActionLoading, setTxActionLoading] = useState<string | null>(null);

  // Activity modal state
  const [actModalUser, setActModalUser] = useState<string | null>(null);
  const [actModalEmail, setActModalEmail] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [actLoading, setActLoading] = useState(false);
  const actPollRef = useRef<NodeJS.Timeout | null>(null);

  // Adjust Balance state
  const [adjustModalUser, setAdjustModalUser] = useState<User | null>(null);
  const [adjustAction, setAdjustAction] = useState<'credit' | 'deduct'>('credit');
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  useEffect(() => {
    if (token) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, search, offset]);

  useEffect(() => {
    setOffset(0);
  }, [search, statusFilter]);

  useEffect(() => {
    if (actionResult) {
      const timer = setTimeout(() => setActionResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [actionResult]);

  async function loadUsers() {
    if (!token) return;
    setLoading(true);

    const result = await adminApi.getUsers(token, {
      search: search || undefined,
      limit: PAGE_SIZE,
      offset,
    });

    if (result.data) {
      const data = result.data as { users: User[]; total: number };
      setUsers(data.users || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }

  const handleToggleActive = async (userId: string, email: string) => {
    if (!token) return;
    setActionLoading(userId);
    const result = await adminApi.toggleUserActive(userId, token);
    setActionLoading('');

    if (result.data) {
      const data = result.data as { is_active: boolean; message: string };
      setActionResult({
        type: 'success',
        message: `${email} is now ${data.is_active ? 'Active' : 'Locked/Deactivated'}`,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: data.is_active } : u))
      );
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to update user status' });
    }
  };

  const handleDeleteUser = async () => {
    if (!token || !deleteConfirm) return;
    setDeleteLoading(true);
    const result = await adminApi.deleteUser(deleteConfirm.id, token);
    setDeleteLoading(false);

    if (result.data) {
      setActionResult({ type: 'success', message: `${deleteConfirm.email} was deleted successfully.` });
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id));
      setDeleteConfirm(null);
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to delete user' });
    }
  };

  const handleViewTransactions = async (userId: string, email: string, balance?: string) => {
    if (!token) return;
    setTxModalUser(userId);
    setTxModalEmail(email);
    if (balance) setTxModalBalance(balance);
    setTxLoading(true);

    const result = await adminApi.getUserTransactions(userId, token);
    if (result.data) {
      const data = result.data as { transactions: Transaction[] };
      setTransactions(data.transactions || []);
    }
    setTxLoading(false);
  };

  const handleVerifyTx = async (txId: string) => {
    if (!token || !txModalUser) return;
    setTxActionLoading(txId);
    const result = await adminApi.verifyTransaction(txId, token);
    setTxActionLoading(null);
    if (result.data) {
      const data = result.data as { message: string; new_balance: string };
      setTxModalBalance(data.new_balance);
      handleViewTransactions(txModalUser, txModalEmail);
      setUsers((prev) =>
        prev.map((u) => (u.id === txModalUser ? { ...u, balance: data.new_balance } : u))
      );
    }
  };

  const handleFailTx = async (txId: string) => {
    if (!token || !txModalUser) return;
    if (!window.confirm('Mark this deposit as failed?')) return;
    setTxActionLoading(txId);
    const result = await adminApi.failTransaction(txId, token);
    setTxActionLoading(null);
    if (result.data) {
      handleViewTransactions(txModalUser, txModalEmail);
    }
  };

  const fetchActivity = useCallback(
    async (userId: string) => {
      if (!token) return;
      const result = await adminApi.getUserActivity(userId, token);
      if (result.data) {
        const data = result.data as { activities: Activity[] };
        setActivities(data.activities || []);
      }
    },
    [token]
  );

  const handleViewActivity = async (userId: string, email: string) => {
    if (!token) return;
    setActModalUser(userId);
    setActModalEmail(email);
    setActLoading(true);
    await fetchActivity(userId);
    setActLoading(false);

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

  const handleAdjustBalance = async () => {
    if (!token || !adjustModalUser || !adjustAmount) return;
    setAdjustLoading(true);
    const amountNum = parseFloat(adjustAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      setActionResult({ type: 'error', message: 'Invalid amount' });
      setAdjustLoading(false);
      return;
    }

    const result = await adminApi.adjustUserBalance(adjustModalUser.id, adjustAction, amountNum, token);
    setAdjustLoading(false);

    if (result.data) {
      const data = result.data as { message: string; new_balance: string };
      setActionResult({ type: 'success', message: `${adjustModalUser.email}: ${data.message}` });
      setUsers((prev) =>
        prev.map((u) => (u.id === adjustModalUser.id ? { ...u, balance: data.new_balance } : u))
      );
      setAdjustModalUser(null);
      setAdjustAmount('');
    } else {
      setActionResult({ type: 'error', message: result.error || 'Failed to adjust balance' });
    }
  };

  useEffect(() => {
    return () => {
      if (actPollRef.current) clearInterval(actPollRef.current);
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'active') return u.is_active;
    if (statusFilter === 'inactive') return !u.is_active;
    return true;
  });

  return (
    <div className="space-y-6 text-slate-900">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">User Management</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Monitor, adjust balances, and manage accounts.
          </p>
        </div>

        <div className="text-xs font-bold text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          Total Registered: <span className="text-slate-900 font-black">{total}</span>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionResult && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-between ${
            actionResult.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          <span>{actionResult.message}</span>
          <button onClick={() => setActionResult(null)} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search by name, username, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'all'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({total})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              statusFilter === 'inactive'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            Locked
          </button>
        </div>
      </div>

      {/* LUXURY USER CARDS */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-500 text-xs mt-3">Loading users...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bento-card p-5 flex flex-col justify-between space-y-4 bg-white border border-slate-200 hover:border-primary/40 transition-all shadow-xs"
              >
                {/* Top Row: Avatar, Name, Username, Status Pill */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-50 text-primary font-black flex items-center justify-center text-sm border border-blue-100 shrink-0 shadow-xs">
                      {user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username || user.email.split('@')[0]}
                      </h3>
                      <p className="text-[11px] text-slate-500 truncate">
                        @{user.username || 'user'} • {user.email}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full shrink-0 ${
                      user.is_active
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        : 'bg-red-100 text-red-700 border border-red-200'
                    }`}
                  >
                    {user.is_active ? 'Active' : 'Locked'}
                  </span>
                </div>

                {/* Middle Row: Balance Display */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Total Balance
                    </span>
                    <span className="text-lg font-black text-slate-900">{formatCurrency(user.balance || '0')}</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                      Orders
                    </span>
                    <span className="text-sm font-bold text-primary">{user.total_orders || 0}</span>
                  </div>
                </div>

                {/* Bottom Row: 3 Action Buttons + Delete */}
                <div className="flex gap-2 pt-1 border-t border-slate-100">
                  {/* Action 1: Adjust Balance */}
                  <button
                    onClick={() => {
                      setAdjustModalUser(user);
                      setAdjustAmount('');
                    }}
                    title="Adjust Balance"
                    className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 transition-colors text-[10px] font-bold cursor-pointer"
                  >
                    <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Balance</span>
                  </button>

                  {/* Action 2: Lock / Unlock */}
                  <button
                    onClick={() => handleToggleActive(user.id, user.email)}
                    disabled={actionLoading === user.id}
                    title={user.is_active ? 'Lock Account' : 'Unlock Account'}
                    className={`flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-colors text-[10px] font-bold cursor-pointer ${
                      user.is_active
                        ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          user.is_active
                            ? 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                            : 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'
                        }
                      />
                    </svg>
                    <span>{actionLoading === user.id ? '...' : user.is_active ? 'Lock' : 'Unlock'}</span>
                  </button>

                  {/* Action 3: Transactions */}
                  <button
                    onClick={() => handleViewTransactions(user.id, user.email, user.balance)}
                    title="View Transactions"
                    className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 transition-colors text-[10px] font-bold cursor-pointer"
                  >
                    <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span>Txns</span>
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteConfirm(user)}
                    title="Delete User"
                    className="flex items-center justify-center px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bento-card p-12 text-center space-y-2 bg-white border border-slate-200">
            <p className="text-slate-900 font-bold">No users match your filter</p>
            <p className="text-slate-500 text-xs">Try adjusting your search query or status filter.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {Math.ceil(total / PAGE_SIZE) > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-slate-500 text-xs">
            Page {Math.floor(offset / PAGE_SIZE) + 1} of {Math.ceil(total / PAGE_SIZE)} ({total} users)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              disabled={offset === 0}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
            >
              ← Prev
            </button>
            <button
              onClick={() => setOffset(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 text-xs font-bold disabled:opacity-40 transition-colors shadow-xs"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Adjust Balance */}
      {adjustModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bento-card bg-white border-slate-200 w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust User Balance</h3>
                <p className="text-xs text-slate-500">{adjustModalUser.email}</p>
              </div>
              <button onClick={() => setAdjustModalUser(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between text-xs">
              <span className="text-slate-500">Current Balance:</span>
              <span className="font-black text-slate-900">{formatCurrency(adjustModalUser.balance)}</span>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustAction('credit')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                    adjustAction === 'credit'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  + Credit (Add)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustAction('deduct')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors ${
                    adjustAction === 'deduct'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  - Deduct (Subtract)
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setAdjustModalUser(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustBalance}
                disabled={adjustLoading || !adjustAmount}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 shadow-xs"
              >
                {adjustLoading ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: User Transactions */}
      {txModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bento-card bg-white border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Transactions History</h3>
                <p className="text-xs text-slate-500">{txModalEmail} • Balance: {formatCurrency(txModalBalance)}</p>
              </div>
              <button onClick={() => setTxModalUser(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2.5">
              {txLoading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : transactions.length > 0 ? (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 capitalize">{tx.type}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            tx.status === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : tx.status === 'pending'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] mt-0.5">{tx.description}</p>
                      <p className="text-[10px] text-slate-400">{formatDate(tx.created_at)}</p>
                    </div>

                    <div className="text-right">
                      <p className="font-black text-slate-900 text-sm">{formatCurrency(tx.amount)}</p>
                      {tx.status === 'pending' && (
                        <div className="flex gap-1.5 mt-1.5">
                          <button
                            onClick={() => handleVerifyTx(tx.id)}
                            disabled={txActionLoading === tx.id}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 shadow-xs"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleFailTx(tx.id)}
                            disabled={txActionLoading === tx.id}
                            className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 shadow-xs"
                          >
                            Fail
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">No transactions recorded for this user</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Live Activity Stream */}
      {actModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bento-card bg-white border-slate-200 w-full max-w-xl max-h-[80vh] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <h3 className="text-base font-bold text-slate-900">Live Activity Stream</h3>
                </div>
                <p className="text-xs text-slate-500">{actModalEmail}</p>
              </div>
              <button onClick={closeActivityModal} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {actLoading ? (
                <div className="text-center py-10">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                </div>
              ) : activities.length > 0 ? (
                activities.map((act) => (
                  <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-900 capitalize">{act.action.replace('_', ' ')}</p>
                      <p className="text-[11px] text-slate-600 truncate max-w-xs">{act.page}</p>
                      <p className="text-[10px] text-slate-400">{act.ip_address} • {formatDate(act.created_at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500 text-xs">No recent activity detected</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bento-card bg-white border-red-200 w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete <strong className="text-slate-900">{deleteConfirm.email}</strong>?
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs"
              >
                {deleteLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

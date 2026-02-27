'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  user_email: string;
}

export default function AdminTicketsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (token) {
      loadTickets();
      
      // Auto-refresh tickets every 5 seconds
      interval = setInterval(() => {
        loadTickets(false);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token]);

  const loadTickets = async (showLoading = true) => {
    if (!token) return;

    if (showLoading && tickets.length === 0) {
      setLoading(true);
    }

    try {
      const result = await adminApi.getTickets(token);
      if (result.data) {
        setTickets((result.data as { tickets: Ticket[] }).tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-blue-500/10 text-blue-500',
      pending: 'bg-amber-500/10 text-amber-500',
      answered: 'bg-emerald-500/10 text-emerald-500',
      closed: 'bg-slate-500/10 text-slate-400',
    };
    return colors[status] || colors.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'text-slate-400',
      medium: 'text-blue-400',
      high: 'text-red-400 font-bold',
    };
    return colors[priority] || colors.medium;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
          <p className="text-text-secondary">Manage and respond to user inquiries</p>
        </div>
      </div>

      <div className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="text-xs text-text-secondary uppercase bg-surface-darker/50 border-b border-border-dark">
              <tr>
                <th className="px-6 py-4 font-medium">Subject</th>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-dark">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-text-secondary">
                    No support tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-surface-darker/50 transition-colors group cursor-pointer" onClick={() => router.push(`/admin/tickets/${ticket.id}`)}>
                    <td className="px-6 py-4 hidden group-hover:-translate-y-px transition-transform">
                      <p className="text-white font-medium truncate max-w-[250px]">{ticket.subject}</p>
                    </td>
                    <td className="px-6 py-4 table-cell group-hover:-translate-y-px transition-transform">
                      {ticket.user_email}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`capitalize ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/tickets/${ticket.id}`);
                        }}
                        className="text-primary hover:text-white transition-colors font-medium text-sm"
                      >
                        View & Reply
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

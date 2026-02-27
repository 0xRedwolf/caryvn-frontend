'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TicketsPage() {
  const { token } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

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
      const result = await ticketsApi.getTickets(token);
      if (result.data) {
        const data = result.data as { tickets: Ticket[] };
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error("Failed to load tickets:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    try {
      const result = await ticketsApi.createTicket(newTicket, token);
      
      if (result.data) {
        setNewTicket({ subject: '', message: '', priority: 'medium' });
        setShowNewTicket(false);
        toast.success('Ticket submitted successfully!');
        loadTickets();
      }
    } catch (err) {
      toast.error('Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
          <p className="text-text-secondary">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="btn-primary"
        >
          <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Ticket
        </button>
      </div>

      {/* New Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-surface-dark rounded-2xl border border-border-dark w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
              <button onClick={() => setShowNewTicket(false)} className="text-text-secondary hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  required
                  className="input"
                  placeholder="Brief description of your issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  className="select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">Message</label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                  required
                  rows={5}
                  className="input flex-1 min-h-[120px] max-h-[250px] resize-y w-full"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewTicket(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-50">
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="bg-surface-dark rounded-xl border border-border-dark">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : tickets.length > 0 ? (
          <div className="divide-y divide-border-dark">
            {tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                onClick={() => router.push(`/dashboard/tickets/${ticket.id}`)}
                className="p-5 hover:bg-surface-darker/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-white font-medium mb-1 truncate group-hover:text-primary transition-colors">{ticket.subject}</h3>
                    <p className="text-text-secondary text-sm">
                      Opened {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${getStatusBadge(ticket.status)}`}>
                      {ticket.status}
                    </span>
                    <svg className="w-5 h-5 text-text-secondary group-hover:text-white transition-colors shrink-0 hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-text-secondary mb-4">No tickets yet</p>
            <button onClick={() => setShowNewTicket(true)} className="btn-primary">
              Create Your First Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

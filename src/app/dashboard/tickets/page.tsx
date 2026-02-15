'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi } from '@/lib/api';
import { formatDate, getStatusColor } from '@/lib/utils';

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

export default function TicketsPage() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadTickets();
    }
  }, [token]);

  const loadTickets = async () => {
    if (!token) return;

    const result = await ticketsApi.getTickets(token);
    if (result.data) {
      const data = result.data as { tickets: Ticket[] };
      setTickets(data.tickets || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setSubmitting(true);
    const result = await ticketsApi.createTicket(newTicket, token);
    
    if (result.data) {
      setNewTicket({ subject: '', message: '', priority: 'medium' });
      setShowNewTicket(false);
      loadTickets();
    }
    setSubmitting(false);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Support Tickets</h1>
          <p className="text-text-secondary">Get help from our support team</p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="btn-primary"
        >
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
                  className="input resize-none h-auto"
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
              <div key={ticket.id} className="p-5 hover:bg-primary/5 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-white font-medium mb-1">{ticket.subject}</h3>
                    <p className="text-text-secondary text-sm">
                      Opened {formatDate(ticket.created_at)}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(ticket.status)}`}>
                    {ticket.status}
                  </span>
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

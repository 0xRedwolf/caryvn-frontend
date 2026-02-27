'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

interface TicketReply {
  id: string;
  message: string;
  is_admin: boolean;
  user_email: string;
  created_at: string;
}

interface Ticket {
  id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  user_email: string;
  created_at: string;
  replies: TicketReply[];
}

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token } = useAuth();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyMessage, setReplyMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (token && params.id) {
      loadTicket();

      interval = setInterval(() => {
        loadTicket(false);
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [token, params.id]);

  useEffect(() => {
    // Scroll to bottom when newly loaded
    repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.replies]);

  const loadTicket = async (showLoading = true) => {
    try {
      if (!token || !params.id) return;
      
      if (showLoading && !ticket) {
        setLoading(true);
      }

      const result = await ticketsApi.getTicket(params.id as string, token);
      if (result.data) {
        setTicket(result.data as Ticket);
      }
    } catch (err) {
      console.error('Failed to load ticket details', err);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !params.id || !replyMessage.trim()) return;

    setSubmitting(true);
    try {
      const result = await ticketsApi.replyTicket(params.id as string, replyMessage, token);
      if (result.data) {
        setReplyMessage('');
        await loadTicket();
      }
    } catch (err) {
      console.error('Failed to reply', err);
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12 bg-surface-dark rounded-xl border border-border-dark">
        <p className="text-text-secondary text-lg">Ticket not found.</p>
        <Link href="/dashboard/tickets" className="text-primary hover:underline mt-4 inline-block">
          ← Back to Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/dashboard/tickets"
          className="w-10 h-10 flex items-center justify-center rounded-lg bg-surface-dark border border-border-dark text-text-secondary hover:text-white hover:border-text-secondary transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-white truncate">{ticket.subject}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize shrink-0 ${getStatusBadge(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
          <p className="text-text-secondary">
            Opened {formatDate(ticket.created_at)}
          </p>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-surface-dark rounded-xl border border-border-dark flex flex-col h-[600px]">
        {/* Messages space */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Initial Message (Always from User) */}
          <div className="flex gap-4 max-w-[85%] ml-auto flex-row-reverse">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">
                {ticket.user_email[0].toUpperCase()}
              </span>
            </div>
             <div className="items-end flex flex-col">
              <div className="flex items-baseline gap-2 mb-1 justify-end">
                <span className="text-white font-medium">You</span>
                <span className="text-text-secondary text-xs">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="bg-primary/10 text-primary-light border border-primary/20 rounded-2xl p-4 whitespace-pre-wrap">
                {ticket.message}
              </div>
            </div>
          </div>

          {/* Replies */}
          {ticket.replies.map((reply) => (
            <div 
              key={reply.id} 
              className={`flex gap-4 max-w-[85%] ${!reply.is_admin ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${reply.is_admin ? 'bg-indigo-500/10' : 'bg-primary/10'}`}>
                {reply.is_admin ? (
                  <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                ) : (
                  <span className="text-primary font-bold text-sm">
                    {reply.user_email[0].toUpperCase()}
                  </span>
                )}
              </div>
              
              <div className={!reply.is_admin ? 'items-end flex flex-col' : ''}>
                <div className={`flex items-baseline gap-2 mb-1 ${!reply.is_admin ? 'justify-end' : ''}`}>
                  <span className="text-white font-medium">
                    {reply.is_admin ? 'Support Admin' : 'You'}
                  </span>
                  <span className="text-text-secondary text-xs">{formatDate(reply.created_at)}</span>
                </div>
                <div className={`rounded-2xl p-4 whitespace-pre-wrap ${
                  reply.is_admin 
                    ? 'bg-surface-darker text-text-secondary border border-border-dark'
                    : 'bg-primary/10 text-primary-light border border-primary/20' 
                }`}>
                  {reply.message}
                </div>
              </div>
            </div>
          ))}

          <div ref={repliesEndRef} />
        </div>

        {/* Reply Box */}
        {ticket.status !== 'closed' ? (
          <div className="p-4 bg-surface-darker border-t border-border-dark rounded-b-xl">
            <form onSubmit={handleReply} className="flex flex-col sm:flex-row gap-4">
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Type your reply here..."
                className="input flex-1 min-h-[50px] max-h-[150px] resize-y py-3"
                rows={2}
                disabled={submitting}
              />
              <button
                type="submit"
                disabled={submitting || !replyMessage.trim()}
                className="btn-primary shrink-0 self-end px-6 min-w-[120px] w-full sm:w-auto mt-2 sm:mt-0"
              >
                {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 bg-surface-darker border-t border-border-dark rounded-b-xl text-center text-text-secondary">
            This ticket has been closed. Further replies are disabled.
          </div>
        )}
      </div>
    </div>
  );
}

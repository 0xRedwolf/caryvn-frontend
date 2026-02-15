'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

interface ApiLog {
  id: number;
  action: string;
  request_data: any;
  response_data: any;
  status_code: number;
  response_time: number;
  is_success: boolean;
  created_at: string;
}

const actionFilters = ['All', 'services', 'add', 'status', 'balance'];

export default function AdminLogsPage() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('All');
  const [expandedLog, setExpandedLog] = useState<number | null>(null);

  useEffect(() => {
    if (token) {
      loadLogs();
    }
  }, [token, actionFilter]);

  const loadLogs = async () => {
    if (!token) return;
    setLoading(true);

    const result = await adminApi.getLogs(token, {
      action: actionFilter === 'All' ? undefined : actionFilter,
      limit: 100,
    });

    if (result.data) {
      const data = result.data as { logs: ApiLog[] };
      setLogs(data.logs || []);
    }
    setLoading(false);
  };

  const formatJson = (data: any) => {
    try {
      if (typeof data === 'string') {
        return JSON.stringify(JSON.parse(data), null, 2);
      }
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">API Logs</h1>
        <p className="text-text-secondary">Monitor SMM provider API requests</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {actionFilters.map((action) => (
          <button
            key={action}
            onClick={() => setActionFilter(action)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              actionFilter === action
                ? 'bg-primary text-white'
                : 'bg-surface-dark text-text-secondary hover:text-white border border-border-dark'
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div 
              key={log.id} 
              className="bg-surface-dark rounded-xl border border-border-dark overflow-hidden"
            >
              <button
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-surface-darker/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className={`w-2 h-2 rounded-full ${log.is_success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-white font-mono text-sm uppercase">{log.action}</span>
                  <span className={`text-sm ${log.is_success ? 'text-emerald-500' : 'text-red-500'}`}>
                    {log.status_code}
                  </span>
                  <span className="text-text-secondary text-sm">
                    {log.response_time}ms
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-text-secondary text-sm">{formatDate(log.created_at)}</span>
                  <svg 
                    className={`w-5 h-5 text-text-secondary transition-transform ${expandedLog === log.id ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedLog === log.id && (
                <div className="border-t border-border-dark p-4 space-y-4">
                  <div>
                    <p className="text-text-secondary text-xs mb-2">Request</p>
                    <pre className="bg-surface-darker rounded-lg p-3 text-xs text-white overflow-x-auto font-mono">
                      {formatJson(log.request_data)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-text-secondary text-xs mb-2">Response</p>
                    <pre className="bg-surface-darker rounded-lg p-3 text-xs text-white overflow-x-auto font-mono max-h-64">
                      {formatJson(log.response_data)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-surface-dark rounded-xl border border-border-dark p-8 text-center">
            <p className="text-text-secondary">No API logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

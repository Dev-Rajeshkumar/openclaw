'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Search, Filter } from 'lucide-react';
import { IActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        ...(entityFilter && { entity: entityFilter }),
      });
      const { data } = await api.get(`/activity?${params}`);
      if (data.success && data.data) {
        const result = data.data as { logs: IActivityLog[]; total: number; page: number; limit: number };
        setLogs(result.logs);
        setTotalPages(Math.ceil(result.total / result.limit));
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE')) return 'bg-green-100 text-green-700';
    if (action.startsWith('UPDATE')) return 'bg-blue-100 text-blue-700';
    if (action.startsWith('DELETE')) return 'bg-red-100 text-red-700';
    if (action.startsWith('READ')) return 'bg-gray-100 text-gray-700';
    return 'bg-amber-100 text-amber-700';
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-gray-100 text-gray-600',
      POST: 'bg-green-100 text-green-700',
      PUT: 'bg-blue-100 text-blue-700',
      PATCH: 'bg-amber-100 text-amber-700',
      DELETE: 'bg-red-100 text-red-700',
    };
    return colors[method] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Activity Log</h1>
        <p className="text-gray-500">Track all actions and API calls in your business</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by action or path..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
          >
            <option value="">All Entities</option>
            <option value="Invoice">Invoices</option>
            <option value="Client">Clients</option>
            <option value="Business">Businesses</option>
            <option value="Payment">Payments</option>
          </select>
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
          </div>
        ) : logs.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {logs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-gray-50 transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity size={16} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getMethodColor(log.method)}`}>
                          {log.method}
                        </span>
                        <span className="text-xs text-gray-400">{log.entity}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-mono truncate">{log.path}</p>
                      {log.ip && (
                        <p className="text-xs text-gray-400 mt-1">IP: {log.ip}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                    {log.statusCode && (
                      <span className={`text-xs font-medium ${
                        log.statusCode < 300 ? 'text-green-600' : log.statusCode < 400 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {log.statusCode}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <Activity size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No activity logs yet</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">
                Previous
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

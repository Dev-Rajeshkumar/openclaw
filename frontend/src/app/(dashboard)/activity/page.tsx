'use client';
import { useEffect, useState, useCallback } from 'react';
import { Activity, Search } from 'lucide-react';
import { IActivityLog } from '@/types';
import { formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<IActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', ...(entityFilter && { entity: entityFilter }) });
      const { data } = await api.get(`/activity?${params}`);
      if (data.success && data.data) { const result = data.data as { logs: IActivityLog[]; total: number; page: number; limit: number }; setLogs(result.logs); setTotalPages(Math.ceil(result.total / result.limit)); }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActionColor = (action: string) => {
    if (action.startsWith('CREATE')) return 'success';
    if (action.startsWith('UPDATE')) return 'info';
    if (action.startsWith('DELETE')) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Activity Log</h1><p className="text-gray-500">Track all actions in your business</p></div>
      <Card><CardHeader><div className="flex gap-3"><Input placeholder="Search..." className="max-w-sm" /><Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}><SelectTrigger className="w-40"><SelectValue placeholder="All Entities" /></SelectTrigger><SelectContent><SelectItem value="">All</SelectItem><SelectItem value="Invoice">Invoices</SelectItem><SelectItem value="Client">Clients</SelectItem><SelectItem value="Business">Businesses</SelectItem><SelectItem value="Payment">Payments</SelectItem></SelectContent></Select></div></CardHeader>
        <CardContent>{loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> :
          logs.length > 0 ? (<div className="divide-y divide-gray-50">{logs.map((log) => (
            <div key={log.id} className="py-3 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0"><div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5"><Activity size={16} className="text-gray-500" /></div>
                <div className="min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><Badge variant={getActionColor(log.action) as any} className="text-xs">{log.action}</Badge><Badge variant="outline" className="text-xs">{log.method}</Badge><span className="text-xs text-gray-400">{log.entity}</span></div>
                  <p className="text-sm text-gray-700 font-mono truncate">{log.path}</p>{log.ip && <p className="text-xs text-gray-400 mt-1">IP: {log.ip}</p>}
                </div>
              </div>
              <div className="text-right shrink-0"><p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>{log.statusCode && <span className={`text-xs font-medium ${log.statusCode < 300 ? 'text-green-600' : 'text-red-600'}`}>{log.statusCode}</span>}</div>
            </div>
          ))}</div>) : <div className="py-12 text-center"><Activity size={40} className="text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No activity logs yet</p></div>}
        </CardContent>
      </Card>
      {totalPages > 1 && <div className="flex items-center justify-between"><p className="text-sm text-gray-500">Page {page} of {totalPages}</p><div className="flex gap-2"><button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Previous</button><button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">Next</button></div></div>}
    </div>
  );
}

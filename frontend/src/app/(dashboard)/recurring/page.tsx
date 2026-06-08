'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, Repeat, Eye, Trash2, MoreHorizontal, Pause, Play } from 'lucide-react';
import { IRecurringInvoice, RecurringFrequency } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export default function RecurringInvoicesPage() {
  const [recurrings, setRecurrings] = useState<IRecurringInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchRecurrings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', ...(search && { search }) });
      const { data } = await api.get(`/recurring?${params}`);
      if (data.success && data.data) {
        setRecurrings(data.data as IRecurringInvoice[]);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchRecurrings(); }, [fetchRecurrings]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this recurring invoice?')) return;
    try { await api.delete(`/recurring/${id}`); toast.success('Deleted'); fetchRecurrings(); }
    catch { toast.error('Failed to delete'); }
  };

  const getFrequencyLabel = (f: string) => {
    const labels: Record<string, string> = {
      Daily: 'Every Day', Weekly: 'Every Week', Monthly: 'Every Month',
      Quarterly: 'Every 3 Months', Yearly: 'Every Year',
    };
    return labels[f] || f;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Recurring Invoices</h1><p className="text-gray-500">Automate your billing with recurring schedules</p></div>
        <Link href="/dashboard/recurring/new"><Button><Plus size={18} className="mr-2" /> New Recurring</Button></Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            recurrings.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Frequency</TableHead><TableHead>Next Run</TableHead><TableHead className="text-right">Items</TableHead><TableHead>Invoices</TableHead><TableHead>Auto Send</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {recurrings.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.client?.name || '—'}</TableCell>
                        <TableCell><Badge variant="outline">{getFrequencyLabel(r.frequency)}</Badge></TableCell>
                        <TableCell className="text-gray-600">{formatDate(r.nextRun)}</TableCell>
                        <TableCell className="text-right text-gray-600">{r.template?.items?.length || 0}</TableCell>
                        <TableCell className="text-gray-600">{r._count?.invoices || 0}</TableCell>
                        <TableCell>{r.autoSend ? <Badge className="bg-green-50 text-green-700">Yes</Badge> : <span className="text-gray-400 text-sm">No</span>}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link href={`/dashboard/recurring/${r.id}`} className="flex items-center gap-2"><Eye size={14} /> View</Link></DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(r.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Repeat size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No recurring invoices yet</p>
                <Link href="/dashboard/recurring/new"><Button><Plus size={18} className="mr-2" /> Create Recurring Invoice</Button></Link>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

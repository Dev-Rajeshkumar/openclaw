'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, ClipboardList, Eye, Trash2, MoreHorizontal, FileText } from 'lucide-react';
import { IEstimate, EstimateStatus } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

export default function EstimatesPage() {
  const [estimates, setEstimates] = useState<IEstimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchEstimates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', ...(search && { search }), ...(statusFilter && { status: statusFilter }) });
      const { data } = await api.get(`/estimates?${params}`);
      if (data.success && data.data) { setEstimates(data.data as IEstimate[]); setTotalPages(data.meta?.totalPages || 1); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchEstimates(); }, [fetchEstimates]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this estimate?')) return;
    try { await api.delete(`/estimates/${id}`); toast.success('Deleted'); fetchEstimates(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleConvert = async (id: string) => {
    try {
      const { data } = await api.post(`/estimates/${id}/convert`);
      if (data.success && data.data) { toast.success('Converted to invoice!'); window.location.href = `/dashboard/invoices/${(data.data as any).id}`; }
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to convert'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Estimates & Quotations</h1><p className="text-gray-500">Create and manage quotes for your clients</p></div>
        <Link href="/dashboard/estimates/new"><Button><Plus size={18} className="mr-2" /> New Estimate</Button></Link>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search estimates..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {Object.values(EstimateStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            estimates.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Client</TableHead><TableHead>Title</TableHead><TableHead>Date</TableHead><TableHead>Expiry</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {estimates.map((est) => (
                      <TableRow key={est.id}>
                        <TableCell className="font-medium">{est.estimateNumber}</TableCell>
                        <TableCell className="text-gray-600">{est.client?.name || '—'}</TableCell>
                        <TableCell className="text-gray-600 truncate max-w-48">{est.title}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(est.createdAt)}</TableCell>
                        <TableCell className="text-gray-600">{est.expiryDate ? formatDate(est.expiryDate) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(est.total)}</TableCell>
                        <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(est.status)}`}>{est.status}</span></TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild><Link href={`/dashboard/estimates/${est.id}`} className="flex items-center gap-2"><Eye size={14} /> View</Link></DropdownMenuItem>
                              {est.status === EstimateStatus.Sent && (
                                <DropdownMenuItem onClick={() => handleConvert(est.id)} className="flex items-center gap-2 text-green-600"><FileText size={14} /> Convert to Invoice</DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleDelete(est.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
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
                <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No estimates yet</p>
                <Link href="/dashboard/estimates/new"><Button><Plus size={18} className="mr-2" /> Create Your First Estimate</Button></Link>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

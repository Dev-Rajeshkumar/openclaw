'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Eye, Trash2, MoreHorizontal, Filter, Download, Mail, CheckCircle, XCircle, Send, Zap } from 'lucide-react';
import { IInvoice, InvoiceStatus, TeamRole } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const { data } = await api.get(`/invoices?${params}`);
      if (data.success && data.data) {
        setInvoices(data.data as IInvoice[]);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleSubmitForReview = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/submit-for-review`);
      toast.success('Invoice submitted for review');
      fetchInvoices();
    } catch { toast.error('Failed to submit for review'); }
  };

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/approve`);
      toast.success('Invoice approved');
      fetchInvoices();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to approve'); }
  };

  const handleReject = async (id: string) => {
    const notes = prompt('Rejection notes (optional):');
    if (notes === null) return; // cancelled
    try {
      await api.post(`/invoices/${id}/reject`, { notes: notes || undefined });
      toast.success('Invoice rejected');
      fetchInvoices();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to reject'); }
  };

  const handleSendApproved = async (id: string) => {
    try {
      await api.post(`/invoices/${id}/send`);
      toast.success('Invoice sent to client');
      fetchInvoices();
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to send'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); fetchInvoices(); }
    catch { toast.error('Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.size} invoices?`)) return;
    try {
      await Promise.all(Array.from(selected).map((id) => api.delete(`/invoices/${id}`)));
      toast.success(`${selected.size} invoices deleted`);
      setSelected(new Set());
      setBulkMode(false);
      fetchInvoices();
    } catch { toast.error('Failed to delete some invoices'); }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleSelectAll = () => {
    if (selected.size === invoices.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(invoices.map((inv) => inv.id)));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Invoices</h1><p className="text-gray-500 dark:text-gray-400">Manage all your invoices</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}>
            <Filter size={14} className="mr-1" /> {bulkMode ? 'Cancel' : 'Bulk'}
          </Button>
          <Link href="/dashboard/invoices/new"><Button size="sm"><Plus size={16} className="mr-1" /> New Invoice</Button></Link>
        </div>
      </div>

      {/* Bulk actions bar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <span className="text-sm font-medium text-amber-800 dark:text-amber-400">{selected.size} selected</span>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete}><Trash2 size={14} className="mr-1" /> Delete</Button>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by invoice number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Status</SelectItem>
              {Object.values(InvoiceStatus).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : invoices.length > 0 ? (
            <>
              {/* Mobile card view */}
              <div className="block md:hidden space-y-3">
                {bulkMode && (
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                    <input type="checkbox" checked={selected.size === invoices.length} onChange={toggleSelectAll} className="rounded" />
                    Select all
                  </label>
                )}
                {invoices.map((inv) => (
                  <div key={inv.id} className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {bulkMode && (
                          <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded mt-0.5" />
                        )}
                        <div>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-amber-600 dark:hover:text-amber-400">
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{inv.client?.name || 'No client'}</p>
                        </div>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">{formatDate(inv.invoiceDate)}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(inv.total)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
                      <Link href={`/dashboard/invoices/${inv.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Eye size={14} className="mr-1" /> View</Button></Link>
                      {inv.status === InvoiceStatus.Draft && (
                        <Button size="sm" variant="outline" onClick={() => handleSubmitForReview(inv.id)} className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs px-2">
                          <Send size={12} className="mr-1" /> Review
                        </Button>
                      )}
                      {inv.status === InvoiceStatus.PendingReview && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => handleApprove(inv.id)} className="text-green-600 border-green-300 hover:bg-green-50 text-xs px-2">
                            <CheckCircle size={12} className="mr-1" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(inv.id)} className="text-red-600 border-red-300 hover:bg-red-50 text-xs px-2">
                            <XCircle size={12} className="mr-1" /> Reject
                          </Button>
                        </>
                      )}
                      {inv.status === InvoiceStatus.Approved && (
                        <Button size="sm" variant="outline" onClick={() => handleSendApproved(inv.id)} className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs px-2">
                          <Send size={12} className="mr-1" /> Send
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="text-red-500 dark:text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {bulkMode && <TableHead className="w-10"><input type="checkbox" checked={selected.size === invoices.length} onChange={toggleSelectAll} className="rounded" /></TableHead>}
                      <TableHead>Invoice</TableHead>
                      <TableHead>Client</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        {bulkMode && <TableCell><input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded" /></TableCell>}
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-amber-600 dark:hover:text-amber-400">{inv.invoiceNumber}</Link>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">{inv.client?.name || '—'}</TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-300">{formatDate(inv.invoiceDate)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(inv.total)}</TableCell>
                        <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {inv.status === InvoiceStatus.PendingReview && (<>
                              <Button variant="ghost" size="icon" onClick={() => handleApprove(inv.id)} className="text-green-600" title="Approve"><CheckCircle size={16} /></Button>
                              <Button variant="ghost" size="icon" onClick={() => handleReject(inv.id)} className="text-red-500" title="Reject"><XCircle size={16} /></Button>
                            </>)}
                            {inv.status === InvoiceStatus.Approved && (
                              <Button variant="ghost" size="icon" onClick={() => handleSendApproved(inv.id)} className="text-blue-600" title="Send"><Send size={16} /></Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center gap-2"><Eye size={14} /> View</Link></DropdownMenuItem>
                                {inv.status === InvoiceStatus.Draft && <DropdownMenuItem onClick={() => handleSubmitForReview(inv.id)} className="flex items-center gap-2"><Send size={14} /> Submit for Review</DropdownMenuItem>}
                                <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <FileText size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-4">No invoices found</p>
              <Link href="/dashboard/invoices/new"><Button><Plus size={18} className="mr-2" /> Create Your First Invoice</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

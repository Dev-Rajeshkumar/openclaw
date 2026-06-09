'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, Search, FileText, Eye, Trash2, MoreHorizontal, Filter, Download, Mail, Send, CheckCircle, X, Loader2 } from 'lucide-react';
import { IInvoice, InvoiceStatus } from '@/types';
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
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

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

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); fetchInvoices(); }
    catch { toast.error('Failed to delete'); }
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

  const handleBulkStatusUpdate = async (status: InvoiceStatus) => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) => api.put(`/invoices/${id}`, { status }))
      );
      toast.success(`${selected.size} invoice(s) marked as ${status}`);
      setSelected(new Set());
      setBulkMode(false);
      fetchInvoices();
    } catch { toast.error('Failed to update some invoices'); }
    finally { setBulkActionLoading(false); }
  };

  const handleBulkDelete = async () => {
    const paidInvoices = invoices.filter((inv) => selected.has(inv.id) && inv.status === InvoiceStatus.Paid);
    if (paidInvoices.length > 0) {
      toast.error(`Cannot delete ${paidInvoices.length} paid invoice(s). Please exclude them.`);
      return;
    }
    if (!confirm(`Delete ${selected.size} invoice(s)?`)) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.delete(`/invoices/${id}`)));
      toast.success(`${selected.size} invoice(s) deleted`);
      setSelected(new Set());
      setBulkMode(false);
      fetchInvoices();
    } catch { toast.error('Failed to delete some invoices'); }
    finally { setBulkActionLoading(false); }
  };

  const handleBulkExportCSV = () => {
    const selectedInvoices = invoices.filter((inv) => selected.has(inv.id));
    if (selectedInvoices.length === 0) return;

    const headers = ['Invoice Number', 'Client', 'Date', 'Due Date', 'Status', 'Subtotal', 'Tax', 'Total'];
    const rows = selectedInvoices.map((inv) => [
      inv.invoiceNumber,
      inv.client?.name || '',
      formatDate(inv.invoiceDate),
      inv.dueDate ? formatDate(inv.dueDate) : '',
      inv.status,
      String(inv.subtotal),
      String(inv.taxAmount),
      String(inv.total),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invoices_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(`${selectedInvoices.length} invoice(s) exported to CSV`);
  };

  const handleClearSelection = () => {
    setSelected(new Set());
    setBulkMode(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Invoices</h1><p className="text-gray-500">Manage all your invoices</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { setBulkMode(!bulkMode); setSelected(new Set()); }}>
            <Filter size={14} className="mr-1" /> {bulkMode ? 'Cancel' : 'Bulk'}
          </Button>
          <Link href="/dashboard/invoices/new"><Button size="sm"><Plus size={16} className="mr-1" /> New Invoice</Button></Link>
        </div>
      </div>

      {/* Bulk actions sticky bar */}
      {bulkMode && selected.size > 0 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 shadow-sm">
          {bulkActionLoading ? (
            <div className="flex items-center gap-2 w-full justify-center py-1">
              <Loader2 size={16} className="animate-spin text-amber-700" />
              <span className="text-sm font-medium text-amber-700">Processing...</span>
            </div>
          ) : (
            <>
              <span className="text-sm font-medium text-amber-800">{selected.size} selected</span>
              <div className="h-4 w-px bg-amber-300 hidden sm:block" />
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate(InvoiceStatus.Sent)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                <Send size={14} className="mr-1" /> Mark as Sent
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusUpdate(InvoiceStatus.Paid)} className="border-green-300 text-green-700 hover:bg-green-50">
                <CheckCircle size={14} className="mr-1" /> Mark as Paid
              </Button>
              <Button size="sm" variant="outline" onClick={handleBulkExportCSV} className="border-gray-300 text-gray-700 hover:bg-gray-50">
                <Download size={14} className="mr-1" /> Export CSV
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete}>
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={handleClearSelection} className="text-gray-500 hover:text-gray-700">
                <X size={14} className="mr-1" /> Clear
              </Button>
            </>
          )}
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
                  <label className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <input type="checkbox" checked={selected.size === invoices.length && invoices.length > 0} onChange={toggleSelectAll} className="rounded" />
                    Select all
                  </label>
                )}
                {invoices.map((inv) => (
                  <div key={inv.id} className={`p-4 rounded-lg border space-y-3 transition-colors ${selected.has(inv.id) ? 'border-amber-400 bg-amber-50/50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {bulkMode && (
                          <input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded mt-0.5" />
                        )}
                        <div>
                          <Link href={`/dashboard/invoices/${inv.id}`} className="font-semibold text-gray-900 hover:text-amber-600">
                            {inv.invoiceNumber}
                          </Link>
                          <p className="text-xs text-gray-500">{inv.client?.name || 'No client'}</p>
                        </div>
                      </div>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">{formatDate(inv.invoiceDate)}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(inv.total)}</span>
                    </div>
                    {!bulkMode && (
                      <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Eye size={14} className="mr-1" /> View</Button></Link>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(inv.id)} className="text-red-500"><Trash2 size={14} /></Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop table view */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {bulkMode && <TableHead className="w-10"><input type="checkbox" checked={selected.size === invoices.length && invoices.length > 0} onChange={toggleSelectAll} className="rounded" /></TableHead>}
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
                      <TableRow key={inv.id} className={selected.has(inv.id) ? 'bg-amber-50/50' : ''}>
                        {bulkMode && <TableCell><input type="checkbox" checked={selected.has(inv.id)} onChange={() => toggleSelect(inv.id)} className="rounded" /></TableCell>}
                        <TableCell className="font-medium">
                          <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-amber-600">{inv.invoiceNumber}</Link>
                        </TableCell>
                        <TableCell className="text-gray-600">{inv.client?.name || '—'}</TableCell>
                        <TableCell className="text-gray-600">{formatDate(inv.invoiceDate)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(inv.total)}</TableCell>
                        <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span></TableCell>
                        <TableCell className="text-right">
                          {!bulkMode && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild><Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center gap-2"><Eye size={14} /> View</Link></DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(inv.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

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
              <FileText size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-4">No invoices found</p>
              <Link href="/dashboard/invoices/new"><Button><Plus size={18} className="mr-2" /> Create Your First Invoice</Button></Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

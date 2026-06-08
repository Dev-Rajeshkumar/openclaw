'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, Edit, FileText, Calendar, RefreshCw } from 'lucide-react';
import { IRecurringInvoice, IInvoice } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function RecurringDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [recurring, setRecurring] = useState<IRecurringInvoice | null>(null);
  const [generatedInvoices, setGeneratedInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/recurring/${id}`),
      api.get(`/recurring/${id}/invoices`),
    ]).then(([detailRes, invoicesRes]) => {
      if (detailRes.data.success && detailRes.data.data) setRecurring(detailRes.data.data as IRecurringInvoice);
      if (invoicesRes.data.success && invoicesRes.data.data) setGeneratedInvoices(invoicesRes.data.data as IInvoice[]);
    }).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this recurring invoice?')) return;
    try { await api.delete(`/recurring/${id}`); toast.success('Deleted'); router.push('/dashboard/recurring'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!recurring) return <div className="text-center py-12"><p className="text-gray-500">Recurring invoice not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Recurring Invoice</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
              <RefreshCw size={14} /> {recurring.frequency} • Next: {formatDate(recurring.nextRun)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDelete} variant="destructive"><Trash2 size={16} className="mr-2" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Client</p>
          <p className="font-semibold text-gray-900">{recurring.client?.name || '—'}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Frequency</p>
          <p className="font-semibold text-gray-900">{recurring.frequency}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Next Run</p>
          <p className="font-semibold text-gray-900">{formatDate(recurring.nextRun)}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Template Items</CardTitle></CardHeader>
        <CardContent>
          {recurring.template?.items && recurring.template.items.length > 0 ? (
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {recurring.template.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{item.hsnCode}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : <p className="text-gray-400 text-sm">No items in template</p>}
        </CardContent>
      </Card>

      {generatedInvoices.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Generated Invoices ({generatedInvoices.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-50">
              {generatedInvoices.map((inv) => (
                <Link key={inv.id} href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 transition -mx-2 px-2 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><FileText size={16} className="text-amber-600" /></div>
                    <div><p className="font-medium text-gray-900 text-sm">{inv.invoiceNumber}</p><p className="text-xs text-gray-500">{formatDate(inv.invoiceDate)}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 text-sm">{formatCurrency(inv.total)}</p>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

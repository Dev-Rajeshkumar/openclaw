'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle, Trash2, Clock, FileText, Download, Mail } from 'lucide-react';
import { IInvoice, InvoiceStatus, IStatusLog } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusLog, setShowStatusLog] = useState(false);

  useEffect(() => {
    api.get(`/invoices/${id}`).then(({ data }) => {
      if (data.success && data.data) setInvoice(data.data as IInvoice);
    }).catch(() => toast.error('Failed to load invoice')).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: InvoiceStatus) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/invoices/${id}`, { status });
      if (data.success && data.data) { setInvoice(data.data as IInvoice); toast.success(`Invoice marked as ${status}`); }
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    setActionLoading(true);
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); router.push('/dashboard/invoices'); }
    catch { toast.error('Failed'); setActionLoading(false); }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/payments`, { amount: invoice.total, method: 'Manual', notes: 'Payment recorded manually' });
      const { data } = await api.get(`/invoices/${id}`);
      if (data.success && data.data) setInvoice(data.data as IInvoice);
      toast.success('Payment recorded');
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!invoice) return <div className="text-center py-12"><p className="text-gray-500">Invoice not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
              <span className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === InvoiceStatus.DRAFT && (
            <Button onClick={() => handleStatusChange(InvoiceStatus.Sent)} disabled={actionLoading} variant="outline"><Send size={16} className="mr-2" /> Mark as Sent</Button>
          )}
          {(invoice.status === InvoiceStatus.Sent || invoice.status === InvoiceStatus.Overdue || invoice.status === InvoiceStatus.PartiallyPaid) && (
            <Button onClick={handleRecordPayment} disabled={actionLoading} className="bg-green-600 hover:bg-green-700"><CheckCircle size={16} className="mr-2" /> Record Payment</Button>
          )}
          {invoice.client?.email && (
            <Button onClick={async () => { setActionLoading(true); try { await api.post(`/invoices/${invoice.id}/send-email`); toast.success(`Sent to ${invoice.client?.email}`); } catch { toast.error('Failed'); } finally { setActionLoading(false); } }} disabled={actionLoading} variant="outline"><Mail size={16} className="mr-2" /> Email</Button>
          )}
          <Button onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/v1/businesses/${invoice.businessId}/invoices/${invoice.id}/pdf`, '_blank')} disabled={actionLoading} variant="outline"><Download size={16} className="mr-2" /> PDF</Button>
          <Button onClick={handleDelete} disabled={actionLoading} variant="destructive"><Trash2 size={16} className="mr-2" /> Delete</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              {invoice.client ? (
                <>
                  <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                  {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
                  {invoice.client.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
                  {invoice.client.gstNumber && <p className="text-sm text-gray-500">GST: {invoice.client.gstNumber}</p>}
                </>
              ) : <p className="text-gray-400">No client assigned</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-sm text-gray-500">Number</p><p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p></div>
              <div><p className="text-sm text-gray-500">Date</p><p className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p></div>
              <div><p className="text-sm text-gray-500">Due</p><p className="font-semibold text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</p></div>
            </div>
          </div>

          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {invoice.items.map((item, i) => (
                <TableRow key={item.id || i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.hsnCode}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">GST</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(invoice.total)}</span></div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" onClick={() => setShowStatusLog(!showStatusLog)} className="text-amber-600">
        <Clock size={16} className="mr-2" />{showStatusLog ? 'Hide' : 'Show'} Status History ({invoice.statusLogs?.length || 0})
      </Button>

      {showStatusLog && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock size={18} /> Status History</CardTitle></CardHeader>
          <CardContent>
            {invoice.statusLogs && invoice.statusLogs.length > 0 ? (
              <div className="space-y-4">
                {[...invoice.statusLogs].reverse().map((log, i) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.action === 'CREATE' ? 'bg-green-100 text-green-600' : log.action === 'DELETE' ? 'bg-red-100 text-red-600' : log.action === 'STATUS_CHANGE' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {log.action === 'CREATE' ? <FileText size={14} /> : <Clock size={14} />}
                      </div>
                      {i < invoice.statusLogs!.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{log.action}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                      </div>
                      {log.oldValue && log.newValue && <p className="text-xs text-gray-400 mt-1">{log.oldValue} → {log.newValue}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">No status history yet</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

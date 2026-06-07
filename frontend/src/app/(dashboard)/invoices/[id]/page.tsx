'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft, Send, CheckCircle, Trash2, Loader2, Clock, FileText,
} from 'lucide-react';
import { IInvoice, InvoiceStatus, IStatusLog } from '@/types';
import { formatCurrency, formatDate, getStatusColor, formatDateTime } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusLog, setShowStatusLog] = useState(false);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
        if (data.success && data.data) setInvoice(data.data as IInvoice);
      } catch { toast.error('Failed to load invoice'); }
      finally { setLoading(false); }
    };
    fetchInvoice();
  }, [id]);

  const handleStatusChange = async (status: InvoiceStatus) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/invoices/${id}`, { status });
      if (data.success && data.data) { setInvoice(data.data as IInvoice); toast.success(`Invoice marked as ${status}`); }
    } catch { toast.error('Failed to update invoice'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    setActionLoading(true);
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); router.push('/dashboard/invoices'); }
    catch { toast.error('Failed to delete invoice'); setActionLoading(false); }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/payments`, { amount: invoice.total, method: 'Manual', notes: 'Payment recorded manually' });
      const { data } = await api.get(`/invoices/${id}`);
      if (data.success && data.data) setInvoice(data.data as IInvoice);
      toast.success('Payment recorded');
    } catch { toast.error('Failed to record payment'); }
    finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!invoice) return <div className="text-center py-12"><p className="text-gray-500">Invoice not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"><ArrowLeft size={20} /></button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
              <span className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {invoice.status === InvoiceStatus.DRAFT && (
            <button onClick={() => handleStatusChange(InvoiceStatus.SENT)} disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <Send size={16} /> Mark as Sent
            </button>
          )}
          {(invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE) && (
            <button onClick={handleRecordPayment} disabled={actionLoading}
              className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
              <CheckCircle size={16} /> Record Payment
            </button>
          )}
          <button onClick={handleDelete} disabled={actionLoading}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition disabled:opacity-50">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Invoice Content */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
            {invoice.client ? (<>
              <p className="font-semibold text-gray-900">{invoice.client.name}</p>
              {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
              {invoice.client.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
              {invoice.client.gstNumber && <p className="text-sm text-gray-500">GST: {invoice.client.gstNumber}</p>}
            </>) : (<p className="text-gray-400">No client assigned</p>)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><p className="text-sm text-gray-500">Number</p><p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p></div>
            <div><p className="text-sm text-gray-500">Date</p><p className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p></div>
            <div><p className="text-sm text-gray-500">Due</p><p className="font-semibold text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</p></div>
          </div>
        </div>

        {/* Line Items */}
        <table className="w-full mb-8">
          <thead><tr className="border-b-2 border-gray-200">
            <th className="text-left py-3 text-sm font-medium text-gray-500">Description</th>
            <th className="text-left py-3 text-sm font-medium text-gray-500">HSN</th>
            <th className="text-right py-3 text-sm font-medium text-gray-500">Qty</th>
            <th className="text-right py-3 text-sm font-medium text-gray-500">Rate</th>
            <th className="text-right py-3 text-sm font-medium text-gray-500">Amount</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {invoice.items.map((item, i) => (
              <tr key={item.id || i}>
                <td className="py-3 text-gray-900">{item.description}</td>
                <td className="py-3 text-gray-500 text-sm">{item.hsnCode}</td>
                <td className="py-3 text-gray-900 text-right">{item.quantity}</td>
                <td className="py-3 text-gray-900 text-right">{formatCurrency(item.rate)}</td>
                <td className="py-3 text-gray-900 text-right font-medium">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end"><div className="w-64 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-500">GST ({invoice.gstRate}%)</span><span>{formatCurrency(invoice.gstAmount)}</span></div>
          <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(invoice.total)}</span></div>
        </div></div>

        {invoice.notes && (<div className="mt-8 p-4 bg-gray-50 rounded-xl"><p className="text-sm font-medium text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{invoice.notes}</p></div>)}
      </div>

      {/* Status Log Toggle */}
      <button onClick={() => setShowStatusLog(!showStatusLog)}
        className="flex items-center gap-2 text-amber-600 hover:text-amber-700 font-medium text-sm">
        <Clock size={16} />
        {showStatusLog ? 'Hide' : 'Show'} Status History ({invoice.statusLogs?.length || 0})
      </button>

      {/* Status Log Timeline */}
      {showStatusLog && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2"><Clock size={18} />Status History</h2>
          {invoice.statusLogs && invoice.statusLogs.length > 0 ? (
            <div className="space-y-4">
              {[...invoice.statusLogs].reverse().map((log, i) => (
                <div key={log.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.action === 'CREATED' ? 'bg-green-100 text-green-600' :
                      log.action === 'DELETED' ? 'bg-red-100 text-red-600' :
                      log.action === 'STATUS_CHANGED' ? 'bg-blue-100 text-blue-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {log.action === 'CREATED' ? <FileText size={14} /> : <Clock size={14} />}
                    </div>
                    {i < invoice.statusLogs!.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium text-gray-900">{log.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.action === 'DELETED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {log.action}
                      </span>
                      <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                    </div>
                    {log.oldValue && log.newValue && (
                      <p className="text-xs text-gray-400 mt-1">{log.oldValue} → {log.newValue}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No status history yet</p>
          )}
        </div>
      )}
    </div>
  );
}

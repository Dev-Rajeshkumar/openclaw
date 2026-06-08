'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, FileText, Loader2 } from 'lucide-react';
import { IInvoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ClientInvoiceDetail() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInvoice = useCallback(async () => {
    const token = localStorage.getItem('client_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/v1/portal/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) setInvoice(json.data as IInvoice);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const handleDownloadPDF = () => {
    const publicToken = (invoice as any)?.publicAccessToken;
    if (publicToken) {
      window.open(`${API_URL}/v1/public/invoices/${publicToken}/pdf`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-amber-500" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="text-center py-12">
        <FileText size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Invoice not found</p>
        <button onClick={() => router.push('/portal/invoices')} className="mt-4 text-amber-600 text-sm font-medium">
          Back to invoices
        </button>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    Sent: 'bg-blue-100 text-blue-700',
    Draft: 'bg-gray-100 text-gray-700',
    Overdue: 'bg-red-100 text-red-700',
    PartiallyPaid: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-gray-200 text-gray-500',
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push('/portal/invoices')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={16} /> Back
        </button>
        <button onClick={handleDownloadPDF} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">
          <Download size={14} /> PDF
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">{formatDate(invoice.invoiceDate)}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-600'}`}>
              {invoice.status}
            </span>
          </div>
        </div>

        {/* Line items */}
        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-200">
                <th className="text-left py-2 text-xs text-gray-400 uppercase">Description</th>
                <th className="text-right py-2 text-xs text-gray-400 uppercase w-16">Qty</th>
                <th className="text-right py-2 text-xs text-gray-400 uppercase w-24">Rate</th>
                <th className="text-right py-2 text-xs text-gray-400 uppercase w-24">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-50">
                  <td className="py-3 text-gray-700">
                    <p className="font-medium">{item.description}</p>
                    {item.hsnCode && <p className="text-xs text-gray-400">HSN: {item.hsnCode}</p>}
                  </td>
                  <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{formatCurrency(item.rate)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Discount</span>
                  <span className="text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Tax</span>
                <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-amber-600">{formatCurrency(invoice.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-400 mb-1">Notes</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}

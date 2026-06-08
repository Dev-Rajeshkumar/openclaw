'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { FileText, IndianRupee, Clock, CheckCircle, AlertCircle, Loader2, Receipt } from 'lucide-react';
import { IInvoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ClientInvoicesPage() {
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    const token = localStorage.getItem('client_token');
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/v1/portal/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data) setInvoices(json.data as IInvoice[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const totalOutstanding = invoices
    .filter((i) => i.status !== 'Paid' && i.status !== 'Cancelled')
    .reduce((sum, i) => sum + i.total, 0);

  const totalPaid = invoices
    .filter((i) => i.status === 'Paid')
    .reduce((sum, i) => sum + i.total, 0);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-400 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
        </div>
      </div>

      {/* Invoices list */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Your Invoices</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-amber-500 mx-auto" />
          </div>
        ) : invoices.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {invoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/portal/invoices/${inv.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    inv.status === 'Paid' ? 'bg-green-50' :
                    inv.status === 'Overdue' ? 'bg-red-50' :
                    inv.status === 'Sent' ? 'bg-blue-50' : 'bg-gray-50'
                  }`}>
                    {inv.status === 'Paid' ? <CheckCircle size={16} className="text-green-600" /> :
                     inv.status === 'Overdue' ? <AlertCircle size={16} className="text-red-500" /> :
                     <Clock size={16} className="text-blue-500" />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(inv.invoiceDate)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="font-semibold text-gray-900 text-sm">{formatCurrency(inv.total)}</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                    inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                    inv.status === 'Sent' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>{inv.status}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <Receipt size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No invoices yet</p>
          </div>
        )}
      </div>
    </div>
  );
}

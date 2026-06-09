'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Phone, IndianRupee, Clock, TrendingUp, TrendingDown, FileText, AlertCircle } from 'lucide-react';
import { IClient, IInvoice, IPayment } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ClientInsight {
  client: IClient;
  invoices: IInvoice[];
  payments: IPayment[];
  stats: {
    totalInvoices: number;
    totalRevenue: number;
    totalPaid: number;
    totalOutstanding: number;
    averagePaymentDays: number;
    lastInvoiceDate: string | null;
    firstInvoiceDate: string | null;
    overdueCount: number;
  };
  monthlyRevenue: { month: string; amount: number }[];
}

export default function ClientInsightsPage() {
  const params = useParams();
  const clientId = params.id as string;
  const [data, setData] = useState<ClientInsight | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, invoicesRes, paymentsRes] = await Promise.all([
          api.get(`/clients/${clientId}`),
          api.get(`/clients/${clientId}/invoices`),
          api.get(`/payments?clientId=${clientId}&limit=100`),
        ]);

        const client = clientRes.data.data as IClient;
        const invoices = (invoicesRes.data.data || []) as IInvoice[];
        const payments = (paymentsRes.data.data || []) as IPayment[];

        const totalRevenue = invoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
        const paidInvoices = invoices.filter((i: any) => i.status === 'Paid');
        const totalPaid = paidInvoices.reduce((s: number, i: any) => s + (i.total || 0), 0);
        const totalOutstanding = totalRevenue - totalPaid;
        const overdueCount = invoices.filter((i: any) => ['Overdue', 'Sent', 'PartiallyPaid'].includes(i.status)).length;

        // Average payment days
        let avgPaymentDays = 0;
        if (paidInvoices.length > 0) {
          const totalDays = paidInvoices.reduce((sum: number, inv: any) => {
            const payment = payments.find((p) => p.invoiceId === inv.id);
            if (payment?.paidAt) {
              const days = Math.ceil(
                (new Date(payment.paidAt).getTime() - new Date(inv.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
              );
              return sum + Math.max(0, days);
            }
            return sum;
          }, 0);
          avgPaymentDays = Math.round(totalDays / paidInvoices.length);
        }

        // Monthly revenue (last 12 months)
        const monthlyMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          monthlyMap[key] = 0;
        }
        invoices.forEach((inv: any) => {
          const d = new Date(inv.invoiceDate);
          const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
          if (key in monthlyMap) monthlyMap[key] += inv.total || 0;
        });
        const monthlyRevenue = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));

        const sortedInvoices = [...invoices].sort(
          (a: any, b: any) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime()
        );

        setData({
          client,
          invoices,
          payments,
          stats: {
            totalInvoices: invoices.length,
            totalRevenue,
            totalPaid,
            totalOutstanding,
            averagePaymentDays: avgPaymentDays,
            lastInvoiceDate: sortedInvoices.length > 0 ? sortedInvoices[0].invoiceDate : null,
            firstInvoiceDate: sortedInvoices.length > 0 ? sortedInvoices[sortedInvoices.length - 1].invoiceDate : null,
            overdueCount,
          },
          monthlyRevenue,
        });
      } catch (error) {
        console.error('Failed to load client insights:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Failed to load client insights</div>;
  }

  const { client, stats, monthlyRevenue } = data;
  const maxRevenue = Math.max(...monthlyRevenue.map((m) => m.amount), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
          <ArrowLeft size={20} className="text-gray-600 dark:text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{client.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Client Insights & Analytics</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(stats.totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Total Paid</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Outstanding</p>
            <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.totalOutstanding)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-400 mb-1">Avg Payment Time</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.averagePaymentDays > 0 ? `${stats.averagePaymentDays} days` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Details + Invoice Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.company && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">Company:</span>
                <span className="text-gray-900 dark:text-white">{client.company}</span>
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-gray-400" />
                <span className="text-gray-900 dark:text-white">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone size={14} className="text-gray-400" />
                <span className="text-gray-900 dark:text-white">{client.phone}</span>
              </div>
            )}
            {client.gstNumber && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">GST:</span>
                <span className="text-gray-900 dark:text-white">{client.gstNumber}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-400">Status:</span>
              <Badge className={client.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-600'}>
                {client.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-gray-400" />
              <span className="text-gray-500 dark:text-gray-400">
                Client since {stats.firstInvoiceDate ? formatDate(stats.firstInvoiceDate) : 'N/A'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Invoice Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Total Invoices</span>
              <span className="font-semibold text-gray-900 dark:text-white">{stats.totalInvoices}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Last Invoice</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.lastInvoiceDate ? formatDate(stats.lastInvoiceDate) : '—'}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Overdue Invoices</span>
              <span className={`font-semibold ${stats.overdueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {stats.overdueCount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Collection Rate</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {stats.totalRevenue > 0 ? `${Math.round((stats.totalPaid / stats.totalRevenue) * 100)}%` : '—'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue (Last 12 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-40">
            {monthlyRevenue.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-32">
                  <div
                    className="w-full bg-amber-400 dark:bg-amber-500 rounded-t-sm min-h-[2px] transition-all"
                    style={{ height: `${Math.max((m.amount / maxRevenue) * 100, 2)}%` }}
                    title={formatCurrency(m.amount)}
                  />
                </div>
                <span className="text-[9px] text-gray-400 dark:text-gray-500 rotate-0">{m.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {data.payments.length === 0 ? (
            <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">No payments recorded yet</p>
          ) : (
            <div className="space-y-2">
              {data.payments.slice(0, 10).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
                      <IndianRupee size={14} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{payment.method} • {formatDate(payment.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    payment.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    payment.status === 'Failed' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

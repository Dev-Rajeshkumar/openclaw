'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText,
  IndianRupee,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
} from 'lucide-react';
import { IDashboardStats, IInvoice, InvoiceStatus } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/invoices/dashboard/stats');
        if (data.success && data.data) {
          setStats(data.data as IDashboardStats);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Invoices',
      value: stats?.totalInvoices || 0,
      icon: FileText,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: IndianRupee,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Pending Amount',
      value: formatCurrency(stats?.pendingAmount || 0),
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      label: 'Overdue',
      value: stats?.overdueInvoices || 0,
      icon: AlertTriangle,
      color: 'bg-red-50 text-red-600',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Here's what's happening with your invoices</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
        >
          <Plus size={18} />
          New Invoice
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Invoices</h2>
          <Link
            href="/dashboard/invoices"
            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
          >
            View all
            <ArrowUpRight size={14} />
          </Link>
        </div>

        {stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {stats.recentInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/dashboard/invoices/${invoice.id}`}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-gray-500">
                      {invoice.client?.name || 'No client'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(invoice.total)}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(
                      invoice.status
                    )}`}
                  >
                    {invoice.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No invoices yet</p>
            <Link
              href="/dashboard/invoices/new"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition"
            >
              <Plus size={18} />
              Create Your First Invoice
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

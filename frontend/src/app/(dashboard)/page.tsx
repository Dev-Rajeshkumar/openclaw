'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, IndianRupee, Clock, AlertTriangle, Plus, ArrowUpRight, TrendingUp } from 'lucide-react';
import { IDashboardStats, IInvoice } from '@/types';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/invoices/dashboard/stats').then(({ data }) => {
      if (data.success && data.data) setStats(data.data as IDashboardStats);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Invoices', value: stats?.totalInvoices || 0, icon: FileText, color: 'bg-blue-50 text-blue-600', change: '' },
    { label: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: IndianRupee, color: 'bg-green-50 text-green-600', change: '' },
    { label: 'Pending Amount', value: formatCurrency(stats?.pendingAmount || 0), icon: Clock, color: 'bg-amber-50 text-amber-600', change: '' },
    { label: 'Overdue', value: stats?.overdueCount || 0, icon: AlertTriangle, color: 'bg-red-50 text-red-600', change: '' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Here&apos;s what&apos;s happening with your business</p>
        </div>
        <Link href="/dashboard/invoices/new">
          <Button><Plus size={18} className="mr-2" /> New Invoice</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-32" /></CardContent></Card>) :
          statCards.map((card) => (
            <Card key={card.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.color}`}><card.icon size={20} /></div>
                  {card.change && <span className="text-xs font-medium text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />{card.change}</span>}
                </div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-sm text-gray-500 mt-1">{card.label}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div><CardTitle>Recent Invoices</CardTitle><CardDescription>Your latest invoice activity</CardDescription></div>
          <Link href="/dashboard/invoices" className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1">View all <ArrowUpRight size={14} /></Link>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div> :
            stats?.recentInvoices && stats.recentInvoices.length > 0 ? (
              <div className="divide-y divide-gray-50">
                {stats.recentInvoices.map((invoice) => (
                  <Link key={invoice.id} href={`/dashboard/invoices/${invoice.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 transition -mx-2 px-2 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><FileText size={16} className="text-amber-600" /></div>
                      <div><p className="font-medium text-gray-900 text-sm">{invoice.invoiceNumber}</p><p className="text-xs text-gray-500">{invoice.client?.name || 'No client'}</p></div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">{formatCurrency(invoice.total)}</p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <FileText size={36} className="text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm mb-3">No invoices yet</p>
                <Link href="/dashboard/invoices/new"><Button size="sm"><Plus size={16} className="mr-1" /> Create Your First Invoice</Button></Link>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

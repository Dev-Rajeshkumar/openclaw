'use client';
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, IndianRupee, FileText, Receipt, Users, PieChart } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  totalClients: number;
  activeClients: number;
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    api.get(`/reports/summary?period=${period}`).then(({ data }) => {
      if (data.success && data.data) setSummary(data.data as ReportSummary);
    }).catch(console.error).finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1><p className="text-gray-500">Insights into your business performance</p></div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="quarter">This Quarter</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div> : (
        <>
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-50"><IndianRupee size={20} className="text-green-600" /></div>
                  <span className="text-xs font-medium text-green-600 flex items-center gap-0.5"><TrendingUp size={12} />Revenue</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalRevenue || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-red-50"><Receipt size={20} className="text-red-600" /></div>
                  <span className="text-xs font-medium text-red-600 flex items-center gap-0.5"><TrendingDown size={12} />Expenses</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.totalExpenses || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">Total Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-blue-50"><BarChart3 size={20} className="text-blue-600" /></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.netProfit || 0)}</p>
                <p className="text-sm text-gray-500 mt-1">Net Profit</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-amber-50"><Users size={20} className="text-amber-600" /></div>
                </div>
                <p className="text-2xl font-bold text-gray-900">{summary?.totalClients || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Total Clients</p>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Breakdown */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={18} /> Invoice Breakdown</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <p className="text-3xl font-bold text-green-600">{summary?.paidInvoices || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Paid Invoices</p>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <p className="text-3xl font-bold text-amber-600">{summary?.pendingInvoices || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Pending Invoices</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl">
                  <p className="text-3xl font-bold text-red-600">{summary?.overdueInvoices || 0}</p>
                  <p className="text-sm text-gray-500 mt-1">Overdue Invoices</p>
                </div>
              </div>
              {/* Simple bar visualization */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>Payment Rate</span>
                  <span>{summary ? Math.round((summary.paidInvoices / Math.max(summary.totalInvoices, 1)) * 100) : 0}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${summary ? (summary.paidInvoices / Math.max(summary.totalInvoices, 1)) * 100 : 0}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profit & Loss */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><PieChart size={18} /> Profit & Loss Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Revenue</span>
                  <span className="font-semibold text-green-600">+{formatCurrency(summary?.totalRevenue || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Total Expenses</span>
                  <span className="font-semibold text-red-600">-{formatCurrency(summary?.totalExpenses || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-t-2 border-gray-200">
                  <span className="font-semibold text-gray-900">Net Profit</span>
                  <span className={`font-bold text-lg ${(summary?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary?.netProfit || 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

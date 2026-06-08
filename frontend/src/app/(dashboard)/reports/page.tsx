'use client';
import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, IndianRupee, FileText, Download, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface ReportData {
  period: { startDate: string; endDate: string };
  revenue: { total: number; monthly: { month: string; amount: number }[] };
  expenses: { total: number; byCategory: { category: string; amount: number }[] };
  profit: number;
  invoiceBreakdown: { status: string; count: number; amount: number }[];
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const months = period === '6months' ? 6 : period === '3months' ? 3 : 12;
      const start = new Date(now.getFullYear(), now.getMonth() - months, 1);
      const { data: res } = await api.get(`/reports/summary?startDate=${start.toISOString()}&endDate=${now.toISOString()}`);
      if (res.success && res.data) setData(res.data as ReportData);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [period]);

  const exportCSV = async (type: string) => {
    try {
      const { data: res } = await api.get(`/reports/export?type=${type}&format=csv`);
      if (res.success && res.data) {
        const blob = new Blob([res.data as string], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch { console.error('Export failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Business performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="6months">Last 6 Months</SelectItem>
              <SelectItem value="12months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchReport}><Calendar size={16} className="mr-2" /> Refresh</Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Card key={i}><CardContent className="p-5"><Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-8 w-32" /></CardContent></Card>)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-lg bg-green-50"><TrendingUp size={20} className="text-green-600" /></div></div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.revenue.total)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Revenue</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-lg bg-red-50"><IndianRupee size={20} className="text-red-600" /></div></div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(data.expenses.total)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Expenses</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-lg bg-blue-50"><BarChart3 size={20} className="text-blue-600" /></div></div>
              <p className={`text-2xl font-bold ${data.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(data.profit)}</p>
              <p className="text-sm text-gray-500 mt-1">Net Profit</p>
            </CardContent></Card>
            <Card><CardContent className="p-5">
              <div className="flex items-center justify-between mb-3"><div className="p-2 rounded-lg bg-purple-50"><FileText size={20} className="text-purple-600" /></div></div>
              <p className="text-2xl font-bold text-gray-900">{data.invoiceBreakdown.reduce((s, b) => s + b.count, 0)}</p>
              <p className="text-sm text-gray-500 mt-1">Total Invoices</p>
            </CardContent></Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Revenue Trend</CardTitle><CardDescription>Monthly revenue over time</CardDescription></CardHeader>
              <CardContent>
                {data.revenue.monthly.length > 0 ? (
                  <div className="space-y-3">
                    {data.revenue.monthly.map((m) => (
                      <div key={m.month} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-12 shrink-0">{m.month}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-amber-400 rounded-full transition-all" style={{ width: `${Math.min(100, data.revenue.total > 0 ? (m.amount / data.revenue.total) * 100 * (data.revenue.monthly.length))}%` }} />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">{formatCurrency(m.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm py-4 text-center">No revenue data</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Expenses by Category</CardTitle><CardDescription>Where your money goes</CardDescription></CardHeader>
              <CardContent>
                {data.expenses.byCategory.length > 0 ? (
                  <div className="space-y-3">
                    {data.expenses.byCategory.map((c) => (
                      <div key={c.category} className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 w-24 shrink-0">{c.category}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                          <div className="absolute inset-y-0 left-0 bg-red-400 rounded-full transition-all" style={{ width: `${Math.min(100, data.expenses.total > 0 ? (c.amount / data.expenses.total) * 100 : 0)}%` }} />
                          <span className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">{formatCurrency(c.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-gray-400 text-sm py-4 text-center">No expense data</p>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Invoice Breakdown</CardTitle><CardDescription>Status-wise distribution</CardDescription></div>
                <Button size="sm" variant="outline" onClick={() => exportCSV('invoices')}><Download size={14} className="mr-2" /> CSV</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Count</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.invoiceBreakdown.map((b) => (
                      <TableRow key={b.status}>
                        <TableCell className="font-medium">{b.status}</TableCell>
                        <TableCell className="text-right">{b.count}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(b.amount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div><CardTitle>Export Data</CardTitle><CardDescription>Download reports as CSV</CardDescription></div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div><p className="font-medium text-sm text-gray-900">Invoices</p><p className="text-xs text-gray-400">All invoice data with line items</p></div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('invoices')}><Download size={14} /></Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div><p className="font-medium text-sm text-gray-900">Clients</p><p className="text-xs text-gray-400">Client list with contact details</p></div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('clients')}><Download size={14} /></Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div><p className="font-medium text-sm text-gray-900">Payments</p><p className="text-xs text-gray-400">Payment history with references</p></div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('payments')}><Download size={14} /></Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition">
                  <div><p className="font-medium text-sm text-gray-900">Expenses</p><p className="text-xs text-gray-400">Expense records with categories</p></div>
                  <Button size="sm" variant="outline" onClick={() => exportCSV('expenses')}><Download size={14} /></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card><CardContent className="py-12 text-center">
          <BarChart3 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Select a period to view reports</p>
        </CardContent></Card>
      )}
    </div>
  );
}

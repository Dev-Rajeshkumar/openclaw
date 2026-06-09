'use client';
import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, CreditCard, Eye, Download } from 'lucide-react';
import { IPayment, PaymentMethod, PaymentStatus } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReceived, setTotalReceived] = useState(0);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }), ...(methodFilter && { method: methodFilter }) });
      const { data } = await api.get(`/payments?${params}`);
      if (data.success && data.data) {
        const result = data.data as { payments: IPayment[]; total: number; totalAmount: number };
        setPayments(result.payments || []);
        setTotalReceived(result.totalAmount || 0);
        setTotalPages(data.meta?.totalPages || 1);
      }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search, methodFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1><p className="text-gray-500 dark:text-gray-400">Track all payment transactions</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Total Received</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalReceived)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(payments.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).reduce((s, p) => s + p.amount, 0))}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Transactions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{payments.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search by reference..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={methodFilter} onValueChange={(v) => { setMethodFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All Methods" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Methods</SelectItem>
              {Object.values(PaymentMethod).map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            payments.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Amount</TableHead><TableHead>Method</TableHead><TableHead>Reference</TableHead><TableHead>Status</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.invoice?.invoiceNumber || '—'}</TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-400">{formatCurrency(p.amount)}</TableCell>
                        <TableCell><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{p.method}</span></TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 text-sm">{p.reference || '—'}</TableCell>
                        <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>{p.status}</span></TableCell>
                        <TableCell className="text-gray-500 dark:text-gray-400 text-sm">{formatDate(p.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <CreditCard size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">No payments recorded yet. Record a payment from an invoice detail page.</p>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

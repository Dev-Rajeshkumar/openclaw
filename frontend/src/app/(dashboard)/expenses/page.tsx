'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Search, Receipt, Trash2, MoreHorizontal, Pencil } from 'lucide-react';
import { IExpense } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';

const EXPENSE_CATEGORIES = [
  'Office Supplies', 'Travel', 'Meals', 'Software', 'Hardware',
  'Marketing', 'Rent', 'Utilities', 'Insurance', 'Professional Services',
  'Transportation', 'Communication', 'Training', 'Miscellaneous',
];

export default function ExpensesPage() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<IExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', ...(search && { search }), ...(categoryFilter && { category: categoryFilter }) });
      const { data } = await api.get(`/expenses?${params}`);
      if (data.success && data.data) { setExpenses(data.data as IExpense[]); setTotalPages(data.meta?.totalPages || 1); }
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [page, search, categoryFilter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try { await api.delete(`/expenses/${id}`); toast.success('Deleted'); fetchExpenses(); }
    catch { toast.error('Failed'); }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">Expenses</h1><p className="text-gray-500">Track your business expenses</p></div>
        <Link href="/dashboard/expenses/new"><Button><Plus size={18} className="mr-2" /> Add Expense</Button></Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalAmount)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">This Month</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth()).reduce((s, e) => s + e.amount, 0))}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Entries</p>
          <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input placeholder="Search expenses..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div> :
            expenses.length > 0 ? (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">Tax</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell><span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{exp.category}</span></TableCell>
                        <TableCell className="text-gray-600 truncate max-w-48">{exp.description || '—'}</TableCell>
                        <TableCell className="text-gray-500 text-sm">{formatDate(exp.date)}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(exp.amount)}</TableCell>
                        <TableCell className="text-right text-gray-500">{exp.taxAmount ? formatCurrency(exp.taxAmount) : '—'}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => router.push(`/dashboard/expenses/${exp.id}`)} className="flex items-center gap-2"><Pencil size={14} /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(exp.id)} className="text-red-600 flex items-center gap-2"><Trash2 size={14} /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                      <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <Receipt size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-4">No expenses recorded yet</p>
                <Link href="/dashboard/expenses/new"><Button><Plus size={18} className="mr-2" /> Add Your First Expense</Button></Link>
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

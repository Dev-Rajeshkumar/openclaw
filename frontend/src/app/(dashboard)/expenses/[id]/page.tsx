'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save, Trash2, Receipt } from 'lucide-react';
import { IExpense } from '@/types';
import { expenseSchema, ExpenseFormData } from '@/lib/validations';
import { formatDate, formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  'Office Supplies', 'Travel', 'Meals & Entertainment', 'Software', 'Hardware',
  'Marketing & Advertising', 'Rent', 'Utilities', 'Insurance', 'Professional Services',
  'Transportation', 'Communication', 'Training & Education', 'Miscellaneous',
];

export default function ExpenseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [expense, setExpense] = useState<IExpense | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0], taxAmount: 0 },
  });

  useEffect(() => {
    const fetchExpense = async () => {
      try {
        const { data } = await api.get(`/expenses/${id}`);
        if (data.success && data.data) {
          const exp = data.data as IExpense;
          setExpense(exp);
          reset({
            category: exp.category || '',
            amount: exp.amount || 0,
            description: exp.description || '',
            date: exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0],
            taxAmount: exp.taxAmount || 0,
          });
        }
      } catch { toast.error('Failed to load expense'); }
      setLoading(false);
    };
    fetchExpense();
  }, [id, reset]);

  const onSubmit = async (data: ExpenseFormData) => {
    setSaving(true);
    try {
      const { data: result } = await api.put(`/expenses/${id}`, {
        ...data,
        amount: Number(data.amount),
        taxAmount: data.taxAmount ? Number(data.taxAmount) : undefined,
      });
      if (result.success && result.data) {
        setExpense(result.data as IExpense);
        setIsEditing(false);
        toast.success('Expense updated!');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to update expense');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this expense?')) return;
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      router.push('/dashboard/expenses');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!expense) return <div className="text-center py-12"><p className="text-gray-500">Expense not found</p><Button variant="link" onClick={() => router.push('/dashboard/expenses')}>Back to Expenses</Button></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expense Details</h1>
            <p className="text-gray-500 text-sm">{formatDate(expense.date)} • {expense.category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Save size={14} className="mr-1" /> Edit
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={handleDelete}>
            <Trash2 size={14} className="mr-1" /> Delete
          </Button>
        </div>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Edit Expense</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select defaultValue={expense.category} onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input type="number" min="0" step="0.01" {...register('amount', { valueAsNumber: true })} />
                  {errors.amount && <p className="text-red-500 text-sm">{errors.amount.message}</p>}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date *</Label>
                  <Input type="date" {...register('date')} />
                  {errors.date && <p className="text-red-500 text-sm">{errors.date.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Tax Amount</Label>
                  <Input type="number" min="0" step="0.01" {...register('taxAmount', { valueAsNumber: true })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea placeholder="What was this expense for?" {...register('description')} rows={3} />
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => { setIsEditing(false); reset(); }}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <><Loader2 size={16} className="animate-spin mr-2" />Saving...</> : <><Save size={16} className="mr-2" />Save Changes</>}
            </Button>
          </div>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Amount</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(expense.amount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Category</p>
                <p className="font-semibold text-gray-900">{expense.category}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="font-semibold text-gray-900">{formatDate(expense.date)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt size={18} /> Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {expense.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-900">{expense.description}</p>
                </div>
              )}
              {expense.taxAmount ? (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Tax Amount</p>
                  <p className="font-semibold text-gray-900">{formatCurrency(expense.taxAmount)}</p>
                </div>
              ) : null}
              <div className="pt-2 border-t border-gray-100 flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-400">Total with Tax</p>
                  <p className="font-bold text-gray-900">{formatCurrency(expense.amount + (expense.taxAmount || 0))}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

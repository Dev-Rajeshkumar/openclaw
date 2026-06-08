'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { expenseSchema, ExpenseFormData } from '@/lib/validations';
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

export default function NewExpensePage() {
  const router = useRouter();
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: '', amount: 0, description: '', date: new Date().toISOString().split('T')[0], taxAmount: 0 },
  });

  const onSubmit = async (data: ExpenseFormData) => {
    try {
      await api.post('/expenses', { ...data, amount: Number(data.amount), taxAmount: data.taxAmount ? Number(data.taxAmount) : undefined });
      toast.success('Expense added!');
      router.push('/dashboard/expenses');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">New Expense</h1><p className="text-gray-500">Record a business expense</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Expense Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select onValueChange={(v) => setValue('category', v, { shouldValidate: true })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm">{errors.category.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...register('amount', { valueAsNumber: true })} />
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
                <Input type="number" min="0" step="0.01" placeholder="0.00" {...register('taxAmount', { valueAsNumber: true })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea placeholder="What was this expense for?" {...register('description')} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" />Saving...</> : <><Save size={18} className="mr-2" />Save Expense</>}
          </Button>
        </div>
      </form>
    </div>
  );
}

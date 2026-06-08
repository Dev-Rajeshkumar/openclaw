'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { estimateSchema, EstimateFormData } from '@/lib/validations';
import { IClient } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function NewEstimatePage() {
  const router = useRouter();
  const [clients, setClients] = useState<IClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<EstimateFormData>({
    resolver: zodResolver(estimateSchema),
    defaultValues: {
      title: '',
      expiryDate: '',
      items: [{ description: '', hsnCode: '', quantity: 1, rate: 0 }],
      notes: '',
      terms: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedTaxRate = 18; // default GST rate for estimates
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  const taxAmount = Math.round((subtotal * watchedTaxRate) / 100 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  useEffect(() => {
    api.get('/clients?limit=100').then(({ data }) => {
      if (data.success && data.data) setClients(data.data as IClient[]);
    });
  }, []);

  const onSubmit = async (formData: EstimateFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: watchedTaxRate,
          discount: 0,
          amount: Number(item.quantity) * Number(item.rate),
        })),
      };
      const { data } = await api.post('/estimates', payload);
      if (data.success) { toast.success('Estimate created!'); router.push('/dashboard/estimates'); }
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setIsSubmitting(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">New Estimate</h1><p className="text-gray-500">Create a professional quotation</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Estimate Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select onValueChange={(v) => setValue('clientId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                {errors.clientId && <p className="text-red-500 text-sm">{errors.clientId.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input placeholder="Project name or quotation title" {...register('title')} />
                {errors.title && <p className="text-red-500 text-sm">{errors.title.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" {...register('expiryDate')} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', hsnCode: '', quantity: 1, rate: 0 })}>
              <Plus size={14} className="mr-1" /> Add Item
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead className="w-[40%]">Description</TableHead><TableHead>HSN</TableHead><TableHead className="w-20">Qty</TableHead><TableHead className="w-24">Rate</TableHead><TableHead className="w-24">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
              <TableBody>
                {fields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell><Input placeholder="Item description" {...register(`items.${index}.description`)} className="h-9" /></TableCell>
                    <TableCell><Input placeholder="HSN" {...register(`items.${index}.hsnCode`)} className="h-9" /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-9" /></TableCell>
                    <TableCell><Input type="number" min="0" step="0.01" {...register(`items.${index}.rate`, { valueAsNumber: true })} className="h-9" /></TableCell>
                    <TableCell><Input value={formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))} readOnly className="h-9 bg-gray-50" /></TableCell>
                    <TableCell>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-red-500"><Trash2 size={14} /></Button>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">GST (18%)</span><span>{formatCurrency(taxAmount)}</span></div>
                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(total)}</span></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
            <CardContent><Textarea placeholder="Internal notes..." {...register('notes')} rows={3} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Terms & Conditions</CardTitle></CardHeader>
            <CardContent><Textarea placeholder="Terms for the client..." {...register('terms')} rows={3} /></CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" />Creating...</> : 'Create Estimate'}
          </Button>
        </div>
      </form>
    </div>
  );
}

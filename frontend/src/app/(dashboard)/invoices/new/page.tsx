'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { invoiceSchema, InvoiceFormData } from '@/lib/validations';
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
import { TemplateSelector } from '@/components/TemplateSelector';

export default function NewInvoicePage() {
  const router = useRouter();
  const { activeBusiness } = useAuth();
  const [clients, setClients] = useState<IClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { gstRate: 18, items: [{ description: '', hsnCode: '', quantity: 1, rate: 0 }], clientId: '', notes: '' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedGstRate = watch('gstRate') || 18;
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  const gstAmount = Math.round((subtotal * watchedGstRate) / 100 * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

  useEffect(() => {
    api.get('/clients?limit=100').then(({ data }) => {
      if (data.success && data.data) setClients(data.data as IClient[]);
    });
  }, []);

  const onSubmit = async (formData: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        clientId: formData.clientId || undefined,
        invoiceTemplateId: selectedTemplate,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: watchedGstRate,
          amount: Number(item.quantity) * Number(item.rate),
        })),
      };
      const { data } = await api.post('/invoices', payload);
      if (data.success) { toast.success('Invoice created!'); router.push('/dashboard/invoices'); }
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); } finally { setIsSubmitting(false); }
  };

  const handleTemplateChange = useCallback((slug: string) => {
    setSelectedTemplate(slug);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">New Invoice</h1><p className="text-gray-500">Create a GST-compliant invoice</p></div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Invoice Template */}
        <Card>
          <CardHeader><CardTitle>Choose Template</CardTitle></CardHeader>
          <CardContent>
            <TemplateSelector value={selectedTemplate} onChange={handleTemplateChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Client</Label>
                <Select onValueChange={(v) => setValue('clientId', v)}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent><SelectItem value="">No client</SelectItem>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Due Date</Label><Input type="date" {...register('dueDate')} /></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>GST Details</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>GST Type</Label>
                <Select onValueChange={(v) => setValue('gstType', v)} defaultValue="CGST_SGST">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="CGST_SGST">CGST + SGST</SelectItem><SelectItem value="IGST">IGST</SelectItem><SelectItem value="UTGST">UTGST</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>GST Rate (%)</Label>
                <Select onValueChange={(v) => setValue('gstRate', Number(v))} defaultValue="18">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="0">0%</SelectItem><SelectItem value="5">5%</SelectItem><SelectItem value="12">12%</SelectItem><SelectItem value="18">18%</SelectItem><SelectItem value="28">28%</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Line Items</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', hsnCode: '', quantity: 1, rate: 0 })}><Plus size={14} className="mr-1" /> Add Item</Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto -mx-6 px-6">
              <Table>
                <TableHeader><TableRow><TableHead className="w-[35%]">Description</TableHead><TableHead>HSN</TableHead><TableHead className="w-20">Qty</TableHead><TableHead className="w-24">Rate</TableHead><TableHead className="w-24">Amount</TableHead><TableHead className="w-10"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell><Input placeholder="Item description" {...register(`items.${index}.description`)} className="h-9 min-w-[120px]" /></TableCell>
                      <TableCell><Input placeholder="HSN" {...register(`items.${index}.hsnCode`)} className="h-9" /></TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true })} className="h-9" /></TableCell>
                      <TableCell><Input type="number" min="0" step="0.01" {...register(`items.${index}.rate`, { valueAsNumber: true })} className="h-9" /></TableCell>
                      <TableCell><Input value={formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))} readOnly className="h-9 bg-gray-50" /></TableCell>
                      <TableCell>{fields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8 text-red-500"><Trash2 size={14} /></Button>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end mt-4"><div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">GST ({watchedGstRate}%)</span><span>{formatCurrency(gstAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(total)}</span></div>
            </div></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
          <CardContent><Textarea placeholder="Add notes or payment terms..." {...register('notes')} rows={3} /></CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} className="order-2 sm:order-1">Cancel</Button>
          <Button type="submit" disabled={isSubmitting} className="order-1 sm:order-2">{isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" />Creating...</> : 'Create Invoice'}</Button>
        </div>
      </form>
    </div>
  );
}

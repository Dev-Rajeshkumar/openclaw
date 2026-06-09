'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Zap, ArrowLeft, Plus, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { IClient, IProduct } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuickInvoiceForm {
  clientId: string;
  items: { description: string; quantity: number; rate: number }[];
  gstRate: number;
}

export default function QuickInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<IClient[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInvoiceId, setCreatedInvoiceId] = useState<string | null>(null);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<QuickInvoiceForm>({
    resolver: zodResolver(
      (await import('@/lib/validations')).invoiceSchema
    ),
    defaultValues: {
      clientId: '',
      items: [{ description: '', quantity: 1, rate: 0 }],
      gstRate: 18,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const watchedGstRate = watch('gstRate') || 18;
  const subtotal = watchedItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.rate || 0), 0);
  const gstAmount = Math.round((subtotal * watchedGstRate) / 100 * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

  useEffect(() => {
    Promise.all([
      api.get('/clients?limit=100'),
      api.get('/products?limit=100'),
    ]).then(([cRes, pRes]) => {
      if (cRes.data.success && cRes.data.data) setClients(cRes.data.data as IClient[]);
      if (pRes.data.success && pRes.data.data) setProducts(pRes.data.data as IProduct[]);
    });
  }, []);

  const onSubmit = async (formData: QuickInvoiceForm) => {
    setIsSubmitting(true);
    try {
      const payload = {
        clientId: formData.clientId || undefined,
        gstRate: watchedGstRate,
        items: formData.items.map((item) => ({
          description: item.description,
          hsnCode: '',
          quantity: Number(item.quantity),
          rate: Number(item.rate),
          taxRate: watchedGstRate,
          amount: Number(item.quantity) * Number(item.rate),
        })),
      };
      const { data } = await api.post('/invoices', payload);
      if (data.success) {
        setCreatedInvoiceId(data.data.id);
        toast.success('Invoice created in seconds!');
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Failed to create invoice');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdInvoiceId) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-6">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Invoice Created!</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Your invoice has been created successfully</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => router.push(`/dashboard/invoices/${createdInvoiceId}`)} className="bg-amber-500 hover:bg-amber-600">
            View Invoice
          </Button>
          <Button variant="outline" onClick={() => { setCreatedInvoiceId(null); setValue('clientId', ''); setValue('items', [{ description: '', quantity: 1, rate: 0 }]); }}>
            Create Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap size={24} className="text-amber-500" /> Quick Invoice
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Create an invoice in under 30 seconds</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Client Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Client</label>
              <Select onValueChange={(v) => setValue('clientId', v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.company ? ` (${c.company})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Line Items */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</label>
              <div className="flex items-center gap-2">
                {products.length > 0 && (
                  <Select onValueChange={(val) => {
                    const p = products.find((pr) => pr.id === val);
                    if (p) append({ description: p.name, quantity: 1, rate: p.unitPrice });
                  }}>
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="+ Product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} — {formatCurrency(p.unitPrice)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, rate: 0 })}>
                  <Plus size={14} className="mr-1" /> Add
                </Button>
              </div>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Input
                  placeholder="Description"
                  {...register(`items.${index}.description`)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                  className="w-16"
                />
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Rate"
                  {...register(`items.${index}.rate`, { valueAsNumber: true })}
                  className="w-24"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400 w-20 text-right">
                  {formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))}
                </span>
                {fields.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-red-500 h-8 w-8">
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* GST + Total */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GST</label>
                <Select onValueChange={(v) => setValue('gstRate', Number(v))} defaultValue="18">
                  <SelectTrigger className="w-20 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0%</SelectItem>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="12">12%</SelectItem>
                    <SelectItem value="18">18%</SelectItem>
                    <SelectItem value="28">28%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-right space-y-1">
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>Subtotal: {formatCurrency(subtotal)}</span>
                  <span>GST: {formatCurrency(gstAmount)}</span>
                </div>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(total)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-base">
          {isSubmitting ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Creating...</>
          ) : (
            <><Zap size={18} className="mr-2" /> Create Invoice</>
          )}
        </Button>
      </form>
    </div>
  );
}

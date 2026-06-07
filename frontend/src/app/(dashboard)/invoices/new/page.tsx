'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { invoiceSchema, InvoiceFormData } from '@/lib/validations';
import { GstType, IClient } from '@/types';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';

export default function NewInvoicePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [clients, setClients] = useState<IClient[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      gstType: GstType.CGST_SGST,
      gstRate: 18,
      items: [{ description: '', hsnCode: '', quantity: 1, rate: 0 }],
      clientId: '',
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const watchedItems = watch('items');
  const watchedGstRate = watch('gstRate') || 18;

  // Calculate totals
  const subtotal = watchedItems.reduce(
    (sum, item) => sum + (item.quantity || 0) * (item.rate || 0),
    0
  );
  const gstAmount = Math.round((subtotal * watchedGstRate) / 100 * 100) / 100;
  const total = Math.round((subtotal + gstAmount) * 100) / 100;

  // Fetch clients on mount
  useState(() => {
    api.get('/clients?limit=100').then(({ data }) => {
      if (data.success && data.data) {
        setClients(data.data as IClient[]);
      }
    });
  });

  const onSubmit = async (formData: InvoiceFormData) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        clientId: formData.clientId || undefined,
        items: formData.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          rate: Number(item.rate),
        })),
      };
      const { data } = await api.post('/invoices', payload);
      if (data.success) {
        toast.success('Invoice created successfully!');
        router.push('/dashboard/invoices');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create invoice';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
          <p className="text-gray-500">Create a new GST invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                {...register('clientId')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value="">Select a client (optional)</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                {...register('dueDate')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              />
            </div>
          </div>
        </div>

        {/* GST Info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">GST Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Type</label>
              <select
                {...register('gstType')}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value={GstType.CGST_SGST}>CGST + SGST (Intra-state)</option>
                <option value={GstType.IGST}>IGST (Inter-state)</option>
                <option value={GstType.UTGST}>UTGST (Union Territory)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Rate (%)</label>
              <select
                {...register('gstRate', { valueAsNumber: true })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Line Items</h2>
            <button
              type="button"
              onClick={() => append({ description: '', hsnCode: '', quantity: 1, rate: 0 })}
              className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-700 text-sm font-medium"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-3 items-start">
                <div className="col-span-12 md:col-span-5">
                  <input
                    placeholder="Description"
                    {...register(`items.${index}.description`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
                  />
                </div>
                <div className="col-span-3 md:col-span-2">
                  <input
                    placeholder="HSN"
                    {...register(`items.${index}.hsnCode`)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <input
                    type="number"
                    placeholder="Qty"
                    {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    placeholder="Rate"
                    {...register(`items.${index}.rate`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition text-sm"
                  />
                </div>
                <div className="col-span-3 md:col-span-1">
                  <input
                    type="text"
                    value={formatCurrency((watchedItems[index]?.quantity || 0) * (watchedItems[index]?.rate || 0))}
                    readOnly
                    className="w-full px-3 py-2 rounded-lg border border-gray-100 bg-gray-100 text-sm text-gray-600"
                  />
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-end">
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 border-t border-gray-100 pt-4">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST ({watchedGstRate}%)</span>
                  <span className="text-gray-900">{formatCurrency(gstAmount)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t border-gray-100 pt-2">
                  <span className="text-gray-900">Total</span>
                  <span className="text-amber-600">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
          <textarea
            {...register('notes')}
            rows={3}
            placeholder="Add any notes or payment terms..."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              'Create Invoice'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

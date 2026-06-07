'use client';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { clientSchema, ClientFormData } from '@/lib/validations';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewClientPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: { name: '', email: '', phone: '', gstNumber: '', address: '' },
  });

  const onSubmit = async (data: ClientFormData) => {
    try { await api.post('/clients', data); toast.success('Client created!'); router.push('/dashboard/clients'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed'); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
        <div><h1 className="text-2xl font-bold text-gray-900">New Client</h1><p className="text-gray-500">Add a new client to your business</p></div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card><CardHeader><CardTitle>Client Information</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Client Name *</Label><Input placeholder="Client or Company" {...register('name')} />{errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}</div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="client@example.com" {...register('email')} />{errors.email && <p className="text-red-500 text-sm">{errors.email.message}</p>}</div>
            <div className="space-y-2"><Label>Phone</Label><Input placeholder="9876543210" {...register('phone')} />{errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}</div>
            <div className="space-y-2"><Label>GST Number</Label><Input placeholder="33AABCU9603R1ZM" {...register('gstNumber')} />{errors.gstNumber && <p className="text-red-500 text-sm">{errors.gstNumber.message}</p>}</div>
          </div>
          <div className="space-y-2"><Label>Address</Label><Textarea placeholder="Full address..." {...register('address')} rows={3} /></div>
        </CardContent></Card>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" />Creating...</> : <><Save size={18} className="mr-2" />Create Client</>}</Button></div>
      </form>
    </div>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Edit, Trash2, Mail, Phone, MapPin, FileText, IndianRupee, Building2 } from 'lucide-react';
import { IClient, IInvoice, InvoiceStatus } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<IClient | null>(null);
  const [invoices, setInvoices] = useState<IInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/clients/${id}`),
      api.get(`/clients/${id}/invoices`),
    ]).then(([clientRes, invoicesRes]) => {
      if (clientRes.data.success && clientRes.data.data) setClient(clientRes.data.data as IClient);
      if (invoicesRes.data.success && invoicesRes.data.data) setInvoices(invoicesRes.data.data as IInvoice[]);
    }).catch(() => toast.error('Failed to load client')).finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this client? All associated data will be preserved.')) return;
    try { await api.delete(`/clients/${id}`); toast.success('Client deleted'); router.push('/dashboard/clients'); }
    catch { toast.error('Failed'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!client) return <div className="text-center py-12"><p className="text-gray-500">Client not found</p></div>;

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalPaid = invoices.filter(i => i.status === InvoiceStatus.Paid).reduce((sum, inv) => sum + inv.total, 0);
  const totalPending = totalBilled - totalPaid;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            {client.company && <p className="text-gray-500 text-sm">{client.company}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleDelete} variant="destructive"><Trash2 size={16} className="mr-2" /> Delete</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Total Billed</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBilled)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Total Paid</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Outstanding</p>
          <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Info */}
        <Card>
          <CardHeader><CardTitle>Contact Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {client.email && (
              <div className="flex items-start gap-3">
                <Mail size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Email</p><p className="text-sm text-gray-900">{client.email}</p></div>
              </div>
            )}
            {client.phone && (
              <div className="flex items-start gap-3">
                <Phone size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Phone</p><p className="text-sm text-gray-900">{client.phone}</p></div>
              </div>
            )}
            {client.gstNumber && (
              <div className="flex items-start gap-3">
                <Building2 size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">GST Number</p><p className="text-sm text-gray-900">{client.gstNumber}</p></div>
              </div>
            )}
            {client.billingAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Billing Address</p><p className="text-sm text-gray-900 whitespace-pre-wrap">{client.billingAddress}</p></div>
              </div>
            )}
            {client.shippingAddress && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">Shipping Address</p><p className="text-sm text-gray-900 whitespace-pre-wrap">{client.shippingAddress}</p></div>
              </div>
            )}
            {client.pan && (
              <div className="flex items-start gap-3">
                <FileText size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div><p className="text-xs text-gray-400">PAN</p><p className="text-sm text-gray-900">{client.pan}</p></div>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><FileText size={18} /> Invoices ({invoices.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Number</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="text-amber-600 hover:text-amber-700">{inv.invoiceNumber}</Link>
                      </TableCell>
                      <TableCell className="text-gray-600">{formatDate(inv.invoiceDate)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(inv.total)}</TableCell>
                      <TableCell><span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inv.status)}`}>{inv.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No invoices for this client yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

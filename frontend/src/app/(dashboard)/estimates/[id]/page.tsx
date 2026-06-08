'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Trash2, FileText, Send, CheckCircle, XCircle, Clock } from 'lucide-react';
import { IEstimate, EstimateStatus } from '@/types';
import { formatDate, formatCurrency, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [estimate, setEstimate] = useState<IEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    api.get(`/estimates/${id}`).then(({ data }) => {
      if (data.success && data.data) setEstimate(data.data as IEstimate);
    }).catch(() => toast.error('Failed to load estimate')).finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (status: EstimateStatus) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/estimates/${id}`, { status });
      if (data.success && data.data) { setEstimate(data.data as IEstimate); toast.success(`Estimate ${status.toLowerCase()}`); }
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this estimate?')) return;
    setActionLoading(true);
    try { await api.delete(`/estimates/${id}`); toast.success('Deleted'); router.push('/dashboard/estimates'); }
    catch { toast.error('Failed'); setActionLoading(false); }
  };

  const handleConvert = async () => {
    setActionLoading(true);
    try {
      const { data } = await api.post(`/estimates/${id}/convert`);
      if (data.success && data.data) { toast.success('Converted to invoice!'); router.push(`/dashboard/invoices/${(data.data as any).id}`); }
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Failed to convert'); } finally { setActionLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!estimate) return <div className="text-center py-12"><p className="text-gray-500">Estimate not found</p></div>;

  const canConvert = estimate.status === EstimateStatus.Sent || estimate.status === EstimateStatus.Accepted;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{estimate.estimateNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(estimate.status)}`}>{estimate.status}</span>
              <span className="text-sm text-gray-500">{estimate.title}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canConvert && (
            <Button onClick={handleConvert} disabled={actionLoading} className="bg-green-600 hover:bg-green-700">
              <FileText size={16} className="mr-2" /> Convert to Invoice
            </Button>
          )}
          {estimate.status === EstimateStatus.Draft && (
            <Button onClick={() => handleStatusChange(EstimateStatus.Sent)} disabled={actionLoading} variant="outline">
              <Send size={16} className="mr-2" /> Mark as Sent
            </Button>
          )}
          <Button onClick={handleDelete} disabled={actionLoading} variant="destructive"><Trash2 size={16} className="mr-2" /> Delete</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Client</p>
          <p className="font-semibold text-gray-900">{estimate.client?.name || '—'}</p>
          {estimate.client?.email && <p className="text-xs text-gray-500">{estimate.client.email}</p>}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Date</p>
          <p className="font-semibold text-gray-900">{formatDate(estimate.createdAt)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-gray-400 mb-1">Expiry</p>
          <p className="font-semibold text-gray-900">{estimate.expiryDate ? formatDate(estimate.expiryDate) : '—'}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Line Items</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {estimate.items.map((item, i) => (
                <TableRow key={i}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell className="text-gray-500 text-sm">{item.hsnCode}</TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
                  <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex justify-end mt-6">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(estimate.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Tax</span><span>{formatCurrency(estimate.taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(estimate.total)}</span></div>
            </div>
          </div>
          {estimate.notes && <div className="mt-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{estimate.notes}</p></div>}
          {estimate.terms && <div className="mt-4 p-4 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-500 mb-1">Terms</p><p className="text-sm text-gray-700">{estimate.terms}</p></div>}
        </CardContent>
      </Card>
    </div>
  );
}

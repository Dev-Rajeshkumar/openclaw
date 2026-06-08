'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle, Trash2, Clock, FileText, Download, Mail, Palette } from 'lucide-react';
import { IInvoice, InvoiceStatus, IStatusLog, IInvoiceTemplate, SubscriptionPlan } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const ALL_TEMPLATES: IInvoiceTemplate[] = [
  { id: 'builtin_classic', name: 'Classic', slug: 'classic', description: 'Traditional layout', isBuiltIn: true, layout: { primaryColor: '#1a1a2e', accentColor: '#e94560', fontFamily: 'Helvetica', headerStyle: 'left-aligned', tableStyle: 'bordered', footerText: 'Thank you!', tier: '' } },
  { id: 'builtin_modern', name: 'Modern', slug: 'modern', description: 'Bold header with accents', isBuiltIn: true, layout: { primaryColor: '#6366f1', accentColor: '#818cf8', fontFamily: 'Helvetica', headerStyle: 'full-width-banner', tableStyle: 'striped', footerText: 'Thank you!', tier: '' } },
  { id: 'builtin_minimal', name: 'Minimal', slug: 'minimal', description: 'Clean and minimal', isBuiltIn: true, layout: { primaryColor: '#111827', accentColor: '#6b7280', fontFamily: 'Helvetica', headerStyle: 'minimal', tableStyle: 'simple', footerText: '', tier: '' } },
  { id: 'builtin_professional', name: 'Professional', slug: 'professional', description: 'Corporate style', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0f172a', accentColor: '#0ea5e9', fontFamily: 'Helvetica', headerStyle: 'two-column', tableStyle: 'detailed', footerText: '', tier: 'starter' } },
  { id: 'builtin_elegant', name: 'Elegant', slug: 'elegant', description: 'Sophisticated design', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#7c3aed', accentColor: '#a78bfa', fontFamily: 'Helvetica', headerStyle: 'centered', tableStyle: 'elegant', footerText: '', tier: 'starter' } },
  { id: 'builtin_bold', name: 'Bold', slug: 'bold', description: 'High-contrast dark theme', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#000000', accentColor: '#f59e0b', fontFamily: 'Helvetica', headerStyle: 'full-bleed-dark', tableStyle: 'minimal-dark', footerText: '', tier: 'starter' } },
  { id: 'builtin_gradient-blue', name: 'Gradient Blue', slug: 'gradient-blue', description: 'Smooth blue gradient', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#2563eb', accentColor: '#3b82f6', fontFamily: 'Helvetica', headerStyle: 'gradient-banner', tableStyle: 'clean', footerText: '', tier: 'professional' } },
  { id: 'builtin_forest-green', name: 'Forest Green', slug: 'forest-green', description: 'Nature-inspired green', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#166534', accentColor: '#22c55e', fontFamily: 'Helvetica', headerStyle: 'left-accent-bar', tableStyle: 'soft-rows', footerText: '', tier: 'professional' } },
  { id: 'builtin_sunset-orange', name: 'Sunset Orange', slug: 'sunset-orange', description: 'Warm sunset gradient', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#ea580c', accentColor: '#fb923c', fontFamily: 'Helvetica', headerStyle: 'warm-banner', tableStyle: 'striped-warm', footerText: '', tier: 'professional' } },
  { id: 'builtin_rose-gold', name: 'Rose Gold', slug: 'rose-gold', description: 'Luxurious rose gold', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#9f1239', accentColor: '#fb7185', fontFamily: 'Helvetica', headerStyle: 'luxury-centered', tableStyle: 'refined', footerText: '', tier: 'professional' } },
  { id: 'builtin_tech-cyan', name: 'Tech Cyan', slug: 'tech-cyan', description: 'Futuristic tech style', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0e7490', accentColor: '#22d3ee', fontFamily: 'Helvetica', headerStyle: 'tech-block', tableStyle: 'grid-lines', footerText: '', tier: 'professional' } },
  { id: 'builtin_arctic-white', name: 'Arctic White', slug: 'arctic-white', description: 'Ultra-clean white', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#1e40af', accentColor: '#93c5fd', fontFamily: 'Helvetica', headerStyle: 'frost-header', tableStyle: 'airy', footerText: '', tier: 'professional' } },
  { id: 'builtin_midnight-purple', name: 'Midnight Purple', slug: 'midnight-purple', description: 'Deep purple executive', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#3b0764', accentColor: '#d97706', fontFamily: 'Helvetica', headerStyle: 'executive-dark', tableStyle: 'executive-table', footerText: '', tier: 'business' } },
  { id: 'builtin_coral-reef', name: 'Coral Reef', slug: 'coral-reef', description: 'Vibrant coral and teal', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0d9488', accentColor: '#f472b6', fontFamily: 'Helvetica', headerStyle: 'dual-tone', tableStyle: 'colorful-rows', footerText: '', tier: 'business' } },
  { id: 'builtin_slate-pro', name: 'Slate Pro', slug: 'slate-pro', description: 'Ultra-professional slate', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#334155', accentColor: '#475569', fontFamily: 'Helvetica', headerStyle: 'sharp-minimal', tableStyle: 'compact-grid', footerText: '', tier: 'business' } },
  { id: 'builtin_espresso', name: 'Espresso', slug: 'espresso', description: 'Rich brown tones', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#78350f', accentColor: '#d97706', fontFamily: 'Helvetica', headerStyle: 'warm-cream', tableStyle: 'cream-rows', footerText: '', tier: 'business' } },
  { id: 'builtin_neon-edge', name: 'Neon Edge', slug: 'neon-edge', description: 'Dark with neon accents', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#18181b', accentColor: '#a3e635', fontFamily: 'Helvetica', headerStyle: 'neon-dark', tableStyle: 'neon-grid', footerText: '', tier: 'business' } },
  { id: 'builtin_ocean-breeze', name: 'Ocean Breeze', slug: 'ocean-breeze', description: 'Calming ocean blue', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0369a1', accentColor: '#67e8f9', fontFamily: 'Helvetica', headerStyle: 'aqua-wave', tableStyle: 'flowing-rows', footerText: '', tier: 'business' } },
  { id: 'builtin_cherry-blossom', name: 'Cherry Blossom', slug: 'cherry-blossom', description: 'Delicate pink palette', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#be185d', accentColor: '#fda4af', fontFamily: 'Helvetica', headerStyle: 'sakura-header', tableStyle: 'delicate-rows', footerText: '', tier: 'business' } },
  { id: 'builtin_gunmetal', name: 'Gunmetal', slug: 'gunmetal', description: 'Industrial dark theme', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#1c1917', accentColor: '#b45309', fontFamily: 'Helvetica', headerStyle: 'industrial-header', tableStyle: 'solid-grid', footerText: '', tier: 'business' } },
  { id: 'builtin_lavender-dreams', name: 'Lavender Dreams', slug: 'lavender-dreams', description: 'Soft lavender palette', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#6d28d9', accentColor: '#c4b5fd', fontFamily: 'Helvetica', headerStyle: 'soft-gradient', tableStyle: 'gentle-rows', footerText: '', tier: 'business' } },
  { id: 'builtin_monochrome', name: 'Monochrome', slug: 'monochrome', description: 'Pure black and white', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#000000', accentColor: '#525252', fontFamily: 'Helvetica', headerStyle: 'bw-header', tableStyle: 'bw-table', footerText: '', tier: 'business' } },
];

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [invoice, setInvoice] = useState<IInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showStatusLog, setShowStatusLog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('classic');
  const [userPlan, setUserPlan] = useState<string>('Free');

  const availableTemplates = useMemo(() => {
    if (userPlan === SubscriptionPlan.Business) return ALL_TEMPLATES;
    if (userPlan === SubscriptionPlan.Professional) return ALL_TEMPLATES.filter((t) => !t.isPremium || (t.layout as any).tier !== 'business');
    if (userPlan === SubscriptionPlan.Starter) return ALL_TEMPLATES.filter((t) => !t.isPremium || (t.layout as any).tier === 'starter');
    return ALL_TEMPLATES.filter((t) => !t.isPremium);
  }, [userPlan]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
        if (data.success && data.data) {
          setInvoice(data.data as IInvoice);
          setSelectedTemplate(data.data.invoiceTemplateId || 'classic');
        }
      } catch { toast.error('Failed to load invoice'); }

      try {
        const { data: bizData } = await api.get('/businesses');
        if (bizData.success && bizData.data && bizData.data.length > 0) {
          setUserPlan(bizData.data[0].plan || 'Free');
        }
      } catch { /* ignore */ }

      setLoading(false);
    };
    init();
  }, [id]);

  const handleStatusChange = async (status: InvoiceStatus) => {
    setActionLoading(true);
    try {
      const { data } = await api.put(`/invoices/${id}`, { status });
      if (data.success && data.data) { setInvoice(data.data as IInvoice); toast.success(`Invoice marked as ${status}`); }
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this invoice?')) return;
    setActionLoading(true);
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); router.push('/dashboard/invoices'); }
    catch { toast.error('Failed'); setActionLoading(false); }
  };

  const handleRecordPayment = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await api.post(`/invoices/${id}/payments`, { amount: invoice.total, method: 'Manual', notes: 'Payment recorded manually' });
      const { data } = await api.get(`/invoices/${id}`);
      if (data.success && data.data) setInvoice(data.data as IInvoice);
      toast.success('Payment recorded');
    } catch { toast.error('Failed'); } finally { setActionLoading(false); }
  };

  const handleDownloadPDF = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const businessId = invoice?.businessId || '';
    window.open(`${apiUrl}/v1/businesses/${businessId}/invoices/${id}/pdf?template=${selectedTemplate}`, '_blank');
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>;
  if (!invoice) return <div className="text-center py-12"><p className="text-gray-500">Invoice not found</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>{invoice.status}</span>
              <span className="text-sm text-gray-500">{formatDate(invoice.invoiceDate)}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {invoice.status === InvoiceStatus.DRAFT && (
            <Button onClick={() => handleStatusChange(InvoiceStatus.Sent)} disabled={actionLoading} variant="outline" size="sm"><Send size={14} className="mr-1" /> Mark Sent</Button>
          )}
          {(invoice.status === InvoiceStatus.Sent || invoice.status === InvoiceStatus.Overdue || invoice.status === InvoiceStatus.PartiallyPaid) && (
            <Button onClick={handleRecordPayment} disabled={actionLoading} className="bg-green-600 hover:bg-green-700" size="sm"><CheckCircle size={14} className="mr-1" /> Record Payment</Button>
          )}
          {invoice.client?.email && (
            <Button onClick={async () => { setActionLoading(true); try { await api.post(`/invoices/${invoice.id}/send-email`); toast.success(`Sent to ${invoice.client?.email}`); } catch { toast.error('Failed'); } finally { setActionLoading(false); } }} disabled={actionLoading} variant="outline" size="sm"><Mail size={14} className="mr-1" /> Email</Button>
          )}
          <Button onClick={handleDownloadPDF} disabled={actionLoading} variant="outline" size="sm"><Download size={14} className="mr-1" /> PDF</Button>
          <Button onClick={handleDelete} disabled={actionLoading} variant="destructive" size="sm"><Trash2 size={14} className="mr-1" /> Delete</Button>
        </div>
      </div>

      {/* Template selector for PDF */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Palette size={16} />
              <span className="font-medium">PDF Template:</span>
            </div>
            <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                {availableTemplates.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm"><Download size={14} className="mr-1" /> Download</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              {invoice.client ? (
                <>
                  <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                  {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
                  {invoice.client.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
                  {invoice.client.gstNumber && <p className="text-sm text-gray-500">GST: {invoice.client.gstNumber}</p>}
                </>
              ) : <p className="text-gray-400">No client assigned</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-sm text-gray-500">Number</p><p className="font-semibold text-gray-900">{invoice.invoiceNumber}</p></div>
              <div><p className="text-sm text-gray-500">Date</p><p className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p></div>
              <div><p className="text-sm text-gray-500">Due</p><p className="font-semibold text-gray-900">{invoice.dueDate ? formatDate(invoice.dueDate) : '—'}</p></div>
            </div>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <Table>
              <TableHeader><TableRow><TableHead>Description</TableHead><TableHead>HSN</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Rate</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoice.items.map((item, i) => (
                  <TableRow key={item.id || i}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell className="text-gray-500 text-sm">{item.hsnCode}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-end mt-6">
            <div className="w-full sm:w-64 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">GST</span><span>{formatCurrency(invoice.taxAmount)}</span></div>
              <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span className="text-amber-600">{formatCurrency(invoice.total)}</span></div>
            </div>
          </div>

          {invoice.notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-500 mb-1">Notes</p>
              <p className="text-sm text-gray-700">{invoice.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Button variant="ghost" onClick={() => setShowStatusLog(!showStatusLog)} className="text-amber-600">
        <Clock size={16} className="mr-2" />{showStatusLog ? 'Hide' : 'Show'} Status History ({invoice.statusLogs?.length || 0})
      </Button>

      {showStatusLog && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Clock size={18} /> Status History</CardTitle></CardHeader>
          <CardContent>
            {invoice.statusLogs && invoice.statusLogs.length > 0 ? (
              <div className="space-y-4">
                {[...invoice.statusLogs].reverse().map((log, i) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.action === 'CREATE' ? 'bg-green-100 text-green-600' : log.action === 'DELETE' ? 'bg-red-100 text-red-600' : log.action === 'STATUS_CHANGE' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}>
                        {log.action === 'CREATE' ? <FileText size={14} /> : <Clock size={14} />}
                      </div>
                      {i < invoice.statusLogs!.length - 1 && <div className="w-px h-full bg-gray-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-gray-900">{log.description}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{log.action}</span>
                        <span className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</span>
                      </div>
                      {log.oldValue && log.newValue && <p className="text-xs text-gray-400 mt-1">{log.oldValue} → {log.newValue}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-400 text-sm">No status history yet</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

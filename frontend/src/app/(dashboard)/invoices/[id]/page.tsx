'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle, Trash2, Clock, FileText, Download, Mail, Palette, Settings2, Link, Copy, Eye } from 'lucide-react';
import { IInvoice, InvoiceStatus, IStatusLog, IInvoiceTemplate, ITemplateTextOverrides, SubscriptionPlan } from '@/types';
import { formatCurrency, formatDate, formatDateTime, getStatusColor } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TemplateTextEditor } from '@/components/TemplateTextEditor';

const ALL_TEMPLATES: IInvoiceTemplate[] = [
  { id: 'builtin_classic', name: 'Classic', slug: 'classic', description: 'Split header, bordered table', isBuiltIn: true, layout: { primaryColor: '#1a1a2e', accentColor: '#e94560', fontFamily: 'Helvetica', headerStyle: 'split-left-right', tableStyle: 'bordered-rows', footerText: 'Thank you!', labelInvoiceTitle: 'TAX INVOICE', labelBillTo: 'Bill To:', labelNotes: 'Notes:', labelTerms: 'Terms & Conditions:', labelSubtotal: 'Subtotal:', labelDiscount: 'Discount:', labelTax: 'Tax:', labelTotal: 'Total:', tier: '' } },
  { id: 'builtin_modern', name: 'Modern', slug: 'modern', description: 'Full banner, striped rows', isBuiltIn: true, layout: { primaryColor: '#6366f1', accentColor: '#818cf8', fontFamily: 'Helvetica', headerStyle: 'full-banner', tableStyle: 'striped', footerText: 'Thank you!', labelInvoiceTitle: 'INVOICE', labelBillTo: 'BILL TO', labelNotes: 'Notes', labelTerms: 'Terms & Conditions', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: '' } },
  { id: 'builtin_minimal', name: 'Minimal', slug: 'minimal', description: 'Giant faded number, no borders', isBuiltIn: true, layout: { primaryColor: '#111827', accentColor: '#6b7280', fontFamily: 'Helvetica', headerStyle: 'minimal-faded-number', tableStyle: 'no-borders', footerText: '', labelInvoiceTitle: '', labelBillTo: 'To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: '' } },
  { id: 'builtin_professional', name: 'Professional', slug: 'professional', description: 'Accent bar, two-col, 9-col table', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0f172a', accentColor: '#0ea5e9', fontFamily: 'Helvetica', headerStyle: 'accent-bar-two-col', tableStyle: 'detailed-grid', footerText: 'Payment is due within the specified terms.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'BILL TO', labelNotes: 'Notes', labelTerms: 'Terms & Conditions', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL DUE', tier: 'starter' } },
  { id: 'builtin_elegant', name: 'Elegant', slug: 'elegant', description: 'Centered, decorative line', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#7c3aed', accentColor: '#a78bfa', fontFamily: 'Helvetica', headerStyle: 'centered-decorative', tableStyle: 'double-line-header', footerText: 'We appreciate your continued trust.', labelInvoiceTitle: 'Invoice', labelBillTo: 'Billed To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'starter' } },
  { id: 'builtin_bold', name: 'Bold', slug: 'bold', description: 'Full-bleed dark, gold accents', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#000000', accentColor: '#f59e0b', fontFamily: 'Helvetica', headerStyle: 'full-bleed-dark', tableStyle: 'dark-minimal', footerText: 'We value your business!', labelInvoiceTitle: 'INVOICE', labelBillTo: 'BILL TO', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'starter' } },
  { id: 'builtin_gradient-blue', name: 'Gradient Blue', slug: 'gradient-blue', description: 'Blue gradient header', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#2563eb', accentColor: '#93c5fd', fontFamily: 'Helvetica', headerStyle: 'gradient-banner', tableStyle: 'clean-white', footerText: 'Thank you for choosing us!', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total Due', tier: 'professional' } },
  { id: 'builtin_forest-green', name: 'Forest Green', slug: 'forest-green', description: 'Left accent bar, green rows', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#166534', accentColor: '#22c55e', fontFamily: 'Helvetica', headerStyle: 'left-accent-bar', tableStyle: 'tinted-rows', footerText: 'Growing together with our clients.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'professional' } },
  { id: 'builtin_sunset-orange', name: 'Sunset Orange', slug: 'sunset-orange', description: 'Warm orange, cream body', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#ea580c', accentColor: '#fed7aa', fontFamily: 'Helvetica', headerStyle: 'warm-banner', tableStyle: 'cream-rows', footerText: 'Your success is our priority!', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'professional' } },
  { id: 'builtin_rose-gold', name: 'Rose Gold', slug: 'rose-gold', description: 'Deep rose, luxury spacing', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#9f1239', accentColor: '#fda4af', fontFamily: 'Helvetica', headerStyle: 'luxury-rose', tableStyle: 'refined-rows', footerText: 'Crafted with care for our valued clients.', labelInvoiceTitle: 'Invoice', labelBillTo: 'Billed To', labelNotes: 'Notes', labelTerms: 'Terms & Conditions', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total Amount', tier: 'professional' } },
  { id: 'builtin_tech-cyan', name: 'Tech Cyan', slug: 'tech-cyan', description: 'Dark slate, cyan blocks', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0e7490', accentColor: '#22d3ee', fontFamily: 'Helvetica', headerStyle: 'tech-blocks', tableStyle: 'grid-lines', footerText: 'Innovation delivered, satisfaction guaranteed.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'CLIENT', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Disc', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'professional' } },
  { id: 'builtin_arctic-white', name: 'Arctic White', slug: 'arctic-white', description: 'Frost blue strip, airy', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#1e40af', accentColor: '#dbeafe', fontFamily: 'Helvetica', headerStyle: 'frost-strip', tableStyle: 'airy-minimal', footerText: 'Crystal clear billing, every time.', labelInvoiceTitle: 'Invoice', labelBillTo: 'To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'professional' } },
  { id: 'builtin_midnight-purple', name: 'Midnight Purple', slug: 'midnight-purple', description: 'Deep purple, gold trim', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#3b0764', accentColor: '#d97706', fontFamily: 'Helvetica', headerStyle: 'executive-purple', tableStyle: 'executive-grid', footerText: 'Excellence in every detail.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms & Conditions', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total Due', tier: 'business' } },
  { id: 'builtin_coral-reef', name: 'Coral Reef', slug: 'coral-reef', description: 'Dual-tone teal/pink', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0d9488', accentColor: '#f472b6', fontFamily: 'Helvetica', headerStyle: 'dual-tone-split', tableStyle: 'colorful-rounded', footerText: 'Making business a pleasure!', labelInvoiceTitle: 'Invoice', labelBillTo: 'Hello', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'business' } },
  { id: 'builtin_slate-pro', name: 'Slate Pro', slug: 'slate-pro', description: 'Sharp slate, compact grid', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#334155', accentColor: '#94a3b8', fontFamily: 'Helvetica', headerStyle: 'sharp-slate', tableStyle: 'compact-grid', footerText: 'Precision billing for modern businesses.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'business' } },
  { id: 'builtin_espresso', name: 'Espresso', slug: 'espresso', description: 'Rich brown, cream body', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#78350f', accentColor: '#fbbf24', fontFamily: 'Helvetica', headerStyle: 'warm-espresso', tableStyle: 'cream-table', footerText: 'Brewed to perfection for your business.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'business' } },
  { id: 'builtin_neon-edge', name: 'Neon Edge', slug: 'neon-edge', description: 'Dark header, neon lime', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#18181b', accentColor: '#a3e635', fontFamily: 'Helvetica', headerStyle: 'neon-dark', tableStyle: 'neon-grid', footerText: 'Disrupting invoicing, one invoice at a time.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'CLIENT', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Disc', labelTax: 'Tax', labelTotal: 'TOTAL DUE', tier: 'business' } },
  { id: 'builtin_ocean-breeze', name: 'Ocean Breeze', slug: 'ocean-breeze', description: 'Aqua wave header', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#0369a1', accentColor: '#67e8f9', fontFamily: 'Helvetica', headerStyle: 'aqua-wave', tableStyle: 'flowing-rows', footerText: 'Smooth sailing with every transaction.', labelInvoiceTitle: 'Invoice', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'business' } },
  { id: 'builtin_cherry-blossom', name: 'Cherry Blossom', slug: 'cherry-blossom', description: 'Pink sakura, Japanese aesthetic', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#be185d', accentColor: '#fce7f3', fontFamily: 'Helvetica', headerStyle: 'sakura-header', tableStyle: 'delicate-rows', footerText: 'Beauty in every detail.', labelInvoiceTitle: 'Invoice', labelBillTo: 'Dear Client', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total Amount', tier: 'business' } },
  { id: 'builtin_gunmetal', name: 'Gunmetal', slug: 'gunmetal', description: 'Industrial dark, copper', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#1c1917', accentColor: '#f59e0b', fontFamily: 'Helvetica', headerStyle: 'industrial-gunmetal', tableStyle: 'solid-grid', footerText: 'Built strong. Billed right.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'business' } },
  { id: 'builtin_lavender-dreams', name: 'Lavender Dreams', slug: 'lavender-dreams', description: 'Soft purple gradient', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#6d28d9', accentColor: '#ddd6fe', fontFamily: 'Helvetica', headerStyle: 'soft-lavender', tableStyle: 'gentle-rows', footerText: 'Care in every transaction.', labelInvoiceTitle: 'Invoice', labelBillTo: 'Valued Client', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'Total', tier: 'business' } },
  { id: 'builtin_monochrome', name: 'Monochrome', slug: 'monochrome', description: 'Pure B&W, max contrast', isPremium: true, isBuiltIn: true, layout: { primaryColor: '#000000', accentColor: '#525252', fontFamily: 'Helvetica', headerStyle: 'bw-sharp', tableStyle: 'bw-table', footerText: 'Simplicity is the ultimate sophistication.', labelInvoiceTitle: 'INVOICE', labelBillTo: 'Bill To', labelNotes: 'Notes', labelTerms: 'Terms', labelSubtotal: 'Subtotal', labelDiscount: 'Discount', labelTax: 'Tax', labelTotal: 'TOTAL', tier: 'business' } },
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
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [textOverrides, setTextOverrides] = useState<ITemplateTextOverrides>({});
  const isPremium = userPlan === SubscriptionPlan.Professional || userPlan === SubscriptionPlan.Business;

  const availableTemplates = useMemo(() => {
    if (userPlan === SubscriptionPlan.Business) return ALL_TEMPLATES;
    if (userPlan === SubscriptionPlan.Professional) return ALL_TEMPLATES.filter((t) => !t.isPremium || (t.layout as any).tier !== 'business');
    if (userPlan === SubscriptionPlan.Starter) return ALL_TEMPLATES.filter((t) => !t.isPremium || (t.layout as any).tier === 'starter');
    return ALL_TEMPLATES.filter((t) => !t.isPremium);
  }, [userPlan]);

  const selectedTemplateObj = ALL_TEMPLATES.find((t) => t.slug === selectedTemplate) || null;

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await api.get(`/invoices/${id}`);
        if (data.success && data.data) {
          setInvoice(data.data as IInvoice);
          setSelectedTemplate((data.data as IInvoice).invoiceTemplateId || 'classic');
          setTextOverrides((data.data as any).templateTextOverrides || {});
        }
      } catch { toast.error('Failed to load invoice'); }
      try {
        const { data: bizData } = await api.get('/businesses');
        if (bizData.success && bizData.data && bizData.data.length > 0) setUserPlan(bizData.data[0].plan || 'Free');
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
    let url = `${apiUrl}/v1/businesses/${businessId}/invoices/${id}/pdf?template=${selectedTemplate}`;
    // Append text overrides as query params for premium users
    if (isPremium && Object.keys(textOverrides).length > 0) {
      const params = new URLSearchParams();
      Object.entries(textOverrides).forEach(([k, v]) => { if (v) params.set(k, v); });
      url += `&${params.toString()}`;
    }
    window.open(url, '_blank');
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
          {invoice.status === InvoiceStatus.DRAFT && (<Button onClick={() => handleStatusChange(InvoiceStatus.Sent)} disabled={actionLoading} variant="outline" size="sm"><Send size={14} className="mr-1" /> Mark Sent</Button>)}
          {(invoice.status === InvoiceStatus.Sent || invoice.status === InvoiceStatus.Overdue || invoice.status === InvoiceStatus.PartiallyPaid) && (<Button onClick={handleRecordPayment} disabled={actionLoading} className="bg-green-600 hover:bg-green-700" size="sm"><CheckCircle size={14} className="mr-1" /> Record Payment</Button>)}
          {invoice.client?.email && (<Button onClick={async () => { setActionLoading(true); try { await api.post(`/invoices/${invoice.id}/send-email`); toast.success(`Sent to ${invoice.client?.email}`); } catch { toast.error('Failed'); } finally { setActionLoading(false); } }} disabled={actionLoading} variant="outline" size="sm"><Mail size={14} className="mr-1" /> Email</Button>)}
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
                {availableTemplates.map((t) => (<SelectItem key={t.slug} value={t.slug}>{t.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Button onClick={handleDownloadPDF} variant="outline" size="sm"><Download size={14} className="mr-1" /> Download</Button>
            {isPremium && selectedTemplateObj && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowTextEditor(true)} className="gap-1 text-amber-600">
                <Settings2 size={14} /> Customize Text
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Public Link */}
      {(invoice as any)?.publicAccessToken && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Link size={16} />
                <span className="font-medium">Public Link:</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 truncate flex-1">
                  {typeof window !== 'undefined' ? window.location.origin : ''}/i/{(invoice as any).publicAccessToken}
                </code>
                <button
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/i/${(invoice as any).publicAccessToken}`;
                    navigator.clipboard.writeText(url);
                    toast.success('Link copied!');
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-lg transition shrink-0"
                  title="Copy link"
                >
                  <Copy size={14} className="text-gray-400" />
                </button>
              </div>
              {(invoice as any)?.viewCount > 0 && (
                <span className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                  <Eye size={12} /> {(invoice as any).viewCount} views
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Bill To</h3>
              {invoice.client ? (<>
                <p className="font-semibold text-gray-900">{invoice.client.name}</p>
                {invoice.client.email && <p className="text-sm text-gray-500">{invoice.client.email}</p>}
                {invoice.client.phone && <p className="text-sm text-gray-500">{invoice.client.phone}</p>}
                {invoice.client.gstNumber && <p className="text-sm text-gray-500">GST: {invoice.client.gstNumber}</p>}
              </>) : <p className="text-gray-400">No client assigned</p>}
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

          {invoice.notes && (<div className="mt-6 p-4 bg-gray-50 rounded-lg"><p className="text-sm font-medium text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-700">{invoice.notes}</p></div>)}
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

      {/* Template Text Editor Modal */}
      {showTextEditor && selectedTemplateObj && (
        <TemplateTextEditor
          template={selectedTemplateObj}
          overrides={textOverrides}
          onSave={(overrides) => { setTextOverrides(overrides); setShowTextEditor(false); toast.success('Template text customized for this PDF!'); }}
          onClose={() => setShowTextEditor(false)}
          isPremium={isPremium}
        />
      )}
    </div>
  );
}

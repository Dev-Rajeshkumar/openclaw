'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wand2, ArrowLeft, Sparkles, AlertCircle, CheckCircle, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface ParsedData {
  clientName: string | null;
  items: Array<{ description: string; amount: number; hsnCode: string }>;
  taxRate: number;
  notes: string | null;
  confidence: number;
}

const EXAMPLE_PROMPTS = [
  'Invoice for ABC Pvt Ltd, website redesign ₹50,000 18% GST',
  'Bill John Doe for SEO Package ₹15,000 and Logo Design ₹5,000 12% tax',
  'Create invoice for Acme Corp: Consulting ₹1,00,000, Training ₹25,000. GST 18%',
  'Invoice XYZ Ltd for Mobile App Development ₹2.5 Lakhs 18% GST',
];

export default function AIInvoicePage() {
  const router = useRouter();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedData | null>(null);

  const handleParse = async () => {
    if (!text.trim()) { toast.error('Please enter invoice details'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/ai/parse', { text });
      if (data.success && data.data) {
        setParsed(data.data as ParsedData);
        toast.success('Invoice parsed!');
      } else {
        toast.error('Could not parse the text. Try a different format.');
      }
    } catch {
      toast.error('Failed to parse');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    if (!parsed) return;
    // Store parsed data in sessionStorage for the invoice create page
    sessionStorage.setItem('ai_invoice_data', JSON.stringify(parsed));
    router.push('/dashboard/invoices/new?ai=1');
  };

  const subtotal = parsed?.items.reduce((s, i) => s + i.amount, 0) || 0;
  const taxAmount = parsed ? Math.round((subtotal * parsed.taxRate) / 100 * 100) / 100 : 0;
  const total = subtotal + taxAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/invoices')}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Sparkles size={24} className="text-amber-500" /> AI Invoice Creator
          </h1>
          <p className="text-gray-500">Describe your invoice in plain English</p>
        </div>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 size={18} className="text-amber-500" /> Describe Your Invoice</CardTitle>
          <CardDescription>Write naturally — the AI will extract client, items, amounts, and tax</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="e.g., Invoice for ABC Pvt Ltd, website redesign ₹50,000 18% GST"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className="text-sm resize-none"
          />
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                onClick={() => setText(example)}
                className="text-xs px-3 py-1.5 bg-gray-50 hover:bg-amber-50 text-gray-600 hover:text-amber-700 rounded-full border border-gray-200 hover:border-amber-200 transition truncate max-w-xs"
              >
                {example.length > 50 ? example.slice(0, 50) + '...' : example}
              </button>
            ))}
          </div>
          <Button onClick={handleParse} disabled={loading || !text.trim()}>
            {loading ? <><Loader2 size={16} className="animate-spin mr-2" />Parsing...</> : <><Wand2 size={16} className="mr-2" /> Parse Invoice</>}
          </Button>
        </CardContent>
      </Card>

      {/* Parsed result */}
      {parsed && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Parsed Result</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                parsed.confidence >= 0.7 ? 'bg-green-100 text-green-700' :
                parsed.confidence >= 0.4 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                {Math.round(parsed.confidence * 100)}% confidence
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client */}
            {parsed.clientName && (
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">Client</p>
                <p className="font-semibold text-gray-900">{parsed.clientName}</p>
              </div>
            )}

            {/* Items */}
            {parsed.items.length > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">Line Items</p>
                <div className="space-y-2">
                  {parsed.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{item.description}</p>
                        <p className="text-xs text-gray-400">HSN: {item.hsnCode}</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Totals */}
            <div className="border-t pt-3 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">GST ({parsed.taxRate}%)</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-amber-600">{formatCurrency(total)}</span>
              </div>
            </div>

            {/* Warnings */}
            {parsed.confidence < 0.5 && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700">Low confidence parse. Review the results carefully before creating the invoice.</p>
              </div>
            )}

            <Button onClick={handleCreateInvoice} className="w-full">
              <Send size={16} className="mr-2" /> Create This Invoice
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

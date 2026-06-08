'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Download, Calendar, Building2, User, Phone, Mail, Hash, CreditCard, CheckCircle, Loader2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface PublicInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  items: any[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  status: string;
  notes: string | null;
  terms: string | null;
  viewCount: number;
  lastViewedAt: string | null;
}

interface PublicClient {
  name: string;
  email: string | null;
  phone: string | null;
  gstNumber: string | null;
  address: string | null;
}

interface PublicBusiness {
  name: string;
  gstNumber: string | null;
  phone: string | null;
  address: string | null;
  logo: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PublicInvoicePage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<{ invoice: PublicInvoice; client: PublicClient | null; business: PublicBusiness | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchInvoice = useCallback(() => {
    fetch(`${API_URL}/v1/public/invoices/${token}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
          if (json.data.invoice.status === 'Paid') setPaymentSuccess(true);
        } else {
          setError(json.message || 'Invoice not found');
        }
      })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { fetchInvoice(); }, [fetchInvoice]);

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayNow = async () => {
    if (!data) return;
    setPaying(true);
    try {
      // Create order
      const orderRes = await fetch(`${API_URL}/v1/public/payments/invoice/${token}/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const orderJson = await orderRes.json();
      if (!orderJson.success) throw new Error(orderJson.message || 'Failed to create order');

      const { orderId, amount, currency, key } = orderJson.data;

      // Load Razorpay
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) throw new Error('Failed to load payment gateway');

      // Open checkout
      const options = {
        key,
        amount,
        currency,
        name: data.business?.name || 'Invoice Payment',
        description: `Payment for ${data.invoice.invoiceNumber}`,
        order_id: orderId,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API_URL}/v1/public/payments/invoice/${token}/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (verifyJson.success) {
              setPaymentSuccess(true);
              fetchInvoice(); // Refresh to show paid status
            } else {
              throw new Error(verifyJson.message);
            }
          } catch (err: any) {
            alert('Payment verification failed: ' + err.message);
          }
        },
        prefill: {
          name: data.client?.name || '',
          email: data.client?.email || '',
          contact: data.client?.phone || '',
        },
        theme: {
          color: '#f59e0b',
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Payment failed');
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPDF = () => {
    window.open(`${API_URL}/v1/public/invoices/${token}/pdf`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-500 text-sm">{error || 'This invoice link may have expired or been removed.'}</p>
        </div>
      </div>
    );
  }

  const { invoice, client, business } = data;
  const statusColors: Record<string, string> = {
    Paid: 'bg-green-100 text-green-700',
    Sent: 'bg-blue-100 text-blue-700',
    Draft: 'bg-gray-100 text-gray-700',
    Overdue: 'bg-red-100 text-red-700',
    PartiallyPaid: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-gray-200 text-gray-500',
    Viewed: 'bg-indigo-100 text-indigo-700',
  };
  const isPaid = invoice.status === 'Paid' || paymentSuccess;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-amber-500" />
            <span className="font-semibold text-gray-900 text-sm">{invoice.invoiceNumber}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[invoice.status] || 'bg-gray-100 text-gray-600'}`}>
              {isPaid ? 'Paid' : invoice.status}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isPaid && (
              <button
                onClick={handlePayNow}
                disabled={paying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition disabled:opacity-50"
              >
                {paying ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                {paying ? 'Processing...' : `Pay ${formatCurrency(invoice.total)}`}
              </button>
            )}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition"
            >
              <Download size={14} /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Payment success banner */}
      {paymentSuccess && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="max-w-3xl mx-auto flex items-center gap-2 text-green-700 text-sm">
            <CheckCircle size={18} />
            <span className="font-medium">Payment successful! Thank you for your payment.</span>
          </div>
        </div>
      )}

      {/* Invoice content */}
      <div className="max-w-3xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 sm:p-8 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                {business?.logo && (
                  <img src={business.logo} alt={business.name} className="h-12 mb-3 object-contain" />
                )}
                <h1 className="text-2xl font-bold text-gray-900">{business?.name || 'Invoice'}</h1>
                {business?.gstNumber && (
                  <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    <Hash size={12} /> {business.gstNumber}
                  </p>
                )}
                {business?.address && <p className="text-xs text-gray-500 mt-0.5">{business.address}</p>}
                {business?.phone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                    <Phone size={12} /> {business.phone}
                  </p>
                )}
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Invoice Number</p>
                <p className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(invoice.invoiceDate)}
                  </span>
                  {invoice.dueDate && (
                    <span>Due: {formatDate(invoice.dueDate)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To */}
          {client && (
            <div className="px-6 sm:px-8 py-4 bg-gray-50 border-b border-gray-100">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
              <p className="font-semibold text-gray-900">{client.name}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                {client.email && <span className="flex items-center gap-1"><Mail size={12} /> {client.email}</span>}
                {client.phone && <span className="flex items-center gap-1"><Phone size={12} /> {client.phone}</span>}
                {client.gstNumber && <span className="flex items-center gap-1"><Hash size={12} /> {client.gstNumber}</span>}
              </div>
              {client.address && <p className="text-xs text-gray-500 mt-1">{client.address}</p>}
            </div>
          )}

          {/* Line Items */}
          <div className="px-6 sm:px-8 py-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-2 text-xs text-gray-400 uppercase tracking-wider font-medium">Description</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-medium w-16">Qty</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-medium w-24">Rate</th>
                  <th className="text-right py-2 text-xs text-gray-400 uppercase tracking-wider font-medium w-24">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-3 text-gray-700">
                      <p className="font-medium">{item.description}</p>
                      {item.hsnCode && <p className="text-xs text-gray-400">HSN: {item.hsnCode}</p>}
                    </td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">{formatCurrency(item.rate)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-6">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                </div>
                {invoice.discountAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">-{formatCurrency(invoice.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">{formatCurrency(invoice.taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span className="text-amber-600">{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Terms */}
          {(invoice.notes || invoice.terms) && (
            <div className="px-6 sm:px-8 py-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {invoice.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Terms & Conditions</p>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.terms}</p>
                </div>
              )}
            </div>
          )}

          {/* View tracking */}
          {invoice.viewCount > 0 && (
            <div className="px-6 sm:px-8 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
              <span>Viewed {invoice.viewCount} time{invoice.viewCount !== 1 ? 's' : ''}</span>
              {invoice.lastViewedAt && <span>Last viewed: {formatDate(invoice.lastViewedAt)}</span>}
            </div>
          )}
        </div>

        {/* Powered by */}
        <div className="text-center mt-6 pb-6">
          <p className="text-xs text-gray-400">
            Powered by <span className="font-semibold text-amber-500">BillingBee</span>
          </p>
        </div>
      </div>
    </div>
  );
}

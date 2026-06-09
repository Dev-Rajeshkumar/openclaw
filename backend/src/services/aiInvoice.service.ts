/**
 * AI Invoice Creation Service
 * Parses natural language input and extracts invoice data.
 * Uses pattern matching + heuristics (no external AI API needed).
 * Supports formats like:
 *   "Invoice for ABC Pvt Ltd, website redesign ₹50,000 18% GST"
 *   "Bill John Doe for SEO Package ₹15,000 and Logo Design ₹5,000 12% tax"
 *   "Create invoice for Acme Corp, items: Consulting ₹1,00,000, Training ₹25,000. GST 18%"
 */

export interface ParsedInvoiceData {
  clientName: string | null;
  items: Array<{
    description: string;
    amount: number;
    hsnCode: string;
  }>;
  taxRate: number;
  notes: string | null;
  confidence: number; // 0-1, how confident the parser is
}

// Common HSN codes for services
const HSN_CATEGORIES: Record<string, string> = {
  'website': '9983',
  'web': '9983',
  'software': '9983',
  'development': '9983',
  'app': '9983',
  'mobile': '9983',
  'design': '9983',
  'logo': '9983',
  'branding': '9983',
  'seo': '9983',
  'marketing': '9983',
  'consulting': '9983',
  'consultation': '9983',
  'training': '9983',
  'support': '9983',
  'maintenance': '9983',
  'hosting': '9984',
  'domain': '9984',
};

const DEFAULT_HSN = '9983'; // IT/Software services

function detectHsnCode(description: string): string {
  const lower = description.toLowerCase();
  for (const [keyword, code] of Object.entries(HSN_CATEGORIES)) {
    if (lower.includes(keyword)) return code;
  }
  return DEFAULT_HSN;
}

function parseAmount(amountStr: string): number {
  // Handle formats: ₹50,000 | 50000 | 50k | 1,00,000 | 1.5L | 1.5 Lakhs
  const cleaned = amountStr.replace(/[₹,\s]/g, '').toLowerCase();

  if (cleaned.endsWith('k')) {
    return parseFloat(cleaned) * 1000;
  }
  if (cleaned.includes('lakh') || cleaned.endsWith('l')) {
    return parseFloat(cleaned) * 100000;
  }

  return parseFloat(cleaned) || 0;
}

export function parseInvoiceText(input: string): ParsedInvoiceData {
  const result: ParsedInvoiceData = {
    clientName: null,
    items: [],
    taxRate: 18, // default GST
    notes: null,
    confidence: 0,
  };

  let text = input.trim();

  // ─── Extract client name ───
  // Patterns: "for ABC Pvt Ltd", "for John Doe", "bill ABC Corp", "invoice for XYZ"
  const clientPatterns = [
    /(?:for|to|bill|billed)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]+(?:items?|for|hsn|gst|tax|₹|$))/i,
    /(?:invoice|bill|estimate)\s+(?:for|to)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]|$)/i,
    /client[:\s]+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]|$)/i,
  ];

  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      result.clientName = match[1].trim().replace(/[,.\s]+$/, '');
      break;
    }
  }

  // ─── Extract GST/Tax rate ───
  const taxPatterns = [
    /(\d{1,2})\s*%?\s*(?:GST|gst|tax|TAX)/i,
    /(?:GST|gst|tax|TAX)\s*(?:rate|@|of)?\s*(\d{1,2})\s*%?/i,
    /(\d{1,2})\s*percent\s*(?:GST|gst|tax)/i,
  ];

  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const rate = parseInt(match[1], 10);
      if (rate >= 0 && rate <= 28) {
        result.taxRate = rate;
        break;
      }
    }
  }

  // ─── Extract line items ───
  // Strategy: find description + amount pairs
  // Pattern: "description ₹amount" or "description: ₹amount" or "description - ₹amount"
  // Also: "item1: ₹amt1, item2: ₹amt2"

  // Split by common delimiters for items
  const itemParts = text.split(/[,;]|\band\b/i).map(p => p.trim()).filter(Boolean);

  for (const part of itemParts) {
    if (!part) continue;

    // Try to match: description followed by amount
    // Patterns: "Website Redesign ₹50,000" | "SEO Package: ₹15,000" | "Logo - ₹5,000"
    const itemMatch = part.match(
      /^(.+?)\s*[:@-]?\s*[₹]?\s*([\d,.]+(?:[kKlL](?:akh)?)?)\s*$/
    );

    if (itemMatch && itemMatch[1] && itemMatch[2]) {
      const desc = itemMatch[1].trim();
      const amount = parseAmount(itemMatch[2]);

      if (amount > 0) {
        result.items.push({
          description: desc,
          amount,
          hsnCode: detectHsnCode(desc),
        });
        continue;
      }
    }

    // Try: "₹amount for description" or "₹amount description"
    const reverseMatch = part.match(
      /[₹]?\s*([\d,.]+(?:[kKlL](?:akh)?)?)\s+(?:for\s+)?(.+)/i
    );

    if (reverseMatch && reverseMatch[2]) {
      const amount = parseAmount(reverseMatch[1]);
      const desc = reverseMatch[2].trim();

      if (amount > 0 && desc.length > 2) {
        result.items.push({
          description: desc,
          amount,
          hsnCode: detectHsnCode(desc),
        });
      }
    }
  }

  // ─── Fallback: if no items found but amounts exist ───
  if (result.items.length === 0) {
    // Extract all amounts from text
    const amountRegex = /[₹]\s*([\d,.]+(?:[kKlL](?:akh)?)?)|([\d,.]+)\s*(?:rupees|INR|₹)/gi;
    let match;
    const amounts: number[] = [];

    while ((match = amountRegex.exec(text)) !== null) {
      const amt = parseAmount(match[1] || match[2]);
      if (amt > 0) amounts.push(amt);
    }

    if (amounts.length === 1) {
      // Single amount — treat as one item
      result.items.push({
        description: 'Professional Services',
        amount: amounts[0],
        hsnCode: DEFAULT_HSN,
      });
    } else if (amounts.length > 1) {
      // Multiple amounts — create generic items
      amounts.forEach((amt, i) => {
        result.items.push({
          description: `Service Item ${i + 1}`,
          amount: amt,
          hsnCode: DEFAULT_HSN,
        });
      });
    }
  }

  // ─── Calculate confidence ───
  let confidenceScore = 0;
  if (result.clientName) confidenceScore += 0.3;
  if (result.items.length > 0) confidenceScore += 0.4;
  if (result.items.every(i => i.description.length > 3)) confidenceScore += 0.15;
  if (result.taxRate > 0) confidenceScore += 0.15;
  result.confidence = Math.min(1, confidenceScore);

  return result;
}

/**
 * AI Business Insights generator
 * Analyzes invoice/payment data and generates actionable insights
 */
export interface BusinessInsight {
  type: 'revenue' | 'payment' | 'client' | 'warning' | 'opportunity';
  title: string;
  description: string;
  metric?: string;
  priority: 'high' | 'medium' | 'low';
}

export function generateBusinessInsights(data: {
  invoices: any[];
  payments: any[];
  clients: any[];
  currentMonth: number;
  previousMonth: number;
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  overdueInvoices: any[];
  topClients: { name: string; total: number }[];
  avgPaymentDays: number;
}): BusinessInsight[] {
  const insights: BusinessInsight[] = [];

  // Revenue trend
  if (data.previousMonthRevenue > 0) {
    const change = ((data.currentMonthRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100;
    if (change < -10) {
      insights.push({
        type: 'warning',
        title: 'Revenue Declining',
        description: `Revenue is down ${Math.abs(change).toFixed(0)}% compared to last month. Consider following up on outstanding invoices or reaching out to dormant clients.`,
        metric: `${formatCurrencyIndian(data.currentMonthRevenue)} vs ${formatCurrencyIndian(data.previousMonthRevenue)}`,
        priority: 'high',
      });
    } else if (change > 20) {
      insights.push({
        type: 'revenue',
        title: 'Revenue Growing! 🎉',
        description: `Revenue increased ${change.toFixed(0)}% from last month. Great momentum — keep it up!`,
        metric: `${formatCurrencyIndian(data.currentMonthRevenue)} (+${change.toFixed(0)}%)`,
        priority: 'medium',
      });
    }
  }

  // Overdue invoices
  if (data.overdueInvoices.length > 0) {
    const overdueTotal = data.overdueInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
    insights.push({
      type: 'warning',
      title: 'Overdue Invoices Need Attention',
      description: `You have ${data.overdueInvoices.length} overdue invoice(s) totaling ${formatCurrencyIndian(overdueTotal)}. Send reminders or follow up directly.`,
      metric: formatCurrencyIndian(overdueTotal),
      priority: 'high',
    });
  }

  // Average payment time
  if (data.avgPaymentDays > 30) {
    insights.push({
      type: 'payment',
      title: 'Slow Payment Collection',
      description: `Average payment takes ${Math.round(data.avgPaymentDays)} days. Consider offering early payment discounts or tightening payment terms.`,
      metric: `${Math.round(data.avgPaymentDays)} days avg`,
      priority: 'medium',
    });
  } else if (data.avgPaymentDays > 0 && data.avgPaymentDays <= 15) {
    insights.push({
      type: 'payment',
      title: 'Fast Payment Collection ⚡',
      description: `Your average collection time is just ${Math.round(data.avgPaymentDays)} days. Excellent cash flow management!`,
      metric: `${Math.round(data.avgPaymentDays)} days avg`,
      priority: 'low',
    });
  }

  // Client concentration
  if (data.topClients.length > 0 && data.invoices.length > 0) {
    const topClientTotal = data.topClients[0]?.total || 0;
    const totalRevenue = data.currentMonthRevenue || 1;
    const concentration = (topClientTotal / totalRevenue) * 100;

    if (concentration > 40) {
      insights.push({
        type: 'warning',
        title: 'High Client Concentration Risk',
        description: `Your top client "${data.topClients[0].name}" contributes ${concentration.toFixed(0)%} of revenue. Diversify your client base to reduce risk.`,
        metric: `${concentration.toFixed(0)}% from top client`,
        priority: 'high',
      });
    }
  }

  // Client growth
  const uniqueClients = new Set(data.invoices.map((inv: any) => inv.clientId).filter(Boolean)).size;
  if (uniqueClients > 3) {
    insights.push({
      type: 'client',
      title: `Active Client Base`,
      description: `You have ${uniqueClients} active clients. ${data.topClients.length > 0 ? `Top client: ${data.topClients[0].name}.` : ''}`,
      metric: `${uniqueClients} clients`,
      priority: 'low',
    });
  }

  // Monthly invoice count
  if (data.currentMonth < 5) {
    insights.push({
      type: 'opportunity',
      title: 'Boost Monthly Invoicing',
      description: `You've only created ${data.currentMonth} invoices this month. Reach out to existing clients for repeat business.`,
      metric: `${data.currentMonth} invoices this month`,
      priority: 'medium',
    });
  }

  return insights;
}

function formatCurrencyIndian(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

/**
 * AI Follow-Up Generator
 * Generates personalized follow-up messages based on invoice context
 */
export interface FollowUpMessage {
  type: 'email' | 'whatsapp';
  subject?: string;
  message: string;
  tone: 'friendly' | 'firm' | 'urgent';
}

export function generateFollowUp(invoice: any, daysOverdue: number): FollowUpMessage[] {
  const clientName = invoice.client?.name || 'there';
  const invoiceNumber = invoice.invoiceNumber;
  const amount = formatCurrencyIndian(invoice.total || 0);
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'the due date';

  const messages: FollowUpMessage[] = [];

  if (daysOverdue <= 0) {
    // Pre-due or on due date
    messages.push({
      type: 'email',
      subject: `Payment Reminder: Invoice ${invoiceNumber}`,
      tone: 'friendly',
      message: `Hi ${clientName},\n\nJust a friendly reminder that invoice ${invoiceNumber} for ${amount} is due on ${dueDate}.\n\nPlease let us know if you have any questions.\n\nThank you for your business!`,
    });
    messages.push({
      type: 'whatsapp',
      tone: 'friendly',
      message: `Hi ${clientName}, just a quick reminder that invoice ${invoiceNumber} for ${amount} is due on ${dueDate}. Let me know if you need anything! 😊`,
    });
  } else if (daysOverdue <= 7) {
    // Slightly overdue
    messages.push({
      type: 'email',
      subject: `Gentle Reminder: Invoice ${invoiceNumber} - ${daysOverdue} days overdue`,
      tone: 'friendly',
      message: `Hi ${clientName},\n\nI hope this message finds you well. Invoice ${invoiceNumber} for ${amount} was due on ${dueDate} and is now ${daysOverdue} days overdue.\n\nIf payment has already been sent, please disregard this notice. Otherwise, we'd appreciate it if you could process it at your earliest convenience.\n\nThank you!`,
    });
    messages.push({
      type: 'whatsapp',
      tone: 'friendly',
      message: `Hi ${clientName}, just following up on invoice ${invoiceNumber} (${amount}) which was due on ${dueDate}. Could you please check on this? Thanks!`,
    });
  } else if (daysOverdue <= 30) {
    // Moderately overdue
    messages.push({
      type: 'email',
      subject: `OVERDUE: Invoice ${invoiceNumber} - Action Required`,
      tone: 'firm',
      message: `Dear ${clientName},\n\nInvoice ${invoiceNumber} for ${amount} is now ${daysOverdue} days overdue (due date: ${dueDate}).\n\nWe understand circumstances can sometimes cause delays. If there's an issue, please let us know so we can work together on a solution.\n\nOtherwise, please arrange payment as soon as possible.\n\nRegards`,
    });
    messages.push({
      type: 'whatsapp',
      tone: 'firm',
      message: `Hi ${clientName}, invoice ${invoiceNumber} for ${amount} is ${daysOverdue} days overdue. Could you please prioritize this payment? Let me know if there's any issue. Thank you.`,
    });
  } else {
    // Severely overdue
    messages.push({
      type: 'email',
      subject: `URGENT: ${daysOverdue} Days Overdue - Invoice ${invoiceNumber}`,
      tone: 'urgent',
      message: `Dear ${clientName},\n\nThis is a formal notice that invoice ${invoiceNumber} for ${amount} is now ${daysOverdue} days overdue.\n\nDespite previous reminders, we have not received payment or any communication regarding this invoice.\n\nPlease arrange immediate payment to avoid further action. If there are any issues preventing payment, contact us immediately.\n\nRegards`,
    });
    messages.push({
      type: 'whatsapp',
      tone: 'urgent',
      message: `${clientName}, invoice ${invoiceNumber} (${amount}) is now ${daysOverdue} days overdue. Kindly settle this at the earliest. Please reach out if you need to discuss.`,
    });
  }

  return messages;
}

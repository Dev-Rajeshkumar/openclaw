/**
 * AI Invoice Creation Service
 * Parses natural language input and extracts invoice data.
 * Uses OpenAI GPT-4o-mini for intelligent parsing with heuristic fallback.
 * Supports formats like:
 *   "Invoice for ABC Pvt Ltd, website redesign ₹50,000 18% GST"
 *   "Bill John Doe for SEO Package ₹15,000 and Logo Design ₹5,000 12% tax"
 *   "Create invoice for Acme Corp, items: Consulting ₹1,00,000, Training ₹25,000. GST 18%"
 */

import OpenAI from 'openai';
import { config } from '../config/index.js';

export interface ParsedInvoiceData {
  clientName: string | null;
  items: Array<{
    description: string;
    amount: number;
    hsnCode: string;
  }>;
  taxRate: number;
  notes: string | null;
  confidence: number;
}

// Initialize OpenAI client (works with any OpenAI-compatible API via baseURL)
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI | null {
  if (openaiClient) return openaiClient;
  if (!config.openai.apiKey) return null;
  try {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
      baseURL: config.openai.baseURL || undefined,
    });
    return openaiClient;
  } catch {
    return null;
  }
}

// Common HSN codes for services (used as hints for AI and fallback)
const HSN_CATEGORIES: Record<string, string> = {
  'website': '9983', 'web': '9983', 'software': '9983', 'development': '9983',
  'app': '9983', 'mobile': '9983', 'design': '9983', 'logo': '9983',
  'branding': '9983', 'seo': '9983', 'marketing': '9983', 'consulting': '9983',
  'consultation': '9983', 'training': '9983', 'support': '9983',
  'maintenance': '9983', 'hosting': '9984', 'domain': '9984',
};

const DEFAULT_HSN = '9983';

function detectHsnCode(description: string): string {
  const lower = description.toLowerCase();
  for (const [keyword, code] of Object.entries(HSN_CATEGORIES)) {
    if (lower.includes(keyword)) return code;
  }
  return DEFAULT_HSN;
}

function parseAmount(amountStr: string): number {
  const cleaned = amountStr.replace(/[₹,\s]/g, '').toLowerCase();
  if (cleaned.endsWith('k')) return parseFloat(cleaned) * 1000;
  if (cleaned.includes('lakh') || cleaned.endsWith('l')) return parseFloat(cleaned) * 100000;
  return parseFloat(cleaned) || 0;
}

const AI_PROMPT = `You are an invoice data extraction AI. Parse the user's natural language input and extract structured invoice data.

Return ONLY valid JSON (no markdown, no code fences, no explanation) in this exact shape:
{
  "clientName": "string or null",
  "items": [
    {
      "description": "string",
      "amount": number,
      "hsnCode": "4-6 digit string"
    }
  ],
  "taxRate": number,
  "notes": "string or null",
  "confidence": number
}

Rules:
- clientName: Extract the client/company name. Look for patterns like "for ABC", "bill XYZ", "invoice for Company Name".
- items: Extract each line item with description and amount. Amounts may use ₹, k (thousands), lakhs, commas.
- hsnCode: Infer from description. Use 9983 for IT/software/design/consulting, 9984 for hosting/domain, 9995 for other services.
- taxRate: Extract GST/tax percentage. Default to 18 if not specified. Valid range: 0-28.
- confidence: 0-1 score based on how complete the data is (client + items + amounts = high confidence).
- If no clear items found but amounts exist, create items with descriptive names from context.

HSN Code Reference:
- 9983: IT services, software development, web design, consulting, SEO, marketing, training
- 9984: Hosting, domain, cloud services
- 9995: Other professional services
- 4901: Printed books, brochures
- 4911: Other printed matter

User input: `;

async function parseWithAI(input: string): Promise<ParsedInvoiceData | null> {
  const client = getOpenAIClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: config.openai.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: AI_PROMPT },
        { role: 'user', content: input },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) return null;

    let jsonStr = content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) jsonStr = jsonMatch[0];

    const parsed = JSON.parse(jsonStr);

    return {
      clientName: parsed.clientName || null,
      items: (parsed.items || [])
        .filter((item: any) => item.description && item.amount > 0)
        .map((item: any) => ({
          description: String(item.description),
          amount: Number(item.amount),
          hsnCode: item.hsnCode || detectHsnCode(item.description),
        })),
      taxRate: typeof parsed.taxRate === 'number' && parsed.taxRate >= 0 && parsed.taxRate <= 28
        ? parsed.taxRate : 18,
      notes: parsed.notes || null,
      confidence: typeof parsed.confidence === 'number'
        ? Math.min(1, Math.max(0, parsed.confidence)) : 0.5,
    };
  } catch (error) {
    console.error('[AI] OpenAI parsing failed, falling back to heuristics:', error);
    return null;
  }
}

function parseWithHeuristics(input: string): ParsedInvoiceData {
  const result: ParsedInvoiceData = {
    clientName: null, items: [], taxRate: 18, notes: null, confidence: 0,
  };

  const text = input.trim();

  // Extract client name
  const clientPatterns = [
    /(?:for|to|bill|billed)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]+(?:items?|for|hsn|gst|tax|₹|$))/i,
    /(?:invoice|bill|estimate)\s+(?:for|to)\s+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]|$)/i,
    /client[:\s]+([A-Z][A-Za-z0-9\s&.,]+?)(?:[,.\s]|$)/i,
  ];
  for (const pattern of clientPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) { result.clientName = match[1].trim().replace(/[,.\s]+$/, ''); break; }
  }

  // Extract tax rate
  const taxPatterns = [
    /(\d{1,2})\s*%?\s*(?:GST|gst|tax|TAX)/i,
    /(?:GST|gst|tax|TAX)\s*(?:rate|@|of)?\s*(\d{1,2})\s*%?/i,
    /(\d{1,2})\s*percent\s*(?:GST|gst|tax)/i,
  ];
  for (const pattern of taxPatterns) {
    const match = text.match(pattern);
    if (match?.[1]) { const r = parseInt(match[1], 10); if (r >= 0 && r <= 28) { result.taxRate = r; break; } }
  }

  // Extract line items
  const itemParts = text.split(/[,;]|\band\b/i).map(p => p.trim()).filter(Boolean);
  for (const part of itemParts) {
    if (!part) continue;
    const itemMatch = part.match(/^(.+?)\s*[:@-]?\s*[₹]?\s*([\d,.]+(?:[kKlL](?:akh)?)?)\s*$/);
    if (itemMatch?.[1] && itemMatch?.[2]) {
      const desc = itemMatch[1].trim();
      const amount = parseAmount(itemMatch[2]);
      if (amount > 0) { result.items.push({ description: desc, amount, hsnCode: detectHsnCode(desc) }); continue; }
    }
    const reverseMatch = part.match(/[₹]?\s*([\d,.]+(?:[kKlL](?:akh)?)?)\s+(?:for\s+)?(.+)/i);
    if (reverseMatch?.[2]) {
      const amount = parseAmount(reverseMatch[1]);
      const desc = reverseMatch[2].trim();
      if (amount > 0 && desc.length > 2) { result.items.push({ description: desc, amount, hsnCode: detectHsnCode(desc) }); }
    }
  }

  // Fallback amounts
  if (result.items.length === 0) {
    const amountRegex = /[₹]\s*([\d,.]+(?:[kKlL](?:akh)?)?)|([\d,.]+)\s*(?:rupees|INR|₹)/gi;
    const amounts: number[] = [];
    let m;
    while ((m = amountRegex.exec(text)) !== null) { const a = parseAmount(m[1] || m[2]); if (a > 0) amounts.push(a); }
    if (amounts.length === 1) {
      result.items.push({ description: 'Professional Services', amount: amounts[0], hsnCode: DEFAULT_HSN });
    } else if (amounts.length > 1) {
      amounts.forEach((amt, i) => result.items.push({ description: `Service Item ${i + 1}`, amount: amt, hsnCode: DEFAULT_HSN }));
    }
  }

  let cs = 0;
  if (result.clientName) cs += 0.3;
  if (result.items.length > 0) cs += 0.4;
  if (result.items.every(i => i.description.length > 3)) cs += 0.15;
  if (result.taxRate > 0) cs += 0.15;
  result.confidence = Math.min(1, cs);
  return result;
}

/** Parse invoice text using OpenAI with heuristic fallback. */
export async function parseInvoiceText(input: string): Promise<ParsedInvoiceData> {
  const aiResult = await parseWithAI(input);
  if (aiResult && aiResult.confidence > 0.3) return aiResult;
  return parseWithHeuristics(input);
}

/**
 * AI Business Insights generator
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

  if (data.previousMonthRevenue > 0) {
    const change = ((data.currentMonthRevenue - data.previousMonthRevenue) / data.previousMonthRevenue) * 100;
    if (change < -10) {
      insights.push({
        type: 'warning', title: 'Revenue Declining',
        description: `Revenue is down ${Math.abs(change).toFixed(0)}% vs last month. Follow up on outstanding invoices or reach out to dormant clients.`,
        metric: `₹${data.currentMonthRevenue.toLocaleString('en-IN')} vs ₹${data.previousMonthRevenue.toLocaleString('en-IN')}`,
        priority: 'high',
      });
    } else if (change > 20) {
      insights.push({
        type: 'revenue', title: 'Revenue Growing! 🎉',
        description: `Revenue increased ${change.toFixed(0)}% from last month. Great momentum!`,
        metric: `₹${data.currentMonthRevenue.toLocaleString('en-IN')} (+${change.toFixed(0)}%)`,
        priority: 'medium',
      });
    }
  }

  if (data.overdueInvoices.length > 0) {
    const overdueTotal = data.overdueInvoices.reduce((s: number, inv: any) => s + (inv.total || 0), 0);
    insights.push({
      type: 'warning', title: 'Overdue Invoices Need Attention',
      description: `You have ${data.overdueInvoices.length} overdue invoice(s) totaling ₹${overdueTotal.toLocaleString('en-IN')}. Send reminders or follow up directly.`,
      metric: `₹${overdueTotal.toLocaleString('en-IN')}`, priority: 'high',
    });
  }

  if (data.avgPaymentDays > 30) {
    insights.push({
      type: 'payment', title: 'Slow Payment Collection',
      description: `Average payment takes ${Math.round(data.avgPaymentDays)} days. Consider early payment discounts or tighter payment terms.`,
      metric: `${Math.round(data.avgPaymentDays)} days avg`, priority: 'medium',
    });
  } else if (data.avgPaymentDays > 0 && data.avgPaymentDays <= 15) {
    insights.push({
      type: 'payment', title: 'Fast Payment Collection ⚡',
      description: `Your average collection time is just ${Math.round(data.avgPaymentDays)} days. Excellent cash flow!`,
      metric: `${Math.round(data.avgPaymentDays)} days avg`, priority: 'low',
    });
  }

  if (data.topClients.length > 0 && data.invoices.length > 0) {
    const topTotal = data.topClients[0]?.total || 0;
    const concentration = (topTotal / (data.currentMonthRevenue || 1)) * 100;
    if (concentration > 40) {
      insights.push({
        type: 'warning', title: 'High Client Concentration Risk',
        description: `Your top client "${data.topClients[0].name}" contributes ${concentration.toFixed(0)}% of revenue. Diversify your client base.`,
        metric: `${concentration.toFixed(0)}% from top client`, priority: 'high',
      });
    }
  }

  const uniqueClients = new Set(data.invoices.map((inv: any) => inv.clientId).filter(Boolean)).size;
  if (uniqueClients > 3) {
    insights.push({
      type: 'client', title: 'Active Client Base',
      description: `You have ${uniqueClients} active clients. ${data.topClients.length > 0 ? `Top client: ${data.topClients[0].name}.` : ''}`,
      metric: `${uniqueClients} clients`, priority: 'low',
    });
  }

  if (data.currentMonth < 5) {
    insights.push({
      type: 'opportunity', title: 'Boost Monthly Invoicing',
      description: `Only ${data.currentMonth} invoices this month. Reach out to existing clients for repeat business.`,
      metric: `${data.currentMonth} invoices this month`, priority: 'medium',
    });
  }

  return insights;
}

/**
 * AI Follow-Up Generator
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
  const amount = '₹' + (invoice.total || 0).toLocaleString('en-IN');
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-IN') : 'the due date';
  const messages: FollowUpMessage[] = [];

  if (daysOverdue <= 0) {
    messages.push({
      type: 'email', subject: `Payment Reminder: Invoice ${invoiceNumber}`, tone: 'friendly',
      message: `Hi ${clientName},\n\nJust a friendly reminder that invoice ${invoiceNumber} for ${amount} is due on ${dueDate}.\n\nPlease let us know if you have any questions.\n\nThank you for your business!`,
    });
    messages.push({
      type: 'whatsapp', tone: 'friendly',
      message: `Hi ${clientName}, just a quick reminder that invoice ${invoiceNumber} for ${amount} is due on ${dueDate}. Let me know if you need anything! 😊`,
    });
  } else if (daysOverdue <= 7) {
    messages.push({
      type: 'email', subject: `Gentle Reminder: Invoice ${invoiceNumber} - ${daysOverdue} days overdue`, tone: 'friendly',
      message: `Hi ${clientName},\n\nI hope this message finds you well. Invoice ${invoiceNumber} for ${amount} was due on ${dueDate} and is now ${daysOverdue} days overdue.\n\nIf payment has already been sent, please disregard this notice. Otherwise, we'd appreciate it if you could process it at your earliest convenience.\n\nThank you!`,
    });
    messages.push({
      type: 'whatsapp', tone: 'friendly',
      message: `Hi ${clientName}, just following up on invoice ${invoiceNumber} (${amount}) which was due on ${dueDate}. Could you please check on this? Thanks!`,
    });
  } else if (daysOverdue <= 30) {
    messages.push({
      type: 'email', subject: `OVERDUE: Invoice ${invoiceNumber} - Action Required`, tone: 'firm',
      message: `Dear ${clientName},\n\nInvoice ${invoiceNumber} for ${amount} is now ${daysOverdue} days overdue (due date: ${dueDate}).\n\nWe understand circumstances can sometimes cause delays. If there's an issue, please let us know so we can work together on a solution.\n\nOtherwise, please arrange payment as soon as possible.\n\nRegards`,
    });
    messages.push({
      type: 'whatsapp', tone: 'firm',
      message: `Hi ${clientName}, invoice ${invoiceNumber} for ${amount} is ${daysOverdue} days overdue. Could you please prioritize this payment? Let me know if there's any issue. Thank you.`,
    });
  } else {
    messages.push({
      type: 'email', subject: `URGENT: ${daysOverdue} Days Overdue - Invoice ${invoiceNumber}`, tone: 'urgent',
      message: `Dear ${clientName},\n\nThis is a formal notice that invoice ${invoiceNumber} for ${amount} is now ${daysOverdue} days overdue.\n\nDespite previous reminders, we have not received payment or any communication regarding this invoice.\n\nPlease arrange immediate payment to avoid further action. If there are any issues preventing payment, contact us immediately.\n\nRegards`,
    });
    messages.push({
      type: 'whatsapp', tone: 'urgent',
      message: `${clientName}, invoice ${invoiceNumber} (${amount}) is now ${daysOverdue} days overdue. Kindly settle this at the earliest. Please reach out if you need to discuss.`,
    });
  }

  return messages;
}

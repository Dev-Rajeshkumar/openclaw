import PDFDocument from 'pdfkit';
import { Invoice, Client, Business, InvoiceItem } from '../types/index.js';

export interface PDFInvoiceData {
  invoice: Partial<Invoice & {
    invoiceNumber: string;
    invoiceDate: Date;
    dueDate: Date;
    items: InvoiceItem[];
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
    notes?: string;
    terms?: string;
  }>;
  client: Partial<Client>;
  business: Partial<Business>;
  template?: {
    name: string;
    slug: string;
    layout: Record<string, string>;
  };
}

// ─── Helpers ────────────────────────────────────────────────
export function hexToRgb(hex: string) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : { r: 0, g: 0, b: 0 };
}

export function setFillColor(doc: PDFKit.PDFDocument, hex: string) {
  const { r, g, b } = hexToRgb(hex);
  doc.fillColor(r, g, b);
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const m = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatCurrency(amount: number): string {
  return `INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Get customizable label from layout with fallback
export function L(layout: Record<string, string>, key: string, fallback: string): string {
  return layout[key] || fallback;
}

// Draw a rounded-ish status badge
export function drawStatusBadge(doc: PDFKit.PDFDocument, text: string, x: number, y: number, w: number, h: number, bgColor: string) {
  const { r, g, b } = hexToRgb(bgColor);
  doc.rect(x, y, w, h).fill(r, g, b);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold');
  doc.text(text, x, y + (h - 7) / 2, { width: w, align: 'center' });
}

// Draw dot-leader line between label and value
export function drawDottedLine(doc: PDFKit.PDFDocument, x1: number, x2: number, y: number) {
  doc.moveTo(x1, y).lineTo(x2, y).dash(1, { space: 2 }).stroke('#cccccc').undash();
}

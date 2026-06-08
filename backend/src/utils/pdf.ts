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
    layout: {
      primaryColor: string;
      accentColor: string;
      fontFamily: string;
      headerStyle: string;
      tableStyle: string;
      footerText: string;
    };
  };
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 0, g: 0, b: 0 };
}

function setFillColor(doc: PDFKit.PDFDocument, hex: string) {
  const { r, g, b } = hexToRgb(hex);
  doc.fillColor(r, g, b);
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCurrency(amount: number): string {
  return `INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Generate PDF invoice with template support
 */
export function generateInvoicePDF(data: PDFInvoiceData): PDFKit.PDFDocument {
  const { invoice, client, business, template } = data;
  const layout = template?.layout || {
    primaryColor: '#1a1a2e',
    accentColor: '#e94560',
    fontFamily: 'Helvetica',
    headerStyle: 'left-aligned',
    tableStyle: 'bordered',
    footerText: 'Thank you for your business!',
  };

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  switch (template?.slug) {
    case 'modern':
      renderModernTemplate(doc, data, layout);
      break;
    case 'minimal':
      renderMinimalTemplate(doc, data, layout);
      break;
    case 'professional':
      renderProfessionalTemplate(doc, data, layout);
      break;
    case 'elegant':
      renderElegantTemplate(doc, data, layout);
      break;
    default:
      renderClassicTemplate(doc, data, layout);
      break;
  }

  return doc;
}

// ─── Classic Template ────────────────────────────────────────
function renderClassicTemplate(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any
) {
  const { invoice, client, business } = data;
  doc.font('Helvetica');

  // Business header
  setFillColor(doc, layout.primaryColor);
  doc.fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 40);
  doc.font('Helvetica');
  let y = 68;
  if (business.address) { doc.fontSize(9).text(business.address, 40, y); y += 14; }
  if (business.gstNumber) { doc.fontSize(9).text(`GST: ${business.gstNumber}`, 40, y); y += 14; }
  if (business.phone) { doc.fontSize(9).text(`Phone: ${business.phone}`, 40, y); }

  // Invoice title right
  setFillColor(doc, layout.accentColor);
  doc.fontSize(26).font('Helvetica-Bold').text('TAX INVOICE', 380, 40, { align: 'right' });
  setFillColor(doc, '#333333');
  doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 380, 72, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 380, 86, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 100, { align: 'right' });
  doc.font('Helvetica-Bold').text(`Status: ${invoice.status || 'Draft'}`, 380, 114, { align: 'right' });

  // Divider
  doc.moveTo(40, 145).lineTo(555, 145).lineWidth(1).stroke('#e5e7eb');

  // Bill To
  const clientY = 160;
  setFillColor(doc, layout.primaryColor);
  doc.fontSize(11).font('Helvetica-Bold').text('Bill To:', 40, clientY);
  setFillColor(doc, '#333333');
  doc.fontSize(10).font('Helvetica');
  let cy = clientY + 18;
  if (client.name) { doc.text(client.name, 40, cy); cy += 14; }
  if (client.company) { doc.text(client.company, 40, cy); cy += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 250 }); cy += 28; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); cy += 14; }
  if (client.email) { doc.text(client.email, 40, cy); }

  // Table
  renderClassicTable(doc, data, layout, cy + 20);

  // Footer
  if (layout.footerText) {
    doc.fontSize(9).font('Helvetica').fillColor('#666666').text(layout.footerText, 40, 760, { align: 'center', width: 515 });
  }
}

function renderClassicTable(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any,
  startY: number
) {
  const { invoice } = data;
  const tableTop = startY;
  const colWidths = [25, 165, 45, 40, 65, 45, 45, 80];
  const headers = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  // Header bg
  doc.rect(40, tableTop - 4, 515, 20).fill(layout.primaryColor);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  headers.forEach((h, i) => {
    doc.text(h, cx, tableTop + 2, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
    cx += colWidths[i];
  });

  // Rows
  let rowY = tableTop + 22;
  doc.font('Helvetica').fillColor('#333333');
  const items = (invoice.items || []) as unknown as InvoiceItem[];

  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) {
      doc.rect(40, rowY - 2, 515, 18).fill('#f9fafb');
    }
    const values = [
      String(idx + 1),
      item.description || '',
      item.hsnCode || '-',
      String(item.quantity || 0),
      formatCurrency(item.rate || 0),
      `${item.discount || 0}%`,
      `${item.taxRate || 0}%`,
      formatCurrency(item.amount || 0),
    ];
    let vx = 42;
    values.forEach((val, i) => {
      doc.text(val, vx, rowY, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
      vx += colWidths[i];
    });
    rowY += 18;
  });

  // Totals
  const totalsX = 380;
  const totalsY = rowY + 15;
  doc.fontSize(9).fillColor('#333333');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 100, totalsY, { align: 'right', width: 120 });

  if ((invoice.discountAmount || 0) > 0) {
    doc.text('Discount:', totalsX, totalsY + 16);
    doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, totalsX + 100, totalsY + 16, { align: 'right', width: 120 });
  }

  doc.text('Tax:', totalsX, totalsY + 32);
  doc.text(formatCurrency(invoice.taxAmount || 0), totalsX + 100, totalsY + 32, { align: 'right', width: 120 });

  doc.moveTo(totalsX, totalsY + 50).lineTo(555, totalsY + 50).stroke('#e5e7eb');
  doc.fontSize(12).font('Helvetica-Bold');
  setFillColor(doc, layout.accentColor);
  doc.text('Total:', totalsX, totalsY + 58);
  doc.text(formatCurrency(invoice.total || 0), totalsX + 100, totalsY + 58, { align: 'right', width: 120 });

  // Notes & Terms
  let noteY = totalsY + 90;
  doc.fillColor('#333333');
  if (invoice.notes) {
    doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 40, noteY);
    doc.font('Helvetica').fontSize(8).text(invoice.notes, 40, noteY + 14, { width: 515 });
    noteY += 40;
  }
  if (invoice.terms) {
    doc.fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:', 40, noteY);
    doc.font('Helvetica').fontSize(8).text(invoice.terms, 40, noteY + 14, { width: 515 });
  }
}

// ─── Modern Template ─────────────────────────────────────────
function renderModernTemplate(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any
) {
  const { invoice, client, business } = data;

  // Full-width colored header bar
  doc.rect(0, 0, 595, 120).fill(layout.primaryColor);

  // Business name on header
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 25);
  doc.fontSize(9).font('Helvetica').fillColor('#c7d2fe');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 70);

  // Invoice details on header right
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 25, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#c7d2fe');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 52, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 380, 66, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 80, { align: 'right' });

  // Status badge
  const statusColors: Record<string, string> = {
    Paid: '#10b981', Sent: '#3b82f6', Draft: '#6b7280',
    Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b',
  };
  const badgeColor = statusColors[invoice.status || 'Draft'] || '#6b7280';
  doc.rect(380, 92, 60, 16).fill(badgeColor);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 380, 96, { align: 'right', width: 60 });

  // Bill To section
  let y = 140;
  doc.fillColor('#9ca3af').fontSize(8).font('Helvetica').text('BILL TO', 40, y);
  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 12);
  doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 14; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }

  // Table
  renderModernTable(doc, data, layout, y + 15);

  // Footer
  if (layout.footerText) {
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
  }
}

function renderModernTable(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any,
  startY: number
) {
  const { invoice } = data;
  const colWidths = [30, 160, 45, 40, 65, 45, 45, 80];
  const headers = ['#', 'DESCRIPTION', 'HSN', 'QTY', 'RATE', 'DISC', 'TAX', 'AMT'];

  // Header
  doc.rect(40, startY, 515, 22).fill(layout.primaryColor);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  headers.forEach((h, i) => {
    doc.text(h, cx, startY + 6, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
    cx += colWidths[i];
  });

  let rowY = startY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#374151');
  const items = (invoice.items || []) as unknown as InvoiceItem[];

  items.forEach((item: InvoiceItem, idx: number) => {
    // Striped rows
    if (idx % 2 === 0) {
      doc.rect(40, rowY, 515, 18).fill('#f3f4f6');
    }
    const values = [
      String(idx + 1),
      item.description || '',
      item.hsnCode || '-',
      String(item.quantity || 0),
      formatCurrency(item.rate || 0),
      `${item.discount || 0}%`,
      `${item.taxRate || 0}%`,
      formatCurrency(item.amount || 0),
    ];
    let vx = 42;
    values.forEach((val, i) => {
      if (i === 7) doc.font('Helvetica-Bold');
      doc.text(val, vx, rowY + 4, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
      if (i === 7) doc.font('Helvetica');
      vx += colWidths[i];
    });
    rowY += 18;
  });

  // Bottom border
  doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#e5e7eb');

  // Totals
  const totalsX = 375;
  const totalsY = rowY + 15;
  doc.fontSize(9).fillColor('#374151');
  doc.text('Subtotal', totalsX, totalsY);
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 120, totalsY, { align: 'right', width: 100 });

  let ty = totalsY + 18;
  if ((invoice.discountAmount || 0) > 0) {
    doc.text('Discount', totalsX, ty);
    doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, totalsX + 120, ty, { align: 'right', width: 100 });
    ty += 18;
  }

  doc.text('Tax', totalsX, ty);
  doc.text(formatCurrency(invoice.taxAmount || 0), totalsX + 120, ty, { align: 'right', width: 100 });
  ty += 6;

  // Total box
  doc.rect(totalsX - 10, ty, 240, 28).fill(layout.primaryColor);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', totalsX, ty + 8);
  doc.text(formatCurrency(invoice.total || 0), totalsX + 110, ty + 8, { align: 'right', width: 120 });

  // Notes
  ty += 45;
  if (invoice.notes) {
    doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, ty);
    doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, ty + 14, { width: 515 });
  }
}

// ─── Minimal Template ────────────────────────────────────────
function renderMinimalTemplate(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any
) {
  const { invoice, client, business } = data;

  // Clean header
  doc.fillColor('#111827').fontSize(18).font('Helvetica').text(business.name || 'Company', 40, 40);
  doc.fontSize(8).fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 40, 62);

  // Invoice number subtle
  doc.fillColor('#d1d5db').fontSize(40).font('Helvetica-Bold').text(invoice.invoiceNumber, 380, 30, { align: 'right' });
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Date: ${formatDate(invoice.invoiceDate)}  •  Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });

  // Thin line
  doc.moveTo(40, 100).lineTo(555, 100).lineWidth(0.5).stroke('#e5e7eb');

  // Bill To
  let y = 118;
  doc.fillColor('#111827').fontSize(10).font('Helvetica').text('To', 40, y);
  doc.fontSize(11).text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  if (client.company) { y += 30; doc.text(client.company, 40, y); }
  if (client.email) { y += 14; doc.text(client.email, 40, y); }
  if (client.gstNumber) { y += 14; doc.text(`GST: ${client.gstNumber}`, 40, y); }

  // Simple table
  y += 25;
  // Underline header
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke('#111827');
  y += 10;
  doc.fontSize(7).font('Helvetica').fillColor('#9ca3af');
  doc.text('DESCRIPTION', 40, y);
  doc.text('QTY', 350, y, { align: 'right', width: 60 });
  doc.text('RATE', 420, y, { align: 'right', width: 60 });
  doc.text('AMOUNT', 555, y, { align: 'right' });
  y += 18;
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#e5e7eb');
  y += 6;

  doc.fontSize(9).fillColor('#111827').font('Helvetica');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    y += 12;
    doc.text(item.description || '', 40, y, { width: 300 });
    doc.text(String(item.quantity || 0), 350, y, { align: 'right', width: 60 });
    doc.text(formatCurrency(item.rate || 0), 410, y, { align: 'right', width: 60 });
    doc.font('Helvetica-Bold').text(formatCurrency(item.amount || 0), 480, y, { align: 'right', width: 75 });
    doc.font('Helvetica');
  });

  // Totals right-aligned
  y += 25;
  doc.moveTo(350, y).lineTo(555, y).lineWidth(0.5).stroke('#e5e7eb');
  y += 10;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text('Subtotal', 350, y);
  doc.fillColor('#111827').text(formatCurrency(invoice.subtotal || 0), 420, y, { align: 'right', width: 135 });
  y += 16;
  doc.fillColor('#6b7280').text('Tax', 350, y);
  doc.fillColor('#111827').text(formatCurrency(invoice.taxAmount || 0), 420, y, { align: 'right', width: 135 });
  y += 8;
  doc.moveTo(350, y).lineTo(555, y).lineWidth(1).stroke('#111827');
  y += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#111827');
  doc.text('Total', 350, y);
  doc.text(formatCurrency(invoice.total || 0), 420, y, { align: 'right', width: 135 });

  if (invoice.notes) {
    y += 30;
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6b7280').text(invoice.notes, 40, y, { width: 515 });
  }
}

// ─── Professional Template ──────────────────────────────────
function renderProfessionalTemplate(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any
) {
  const { invoice, client, business } = data;

  // Two-column header
  doc.rect(0, 0, 595, 10).fill(layout.accentColor);

  // Left: business
  doc.fillColor(layout.primaryColor).fontSize(16).font('Helvetica-Bold').text(business.name || 'Company', 40, 28);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  let y = 48;
  if (business.address) { doc.text(business.address, 40, y); y += 12; }
  if (business.gstNumber) { doc.text(`GSTIN: ${business.gstNumber}`, 40, y); y += 12; }
  if (business.phone) { doc.text(`Tel: ${business.phone}`, 40, y); }

  // Right: invoice details box
  doc.rect(350, 24, 205, 75).fill('#f8fafc').stroke('#e2e8f0');
  doc.fillColor('#64748b').fontSize(7).font('Helvetica').text('INVOICE NUMBER', 360, 32);
  doc.fillColor(layout.primaryColor).fontSize(11).font('Helvetica-Bold').text(invoice.invoiceNumber, 360, 42);
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text('DATE', 470, 32);
  doc.fillColor('#1e293b').fontSize(9).text(formatDate(invoice.invoiceDate), 470, 42);
  doc.fontSize(7).fillColor('#64748b').text('DUE DATE', 360, 60);
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(formatDate(invoice.dueDate), 360, 70);
  doc.text('STATUS', 470, 60);
  doc.fillColor(layout.accentColor).fontSize(9).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 470, 70);

  // Bill To / Ship To two column
  y = 120;
  doc.rect(40, y, 245, 12).fill('#f1f5f9');
  doc.fillColor(layout.primaryColor).fontSize(8).font('Helvetica-Bold').text('BILL TO', 48, y + 2);
  doc.fillColor('#334155').fontSize(9).font('Helvetica');
  let by = y + 20;
  if (client.name) { doc.font('Helvetica-Bold').text(client.name, 48, by); doc.font('Helvetica'); by += 14; }
  if (client.company) { doc.text(client.company, 48, by); by += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 48, by, { width: 230 }); by += 28; }
  if (client.gstNumber) { doc.text(`GSTIN: ${client.gstNumber}`, 48, by); by += 14; }
  if (client.email) { doc.text(client.email, 48, by); }
  if (client.phone) { doc.text(`Tel: ${client.phone}`, 48, by + 14); }

  // Items table
  renderProfessionalTable(doc, data, layout, Math.max(by + 30, 140));

  // Footer
  doc.rect(0, 790, 595, 10).fill(layout.accentColor);
  if (layout.footerText) {
    doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(layout.footerText, 40, 810, { align: 'center', width: 515 });
  }
}

function renderProfessionalTable(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any,
  startY: number
) {
  const { invoice } = data;
  const colWidths = [22, 130, 40, 35, 55, 40, 40, 65, 80];
  const headers = ['#', 'Item / Description', 'HSN/SAC', 'Qty', 'Rate', 'Disc', 'Tax', 'Tax Amt', 'Amount'];

  // Header
  doc.rect(40, startY, 515, 18).fill('#f1f5f9');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(layout.primaryColor);
  let cx = 42;
  headers.forEach((h, i) => {
    doc.text(h, cx, startY + 5, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
    cx += colWidths[i];
  });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  const items = (invoice.items || []) as unknown as InvoiceItem[];

  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) {
      doc.rect(40, rowY - 1, 515, 17).fill('#fafbfc');
    }
    const taxAmt = ((item.amount || 0) * (item.taxRate || 0)) / 100;
    const values = [
      String(idx + 1),
      item.description || '',
      item.hsnCode || '-',
      String(item.quantity || 0),
      formatCurrency(item.rate || 0),
      `${item.discount || 0}%`,
      `${item.taxRate || 0}%`,
      formatCurrency(taxAmt),
      formatCurrency(item.amount || 0),
    ];
    let vx = 42;
    values.forEach((val, i) => {
      doc.text(val, vx, rowY + 3, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
      vx += colWidths[i];
    });
    rowY += 17;
  });

  // Totals
  doc.moveTo(40, rowY).lineTo(555, rowRow).stroke('#e2e8f0');
  rowY += 10;
  const totalsX = 380;

  doc.fontSize(9).fillColor('#334155');
  doc.text('Subtotal', totalsX, rowY);
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 110, rowY, { align: 'right', width: 120 });
  rowY += 16;

  if ((invoice.discountAmount || 0) > 0) {
    doc.text('Discount', totalsX, rowY);
    doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, totalsX + 110, rowY, { align: 'right', width: 120 });
    rowY += 16;
  }

  doc.text('Tax', totalsX, rowY);
  doc.text(formatCurrency(invoice.taxAmount || 0), totalsX + 110, rowY, { align: 'right', width: 120 });
  rowY += 6;

  doc.moveTo(totalsX, rowY).lineTo(555, rowY).stroke(layout.primaryColor);
  rowY += 8;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(layout.primaryColor);
  doc.text('TOTAL DUE', totalsX, rowY);
  doc.text(formatCurrency(invoice.total || 0), totalsX + 110, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.moveTo(totalsX, rowY).lineTo(555, rowY).stroke(layout.primaryColor);

  if (invoice.notes) {
    rowY += 20;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('Notes', 40, rowY);
    doc.font('Helvetica').fontSize(8).fillColor('#334155').text(invoice.notes, 40, rowY + 12, { width: 515 });
  }
}

// ─── Elegant Template ───────────────────────────────────────
function renderElegantTemplate(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any
) {
  const { invoice, client, business } = data;

  // Centered header
  doc.font('Helvetica');
  doc.fillColor(layout.primaryColor).fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 0, 35, { align: 'center' });
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 0, 58, { align: 'center' });
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 0, 72, { align: 'center' });

  // Decorative line
  doc.moveTo(200, 90).lineTo(395, 90).lineWidth(1).stroke(layout.accentColor);

  // Invoice title
  doc.fillColor(layout.primaryColor).fontSize(16).font('Helvetica').text('Invoice', 0, 108, { align: 'center' });
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(`# ${invoice.invoiceNumber}  •  ${formatDate(invoice.invoiceDate)}`, 0, 128, { align: 'center' });

  // Client section
  let y = 155;
  doc.fillColor(layout.accentColor).fontSize(8).font('Helvetica-Bold').text('Billed To', 40, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica').text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  let cy = y + 30;
  if (client.company) { doc.text(client.company, 40, cy); cy += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 250 }); cy += 26; }
  if (client.email) { doc.text(client.email, 40, cy); cy += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); }

  // Elegant table
  renderElegantTable(doc, data, layout, Math.max(cy + 20, 240));

  if (layout.footerText) {
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(layout.footerText, 40, 770, { align: 'center', width: 515 });
  }
}

function renderElegantTable(
  doc: PDFKit.PDFDocument,
  data: PDFInvoiceData,
  layout: any,
  startY: number
) {
  const { invoice } = data;
  const colWidths = [30, 170, 45, 40, 65, 80];
  const headers = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  // Double line header
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(1.5).stroke(layout.primaryColor);
  doc.moveTo(40, startY + 3).lineTo(555, startY + 3).lineWidth(0.3).stroke(layout.primaryColor);
  startY += 10;

  doc.fontSize(7).font('Helvetica-Bold').fillColor(layout.primaryColor);
  let cx = 42;
  headers.forEach((h, i) => {
    doc.text(h, cx, startY, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
    cx += colWidths[i];
  });

  startY += 16;
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(0.3).stroke('#e5e7eb');

  let rowY = startY + 6;
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  const items = (invoice.items || []) as unknown as InvoiceItem[];

  items.forEach((item: InvoiceItem, idx: number) => {
    const values = [
      String(idx + 1),
      item.description || '',
      item.hsnCode || '-',
      String(item.quantity || 0),
      formatCurrency(item.rate || 0),
      formatCurrency(item.amount || 0),
    ];
    let vx = 42;
    values.forEach((val, i) => {
      doc.text(val, vx, rowY, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
      vx += colWidths[i];
    });
    rowY += 14;
    doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.2).stroke('#f3f4f6');
    rowY += 4;
  });

  // Totals with accent
  rowY += 10;
  doc.moveTo(350, rowY).lineTo(555, rowY).lineWidth(0.3).stroke('#e5e7eb');
  rowY += 10;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text('Subtotal', 350, rowY);
  doc.fillColor('#374151').text(formatCurrency(invoice.subtotal || 0), 420, rowY, { align: 'right', width: 135 });
  rowY += 16;
  doc.fillColor('#6b7280').text('Tax', 350, rowY);
  doc.fillColor('#374151').text(formatCurrency(invoice.taxAmount || 0), 420, rowY, { align: 'right', width: 135 });
  rowY += 6;
  doc.moveTo(350, rowY).lineTo(555, rowY).lineWidth(1.5).stroke(layout.primaryColor);
  rowY += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(layout.primaryColor);
  doc.text('Total', 350, rowY);
  doc.text(formatCurrency(invoice.total || 0), 420, rowY, { align: 'right', width: 135 });

  if (invoice.notes) {
    rowY += 25;
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(invoice.notes, 40, rowY, { width: 515 });
  }
}

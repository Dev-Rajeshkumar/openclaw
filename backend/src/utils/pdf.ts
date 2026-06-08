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
 * Generate PDF invoice with template support — 22 unique renderers
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
    case 'classic':
      renderClassicTemplate(doc, data, layout);
      break;
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
    case 'bold':
      renderBoldTemplate(doc, data, layout);
      break;
    case 'gradient-blue':
      renderGradientBlueTemplate(doc, data, layout);
      break;
    case 'forest-green':
      renderForestGreenTemplate(doc, data, layout);
      break;
    case 'sunset-orange':
      renderSunsetOrangeTemplate(doc, data, layout);
      break;
    case 'rose-gold':
      renderRoseGoldTemplate(doc, data, layout);
      break;
    case 'tech-cyan':
      renderTechCyanTemplate(doc, data, layout);
      break;
    case 'arctic-white':
      renderArcticWhiteTemplate(doc, data, layout);
      break;
    case 'midnight-purple':
      renderMidnightPurpleTemplate(doc, data, layout);
      break;
    case 'coral-reef':
      renderCoralReefTemplate(doc, data, layout);
      break;
    case 'slate-pro':
      renderSlateProTemplate(doc, data, layout);
      break;
    case 'espresso':
      renderEspressoTemplate(doc, data, layout);
      break;
    case 'neon-edge':
      renderNeonEdgeTemplate(doc, data, layout);
      break;
    case 'ocean-breeze':
      renderOceanBreezeTemplate(doc, data, layout);
      break;
    case 'cherry-blossom':
      renderCherryBlossomTemplate(doc, data, layout);
      break;
    case 'gunmetal':
      renderGunmetalTemplate(doc, data, layout);
      break;
    case 'lavender-dreams':
      renderLavenderDreamsTemplate(doc, data, layout);
      break;
    case 'monochrome':
      renderMonochromeTemplate(doc, data, layout);
      break;
    default:
      renderClassicTemplate(doc, data, layout);
      break;
  }

  return doc;
}

// ═══════════════════════════════════════════════════════════════
// 1. CLASSIC — Traditional left-aligned header, bordered table
// ═══════════════════════════════════════════════════════════════
function renderClassicTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.font('Helvetica');
  setFillColor(doc, layout.primaryColor);
  doc.fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 40);
  doc.font('Helvetica');
  let y = 68;
  if (business.address) { doc.fontSize(9).text(business.address, 40, y); y += 14; }
  if (business.gstNumber) { doc.fontSize(9).text(`GST: ${business.gstNumber}`, 40, y); y += 14; }
  if (business.phone) { doc.fontSize(9).text(`Phone: ${business.phone}`, 40, y); }
  setFillColor(doc, layout.accentColor);
  doc.fontSize(26).font('Helvetica-Bold').text('TAX INVOICE', 380, 40, { align: 'right' });
  setFillColor(doc, '#333333');
  doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 380, 72, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 380, 86, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 100, { align: 'right' });
  doc.font('Helvetica-Bold').text(`Status: ${invoice.status || 'Draft'}`, 380, 114, { align: 'right' });
  doc.moveTo(40, 145).lineTo(555, 145).lineWidth(1).stroke('#e5e7eb');
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
  renderClassicTable(doc, data, layout, cy + 20);
  if (layout.footerText) doc.fontSize(9).font('Helvetica').fillColor('#666666').text(layout.footerText, 40, 760, { align: 'center', width: 515 });
}

function renderClassicTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const tableTop = startY;
  const colWidths = [25, 165, 45, 40, 65, 45, 45, 80];
  const headers = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];
  doc.rect(40, tableTop - 4, 515, 20).fill(layout.primaryColor);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  headers.forEach((h, i) => { doc.text(h, cx, tableTop + 2, { width: colWidths[i], align: i === 1 ? 'left' : 'right' }); cx += colWidths[i]; });
  let rowY = tableTop + 22;
  doc.font('Helvetica').fillColor('#333333');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 2, 515, 18).fill('#f9fafb');
    const values = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    values.forEach((val, i) => { doc.text(val, vx, rowY, { width: colWidths[i], align: i === 1 ? 'left' : 'right' }); vx += colWidths[i]; });
    rowY += 18;
  });
  const totalsX = 380, totalsY = rowY + 15;
  doc.fontSize(9).fillColor('#333333');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 100, totalsY, { align: 'right', width: 120 });
  if ((invoice.discountAmount || 0) > 0) { doc.text('Discount:', totalsX, totalsY + 16); doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, totalsX + 100, totalsY + 16, { align: 'right', width: 120 }); }
  doc.text('Tax:', totalsX, totalsY + 32);
  doc.text(formatCurrency(invoice.taxAmount || 0), totalsX + 100, totalsY + 32, { align: 'right', width: 120 });
  doc.moveTo(totalsX, totalsY + 50).lineTo(555, totalsY + 50).stroke('#e5e7eb');
  doc.fontSize(12).font('Helvetica-Bold');
  setFillColor(doc, layout.accentColor);
  doc.text('Total:', totalsX, totalsY + 58);
  doc.text(formatCurrency(invoice.total || 0), totalsX + 100, totalsY + 58, { align: 'right', width: 120 });
  let noteY = totalsY + 90;
  doc.fillColor('#333333');
  if (invoice.notes) { doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 40, noteY); doc.font('Helvetica').fontSize(8).text(invoice.notes, 40, noteY + 14, { width: 515 }); noteY += 40; }
  if (invoice.terms) { doc.fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:', 40, noteY); doc.font('Helvetica').fontSize(8).text(invoice.terms, 40, noteY + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 2. MODERN — Full-width indigo header bar, striped rows
// ═══════════════════════════════════════════════════════════════
function renderModernTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 120).fill(layout.primaryColor);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 25);
  doc.fontSize(9).font('Helvetica').fillColor('#c7d2fe');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 70);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 25, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#c7d2fe');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 52, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 380, 66, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 80, { align: 'right' });
  const sc: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  doc.rect(380, 92, 60, 16).fill(sc[invoice.status || 'Draft'] || '#6b7280');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 380, 96, { align: 'right', width: 60 });
  let y = 140;
  doc.fillColor('#9ca3af').fontSize(8).text('BILL TO', 40, y);
  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 12);
  doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 14; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderModernTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderModernTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [30, 160, 45, 40, 65, 45, 45, 80];
  const hdrs = ['#', 'DESCRIPTION', 'HSN', 'QTY', 'RATE', 'DISC', 'TAX', 'AMT'];
  doc.rect(40, startY, 515, 22).fill(layout.primaryColor);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#374151');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY, 515, 18).fill('#f3f4f6');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });
  doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#e5e7eb');
  const tx = 375, ty = rowY + 15;
  doc.fontSize(9).fillColor('#374151');
  doc.text('Subtotal', tx, ty);
  doc.text(formatCurrency(invoice.subtotal || 0), tx + 120, ty, { align: 'right', width: 100 });
  let t2 = ty + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.text('Discount', tx, t2); doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 100 }); t2 += 18; }
  doc.text('Tax', tx, t2);
  doc.text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 100 });
  t2 += 6;
  doc.rect(tx - 10, t2, 240, 28).fill(layout.primaryColor);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 8);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 8, { align: 'right', width: 120 });
  t2 += 45;
  if (invoice.notes) { doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 3. MINIMAL — Clean, giant faded invoice #, thin lines
// ═══════════════════════════════════════════════════════════════
function renderMinimalTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.fillColor('#111827').fontSize(18).font('Helvetica').text(business.name || 'Company', 40, 40);
  doc.fontSize(8).fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 40, 62);
  doc.fillColor('#d1d5db').fontSize(40).font('Helvetica-Bold').text(invoice.invoiceNumber, 380, 30, { align: 'right' });
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica').text(`Date: ${formatDate(invoice.invoiceDate)}  •  Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });
  doc.moveTo(40, 100).lineTo(555, 100).lineWidth(0.5).stroke('#e5e7eb');
  let y = 118;
  doc.fillColor('#111827').fontSize(10).text('To', 40, y);
  doc.fontSize(11).text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  if (client.company) { y += 30; doc.text(client.company, 40, y); }
  if (client.email) { y += 14; doc.text(client.email, 40, y); }
  if (client.gstNumber) { y += 14; doc.text(`GST: ${client.gstNumber}`, 40, y); }
  y += 25;
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
  items.forEach((item: InvoiceItem) => {
    y += 12;
    doc.text(item.description || '', 40, y, { width: 300 });
    doc.text(String(item.quantity || 0), 350, y, { align: 'right', width: 60 });
    doc.text(formatCurrency(item.rate || 0), 410, y, { align: 'right', width: 60 });
    doc.font('Helvetica-Bold').text(formatCurrency(item.amount || 0), 480, y, { align: 'right', width: 75 });
    doc.font('Helvetica');
  });
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
  if (invoice.notes) { y += 30; doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6b7280').text(invoice.notes, 40, y, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 4. PROFESSIONAL — Top accent bar, two-column header, 9-col table
// ═══════════════════════════════════════════════════════════════
function renderProfessionalTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 10).fill(layout.accentColor);
  doc.fillColor(layout.primaryColor).fontSize(16).font('Helvetica-Bold').text(business.name || 'Company', 40, 28);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  let y = 48;
  if (business.address) { doc.text(business.address, 40, y); y += 12; }
  if (business.gstNumber) { doc.text(`GSTIN: ${business.gstNumber}`, 40, y); y += 12; }
  if (business.phone) { doc.text(`Tel: ${business.phone}`, 40, y); }
  doc.rect(350, 24, 205, 75).fill('#f8fafc').stroke('#e2e8f0');
  doc.fillColor('#64748b').fontSize(7).text('INVOICE NUMBER', 360, 32);
  doc.fillColor(layout.primaryColor).fontSize(11).font('Helvetica-Bold').text(invoice.invoiceNumber, 360, 42);
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text('DATE', 470, 32);
  doc.fillColor('#1e293b').fontSize(9).text(formatDate(invoice.invoiceDate), 470, 42);
  doc.fontSize(7).fillColor('#64748b').text('DUE DATE', 360, 60);
  doc.fillColor('#1e293b').fontSize(9).text(formatDate(invoice.dueDate), 360, 70);
  doc.text('STATUS', 470, 60);
  doc.fillColor(layout.accentColor).fontSize(9).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 470, 70);
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
  renderProfessionalTable(doc, data, layout, Math.max(by + 30, 140));
  doc.rect(0, 790, 595, 10).fill(layout.accentColor);
  if (layout.footerText) doc.fontSize(7).fillColor('#64748b').text(layout.footerText, 40, 810, { align: 'center', width: 515 });
}

function renderProfessionalTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [22, 130, 40, 35, 55, 40, 40, 65, 80];
  const hdrs = ['#', 'Item / Description', 'HSN/SAC', 'Qty', 'Rate', 'Disc', 'Tax', 'Tax Amt', 'Amount'];
  doc.rect(40, startY, 515, 18).fill('#f1f5f9');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(layout.primaryColor);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 17).fill('#fafbfc');
    const taxAmt = ((item.amount || 0) * (item.taxRate || 0)) / 100;
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(taxAmt), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 3, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 17;
  });
  doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#e2e8f0');
  rowY += 10;
  const tx = 380;
  doc.fontSize(9).fillColor('#334155');
  doc.text('Subtotal', tx, rowY);
  doc.text(formatCurrency(invoice.subtotal || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.text('Discount', tx, rowY); doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, rowY, { align: 'right', width: 120 }); rowY += 16; }
  doc.text('Tax', tx, rowY);
  doc.text(formatCurrency(invoice.taxAmount || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 6;
  doc.moveTo(tx, rowY).lineTo(555, rowY).stroke(layout.primaryColor);
  rowY += 8;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(layout.primaryColor);
  doc.text('TOTAL DUE', tx, rowY);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.moveTo(tx, rowY).lineTo(555, rowY).stroke(layout.primaryColor);
  if (invoice.notes) { rowY += 20; doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text('Notes', 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#334155').text(invoice.notes, 40, rowY + 12, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 5. ELEGANT — Centered header, decorative line, double-line table header
// ═══════════════════════════════════════════════════════════════
function renderElegantTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.font('Helvetica');
  doc.fillColor(layout.primaryColor).fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 0, 35, { align: 'center' });
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 0, 58, { align: 'center' });
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 0, 72, { align: 'center' });
  doc.moveTo(200, 90).lineTo(395, 90).lineWidth(1).stroke(layout.accentColor);
  doc.fillColor(layout.primaryColor).fontSize(16).font('Helvetica').text('Invoice', 0, 108, { align: 'center' });
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(`# ${invoice.invoiceNumber}  •  ${formatDate(invoice.invoiceDate)}`, 0, 128, { align: 'center' });
  let y = 155;
  doc.fillColor(layout.accentColor).fontSize(8).font('Helvetica-Bold').text('Billed To', 40, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica').text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  let cy = y + 30;
  if (client.company) { doc.text(client.company, 40, cy); cy += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 250 }); cy += 26; }
  if (client.email) { doc.text(client.email, 40, cy); cy += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); }
  renderElegantTable(doc, data, layout, Math.max(cy + 20, 240));
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(layout.footerText, 40, 770, { align: 'center', width: 515 });
}

function renderElegantTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [30, 170, 45, 40, 65, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(1.5).stroke(layout.primaryColor);
  doc.moveTo(40, startY + 3).lineTo(555, startY + 3).lineWidth(0.3).stroke(layout.primaryColor);
  startY += 10;
  doc.fontSize(7).font('Helvetica-Bold').fillColor(layout.primaryColor);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  startY += 16;
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(0.3).stroke('#e5e7eb');
  let rowY = startY + 6;
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 14;
    doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.2).stroke('#f3f4f6');
    rowY += 4;
  });
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
  if (invoice.notes) { rowY += 25; doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(invoice.notes, 40, rowY, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 6. BOLD — Full-bleed black header, gold accent, dark theme
// ═══════════════════════════════════════════════════════════════
function renderBoldTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 130).fill('#000000');
  doc.rect(0, 127, 595, 3).fill('#d4a843');
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text(business.name || 'Company', 40, 22);
  doc.fontSize(8).font('Helvetica').fillColor('#999999');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 69);
  if (business.phone) doc.text(`Tel: ${business.phone}`, 40, 83);
  doc.fillColor('#d4a843').fontSize(22).font('Helvetica-Bold').text('INVOICE', 380, 22, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#cccccc');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 52, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}  •  Due ${formatDate(invoice.dueDate)}`, 380, 66, { align: 'right' });
  doc.fillColor('#d4a843').fontSize(10).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 380, 86, { align: 'right' });
  let y = 148;
  doc.fillColor('#d4a843').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderBoldTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 595, 4).fill('#d4a843');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#666666').text(layout.footerText, 40, 800, { align: 'center', width: 515 });
}

function renderBoldTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#d4a843');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#cccccc');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#1a1a1a' : '#0d0d0d');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.fillColor('#d4a843').font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.fillColor('#cccccc').font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#999999');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#cccccc').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#999999').text('Discount', tx, t2); doc.fillColor('#cccccc').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#999999').text('Tax', tx, t2);
  doc.fillColor('#cccccc').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 28).fill('#d4a843');
  doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 8);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 8, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 45; doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#999999').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 7. GRADIENT-BLUE — Blue gradient header, light blue rows
// ═══════════════════════════════════════════════════════════════
function renderGradientBlueTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 110).fill('#1e40af');
  doc.rect(0, 80, 595, 30).fill('#2563eb');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#bfdbfe');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#dbeafe');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 50, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 64, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });
  let y = 130;
  doc.fillColor('#1e40af').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#475569');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderGradientBlueTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#93c5fd').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderGradientBlueTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#1e40af');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#1e293b');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#eff6ff' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#1e40af'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#1e293b'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#475569');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#1e293b').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#475569').text('Discount', tx, t2); doc.fillColor('#1e293b').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#475569').text('Tax', tx, t2);
  doc.fillColor('#1e293b').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#1e40af');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#1e293b').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#475569').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 8. FOREST-GREEN — Green left accent bar, soft green-tinted rows
// ═══════════════════════════════════════════════════════════════
function renderForestGreenTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 8, 842).fill('#166534');
  doc.fillColor('#166534').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 48, 35);
  doc.fontSize(8).font('Helvetica').fillColor('#6b7280');
  let y = 58;
  if (business.address) { doc.text(business.address, 48, y); y += 13; }
  if (business.gstNumber) { doc.text(`GST: ${business.gstNumber}`, 48, y); y += 13; }
  if (business.phone) { doc.text(`Tel: ${business.phone}`, 48, y); }
  doc.fillColor('#166534').fontSize(18).font('Helvetica-Bold').text('INVOICE', 388, 35, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
  doc.text(`# ${invoice.invoiceNumber}`, 388, 58, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 388, 72, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 388, 86, { align: 'right' });
  doc.moveTo(48, 110).lineTo(555, 110).lineWidth(0.5).stroke('#166534');
  y = 125;
  doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('BILL TO', 48, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(client.name || '', 48, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
  y += 32;
  if (client.company) { doc.text(client.company, 48, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 48, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 48, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 48, y); y += 14; }
  renderForestGreenTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 8, 54).fill('#166534');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#6b7280').text(layout.footerText, 48, 765, { align: 'center', width: 507 });
}

function renderForestGreenTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#166534');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#f0fdf4' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#166534'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#111827'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#4b5563');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#111827').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#4b5563').text('Discount', tx, t2); doc.fillColor('#111827').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#4b5563').text('Tax', tx, t2);
  doc.fillColor('#111827').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#166534');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#4b5563').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 9. SUNSET-ORANGE — Warm orange header, cream feel, warm rows
// ═══════════════════════════════════════════════════════════════
function renderSunsetOrangeTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 110).fill('#c2410c');
  doc.rect(0, 107, 595, 3).fill('#fbbf24');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#fed7aa');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#ffedd5');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 50, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 64, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });
  doc.rect(0, 110, 595, 732).fill('#fffbeb');
  let y = 130;
  doc.fillColor('#c2410c').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#1c1917').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#78716c');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderSunsetOrangeTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#a8a29e').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderSunsetOrangeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#c2410c');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#1c1917');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#fef3c7' : '#fffbeb');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#c2410c'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#1c1917'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#78716c');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#1c1917').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#78716c').text('Discount', tx, t2); doc.fillColor('#1c1917').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#78716c').text('Tax', tx, t2);
  doc.fillColor('#1c1917').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#c2410c');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#1c1917').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#78716c').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 10. ROSE-GOLD — Deep rose header, pink-tinted sections, luxury spacing
// ═══════════════════════════════════════════════════════════════
function renderRoseGoldTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 115).fill('#9f1239');
  doc.rect(0, 112, 595, 3).fill('#fda4af');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 22);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#fecdd3');
  if (business.address) doc.text(business.address, 40, 52);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 66);
  doc.fillColor('#ffffff').fontSize(18).font('Helvetica').text('Invoice', 380, 22, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#fecdd3');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 48, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 62, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 76, { align: 'right' });
  let y = 140;
  doc.rect(40, y, 515, 30).fill('#fff1f2');
  y += 8;
  doc.fillColor('#9f1239').fontSize(8).font('Helvetica-Bold').text('BILL TO', 50, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y + 12);
  doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
  y += 38;
  if (client.company) { doc.text(client.company, 50, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 50, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 50, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, y); y += 14; }
  renderRoseGoldTable(doc, data, layout, y + 20);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderRoseGoldTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#9f1239');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#fff1f2' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#9f1239'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#111827'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 20;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#111827').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#6b7280').text('Discount', tx, t2); doc.fillColor('#111827').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#6b7280').text('Tax', tx, t2);
  doc.fillColor('#111827').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 10;
  doc.rect(tx - 10, t2, 250, 28).fill('#9f1239');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 8);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 8, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 45; doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 11. TECH-CYAN — Dark slate header, cyan accent blocks, grid aesthetic
// ═══════════════════════════════════════════════════════════════
function renderTechCyanTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 120).fill('#0f172a');
  doc.rect(0, 0, 10, 120).fill('#06b6d4');
  doc.rect(585, 0, 10, 120).fill('#06b6d4');
  doc.fillColor('#06b6d4').fontSize(10).font('Helvetica-Bold').text('// INVOICE SYSTEM', 40, 18);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 35);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  if (business.address) doc.text(business.address, 40, 65);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 79);
  doc.fillColor('#06b6d4').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 35, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 62, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 76, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 90, { align: 'right' });
  doc.moveTo(40, 130).lineTo(555, 130).lineWidth(0.5).stroke('#06b6d4');
  let y = 145;
  doc.fillColor('#06b6d4').fontSize(8).font('Helvetica-Bold').text('> BILL_TO:', 40, y);
  doc.fillColor('#e2e8f0').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#94a3b8');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderTechCyanTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 595, 4).fill('#06b6d4');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(layout.footerText, 40, 800, { align: 'center', width: 515 });
}

function renderTechCyanTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#06b6d4');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#0f172a');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#e2e8f0');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#1e293b' : '#0f172a');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#06b6d4'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#e2e8f0'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#94a3b8');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#e2e8f0').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#94a3b8').text('Discount', tx, t2); doc.fillColor('#e2e8f0').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#94a3b8').text('Tax', tx, t2);
  doc.fillColor('#e2e8f0').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#06b6d4');
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 12. ARCTIC-WHITE — Ultra-clean white, frost blue header strip, airy
// ═══════════════════════════════════════════════════════════════
function renderArcticWhiteTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 80).fill('#e0f2fe');
  doc.fillColor('#0369a1').fontSize(20).font('Helvetica').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#0284c7');
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 48);
  if (business.phone) doc.text(`Tel: ${business.phone}`, 160, 48);
  doc.fillColor('#0369a1').fontSize(16).font('Helvetica').text('Invoice', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#0284c7');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 42, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}  •  Due ${formatDate(invoice.dueDate)}`, 380, 56, { align: 'right' });
  doc.moveTo(40, 95).lineTo(555, 95).lineWidth(0.3).stroke('#bae6fd');
  let y = 115;
  doc.fillColor('#0369a1').fontSize(8).text('BILL TO', 40, y);
  doc.fillColor('#0c4a6e').fontSize(12).font('Helvetica').text(client.name || '', 40, y + 16);
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  y += 36;
  if (client.company) { doc.text(client.company, 40, y); y += 15; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 30; }
  if (client.email) { doc.text(client.email, 40, y); y += 15; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 15; }
  renderArcticWhiteTable(doc, data, layout, y + 20);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(layout.footerText, 40, 770, { align: 'center', width: 515 });
}

function renderArcticWhiteTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(0.5).stroke('#0369a1');
  startY += 8;
  doc.fontSize(7).font('Helvetica').fillColor('#0284c7');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  startY += 16;
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(0.3).stroke('#bae6fd');
  let rowY = startY + 6;
  doc.font('Helvetica').fontSize(9).fillColor('#0c4a6e');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 2, 515, 18).fill('#f0f9ff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#0369a1'); doc.text(val, vx, rowY + 3, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#0c4a6e'); vx += cw[i]; });
    rowY += 20;
  });
  const tx = 370, ty2 = rowY + 20;
  doc.moveTo(tx, ty2).lineTo(555, ty2).lineWidth(0.3).stroke('#bae6fd');
  ty2 += 10;
  doc.fontSize(9).fillColor('#64748b');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#0c4a6e').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 135 });
  ty2 += 18;
  doc.fillColor('#64748b').text('Tax', tx, ty2);
  doc.fillColor('#0c4a6e').text(formatCurrency(invoice.taxAmount || 0), tx + 120, ty2, { align: 'right', width: 135 });
  ty2 += 8;
  doc.moveTo(tx, ty2).lineTo(555, ty2).lineWidth(0.5).stroke('#0369a1');
  ty2 += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#0369a1');
  doc.text('Total', tx, ty2);
  doc.text(formatCurrency(invoice.total || 0), tx + 120, ty2, { align: 'right', width: 135 });
  if (invoice.notes) { ty2 += 30; doc.fontSize(8).font('Helvetica').fillColor('#64748b').text(invoice.notes, 40, ty2, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 13. MIDNIGHT-PURPLE — Deep purple executive header, gold trim, dark theme
// ═══════════════════════════════════════════════════════════════
function renderMidnightPurpleTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 125).fill('#1e1b4b');
  doc.rect(0, 122, 595, 3).fill('#f59e0b');
  doc.fillColor('#f59e0b').fontSize(10).font('Helvetica-Bold').text('◆ INVOICE', 40, 18);
  doc.fillColor('#e0e7ff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 38);
  doc.fontSize(8).font('Helvetica').fillColor('#a5b4fc');
  if (business.address) doc.text(business.address, 40, 68);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 82);
  doc.fillColor('#f59e0b').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 38, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#c4b5fd');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 65, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 79, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 93, { align: 'right' });
  let y = 145;
  doc.fillColor('#f59e0b').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#e0e7ff').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#a5b4fc');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderMidnightPurpleTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 595, 3).fill('#f59e0b');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#6366f1').text(layout.footerText, 40, 800, { align: 'center', width: 515 });
}

function renderMidnightPurpleTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#f59e0b');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e1b4b');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#c4b5fd');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#2e2a5e' : '#1e1b4b');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#f59e0b'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#c4b5fd'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#a5b4fc');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#c4b5fd').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a5b4fc').text('Discount', tx, t2); doc.fillColor('#c4b5fd').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#a5b4fc').text('Tax', tx, t2);
  doc.fillColor('#c4b5fd').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#f59e0b');
  doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#e0e7ff').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#a5b4fc').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 14. CORAL-REEF — Dual-tone header (teal left, pink right), vibrant rows
// ═══════════════════════════════════════════════════════════════
function renderCoralReefTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 298, 110).fill('#0d9488');
  doc.rect(297, 0, 298, 110).fill('#f472b6');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#ccfbf1');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#fce7f3');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 50, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 64, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });
  let y = 130;
  doc.fillColor('#0d9488').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderCoralReefTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#99f6e4').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderCoralReefTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 258, 20).fill('#0d9488');
  doc.rect(297, startY, 258, 20).fill('#f472b6');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  const rowColors = ['#f0fdfa', '#fdf2f8', '#f0f9ff', '#fefce8'];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(rowColors[idx % rowColors.length]);
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#0d9488'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#111827'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#111827').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#6b7280').text('Discount', tx, t2); doc.fillColor('#111827').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#6b7280').text('Tax', tx, t2);
  doc.fillColor('#111827').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 125, 26).fill('#0d9488');
  doc.rect(tx + 115, t2, 125, 26).fill('#f472b6');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 15. SLATE-PRO — Sharp slate gray header, compact minimal, tight grid
// ═══════════════════════════════════════════════════════════════
function renderSlateProTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 90).fill('#334155');
  doc.fillColor('#f1f5f9').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
  if (business.address) doc.text(business.address, 40, 45);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 59);
  doc.fillColor('#f1f5f9').fontSize(18).font('Helvetica-Bold').text('INVOICE', 380, 18, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#cbd5e1');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 45, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}  •  Due ${formatDate(invoice.dueDate)}`, 380, 59, { align: 'right' });
  let y = 105;
  doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 13);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 26; }
  if (client.email) { doc.text(client.email, 40, y); y += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 13; }
  renderSlateProTable(doc, data, layout, y + 12);
  if (layout.footerText) doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(layout.footerText, 40, 770, { align: 'center', width: 515 });
}

function renderSlateProTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [22, 175, 42, 38, 62, 42, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 18).fill('#334155');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#f1f5f9');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 19;
  doc.font('Helvetica').fontSize(8).fillColor('#0f172a');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 16).fill('#f8fafc');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.2).stroke('#e2e8f0');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#334155'); doc.text(val, vx, rowY + 3, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#0f172a'); vx += cw[i]; });
    rowY += 16;
  });
  doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.5).stroke('#334155');
  rowY += 8;
  const tx = 370;
  doc.fontSize(8).fillColor('#64748b');
  doc.text('Subtotal', tx, rowY);
  doc.fillColor('#0f172a').text(formatCurrency(invoice.subtotal || 0), tx + 120, rowY, { align: 'right', width: 120 });
  rowY += 15;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#64748b').text('Discount', tx, rowY); doc.fillColor('#0f172a').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, rowY, { align: 'right', width: 120 }); rowY += 15; }
  doc.fillColor('#64748b').text('Tax', tx, rowY);
  doc.fillColor('#0f172a').text(formatCurrency(invoice.taxAmount || 0), tx + 120, rowY, { align: 'right', width: 120 });
  rowY += 6;
  doc.moveTo(tx, rowY).lineTo(555, rowY).lineWidth(1).stroke('#334155');
  rowY += 6;
  doc.fontSize(11).font('Helvetica-Bold').fillColor('#334155');
  doc.text('TOTAL', tx, rowY);
  doc.text(formatCurrency(invoice.total || 0), tx + 120, rowY, { align: 'right', width: 120 });
  if (invoice.notes) { rowY += 25; doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('Notes', 40, rowY); doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(invoice.notes, 40, rowY + 12, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 16. ESPRESSO — Rich brown header, cream body, warm brown table
// ═══════════════════════════════════════════════════════════════
function renderEspressoTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 110).fill('#3e2723');
  doc.rect(0, 107, 595, 3).fill('#a1887f');
  doc.fillColor('#efebe9').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#bcaaa4');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);
  doc.fillColor('#efebe9').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#d7ccc8');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 50, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 64, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 78, { align: 'right' });
  doc.rect(0, 110, 595, 732).fill('#faf0e6');
  let y = 130;
  doc.fillColor('#3e2723').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#1c1008').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#6d4c41');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderEspressoTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#a1887f').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderEspressoTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#3e2723');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#efebe9');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#1c1008');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#f5e6d3' : '#faf0e6');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#3e2723'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#1c1008'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#6d4c41');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#1c1008').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#6d4c41').text('Discount', tx, t2); doc.fillColor('#1c1008').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#6d4c41').text('Tax', tx, t2);
  doc.fillColor('#1c1008').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#3e2723');
  doc.fillColor('#efebe9').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#1c1008').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6d4c41').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 17. NEON-EDGE — Full dark header, neon lime accents, startup aesthetic
// ═══════════════════════════════════════════════════════════════
function renderNeonEdgeTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 140).fill('#111111');
  doc.rect(0, 137, 595, 3).fill('#a3e635');
  doc.fillColor('#a3e635').fontSize(10).font('Helvetica-Bold').text('⚡ INVOICE', 40, 18);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 38);
  doc.fontSize(8).font('Helvetica').fillColor('#737373');
  if (business.address) doc.text(business.address, 40, 70);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 84);
  if (business.phone) doc.text(`Tel: ${business.phone}`, 40, 98);
  doc.fillColor('#a3e635').fontSize(22).font('Helvetica-Bold').text('INVOICE', 380, 38, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#a3a3a3');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 68, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 82, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 96, { align: 'right' });
  let y = 158;
  doc.fillColor('#a3e635').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#f5f5f5').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#a3a3a3');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderNeonEdgeTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 595, 3).fill('#a3e635');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#737373').text(layout.footerText, 40, 800, { align: 'center', width: 515 });
}

function renderNeonEdgeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#a3e635');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#111111');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#d4d4d4');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#1f1f1f' : '#111111');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#a3e635'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#d4d4d4'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#a3a3a3');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#d4d4d4').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a3a3a3').text('Discount', tx, t2); doc.fillColor('#d4d4d4').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#a3a3a3').text('Tax', tx, t2);
  doc.fillColor('#d4d4d4').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#a3e635');
  doc.fillColor('#111111').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#f5f5f5').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#a3a3a3').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 18. OCEAN-BREEZE — Aqua wave header, flowing blue tones, calming
// ═══════════════════════════════════════════════════════════════
function renderOceanBreezeTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 100).fill('#06b6d4');
  doc.rect(0, 75, 595, 25).fill('#22d3ee');
  doc.rect(0, 95, 595, 5).fill('#67e8f9');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#cffafe');
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 18, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#ecfeff');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 48, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 62, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 76, { align: 'right' });
  let y = 120;
  doc.fillColor('#0891b2').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#164e63').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderOceanBreezeTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#a5f3fc').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderOceanBreezeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#06b6d4');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#164e63');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#e0f7fa' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#0891b2'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#164e63'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#64748b');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#164e63').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#64748b').text('Discount', tx, t2); doc.fillColor('#164e63').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#64748b').text('Tax', tx, t2);
  doc.fillColor('#164e63').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#06b6d4');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#164e63').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 19. CHERRY-BLOSSOM — Pink sakura header, delicate pink-tinted rows
// ═══════════════════════════════════════════════════════════════
function renderCherryBlossomTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 105).fill('#fce7f3');
  doc.rect(0, 102, 595, 3).fill('#ec4899');
  doc.fillColor('#9d174d').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#f472b6');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);
  doc.fillColor('#9d174d').fontSize(18).font('Helvetica').text('Invoice', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#be185d');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 46, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 60, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 74, { align: 'right' });
  let y = 125;
  doc.fillColor('#ec4899').fontSize(8).font('Helvetica-Bold').text('Billed To', 40, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderCherryBlossomTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#f9a8d4').text(layout.footerText, 40, 770, { align: 'center', width: 515 });
}

function renderCherryBlossomTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#fce7f3');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#9d174d');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  doc.moveTo(40, startY + 20).lineTo(555, startY + 20).lineWidth(0.3).stroke('#fbcfe8');
  let rowY = startY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#111827');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#fdf2f8' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#ec4899'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#111827'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#9ca3af');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#111827').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#9ca3af').text('Discount', tx, t2); doc.fillColor('#111827').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#9ca3af').text('Tax', tx, t2);
  doc.fillColor('#111827').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#ec4899');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#9ca3af').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 20. GUNMETAL — Industrial dark header with copper accents, solid grid
// ═══════════════════════════════════════════════════════════════
function renderGunmetalTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 115).fill('#27272a');
  doc.rect(0, 112, 595, 3).fill('#b87333');
  doc.fillColor('#e4e4e7').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#a1a1aa');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 69);
  if (business.phone) doc.text(`Tel: ${business.phone}`, 40, 83);
  doc.fillColor('#b87333').fontSize(22).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#d4d4d8');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 52, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 66, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 80, { align: 'right' });
  let y = 135;
  doc.fillColor('#b87333').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#fafafa').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#a1a1aa');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderGunmetalTable(doc, data, layout, y + 15);
  doc.rect(0, 788, 595, 3).fill('#b87333');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#71717a').text(layout.footerText, 40, 800, { align: 'center', width: 515 });
}

function renderGunmetalTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#b87333');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#27272a');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#e4e4e7');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#2a2a2e' : '#1f1f23');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.3).stroke('#3f3f46');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#b87333'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#e4e4e7'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#a1a1aa');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#e4e4e7').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a1a1aa').text('Discount', tx, t2); doc.fillColor('#e4e4e7').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#a1a1aa').text('Tax', tx, t2);
  doc.fillColor('#e4e4e7').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#b87333');
  doc.fillColor('#27272a').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#fafafa').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#a1a1aa').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// 21. LAVENDER-DREAMS — Soft purple gradient header, gentle lavender rows
// ═══════════════════════════════════════════════════════════════
function renderLavenderDreamsTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 105).fill('#7c3aed');
  doc.rect(0, 80, 595, 25).fill('#8b5cf6');
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#ddd6fe');
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('INVOICE', 380, 18, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#ede9fe');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 48, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 62, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 76, { align: 'right' });
  let y = 125;
  doc.fillColor('#7c3aed').fontSize(8).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#6b7280');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderLavenderDreamsTable(doc, data, layout, y + 15);
  if (layout.footerText) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#c4b5fd').text(layout.footerText, 40, 765, { align: 'center', width: 515 });
}

function renderLavenderDreamsTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#7c3aed');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#1e1b4b');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#f5f3ff' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold').fillColor('#7c3aed'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica').fillColor('#1e1b4b'); vx += cw[i]; });
    rowY += 18;
  });
  const tx = 370, ty2 = rowY + 15;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text('Subtotal', tx, ty2);
  doc.fillColor('#1e1b4b').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty2, { align: 'right', width: 120 });
  let t2 = ty2 + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#6b7280').text('Discount', tx, t2); doc.fillColor('#1e1b4b').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#6b7280').text('Tax', tx, t2);
  doc.fillColor('#1e1b4b').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 250, 26).fill('#7c3aed');
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text('TOTAL', tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 7, { align: 'right', width: 130 });
  if (invoice.notes) { t2 += 42; doc.fillColor('#1e1b4b').fontSize(9).font('Helvetica-Bold').text('Notes', 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

// ═══════════════════════════════════════════════════════════════
// 22. MONOCHROME — Pure black and white, sharp black header, max contrast
// ═══════════════════════════════════════════════════════════════
function renderMonochromeTemplate(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any) {
  const { invoice, client, business } = data;
  doc.rect(0, 0, 595, 100).fill('#000000');
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#888888');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 69);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text('INVOICE', 380, 20, { align: 'right' });
  doc.fontSize(9).font('Helvetica').fillColor('#aaaaaa');
  doc.text(`# ${invoice.invoiceNumber}`, 380, 52, { align: 'right' });
  doc.text(`${formatDate(invoice.invoiceDate)}`, 380, 66, { align: 'right' });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 80, { align: 'right' });
  doc.moveTo(40, 115).lineTo(555, 115).lineWidth(2).stroke('#000000');
  let y = 130;
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold').text('BILL TO', 40, y);
  doc.fontSize(12).text(client.name || '', 40, y + 16);
  doc.fontSize(9).font('Helvetica').fillColor('#555555');
  y += 34;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y, { width: 250 }); y += 28; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }
  renderMonochromeTable(doc, data, layout, y + 15);
  doc.moveTo(40, 780).lineTo(555, 780).lineWidth(2).stroke('#000000');
  if (layout.footerText) doc.fontSize(8).font('Helvetica').fillColor('#888888').text(layout.footerText, 40, 790, { align: 'center', width: 515 });
}

function renderMonochromeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, layout: any, startY: number) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Tax', 'Amount'];
  doc.rect(40, startY, 515, 20).fill('#000000');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  const items = (invoice.items || []) as unknown as InvoiceItem[];
  items.forEach((item: InvoiceItem, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#f5f5f5');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.3).stroke('#dddddd');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 6) doc.font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 6) doc.font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });
  doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(1).stroke('#000000');
  rowY += 10;
  const tx = 370;
  doc.fontSize(9).fillColor('#555555');
  doc.text('Subtotal', tx, rowY);
  doc.fillColor('#000000').text(formatCurrency(invoice.subtotal || 0), tx + 120, rowY, { align: 'right', width: 120 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#555555').text('Discount', tx, rowY); doc.fillColor('#000000').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, rowY, { align: 'right', width: 120 }); rowY += 16; }
  doc.fillColor('#555555').text('Tax', tx, rowY);
  doc.fillColor('#000000').text(formatCurrency(invoice.taxAmount || 0), tx + 120, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.moveTo(tx, rowY).lineTo(555, rowY).lineWidth(2).stroke('#000000');
  rowY += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text('TOTAL', tx, rowY);
  doc.text(formatCurrency(invoice.total || 0), tx + 120, rowY, { align: 'right', width: 120 });
  if (invoice.notes) { rowY += 30; doc.fontSize(8).font('Helvetica-Bold').text('Notes', 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#555555').text(invoice.notes, 40, rowY + 14, { width: 515 }); }
}

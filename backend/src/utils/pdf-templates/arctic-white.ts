// Template 12: ARCTIC WHITE
// Layout: Frost blue strip header (thin, elegant), ultra-clean white body,
// airy spacing, minimal table with frost blue header, lots of whitespace,
// subtle rounded feel with soft colors
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderArcticWhite(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#1e40af';
  const ac = data.template?.layout?.accentColor || '#dbeafe';

  // ── Frost blue strip header ──
  doc.rect(0, 0, 595, 6).fill(pc);
  doc.rect(0, 6, 595, 3).fill(ac);

  // ── Business: large, airy ──
  doc.fillColor(pc).fontSize(24).font('Helvetica').text(business.name || 'Company', 40, 30);
  doc.fontSize(8).font('Helvetica').fillColor('#93c5fd');
  let y = 58;
  if (business.address) { doc.text(business.address, 40, y); y += 12; }
  if (business.gstNumber) { doc.text(`GST: ${business.gstNumber}`, 40, y); y += 12; }
  if (business.phone) { doc.text(business.phone, 40, y); }

  // Invoice details right
  doc.fillColor('#1e3a8a').fontSize(9).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'Invoice'), 400, 30, { align: 'right', width: 155 });
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  doc.text(invoice.invoiceNumber, 400, 44, { align: 'right', width: 155 });
  doc.text(formatDate(invoice.invoiceDate), 400, 56, { align: 'right', width: 155 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 400, 68, { align: 'right', width: 155 });

  // ── Bill To: simple, airy ──
  y = 110;
  doc.fillColor('#93c5fd').fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'To').toUpperCase(), 40, y);
  doc.fillColor('#1e3a8a').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 13; }
  if (client.email) { doc.text(client.email, 40, y); y += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 13; }

  renderArcticWhiteTable(doc, data, y + 20, l);

  const footer = data.template?.layout?.footerText || 'Crystal clear billing, every time.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#93c5fd').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderArcticWhiteTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#1e40af';
  const cw = [28, 175, 45, 40, 65, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  doc.rect(40, startY, 515, 18).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#f8fafc');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 20; // extra airy spacing
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#64748b');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#1e3a8a').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#64748b').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#1e3a8a').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#64748b').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#1e3a8a').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.moveTo(tx, t2).lineTo(555, t2).lineWidth(0.5).stroke('#cbd5e1');
  t2 += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'Total'), tx, t2);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 28; doc.fontSize(9).font('Helvetica-Bold').fillColor('#1e3a8a').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

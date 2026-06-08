// Template 4: PROFESSIONAL
// Layout: Thin accent bar at top (10px), two-column header (business left / invoice box right),
// invoice details in a bordered box, detailed 9-col table with tax amount column,
// BILL TO in a gray ribbon bar, corporate footer
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, setFillColor, formatDate, formatCurrency, L } from './base.js';

export function renderProfessional(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#0f172a';
  const ac = data.template?.layout?.accentColor || '#0ea5e9';

  // ── Accent bar at top ──
  doc.rect(0, 0, 595, 10).fill(ac);

  // ── Two-column header ──
  doc.fillColor(pc).fontSize(16).font('Helvetica-Bold').text(business.name || 'Company', 40, 28);
  doc.fontSize(8).font('Helvetica').fillColor('#64748b');
  let y = 48;
  if (business.address) { doc.text(business.address, 40, y); y += 12; }
  if (business.gstNumber) { doc.text(`GSTIN: ${business.gstNumber}`, 40, y); y += 12; }
  if (business.phone) { doc.text(`Tel: ${business.phone}`, 40, y); }

  // ── Invoice details box (right side) ──
  doc.rect(350, 24, 205, 75).fill('#f8fafc').stroke('#e2e8f0');
  doc.fillColor('#64748b').fontSize(7).font('Helvetica').text(l('labelInvoiceTitle', 'INVOICE NUMBER').toUpperCase(), 360, 32);
  doc.fillColor(pc).fontSize(11).font('Helvetica-Bold').text(invoice.invoiceNumber, 360, 42);
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text('DATE', 470, 32);
  doc.fillColor('#1e293b').fontSize(9).text(formatDate(invoice.invoiceDate), 470, 42);
  doc.fontSize(7).fillColor('#64748b').text('DUE DATE', 360, 60);
  doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(formatDate(invoice.dueDate), 360, 70);
  doc.text('STATUS', 470, 60);
  doc.fillColor(ac).fontSize(9).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 470, 70);

  // ── Bill To: ribbon bar style ──
  y = 120;
  doc.rect(40, y, 245, 12).fill('#f1f5f9');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'BILL TO'), 48, y + 2);
  doc.fillColor('#334155').fontSize(9).font('Helvetica');
  let by = y + 20;
  if (client.name) { doc.font('Helvetica-Bold').text(client.name, 48, by); doc.font('Helvetica'); by += 14; }
  if (client.company) { doc.text(client.company, 48, by); by += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 48, by, { width: 230 }); by += 28; }
  if (client.gstNumber) { doc.text(`GSTIN: ${client.gstNumber}`, 48, by); by += 14; }
  if (client.email) { doc.text(client.email, 48, by); }

  // ── Detailed 9-col table ──
  renderProfessionalTable(doc, data, Math.max(by + 30, 140), l);

  // Footer with accent bar
  doc.rect(0, 790, 595, 10).fill(ac);
  const footer = data.template?.layout?.footerText || '';
  if (footer) doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(footer, 40, 810, { align: 'center', width: 515 });
}

function renderProfessionalTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#0f172a';
  const cw = [22, 130, 40, 35, 55, 40, 40, 65, 80];
  const hdrs = ['#', 'Item / Description', 'HSN/SAC', 'Qty', 'Rate', 'Disc', 'Tax', 'Tax Amt', 'Amount'];

  doc.rect(40, startY, 515, 18).fill('#f1f5f9');
  doc.fontSize(7).font('Helvetica-Bold').fillColor(pc);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
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
  doc.text(l('labelSubtotal', 'Subtotal'), tx, rowY);
  doc.text(formatCurrency(invoice.subtotal || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.text(l('labelDiscount', 'Discount'), tx, rowY); doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, rowY, { align: 'right', width: 120 }); rowY += 16; }
  doc.text(l('labelTax', 'Tax'), tx, rowY);
  doc.text(formatCurrency(invoice.taxAmount || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 6;
  doc.moveTo(tx, rowY).lineTo(555, rowY).stroke(pc);
  rowY += 8;
  doc.fontSize(12).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'TOTAL DUE'), tx, rowY);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.moveTo(tx, rowY).lineTo(555, rowY).stroke(pc);

  if (invoice.notes) { rowY += 20; doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text(l('labelNotes', 'Notes'), 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#334155').text(invoice.notes, 40, rowY + 12, { width: 515 }); }
}

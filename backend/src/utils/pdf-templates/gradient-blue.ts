// Template 7: GRADIENT BLUE
// Layout: Two-tone blue gradient header (darker top, lighter bottom), white text,
// clean white body, blue header row, light blue alternating rows, rounded total area
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderGradientBlue(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#2563eb';
  const ac = data.template?.layout?.accentColor || '#93c5fd';

  // ── Gradient header (simulated with two rects) ──
  doc.rect(0, 0, 595, 75).fill(pc);
  doc.rect(0, 75, 595, 45).fill('#3b82f6');

  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);

  // Right side
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}`, 370, 48, { align: 'right', width: 185 });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}  ·  Due: ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // Status pill
  const sc: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  const bc = sc[invoice.status || 'Draft'] || '#6b7280';
  doc.rect(370, 88, 65, 16).fill(bc);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 370, 92, { align: 'right', width: 65 });

  // ── Bill To ──
  let y = 140;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#1e3a5f').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#64748b');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 14; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }

  renderGradientBlueTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Thank you for choosing us!';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94a3b8').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderGradientBlueTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#2563eb';
  const cw = [28, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#eff6ff' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#64748b');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#1e3a5f').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#64748b').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#1e3a5f').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#64748b').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#1e3a5f').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 28).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total Due'), tx, t2 + 8);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 8, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 45; doc.fillColor('#1e3a5f').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

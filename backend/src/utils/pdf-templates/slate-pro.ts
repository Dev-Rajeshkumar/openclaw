// Template 15: SLATE PRO
// Layout: Sharp slate gray header, compact minimal design, tight grid table,
// no-nonsense corporate, small fonts, dense layout, efficient space usage
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderSlatePro(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#334155';
  const ac = data.template?.layout?.accentColor || '#94a3b8';

  // ── Sharp slate header ──
  doc.rect(0, 0, 595, 8).fill(pc);
  doc.fillColor(pc).fontSize(18).font('Helvetica-Bold').text(business.name || 'Company', 40, 22);
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  let y = 42;
  if (business.address) { doc.text(business.address, 40, y); y += 10; }
  if (business.gstNumber) { doc.text(`GST: ${business.gstNumber}`, 40, y); y += 10; }
  if (business.phone) { doc.text(business.phone, 40, y); }

  doc.fillColor(pc).fontSize(16).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 380, 22, { align: 'right', width: 175 });
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  doc.text(invoice.invoiceNumber, 380, 42, { align: 'right', width: 175 });
  doc.text(formatDate(invoice.invoiceDate), 380, 52, { align: 'right', width: 175 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 380, 62, { align: 'right', width: 175 });

  // ── Bill To: compact ──
  y = 90;
  doc.fillColor(ac).fontSize(7).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(client.name || '', 40, y + 10);
  doc.fontSize(7).font('Helvetica').fillColor('#64748b');
  y += 24;
  if (client.company) { doc.text(client.company, 40, y); y += 10; }
  if (client.email) { doc.text(client.email, 40, y); y += 10; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 10; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 10; }

  renderSlateProTable(doc, data, y + 10, l);

  doc.rect(0, 795, 595, 3).fill(pc);
  const footer = data.template?.layout?.footerText || 'Precision billing for modern businesses.';
  if (footer) doc.fontSize(7).font('Helvetica').fillColor('#94a3b8').text(footer, 40, 805, { align: 'center', width: 515 });
}

function renderSlateProTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#334155';
  const cw = [22, 175, 40, 35, 55, 35, 35, 110];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc', 'Tax', 'Amount'];

  doc.rect(40, startY, 515, 16).fill(pc);
  doc.fontSize(6).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 18;
  doc.font('Helvetica').fontSize(7).fillColor('#334155');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 14).fill('#f8fafc');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.2).stroke('#e2e8f0');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 3, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 14;
  });

  const tx = 380, ty = rowY + 8;
  doc.fontSize(8).fillColor('#64748b');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#1e293b').text(formatCurrency(invoice.subtotal || 0), tx + 100, ty, { align: 'right', width: 120 });
  let t2 = ty + 13;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#64748b').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#1e293b').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 100, t2, { align: 'right', width: 120 }); t2 += 13; }
  doc.fillColor('#64748b').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#1e293b').text(formatCurrency(invoice.taxAmount || 0), tx + 100, t2, { align: 'right', width: 120 });
  t2 += 5;
  doc.moveTo(tx, t2).lineTo(555, t2).lineWidth(1.5).stroke(pc);
  t2 += 6;
  doc.fontSize(11).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'TOTAL'), tx, t2);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 20; doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e293b').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(7).fillColor('#64748b').text(invoice.notes, 40, t2 + 10, { width: 515 }); }
}

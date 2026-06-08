// Template 11: TECH CYAN
// Layout: Dark slate header with cyan accent blocks (left and right sides),
// tech/grid aesthetic, cyan-highlighted table header, monospace-style numbers,
// grid-lines table, futuristic feel
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderTechCyan(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#0e7490';
  const ac = data.template?.layout?.accentColor || '#22d3ee';

  // ── Dark slate header with cyan blocks ──
  doc.rect(0, 0, 595, 110).fill('#1e293b');
  doc.rect(0, 0, 12, 110).fill(ac);
  doc.rect(583, 0, 12, 110).fill(ac);

  doc.fillColor(ac).fontSize(10).font('Helvetica-Bold').text('// ' + (business.name || 'Company').toUpperCase(), 40, 20);
  doc.fillColor('#94a3b8').fontSize(8).font('Helvetica');
  if (business.address) doc.text(business.address, 40, 38);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 52);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor(ac);
  doc.text(`ID: ${invoice.invoiceNumber}`, 370, 46, { align: 'right', width: 185 });
  doc.fillColor('#94a3b8');
  doc.text(`DATE: ${formatDate(invoice.invoiceDate)}`, 370, 60, { align: 'right', width: 185 });
  doc.text(`DUE: ${formatDate(invoice.dueDate)}`, 370, 74, { align: 'right', width: 185 });

  // Status
  const sc: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#64748b', Overdue: '#ef4444', Cancelled: '#64748b', PartiallyPaid: '#f59e0b' };
  doc.rect(370, 86, 60, 14).fill(sc[invoice.status || 'Draft'] || '#64748b');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 370, 89, { align: 'right', width: 60 });

  // ── Bill To ──
  let y = 130;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text('> ' + l('labelBillTo', 'CLIENT'), 40, y);
  doc.fillColor('#e2e8f0').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(8).font('Helvetica').fillColor('#94a3b8');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 12; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 12; }
  if (client.email) { doc.text(client.email, 40, y); y += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 12; }

  renderTechCyanTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Innovation delivered, satisfaction guaranteed.';
  if (footer) doc.fontSize(7).font('Helvetica').fillColor('#64748b').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderTechCyanTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#0e7490';
  const ac = data.template?.layout?.accentColor || '#22d3ee';
  const cw = [25, 165, 45, 40, 60, 40, 40, 90];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc', 'Tax', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(ac);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#1e293b');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.2).stroke('#334155');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.fillColor(ac).font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.fillColor('#cbd5e1').font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });

  doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.5).stroke(ac);
  rowY += 10;
  const tx = 380;
  doc.fontSize(9).fillColor('#94a3b8');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, rowY);
  doc.fillColor('#e2e8f0').text(formatCurrency(invoice.subtotal || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#94a3b8').text(l('labelDiscount', 'Disc'), tx, rowY); doc.fillColor('#e2e8f0').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, rowY, { align: 'right', width: 120 }); rowY += 16; }
  doc.fillColor('#94a3b8').text(l('labelTax', 'Tax'), tx, rowY);
  doc.fillColor('#e2e8f0').text(formatCurrency(invoice.taxAmount || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.rect(tx - 10, rowY, 240, 26).fill(pc);
  doc.fillColor(ac).fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL'), tx, rowY + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, rowY + 7, { align: 'right', width: 130 });

  if (invoice.notes) { rowY += 42; doc.fillColor('#e2e8f0').fontSize(9).font('Helvetica-Bold').text('// ' + l('labelNotes', 'Notes'), 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(invoice.notes, 40, rowY + 14, { width: 515 }); }
}

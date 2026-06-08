// Template 17: NEON EDGE
// Layout: Full dark header (140px), neon lime green accents, dark table with
// neon grid lines, startup aesthetic, bold uppercase labels, neon total box
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderNeonEdge(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#18181b';
  const ac = data.template?.layout?.accentColor || '#a3e635';

  // ── Full dark header ──
  doc.rect(0, 0, 595, 140).fill(pc);
  doc.rect(0, 0, 595, 4).fill(ac);
  doc.rect(0, 136, 595, 4).fill(ac);

  doc.fillColor(ac).fontSize(10).font('Helvetica-Bold').text('// ' + (business.name || 'Company').toUpperCase(), 40, 20);
  doc.fillColor('#71717a').fontSize(8).font('Helvetica');
  if (business.address) doc.text(business.address, 40, 38);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 52);

  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor(ac);
  doc.text(invoice.invoiceNumber, 370, 50, { align: 'right', width: 185 });
  doc.fillColor('#71717a');
  doc.text(`DATE: ${formatDate(invoice.invoiceDate)}`, 370, 64, { align: 'right', width: 185 });
  doc.text(`DUE: ${formatDate(invoice.dueDate)}`, 370, 78, { align: 'right', width: 185 });

  // Status
  const sc: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#52525b', Overdue: '#ef4444', Cancelled: '#52525b', PartiallyPaid: '#f59e0b' };
  doc.rect(370, 92, 70, 18).fill(sc[invoice.status || 'Draft'] || '#52525b');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 370, 96, { align: 'right', width: 70 });

  // ── Bill To ──
  let y = 160;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text('> ' + l('labelBillTo', 'CLIENT'), 40, y);
  doc.fillColor('#fafafa').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(8).font('Helvetica').fillColor('#a1a1aa');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 12; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 12; }
  if (client.email) { doc.text(client.email, 40, y); y += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 12; }

  renderNeonEdgeTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Disrupting invoicing, one invoice at a time.';
  if (footer) doc.fontSize(7).font('Helvetica').fillColor('#52525b').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderNeonEdgeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#18181b';
  const ac = data.template?.layout?.accentColor || '#a3e635';
  const cw = [25, 165, 45, 40, 60, 40, 40, 90];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc', 'Tax', 'Amount'];

  doc.rect(40, startY, 515, 20).fill('#27272a');
  doc.rect(40, startY, 515, 2).fill(ac);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(ac);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#d4d4d8');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#27272a');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.2).stroke('#3f3f46');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.fillColor(ac).font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.fillColor('#d4d4d8').font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });

  doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(1).stroke(ac);
  rowY += 10;
  const tx = 380;
  doc.fontSize(9).fillColor('#a1a1aa');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, rowY);
  doc.fillColor('#fafafa').text(formatCurrency(invoice.subtotal || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a1a1aa').text(l('labelDiscount', 'Disc'), tx, rowY); doc.fillColor('#fafafa').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, rowY, { align: 'right', width: 120 }); rowY += 16; }
  doc.fillColor('#a1a1aa').text(l('labelTax', 'Tax'), tx, rowY);
  doc.fillColor('#fafafa').text(formatCurrency(invoice.taxAmount || 0), tx + 110, rowY, { align: 'right', width: 120 });
  rowY += 8;
  doc.rect(tx - 10, rowY, 240, 28).fill('#27272a');
  doc.rect(tx - 10, rowY, 240, 2).fill(ac);
  doc.fillColor(ac).fontSize(12).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL DUE'), tx, rowY + 9);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, rowY + 9, { align: 'right', width: 130 });

  if (invoice.notes) { rowY += 46; doc.fillColor('#fafafa').fontSize(9).font('Helvetica-Bold').text('// ' + l('labelNotes', 'Notes'), 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#a1a1aa').text(invoice.notes, 40, rowY + 14, { width: 515 }); }
}

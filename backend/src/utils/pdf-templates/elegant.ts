// Template 5: ELEGANT
// Layout: Centered header with decorative accent line, centered "Invoice" title,
// double-line table header, 6-col table, refined totals with accent-colored total line
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, setFillColor, formatDate, formatCurrency, L } from './base.js';

export function renderElegant(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#7c3aed';
  const ac = data.template?.layout?.accentColor || '#a78bfa';

  // ── Centered header ──
  doc.font('Helvetica');
  doc.fillColor(pc).fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 0, 35, { align: 'center' });
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 0, 58, { align: 'center' });
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 0, 72, { align: 'center' });

  // Decorative accent line
  doc.moveTo(200, 90).lineTo(395, 90).lineWidth(1).stroke(ac);

  // Centered invoice title
  doc.fillColor(pc).fontSize(16).font('Helvetica').text(l('labelInvoiceTitle', 'Invoice'), 0, 108, { align: 'center' });
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(`# ${invoice.invoiceNumber}  ·  ${formatDate(invoice.invoiceDate)}`, 0, 128, { align: 'center' });

  // ── Bill To: accent label ──
  let y = 155;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Billed To'), 40, y);
  doc.fillColor('#111827').fontSize(11).font('Helvetica').text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  let cy = y + 30;
  if (client.company) { doc.text(client.company, 40, cy); cy += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 250 }); cy += 26; }
  if (client.email) { doc.text(client.email, 40, cy); cy += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); }

  // ── Elegant table with double-line header ──
  renderElegantTable(doc, data, Math.max(cy + 20, 240), l);

  // Footer
  const footer = data.template?.layout?.footerText || '';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(footer, 40, 770, { align: 'center', width: 515 });
}

function renderElegantTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#7c3aed';
  const cw = [30, 170, 45, 40, 65, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  // Double line header
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(1.5).stroke(pc);
  doc.moveTo(40, startY + 3).lineTo(555, startY + 3).lineWidth(0.3).stroke(pc);
  startY += 10;

  doc.fontSize(7).font('Helvetica-Bold').fillColor(pc);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  startY += 16;
  doc.moveTo(40, startY).lineTo(555, startY).lineWidth(0.3).stroke('#e5e7eb');

  let rowY = startY + 6;
  doc.font('Helvetica').fontSize(9).fillColor('#374151');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 14;
    doc.moveTo(40, rowY).lineTo(555, rowY).lineWidth(0.2).stroke('#f3f4f6');
    rowY += 4;
  });

  // Totals with accent-colored total line
  rowY += 10;
  doc.moveTo(350, rowY).lineTo(555, rowY).lineWidth(0.3).stroke('#e5e7eb');
  rowY += 10;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(l('labelSubtotal', 'Subtotal'), 350, rowY);
  doc.fillColor('#374151').text(formatCurrency(invoice.subtotal || 0), 420, rowY, { align: 'right', width: 135 });
  rowY += 16;
  doc.fillColor('#6b7280').text(l('labelTax', 'Tax'), 350, rowY);
  doc.fillColor('#374151').text(formatCurrency(invoice.taxAmount || 0), 420, rowY, { align: 'right', width: 135 });
  rowY += 6;
  doc.moveTo(350, rowY).lineTo(555, rowY).lineWidth(1.5).stroke(pc);
  rowY += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'Total'), 350, rowY);
  doc.text(formatCurrency(invoice.total || 0), 420, rowY, { align: 'right', width: 135 });

  if (invoice.notes) { rowY += 25; doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(invoice.notes, 40, rowY, { width: 515 }); }
}

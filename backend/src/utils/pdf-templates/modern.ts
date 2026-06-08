// Template 2: MODERN
// Layout: Full-width colored banner header (120px), white text on banner,
// striped table rows, colored total box, BILL TO in uppercase with accent label
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, setFillColor, formatDate, formatCurrency, L } from './base.js';

export function renderModern(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#6366f1';
  const ac = data.template?.layout?.accentColor || '#818cf8';

  // ── Full-width banner header ──
  doc.rect(0, 0, 595, 120).fill(pc);
  doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(business.name || 'Company', 40, 25);
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 70);

  // Invoice details on banner right
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 350, 25, { align: 'right', width: 205 });
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}`, 350, 52, { align: 'right', width: 205 });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 350, 66, { align: 'right', width: 205 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 350, 80, { align: 'right', width: 205 });

  // Status badge on banner
  const statusColors: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  const bc = statusColors[invoice.status || 'Draft'] || '#6b7280';
  doc.rect(350, 92, 70, 16).fill(bc);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 350, 96, { align: 'right', width: 70 });

  // ── Bill To: uppercase accent label ──
  let y = 140;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'BILL TO').toUpperCase(), 40, y);
  doc.fillColor('#111827').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#4b5563');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 14; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }

  // ── Striped table ──
  renderModernTable(doc, data, y + 15, l);

  // Footer
  const footer = data.template?.layout?.footerText || 'Thank you for your business!';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9ca3af').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderModernTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#6366f1';
  const cw = [30, 160, 45, 40, 65, 45, 45, 80];
  const hdrs = ['#', 'DESCRIPTION', 'HSN', 'QTY', 'RATE', 'DISC', 'TAX', 'AMT'];

  doc.rect(40, startY, 515, 22).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#374151');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY, 515, 18).fill('#f3f4f6');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });

  doc.moveTo(40, rowY).lineTo(555, rowY).stroke('#e5e7eb');

  // ── Total box ──
  const tx = 375, ty = rowY + 15;
  doc.fontSize(9).fillColor('#374151');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.text(formatCurrency(invoice.subtotal || 0), tx + 120, ty, { align: 'right', width: 100 });
  let t2 = ty + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.text(l('labelDiscount', 'Discount'), tx, t2); doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 100 }); t2 += 18; }
  doc.text(l('labelTax', 'Tax'), tx, t2);
  doc.text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 100 });
  t2 += 6;
  doc.rect(tx - 10, t2, 240, 28).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL'), tx, t2 + 8);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 8, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 45; doc.fillColor('#111827').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6b7280').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

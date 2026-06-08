// Template 8: FOREST GREEN
// Layout: Green left accent bar (8px full page height), green header accent,
// client info in a soft green box, green-tinted alternating table rows,
// total in green banner, organic feel
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderForestGreen(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#166534';
  const ac = data.template?.layout?.accentColor || '#22c55e';

  // ── Left accent bar (full height) ──
  doc.rect(0, 0, 8, 842).fill(pc);

  // ── Header: indented from accent bar ──
  doc.fillColor(pc).fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 50, 35);
  doc.fontSize(8).font('Helvetica').fillColor('#15803d');
  let y = 58;
  if (business.address) { doc.text(business.address, 50, y); y += 12; }
  if (business.gstNumber) { doc.text(`GST: ${business.gstNumber}`, 50, y); y += 12; }
  if (business.phone) { doc.text(`Phone: ${business.phone}`, 50, y); }

  // Invoice title right
  doc.fillColor(pc).fontSize(22).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 360, 35, { align: 'right', width: 195 });
  doc.fontSize(9).font('Helvetica').fillColor('#15803d');
  doc.text(`# ${invoice.invoiceNumber}`, 360, 62, { align: 'right', width: 195 });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 360, 76, { align: 'right', width: 195 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 360, 90, { align: 'right', width: 195 });

  // Status badge
  const sc: Record<string, string> = { Paid: '#16a34a', Sent: '#2563eb', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  const bc = sc[invoice.status || 'Draft'] || '#6b7280';
  doc.rect(360, 102, 60, 14).fill(bc);
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 360, 105, { align: 'right', width: 60 });

  // ── Bill To: in a soft green box ──
  y = 135;
  doc.rect(50, y, 505, 80).fill('#f0fdf4').stroke('#bbf7d0');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 60, y + 8);
  doc.fillColor('#14532d').fontSize(11).font('Helvetica-Bold').text(client.name || '', 60, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#15803d');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 60, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 60, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 60, cy); }
  if (client.billingAddress) { doc.text(client.billingAddress, 250, y + 38, { width: 150 }); }

  renderForestGreenTable(doc, data, y + 95, l);

  const footer = data.template?.layout?.footerText || 'Growing together with our clients.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#15803d').text(footer, 50, 765, { align: 'center', width: 505 });
}

function renderForestGreenTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#166534';
  const cw = [28, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#14532d');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#f0fdf4');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#15803d');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#14532d').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#15803d').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#14532d').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#15803d').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#14532d').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#14532d').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 50, t2); doc.font('Helvetica').fontSize(8).fillColor('#15803d').text(invoice.notes, 50, t2 + 14, { width: 505 }); }
}

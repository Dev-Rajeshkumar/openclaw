// Template 13: MIDNIGHT PURPLE
// Layout: Deep purple executive header, gold trim accent, client info in a
// sidebar-style box on the right, executive grid table, gold-highlighted total
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderMidnightPurple(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#3b0764';
  const ac = data.template?.layout?.accentColor || '#d97706';

  // ── Deep purple executive header ──
  doc.rect(0, 0, 595, 105).fill(pc);
  doc.rect(0, 105, 595, 3).fill(ac);

  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#c4b5fd');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);

  doc.fillColor(ac).fontSize(18).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 22, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor('#c4b5fd');
  doc.text(`# ${invoice.invoiceNumber}`, 370, 48, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // ── Two-column: Bill To left, Invoice meta right ──
  let y = 125;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(8).font('Helvetica').fillColor('#4c1d95');
  let cy = y + 30;
  if (client.company) { doc.text(client.company, 40, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 40, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); cy += 12; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 200 }); }

  // Status badge right
  const sc: Record<string, string> = { Paid: '#16a34a', Sent: '#2563eb', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  doc.rect(370, y, 70, 18).fill(sc[invoice.status || 'Draft'] || '#6b7280');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 370, y + 4, { align: 'right', width: 70 });

  renderMidnightPurpleTable(doc, data, Math.max(cy + 20, 140), l);

  const footer = data.template?.layout?.footerText || 'Excellence in every detail.';
  if (footer) doc.fontSize(8).font('Helvetica').fillColor('#7c3aed').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderMidnightPurpleTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#3b0764';
  const ac = data.template?.layout?.accentColor || '#d97706';
  const cw = [25, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(ac);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#1e1b4b');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#faf5ff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#4c1d95');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#1e1b4b').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#4c1d95').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#1e1b4b').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#4c1d95').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#1e1b4b').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.fillColor(ac).fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total Due'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#1e1b4b').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#4c1d95').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

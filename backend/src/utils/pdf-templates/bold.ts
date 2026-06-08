// Template 6: BOLD
// Layout: Full-bleed black header (130px), gold accent, white text on dark,
// dark-themed table with gold highlights, bold uppercase labels, gold total box
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderBold(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const ac = data.template?.layout?.accentColor || '#f59e0b';

  // ── Full-bleed black header ──
  doc.rect(0, 0, 595, 130).fill('#000000');
  doc.fillColor('#ffffff').fontSize(26).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 40, 55);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 70);

  // Gold accent line
  doc.moveTo(40, 90).lineTo(200, 90).lineWidth(2).stroke(ac);

  // Invoice title right
  doc.fillColor(ac).fontSize(22).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 350, 25, { align: 'right', width: 205 });
  doc.fontSize(9).font('Helvetica').fillColor('#9ca3af');
  doc.text(`# ${invoice.invoiceNumber}`, 350, 55, { align: 'right', width: 205 });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 350, 69, { align: 'right', width: 205 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 350, 83, { align: 'right', width: 205 });

  // Status badge: gold on black
  doc.rect(350, 96, 70, 18).fill(ac);
  doc.fillColor('#000000').fontSize(8).font('Helvetica-Bold').text((invoice.status || 'Draft').toUpperCase(), 350, 100, { align: 'right', width: 70 });

  // ── Bill To: bold uppercase label ──
  let y = 150;
  doc.fillColor(ac).fontSize(9).font('Helvetica-Bold').text(l('labelBillTo', 'BILL TO').toUpperCase(), 40, y);
  doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 16);
  doc.fontSize(9).font('Helvetica').fillColor('#a3a3a3');
  y += 34;
  if (client.company) { doc.text(client.company, 40, y); y += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 14; }
  if (client.email) { doc.text(client.email, 40, y); y += 14; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 14; }

  // ── Dark-themed table ──
  renderBoldTable(doc, data, y + 15, l);

  // Footer
  const footer = data.template?.layout?.footerText || 'We value your business!';
  if (footer) doc.fontSize(8).font('Helvetica').fillColor('#525252').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderBoldTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const ac = data.template?.layout?.accentColor || '#f59e0b';
  const cw = [28, 165, 45, 40, 65, 45, 45, 80];
  const hdrs = ['#', 'DESCRIPTION', 'HSN', 'QTY', 'RATE', 'DISC', 'TAX', 'AMT'];

  doc.rect(40, startY, 515, 22).fill(ac);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#000000');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 24;
  doc.font('Helvetica').fontSize(8).fillColor('#d4d4d4');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY, 515, 18).fill('#1a1a1a');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) { doc.fillColor(ac).font('Helvetica-Bold'); } doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) { doc.fillColor('#d4d4d4').font('Helvetica'); } vx += cw[i]; });
    rowY += 18;
  });

  // Gold total box
  const tx = 375, ty = rowY + 15;
  doc.fontSize(9).fillColor('#a3a3a3');
  doc.text(l('labelSubtotal', 'SUBTOTAL'), tx, ty);
  doc.fillColor('#d4d4d4').text(formatCurrency(invoice.subtotal || 0), tx + 120, ty, { align: 'right', width: 100 });
  let t2 = ty + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a3a3a3').text(l('labelDiscount', 'DISCOUNT'), tx, t2); doc.fillColor('#d4d4d4').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 120, t2, { align: 'right', width: 100 }); t2 += 18; }
  doc.fillColor('#a3a3a3').text(l('labelTax', 'TAX'), tx, t2);
  doc.fillColor('#d4d4d4').text(formatCurrency(invoice.taxAmount || 0), tx + 120, t2, { align: 'right', width: 100 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 30).fill(ac);
  doc.fillColor('#000000').fontSize(12).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL'), tx, t2 + 9);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2 + 9, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 48; doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'NOTES'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#a3a3a3').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

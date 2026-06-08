// Template 10: ROSE GOLD
// Layout: Deep rose header with pink-tinted bill-to section, luxury spacing,
// refined table with rose-colored header, elegant totals with rose gold accent line
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderRoseGold(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#9f1239';
  const ac = data.template?.layout?.accentColor || '#fda4af';

  // ── Deep rose header ──
  doc.rect(0, 0, 595, 100).fill(pc);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica').text(l('labelInvoiceTitle', 'Invoice'), 370, 22, { align: 'right', width: 185 });
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}`, 370, 48, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // ── Bill To: pink-tinted luxury box ──
  let y = 118;
  doc.rect(40, y, 515, 75).fill('#fff1f2').stroke('#fecdd3');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Billed To').toUpperCase(), 50, y + 8);
  doc.fillColor('#4c0519').fontSize(12).font('Helvetica-Bold').text(client.name || '', 50, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#881337');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 50, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 50, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, cy); }
  if (client.billingAddress) { doc.text(client.billingAddress, 280, y + 38, { width: 150 }); }

  renderRoseGoldTable(doc, data, y + 90, l);

  const footer = data.template?.layout?.footerText || 'Crafted with care for our valued clients.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9f1239').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderRoseGoldTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#9f1239';
  const ac = data.template?.layout?.accentColor || '#fda4af';
  const cw = [28, 175, 45, 40, 65, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#4c0519');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#fff1f2');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#881337');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#4c0519').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#881337').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#4c0519').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#881337').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#4c0519').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 6;
  doc.moveTo(tx, t2).lineTo(555, t2).lineWidth(1.5).stroke(ac);
  t2 += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'Total Amount'), tx, t2);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 25; doc.fontSize(8).font('Helvetica-Oblique').fillColor('#881337').text(invoice.notes, 40, t2, { width: 515 }); }
}

// Template 22: MONOCHROME
// Layout: Pure black and white, sharp black header, clean BW table,
// maximum contrast, no color at all, sharp lines, sophisticated minimalism
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderMonochrome(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);

  // ── Sharp black header ──
  doc.rect(0, 0, 595, 85).fill('#000000');

  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 15);
  doc.fontSize(8).font('Helvetica').fillColor('#a3a3a3');
  if (business.address) doc.text(business.address, 40, 45);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 58);

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 18, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor('#a3a3a3');
  doc.text(invoice.invoiceNumber, 370, 46, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 60, { align: 'right', width: 185 });

  // Thin white line separator
  doc.moveTo(40, 80).lineTo(555, 80).lineWidth(0.5).stroke('#333333');

  // ── Bill To: simple, no box ──
  let y = 100;
  doc.fillColor('#525252').fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#000000').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(8).font('Helvetica').fillColor('#525252');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 12; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 12; }
  if (client.email) { doc.text(client.email, 40, y); y += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 12; }

  renderMonochromeTable(doc, data, y + 15, l);

  doc.rect(0, 795, 595, 2).fill('#000000');
  const footer = data.template?.layout?.footerText || 'Simplicity is the ultimate sophistication.';
  if (footer) doc.fontSize(8).font('Helvetica').fillColor('#737373').text(footer, 40, 805, { align: 'center', width: 515 });
}

function renderMonochromeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const cw = [25, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill('#000000');
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#000000');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#f5f5f5');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.2).stroke('#d4d4d4');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#525252');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#000000').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#525252').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#000000').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#525252').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#000000').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.moveTo(tx, t2).lineTo(555, t2).lineWidth(2).stroke('#000000');
  t2 += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor('#000000');
  doc.text(l('labelTotal', 'TOTAL'), tx, t2);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 25; doc.fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#525252').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

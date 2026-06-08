// Template 18: OCEAN BREEZE
// Layout: Aqua wave-style header (3 flowing layers), light aqua table header,
// flowing rows with wave-like spacing, calming blue tones, aqua total
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderOceanBreeze(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#0369a1';
  const ac = data.template?.layout?.accentColor || '#67e8f9';

  // ── Aqua wave header (3 layers) ──
  doc.rect(0, 0, 595, 50).fill(pc);
  doc.rect(0, 50, 595, 35).fill('#0891b2');
  doc.rect(0, 85, 595, 30).fill('#06b6d4');

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 12);
  doc.fontSize(8).font('Helvetica').fillColor('#cffafe');
  if (business.address) doc.text(business.address, 40, 58);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 72);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'Invoice'), 370, 15, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor('#cffafe');
  doc.text(`# ${invoice.invoiceNumber}`, 370, 42, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 56, { align: 'right', width: 185 });

  // ── Bill To ──
  let y = 135;
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#164e63').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#0e7490');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 13; }
  if (client.email) { doc.text(client.email, 40, y); y += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 13; }

  renderOceanBreezeTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Smooth sailing with every transaction.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#0e7490').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderOceanBreezeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#0369a1';
  const ac = data.template?.layout?.accentColor || '#67e8f9';
  const cw = [28, 175, 45, 40, 65, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  doc.rect(40, startY, 515, 18).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#164e63');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#ecfeff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 20;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#0e7490');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#164e63').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#0e7490').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#164e63').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#0e7490').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#164e63').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#164e63').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#0e7490').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

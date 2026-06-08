// Template 20: GUNMETAL
// Layout: Industrial dark header with copper accents, solid grid table,
// bold typography, strong lines, industrial feel, copper total box
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderGunmetal(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#1c1917';
  const ac = data.template?.layout?.accentColor || '#f59e0b';

  // ── Industrial dark header ──
  doc.rect(0, 0, 595, 95).fill(pc);
  doc.rect(0, 95, 595, 4).fill(ac);

  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#a8a29e');
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);

  doc.fillColor(ac).fontSize(20).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor('#a8a29e');
  doc.text(invoice.invoiceNumber, 370, 48, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // ── Bill To: industrial box ──
  let y = 115;
  doc.rect(40, y, 515, 70).fill('#292524').stroke('#44403c');
  doc.fillColor(ac).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 50, y + 8);
  doc.fillColor('#fafaf9').fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#a8a29e');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 50, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 50, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, cy); }

  renderGunmetalTable(doc, data, y + 85, l);

  doc.rect(0, 795, 595, 4).fill(ac);
  const footer = data.template?.layout?.footerText || 'Built strong. Billed right.';
  if (footer) doc.fontSize(8).font('Helvetica').fillColor('#57534e').text(footer, 40, 805, { align: 'center', width: 515 });
}

function renderGunmetalTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#1c1917';
  const ac = data.template?.layout?.accentColor || '#f59e0b';
  const cw = [25, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.rect(40, startY, 515, 2).fill(ac);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(ac);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 6, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#d6d3d1');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#292524');
    doc.moveTo(40, rowY - 1).lineTo(555, rowY - 1).lineWidth(0.3).stroke('#44403c');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { if (i === 7) doc.fillColor(ac).font('Helvetica-Bold'); doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); if (i === 7) doc.fillColor('#d6d3d1').font('Helvetica'); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#a8a29e');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#fafaf9').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#a8a29e').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#fafaf9').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#a8a29e').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#fafaf9').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.rect(tx - 10, t2, 240, 2).fill(ac);
  doc.fillColor(ac).fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'TOTAL'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#fafaf9').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#a8a29e').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

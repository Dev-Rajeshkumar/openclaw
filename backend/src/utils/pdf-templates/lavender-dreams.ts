// Template 21: LAVENDER DREAMS
// Layout: Soft purple gradient header (two-tone), gentle lavender-tinted rows,
// wellness/beauty brand feel, soft spacing, elegant centered layout
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderLavenderDreams(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#6d28d9';
  const ac = data.template?.layout?.accentColor || '#c4b5fd';

  // ── Soft purple gradient header ──
  doc.rect(0, 0, 595, 70).fill(pc);
  doc.rect(0, 70, 595, 40).fill('#7c3aed');

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 15);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 45);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 58);

  doc.fillColor('#ffffff').fontSize(16).font('Helvetica').text(l('labelInvoiceTitle', 'Invoice'), 0, 78, { align: 'center', width: 595 });
  doc.fontSize(8).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}  ·  ${formatDate(invoice.invoiceDate)}`, 0, 98, { align: 'center', width: 595 });

  // ── Bill To: soft lavender box ──
  let y = 128;
  doc.rect(40, y, 515, 70).fill('#f5f3ff').stroke('#ddd6fe');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Valued Client'), 50, y + 8);
  doc.fillColor('#2e1065').fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#6d28d9');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 50, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 50, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, cy); }

  renderLavenderDreamsTable(doc, data, y + 85, l);

  const footer = data.template?.layout?.footerText || 'Care in every transaction.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#7c3aed').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderLavenderDreamsTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#6d28d9';
  const cw = [28, 175, 45, 40, 65, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  doc.rect(40, startY, 515, 18).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#2e1065');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#f5f3ff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 20;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#6d28d9');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#2e1065').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 18;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#6d28d9').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#2e1065').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 18; }
  doc.fillColor('#6d28d9').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#2e1065').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#2e1065').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#6d28d9').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

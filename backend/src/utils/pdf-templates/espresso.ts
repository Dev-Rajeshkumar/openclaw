// Template 16: ESPRESSO
// Layout: Rich brown header, cream-toned body, warm brown table header,
// cozy premium feel, cream alternating rows, warm total box
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderEspresso(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#78350f';
  const ac = data.template?.layout?.accentColor || '#fbbf24';

  // ── Rich brown header ──
  doc.rect(0, 0, 595, 100).fill(pc);
  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica').fillColor('#fde68a');
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);

  doc.fillColor(ac).fontSize(18).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(8).font('Helvetica').fillColor('#fde68a');
  doc.text(`# ${invoice.invoiceNumber}`, 370, 46, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 60, { align: 'right', width: 185 });

  // ── Bill To: warm cream box ──
  let y = 118;
  doc.rect(40, y, 515, 70).fill('#fffbeb').stroke('#fde68a');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 50, y + 8);
  doc.fillColor('#451a03').fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#92400e');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 50, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 50, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, cy); }
  if (client.billingAddress) { doc.text(client.billingAddress, 280, y + 38, { width: 150 }); }

  renderEspressoTable(doc, data, y + 85, l);

  const footer = data.template?.layout?.footerText || 'Brewed to perfection for your business.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#92400e').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderEspressoTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#78350f';
  const ac = data.template?.layout?.accentColor || '#fbbf24';
  const cw = [28, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor(ac);
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#451a03');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#fffbeb');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#92400e');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#451a03').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#92400e').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#451a03').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#92400e').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#451a03').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(pc);
  doc.fillColor(ac).fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#451a03').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#92400e').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

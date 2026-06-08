// Template 19: CHERRY BLOSSOM
// Layout: Pink sakura header with decorative elements, delicate pink-tinted rows,
// soft rounded feel, Japanese aesthetic, elegant centered invoice title
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderCherryBlossom(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#be185d';
  const ac = data.template?.layout?.accentColor || '#fce7f3';

  // ── Sakura header ──
  doc.rect(0, 0, 595, 100).fill(pc);
  // Decorative circles (sakura petals)
  doc.circle(500, 30, 15).fill('#db2777');
  doc.circle(520, 50, 10).fill('#ec4899');
  doc.circle(480, 55, 8).fill('#f472b6');

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 18);
  doc.fontSize(8).font('Helvetica-Oblique').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 48);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 62);

  doc.fillColor('#ffffff').fontSize(16).font('Helvetica').text(l('labelInvoiceTitle', 'Invoice'), 370, 22, { align: 'right', width: 185 });
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}`, 370, 46, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 60, { align: 'right', width: 185 });

  // ── Bill To: soft pink box ──
  let y = 118;
  doc.rect(40, y, 515, 70).fill('#fdf2f8').stroke('#fbcfe8');
  doc.fillColor(pc).fontSize(8).font('Helvetica-Bold').text(l('labelBillTo', 'Dear Client'), 50, y + 8);
  doc.fillColor('#831843').fontSize(11).font('Helvetica-Bold').text(client.name || '', 50, y + 22);
  doc.fontSize(8).font('Helvetica').fillColor('#9d174d');
  let cy = y + 38;
  if (client.company) { doc.text(client.company, 50, cy); cy += 12; }
  if (client.email) { doc.text(client.email, 50, cy); cy += 12; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 50, cy); }

  renderCherryBlossomTable(doc, data, y + 85, l);

  const footer = data.template?.layout?.footerText || 'Beauty in every detail.';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9d174d').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderCherryBlossomTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#be185d';
  const cw = [28, 175, 45, 40, 65, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Amount'];

  doc.rect(40, startY, 515, 18).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 20;
  doc.font('Helvetica').fontSize(8).fillColor('#831843');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 1, 515, 18).fill('#fdf2f8');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#9d174d');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#831843').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#9d174d').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#831843').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#9d174d').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#831843').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 6;
  doc.moveTo(tx, t2).lineTo(555, t2).lineWidth(1.5).stroke('#f9a8d4');
  t2 += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'Total Amount'), tx, t2);
  doc.text(formatCurrency(invoice.total || 0), tx + 110, t2, { align: 'right', width: 120 });

  if (invoice.notes) { t2 += 25; doc.fontSize(8).font('Helvetica-Oblique').fillColor('#9d174d').text(invoice.notes, 40, t2, { width: 515 }); }
}

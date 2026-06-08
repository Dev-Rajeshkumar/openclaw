// Template 14: CORAL REEF
// Layout: Dual-tone header (teal left half, pink right half), vibrant colorful
// alternating rows (4 colors), rounded status badge, playful yet professional
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderCoralReef(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#0d9488';
  const ac = data.template?.layout?.accentColor || '#f472b6';

  // ── Dual-tone header ──
  doc.rect(0, 0, 298, 110).fill(pc);
  doc.rect(298, 0, 297, 110).fill(ac);

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor('#ccfbf1');
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);

  doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'Invoice'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(9).font('Helvetica').fillColor('#fce7f3');
  doc.text(`# ${invoice.invoiceNumber}`, 370, 48, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // Status: rounded pill
  const sc: Record<string, string> = { Paid: '#10b981', Sent: '#3b82f6', Draft: '#6b7280', Overdue: '#ef4444', Cancelled: '#6b7280', PartiallyPaid: '#f59e0b' };
  doc.rect(370, 80, 65, 18).fill(sc[invoice.status || 'Draft'] || '#6b7280');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 370, 84, { align: 'right', width: 65 });

  // ── Bill To ──
  let y = 130;
  doc.fillColor(pc).fontSize(9).font('Helvetica-Bold').text(l('labelBillTo', 'Hello'), 40, y);
  doc.fillColor('#134e4a').fontSize(12).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#5eead4');
  y += 32;
  if (client.company) { doc.text(client.company, 40, y); y += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 13; }
  if (client.email) { doc.text(client.email, 40, y); y += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 13; }

  renderCoralReefTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Making business a pleasure!';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#5eead4').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderCoralReefTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#0d9488';
  const ac = data.template?.layout?.accentColor || '#f472b6';
  const cw = [28, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  const rowColors = ['#f0fdfa', '#fdf2f8', '#f0f9ff', '#fefce8'];
  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#134e4a');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(rowColors[idx % 4]);
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#5eead4');
  doc.text(l('labelSubtotal', 'Subtotal'), tx, ty);
  doc.fillColor('#134e4a').text(formatCurrency(invoice.subtotal || 0), tx + 110, ty, { align: 'right', width: 120 });
  let t2 = ty + 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#5eead4').text(l('labelDiscount', 'Discount'), tx, t2); doc.fillColor('#134e4a').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 110, t2, { align: 'right', width: 120 }); t2 += 16; }
  doc.fillColor('#5eead4').text(l('labelTax', 'Tax'), tx, t2);
  doc.fillColor('#134e4a').text(formatCurrency(invoice.taxAmount || 0), tx + 110, t2, { align: 'right', width: 120 });
  t2 += 8;
  doc.rect(tx - 10, t2, 240, 26).fill(ac);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total'), tx, t2 + 7);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, t2 + 7, { align: 'right', width: 130 });

  if (invoice.notes) { t2 += 42; doc.fillColor('#134e4a').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, t2); doc.font('Helvetica').fontSize(8).fillColor('#5eead4').text(invoice.notes, 40, t2 + 14, { width: 515 }); }
}

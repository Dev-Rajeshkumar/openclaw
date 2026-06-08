// Template 9: SUNSET ORANGE
// Layout: Warm orange banner header, cream-toned body background feel,
// dot-leader lines between label and value in totals, warm striped rows
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderSunsetOrange(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#ea580c';
  const ac = data.template?.layout?.accentColor || '#fed7aa';

  // ── Warm orange banner ──
  doc.rect(0, 0, 595, 110).fill(pc);
  doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 20);
  doc.fontSize(8).font('Helvetica').fillColor(ac);
  if (business.address) doc.text(business.address, 40, 50);
  if (business.gstNumber) doc.text(`GST: ${business.gstNumber}`, 40, 64);

  doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'INVOICE'), 370, 20, { align: 'right', width: 185 });
  doc.fontSize(9).font('Helvetica').fillColor(ac);
  doc.text(`# ${invoice.invoiceNumber}`, 370, 48, { align: 'right', width: 185 });
  doc.text(`${formatDate(invoice.invoiceDate)}  ·  Due ${formatDate(invoice.dueDate)}`, 370, 62, { align: 'right', width: 185 });

  // Status
  const sc: Record<string, string> = { Paid: '#16a34a', Sent: '#2563eb', Draft: '#78716c', Overdue: '#ef4444', Cancelled: '#78716c', PartiallyPaid: '#f59e0b' };
  doc.rect(370, 80, 60, 16).fill(sc[invoice.status || 'Draft'] || '#78716c');
  doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text(invoice.status || 'Draft', 370, 84, { align: 'right', width: 60 });

  // ── Bill To ──
  let y = 130;
  doc.fillColor(pc).fontSize(9).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To').toUpperCase(), 40, y);
  doc.fillColor('#44403c').fontSize(11).font('Helvetica-Bold').text(client.name || '', 40, y + 14);
  doc.fontSize(9).font('Helvetica').fillColor('#78716c');
  y += 30;
  if (client.company) { doc.text(client.company, 40, y); y += 13; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, y); y += 13; }
  if (client.email) { doc.text(client.email, 40, y); y += 13; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, y); y += 13; }

  renderSunsetOrangeTable(doc, data, y + 15, l);

  const footer = data.template?.layout?.footerText || 'Your success is our priority!';
  if (footer) doc.fontSize(8).font('Helvetica-Oblique').fillColor('#a8a29e').text(footer, 40, 765, { align: 'center', width: 515 });
}

function renderSunsetOrangeTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#ea580c';
  const cw = [28, 170, 45, 40, 65, 45, 45, 75];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY, 515, 20).fill(pc);
  doc.fontSize(7).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 5, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fontSize(8).fillColor('#44403c');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    doc.rect(40, rowY - 1, 515, 18).fill(idx % 2 === 0 ? '#fff7ed' : '#ffffff');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY + 4, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  // ── Totals with dot-leader style ──
  rowY += 10;
  doc.moveTo(350, rowY).lineTo(555, rowY).lineWidth(0.3).stroke('#e7e5e4');
  rowY += 8;
  doc.fontSize(9).fillColor('#78716c');
  doc.text(l('labelSubtotal', 'Subtotal'), 350, rowY);
  doc.fillColor('#44403c').text(formatCurrency(invoice.subtotal || 0), 500, rowY, { align: 'right', width: 55 });
  rowY += 16;
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#78716c').text(l('labelDiscount', 'Discount'), 350, rowY); doc.fillColor('#44403c').text(`-${formatCurrency(invoice.discountAmount || 0)}`, 500, rowY, { align: 'right', width: 55 }); rowY += 16; }
  doc.fillColor('#78716c').text(l('labelTax', 'Tax'), 350, rowY);
  doc.fillColor('#44403c').text(formatCurrency(invoice.taxAmount || 0), 500, rowY, { align: 'right', width: 55 });
  rowY += 8;
  doc.rect(350, rowY, 205, 24).fill(pc);
  doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold');
  doc.text(l('labelTotal', 'Total'), 360, rowY + 6);
  doc.text(formatCurrency(invoice.total || 0), 500, rowY + 6, { align: 'right', width: 55 });

  if (invoice.notes) { rowY += 40; doc.fillColor('#44403c').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes'), 40, rowY); doc.font('Helvetica').fontSize(8).fillColor('#78716c').text(invoice.notes, 40, rowY + 14, { width: 515 }); }
}

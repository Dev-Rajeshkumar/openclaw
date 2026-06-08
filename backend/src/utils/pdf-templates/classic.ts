// Template 1: CLASSIC
// Layout: Split header (business left / invoice details right), bordered table with
// dark header bg, alternating row shading, right-aligned totals column
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, setFillColor, formatDate, formatCurrency, L } from './base.js';

export function renderClassic(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);

  // ── Header: Business LEFT, Invoice RIGHT ──
  setFillColor(doc, data.template?.layout?.primaryColor || '#1a1a2e');
  doc.fontSize(22).font('Helvetica-Bold').text(business.name || 'Company', 40, 40);
  doc.font('Helvetica');
  let y = 68;
  if (business.address) { doc.fontSize(9).text(business.address, 40, y); y += 14; }
  if (business.gstNumber) { doc.fontSize(9).text(`GST: ${business.gstNumber}`, 40, y); y += 14; }
  if (business.phone) { doc.fontSize(9).text(`Phone: ${business.phone}`, 40, y); }

  // Invoice title right side
  setFillColor(doc, data.template?.layout?.accentColor || '#e94560');
  doc.fontSize(26).font('Helvetica-Bold').text(l('labelInvoiceTitle', 'TAX INVOICE'), 350, 40, { align: 'right', width: 205 });
  setFillColor(doc, '#333333');
  doc.fontSize(10).font('Helvetica');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 350, 72, { align: 'right', width: 205 });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 350, 86, { align: 'right', width: 205 });
  doc.text(`Due: ${formatDate(invoice.dueDate)}`, 350, 100, { align: 'right', width: 205 });
  doc.font('Helvetica-Bold').text(`Status: ${invoice.status || 'Draft'}`, 350, 114, { align: 'right', width: 205 });

  // Divider line
  doc.moveTo(40, 145).lineTo(555, 145).lineWidth(1).stroke('#e5e7eb');

  // ── Bill To (left side, simple) ──
  const clientY = 160;
  setFillColor(doc, data.template?.layout?.primaryColor || '#1a1a2e');
  doc.fontSize(11).font('Helvetica-Bold').text(l('labelBillTo', 'Bill To:'), 40, clientY);
  setFillColor(doc, '#333333');
  doc.fontSize(10).font('Helvetica');
  let cy = clientY + 18;
  if (client.name) { doc.text(client.name, 40, cy); cy += 14; }
  if (client.company) { doc.text(client.company, 40, cy); cy += 14; }
  if (client.billingAddress) { doc.text(client.billingAddress, 40, cy, { width: 250 }); cy += 28; }
  if (client.gstNumber) { doc.text(`GST: ${client.gstNumber}`, 40, cy); cy += 14; }
  if (client.email) { doc.text(client.email, 40, cy); }

  // ── Table: bordered with dark header bg ──
  renderClassicTable(doc, data, cy + 20, l);

  // Footer
  const footer = data.template?.layout?.footerText || 'Thank you for your business!';
  if (footer) {
    doc.fontSize(9).font('Helvetica').fillColor('#666666').text(footer, 40, 760, { align: 'center', width: 515 });
  }
}

function renderClassicTable(doc: PDFKit.PDFDocument, data: PDFInvoiceData, startY: number, l: (k: string, fb: string) => string) {
  const { invoice } = data;
  const pc = data.template?.layout?.primaryColor || '#1a1a2e';
  const ac = data.template?.layout?.accentColor || '#e94560';
  const cw = [25, 165, 45, 40, 65, 45, 45, 80];
  const hdrs = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];

  doc.rect(40, startY - 4, 515, 20).fill(pc);
  doc.fontSize(8).font('Helvetica-Bold').fillColor('#ffffff');
  let cx = 42;
  hdrs.forEach((h, i) => { doc.text(h, cx, startY + 2, { width: cw[i], align: i === 1 ? 'left' : 'right' }); cx += cw[i]; });

  let rowY = startY + 22;
  doc.font('Helvetica').fillColor('#333333').fontSize(8);
  const items = (invoice.items || []) as any[];
  items.forEach((item: any, idx: number) => {
    if (idx % 2 === 0) doc.rect(40, rowY - 2, 515, 18).fill('#f9fafb');
    const vals = [String(idx + 1), item.description || '', item.hsnCode || '-', String(item.quantity || 0), formatCurrency(item.rate || 0), `${item.discount || 0}%`, `${item.taxRate || 0}%`, formatCurrency(item.amount || 0)];
    let vx = 42;
    vals.forEach((val, i) => { doc.text(val, vx, rowY, { width: cw[i], align: i === 1 ? 'left' : 'right' }); vx += cw[i]; });
    rowY += 18;
  });

  // Totals right-aligned
  const tx = 380, ty = rowY + 15;
  doc.fontSize(9).fillColor('#555555');
  doc.text(l('labelSubtotal', 'Subtotal:'), tx, ty);
  doc.fillColor('#333333').text(formatCurrency(invoice.subtotal || 0), tx + 100, ty, { align: 'right', width: 120 });
  if ((invoice.discountAmount || 0) > 0) { doc.fillColor('#555555').text(l('labelDiscount', 'Discount:'), tx, ty + 16); doc.fillColor('#333333').text(`-${formatCurrency(invoice.discountAmount || 0)}`, tx + 100, ty + 16, { align: 'right', width: 120 }); }
  doc.fillColor('#555555').text(l('labelTax', 'Tax:'), tx, ty + 32);
  doc.fillColor('#333333').text(formatCurrency(invoice.taxAmount || 0), tx + 100, ty + 32, { align: 'right', width: 120 });
  doc.moveTo(tx, ty + 50).lineTo(555, ty + 50).stroke('#e5e7eb');
  doc.fontSize(12).font('Helvetica-Bold');
  setFillColor(doc, ac);
  doc.text(l('labelTotal', 'Total:'), tx, ty + 58);
  doc.text(formatCurrency(invoice.total || 0), tx + 100, ty + 58, { align: 'right', width: 120 });

  if (invoice.notes) { let ny = ty + 90; doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text(l('labelNotes', 'Notes:'), 40, ny); doc.font('Helvetica').fontSize(8).text(invoice.notes, 40, ny + 14, { width: 515 }); }
  if (invoice.terms) { let ny = ty + 120; doc.fillColor('#333333').fontSize(9).font('Helvetica-Bold').text(l('labelTerms', 'Terms & Conditions:'), 40, ny); doc.font('Helvetica').fontSize(8).text(invoice.terms, 40, ny + 14, { width: 515 }); }
}

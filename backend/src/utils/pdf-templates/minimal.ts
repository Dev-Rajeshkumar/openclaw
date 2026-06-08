// Template 3: MINIMAL
// Layout: Business name left, GIANT faded invoice number right (watermark style),
// thin horizontal lines, simple 4-col table (no borders, no header bg),
// right-aligned totals with double-line total, ultra-clean
import PDFDocument from 'pdfkit';
import { PDFInvoiceData, formatDate, formatCurrency, L } from './base.js';

export function renderMinimal(doc: PDFKit.PDFDocument, data: PDFInvoiceData) {
  const { invoice, client, business } = data;
  const l = (key: string, fb: string) => L(data.template?.layout || {}, key, fb);
  const pc = data.template?.layout?.primaryColor || '#111827';

  // ── Header: business left, giant faded number right ──
  doc.fillColor(pc).fontSize(18).font('Helvetica').text(business.name || 'Company', 40, 40);
  doc.fontSize(8).fillColor('#9ca3af');
  if (business.address) doc.text(business.address, 40, 62);

  // Giant faded invoice number (watermark style)
  doc.fillColor('#e5e7eb').fontSize(44).font('Helvetica-Bold').text(invoice.invoiceNumber, 300, 28, { align: 'right', width: 255 });
  doc.fillColor('#6b7280').fontSize(8).font('Helvetica');
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}  ·  Due: ${formatDate(invoice.dueDate)}`, 300, 78, { align: 'right', width: 255 });

  // Thin line
  doc.moveTo(40, 100).lineTo(555, 100).lineWidth(0.5).stroke('#e5e7eb');

  // ── Bill To: simple "To" label ──
  let y = 118;
  doc.fillColor(pc).fontSize(10).font('Helvetica').text(l('labelBillTo', 'To'), 40, y);
  doc.fontSize(11).text(client.name || '', 40, y + 14);
  doc.fontSize(9).fillColor('#6b7280');
  if (client.company) { y += 30; doc.text(client.company, 40, y); }
  if (client.email) { y += 14; doc.text(client.email, 40, y); }
  if (client.gstNumber) { y += 14; doc.text(`GST: ${client.gstNumber}`, 40, y); }

  // ── Table: no borders, no header bg, just thin lines ──
  y += 25;
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.5).stroke(pc);
  y += 10;
  doc.fontSize(7).font('Helvetica').fillColor('#9ca3af');
  doc.text('DESCRIPTION', 40, y);
  doc.text('QTY', 350, y, { align: 'right', width: 60 });
  doc.text('RATE', 420, y, { align: 'right', width: 60 });
  doc.text('AMOUNT', 555, y, { align: 'right' });
  y += 18;
  doc.moveTo(40, y).lineTo(555, y).lineWidth(0.3).stroke('#e5e7eb');
  y += 6;

  doc.fontSize(9).fillColor(pc).font('Helvetica');
  const items = (invoice.items || []) as any[];
  items.forEach((item: any) => {
    y += 12;
    doc.text(item.description || '', 40, y, { width: 300 });
    doc.text(String(item.quantity || 0), 350, y, { align: 'right', width: 60 });
    doc.text(formatCurrency(item.rate || 0), 410, y, { align: 'right', width: 60 });
    doc.font('Helvetica-Bold').text(formatCurrency(item.amount || 0), 480, y, { align: 'right', width: 75 });
    doc.font('Helvetica');
  });

  // ── Totals: right-aligned, double-line total ──
  y += 25;
  doc.moveTo(350, y).lineTo(555, y).lineWidth(0.5).stroke('#e5e7eb');
  y += 10;
  doc.fontSize(9).fillColor('#6b7280');
  doc.text(l('labelSubtotal', 'Subtotal'), 350, y);
  doc.fillColor(pc).text(formatCurrency(invoice.subtotal || 0), 420, y, { align: 'right', width: 135 });
  y += 16;
  doc.fillColor('#6b7280').text(l('labelTax', 'Tax'), 350, y);
  doc.fillColor(pc).text(formatCurrency(invoice.taxAmount || 0), 420, y, { align: 'right', width: 135 });
  y += 8;
  doc.moveTo(350, y).lineTo(555, y).lineWidth(1).stroke(pc);
  y += 2;
  doc.moveTo(350, y).lineTo(555, y).lineWidth(0.5).stroke(pc);
  y += 8;
  doc.fontSize(13).font('Helvetica-Bold').fillColor(pc);
  doc.text(l('labelTotal', 'Total'), 350, y);
  doc.text(formatCurrency(invoice.total || 0), 420, y, { align: 'right', width: 135 });

  if (invoice.notes) {
    y += 30;
    doc.fontSize(8).font('Helvetica-Oblique').fillColor('#6b7280').text(invoice.notes, 40, y, { width: 515 });
  }
}

import PDFDocument from 'pdfkit';
import { Invoice, Client, Business, InvoiceItem } from '../types/index.js';

interface PDFInvoiceData {
  invoice: Partial<Invoice & { invoiceNumber: string; invoiceDate: Date; dueDate: Date; items: InvoiceItem[]; subtotal: number; discountAmount: number; taxAmount: number; total: number; notes?: string; terms?: string }>;
  client: Partial<Client>;
  business: Partial<Business>;
}

/**
 * Generate a PDF invoice as a Buffer
 * Note: pdfkit is designed for server-side Node.js Buffer output
 */
export function generateInvoicePDF(data: PDFInvoiceData): PDFKit.PDFDocument {
  const { invoice, client, business } = data;
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Header
  doc.fontSize(20).font('Helvetica-Bold').text(business.name || 'Company', 50, 50);

  if (business.address) {
    doc.fontSize(10).font('Helvetica').text(business.address, 50, 75);
  }
  if (business.gstNumber) {
    doc.fontSize(10).font('Helvetica').text(`GST: ${business.gstNumber}`, 50, 90);
  }
  if (business.phone) {
    doc.fontSize(10).font('Helvetica').text(`Phone: ${business.phone}`, 50, 105);
  }

  // Invoice title
  doc.fontSize(24).font('Helvetica-Bold').text('TAX INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(12).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, 400, 80, { align: 'right' });
  doc.fontSize(10).text(`Date: ${formatDate(invoice.invoiceDate)}`, 400, 98, { align: 'right' });
  doc.fontSize(10).text(`Due: ${formatDate(invoice.dueDate)}`, 400, 113, { align: 'right' });
  doc.fontSize(10).font('Helvetica-Bold').text(`Status: ${invoice.status || 'Draft'}`, 400, 128, { align: 'right' });

  // Bill To
  const clientStartY = 170;
  doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, clientStartY);
  doc.fontSize(10).font('Helvetica').text(client.name || '', 50, clientStartY + 20, { width: 500 });
  if (client.company) {
    doc.text(client.company, 50, clientStartY + 35);
  }
  if (client.billingAddress) {
    doc.text(client.billingAddress, 50, clientStartY + 50, { width: 300 });
  }
  if (client.gstNumber) {
    doc.text(`GST: ${client.gstNumber}`, 50, clientStartY + 80);
  }
  if (client.email) {
    doc.text(client.email, 50, clientStartY + 95);
  }

  // Items table
  const tableTop = 310;
  const tableHeaders = ['#', 'Description', 'HSN', 'Qty', 'Rate', 'Disc%', 'Tax%', 'Amount'];
  const colWidths = [30, 170, 45, 40, 60, 45, 45, 70];
  let xPos = 50;

  // Table header background
  doc.rect(50, tableTop - 5, 505, 20).fill('#4a5568');

  doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');
  let currentX = 50;
  tableHeaders.forEach((header, i) => {
    doc.text(header, currentX + 2, tableTop, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
    currentX += colWidths[i];
  });

  // Table rows
  let rowY = tableTop + 25;
  doc.fontSize(8).font('Helvetica').fillColor('#000000');

  const items = invoice.items || [];
  items.forEach((item, index) => {
    const textY = rowY;
    const itemText = item as unknown as InvoiceItem;

    const values = [
      String(index + 1),
      itemText.description || '',
      itemText.hsnCode || '-',
      String(itemText.quantity || 0),
      formatCurrency(itemText.rate || 0),
      `${itemText.discount || 0}%`,
      `${itemText.taxRate || 0}%`,
      formatCurrency(itemText.amount || 0),
    ];

    let vX = 50;
    values.forEach((val, i) => {
      doc.text(val, vX + 2, textY, { width: colWidths[i], align: i === 1 ? 'left' : 'right' });
      vX += colWidths[i];
    });

    rowY += 20;
  });

  // Totals section
  const totalsX = 380;
  const totalsY = rowY + 20;

  doc.fontSize(10).font('Helvetica');
  doc.text('Subtotal:', totalsX, totalsY);
  doc.text(formatCurrency(invoice.subtotal || 0), totalsX + 100, totalsY, { align: 'right', width: 120 });

  if ((invoice.discountAmount || 0) > 0) {
    doc.text('Discount:', totalsX, totalsY + 20);
    doc.text(`-${formatCurrency(invoice.discountAmount || 0)}`, totalsX + 100, totalsY + 20, { align: 'right', width: 120 });
  }

  if ((invoice.taxAmount || 0) > 0) {
    doc.text('Tax:', totalsX, totalsY + 40);
    doc.text(formatCurrency(invoice.taxAmount || 0), totalsX + 100, totalsY + 40, { align: 'right', width: 120 });
  }

  // Total line
  doc.moveTo(totalsX, totalsY + 60).lineTo(565, totalsY + 60).stroke();
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text('Total:', totalsX, totalsY + 68);
  doc.text(formatCurrency(invoice.total || 0), totalsX + 100, totalsY + 68, { align: 'right', width: 120 });

  // Notes
  if (invoice.notes) {
    doc.fontSize(9).font('Helvetica-Bold').text('Notes:', 50, totalsY + 100);
    doc.font('Helvetica').text(invoice.notes, 50, totalsY + 118, { width: 500 });
  }

  // Terms
  if (invoice.terms) {
    const termsY = invoice.notes ? totalsY + 145 : totalsY + 100;
    doc.fontSize(9).font('Helvetica-Bold').text('Terms & Conditions:', 50, termsY);
    doc.font('Helvetica').text(invoice.terms, 50, termsY + 18, { width: 500 });
  }

  // Footer
  doc.fontSize(8).font('Helvetica').text(
    'This is a system-generated invoice.',
    50,
    780,
    { align: 'center', width: 500 }
  );

  return doc;
}

function formatDate(date: Date | string | undefined): string {
  if (!date) return '-';
  const d = new Date(date);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatCurrency(amount: number): string {
  return `INR ${Number(amount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

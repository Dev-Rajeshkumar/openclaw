/**
 * Invoice number generation utilities
 */

/**
 * Generate a unique invoice number with prefix and sequence
 * Format: {PREFIX}-{padding}{number}  e.g. INV-00001
 */
export function generateInvoiceNumber(
  prefix: string,
  sequence: number,
  padding: number = 5
): string {
  const padded = String(sequence).padStart(padding, '0');
  return `${prefix}-${padded}`;
}

/**
 * Generate a unique estimate number
 * Format: EST-{padding}{number}  e.g. EST-00001
 */
export function generateEstimateNumber(sequence: number, padding: number = 5): string {
  const padded = String(sequence).padStart(padding, '0');
  return `EST-${padded}`;
}

/**
 * Parse an invoice number to extract prefix and sequence
 */
export function parseInvoiceNumber(invoiceNumber: string): {
  prefix: string;
  sequence: number;
} | null {
  const match = invoiceNumber.match(/^(.+)-(\d+)$/);
  if (!match) return null;
  return {
    prefix: match[1],
    sequence: parseInt(match[2], 10),
  };
}

/**
 * Generate a payment receipt number
 */
export function generateReceiptNumber(sequence: number): string {
  return `RCP-${String(sequence).padStart(6, '0')}`;
}

/**
 * Generate a proforma invoice number
 */
export function generateProformaNumber(sequence: number): string {
  return `PRO-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generate a credit note number
 */
export function generateCreditNoteNumber(sequence: number): string {
  return `CN-${String(sequence).padStart(5, '0')}`;
}

/**
 * Generate a debit note number
 */
export function generateDebitNoteNumber(sequence: number): string {
  return `DN-${String(sequence).padStart(5, '0')}`;
}

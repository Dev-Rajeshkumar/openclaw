/**
 * GST (Goods and Services Tax) utilities for India
 */

export interface GSTBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GSTValidationResult {
  valid: boolean;
  stateCode?: string;
  error?: string;
}

/**
 * Calculate GST breakdown from a total amount and tax rate.
 * For intra-state: CGST + SGST (split equally)
 * For inter-state: IGST (full rate)
 */
export function calculateGST(
  amount: number,
  taxRate: number,
  isInterState: boolean = false
): GSTBreakdown {
  const totalTax = (amount * taxRate) / 100;

  if (isInterState) {
    return {
      cgst: 0,
      sgst: 0,
      igst: Math.round(totalTax * 100) / 100,
      total: Math.round(totalTax * 100) / 100,
    };
  }

  const halfTax = totalTax / 2;
  return {
    cgst: Math.round(halfTax * 100) / 100,
    sgst: Math.round(halfTax * 100) / 100,
    igst: 0,
    total: Math.round(totalTax * 100) / 100,
  };
}

/**
 * Calculate GST from a tax-inclusive amount
 */
export function calculateGSTExclusive(
  inclusiveAmount: number,
  taxRate: number,
  isInterState: boolean = false
): { baseAmount: number; gst: GSTBreakdown } {
  const baseAmount = (inclusiveAmount * 100) / (100 + taxRate);
  const gst = calculateGST(baseAmount, taxRate, isInterState);
  return {
    baseAmount: Math.round(baseAmount * 100) / 100,
    gst,
  };
}

/**
 * Validate Indian GST number format
 * Format: 22AAAAA0000A1Z5 (15 characters)
 * - First 2 digits: State code
 * - Next 10: PAN of the entity
 * - Next 1: Entity number of same PAN in a state
 * - Next 1: 'Z' by default
 * - Last 1: Checksum
 */
export function validateGSTNumber(gstNumber: string): GSTValidationResult {
  const cleaned = gstNumber.trim().toUpperCase();

  if (cleaned.length !== 15) {
    return { valid: false, error: 'GST number must be 15 characters' };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

  if (!gstRegex.test(cleaned)) {
    return { valid: false, error: 'Invalid GST number format' };
  }

  const stateCode = cleaned.substring(0, 2);
  const validStateCodes = [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
    '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
    '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
    '31', '32', '33', '34', '35', '36', '37', '97', '99',
  ];

  if (!validStateCodes.includes(stateCode)) {
    return { valid: false, error: 'Invalid state code in GST number' };
  }

  return { valid: true, stateCode };
}

/**
 * Validate Indian PAN number format
 * Format: AAAAA0000A (10 characters)
 */
export function validatePAN(pan: string): boolean {
  const cleaned = pan.trim().toUpperCase();
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(cleaned);
}

/**
 * Common GST rates in India
 */
export const GST_RATES = {
  EXEMPT: 0,
  ZERO: 0,
  FIVE: 5,
  TWELVE: 12,
  EIGHTEEN: 18,
  TWENTY_EIGHT: 28,
} as const;

/**
 * HSN code categories with common rates
 */
export const HSN_RATES: Record<string, number> = {
  '99': 18, // Services
  '61': 12, // Textiles
  '62': 12, // Apparel
  '84': 18, // Machinery
  '85': 18, // Electrical equipment
  '87': 28, // Vehicles
  '30': 12, // Pharmaceuticals
  '22': 18, // Beverages
};

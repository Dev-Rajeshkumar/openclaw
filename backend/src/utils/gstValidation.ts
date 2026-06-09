/**
 * Enhanced GST & HSN Validation Utilities
 * Extends the existing gst.ts with smart validation features
 */

import { validateGSTNumber, validatePAN, HSN_RATES } from './gst';

export interface GSTINValidationResult {
  valid: boolean;
  stateCode?: string;
  stateName?: string;
  pan?: string;
  errors: string[];
  warnings: string[];
}

export interface HSNValidationResult {
  valid: boolean;
  code: string;
  suggestedRate?: number;
  description?: string;
  errors: string[];
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingInvoiceId?: string;
  message?: string;
}

// State code to name mapping
const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu & Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab',
  '04': 'Chandigarh', '05': 'Uttarakhand', '06': 'Haryana',
  '07': 'Delhi', '08': 'Rajasthan', '09': 'Uttar Pradesh',
  '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram',
  '16': 'Tripura', '17': 'Meghalaya', '18': 'Assam',
  '19': 'West Bengal', '20': 'Jharkhand', '21': 'Odisha',
  '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '25': 'Daman & Diu', '26': 'Dadra & Nagar Haveli', '27': 'Maharashtra',
  '28': 'Andhra Pradesh', '29': 'Karnataka', '30': 'Goa',
  '31': 'Lakshadweep', '32': 'Kerala', '33': 'Tamil Nadu',
  '34': 'Puducherry', '35': 'Andaman & Nicobar', '36': 'Telangana',
  '37': 'Ladakh', '97': 'Other Territory', '99': 'Centre',
};

/**
 * Comprehensive GSTIN validation with state code verification
 */
export function validateGSTIN(gstin: string): GSTINValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic format validation
  const basicResult = validateGSTNumber(gstin);
  if (!basicResult.valid) {
    return { valid: false, errors: [basicResult.error || 'Invalid GSTIN'], warnings: [] };
  }

  const cleaned = gstin.trim().toUpperCase();
  const stateCode = cleaned.substring(0, 2);
  const pan = cleaned.substring(2, 12);

  // State code validation
  const stateName = STATE_NAMES[stateCode];
  if (!stateName) {
    errors.push(`Invalid state code: ${stateCode}`);
  }

  // PAN format validation embedded in GSTIN
  if (!validatePAN(pan)) {
    warnings.push('PAN format in GSTIN appears incorrect');
  }

  // Entity number check (position 12)
  const entityNum = cleaned.charAt(12);
  const entityNumInt = parseInt(entityNum);
  if (isNaN(entityNumInt) || entityNumInt < 1) {
    warnings.push('Entity number appears unusual');
  }

  // Check digit (position 13) - should be 'Z'
  if (cleaned.charAt(13) !== 'Z') {
    warnings.push('Expected "Z" at position 14');
  }

  return {
    valid: errors.length === 0,
    stateCode,
    stateName,
    pan,
    errors,
    warnings,
  };
}

/**
 * Validate HSN code and suggest GST rate
 */
export function validateHSN(hsnCode: string): HSNValidationResult {
  const errors: string[] = [];
  const cleaned = hsnCode.trim();

  if (!cleaned) {
    return { valid: false, code: '', errors: ['HSN code is required'] };
  }

  // HSN codes are 2, 4, 6, or 8 digits
  if (!/^\d{2}(\d{2}(\d{2}(\d{2})?)?)?$/.test(cleaned)) {
    errors.push('HSN code must be 2, 4, 6, or 8 digits');
  }

  // Check against known categories
  const twoDigit = cleaned.substring(0, 2);
  let suggestedRate: number | undefined;
  let description: string | undefined;

  const HSN_DESCRIPTIONS: Record<string, string> = {
    '99': 'Services',
    '61': 'Textiles & Articles',
    '62': 'Apparel & Clothing',
    '84': 'Machinery & Mechanical Appliances',
    '85': 'Electrical Equipment',
    '87': 'Vehicles & Parts',
    '30': 'Pharmaceuticals',
    '22': 'Beverages & Spirits',
    '04': 'Dairy Products',
    '10': 'Cereals',
    '52': 'Cotton',
    '71': 'Precious Stones & Metals',
  };

  if (HSN_RATES[twoDigit]) {
    suggestedRate = HSN_RATES[twoDigit];
  }
  if (HSN_DESCRIPTIONS[twoDigit]) {
    description = HSN_DESCRIPTIONS[twoDigit];
  }

  if (!suggestedRate && cleaned.length >= 2) {
    // Default suggestion for unknown HSN
    suggestedRate = 18; // Most common rate
  }

  return {
    valid: errors.length === 0,
    code: cleaned,
    suggestedRate,
    description,
    errors,
  };
}

/**
 * Check for duplicate invoice numbers within a business
 * This is a client-side helper — actual duplicate check happens on the backend
 */
export function checkDuplicateInvoiceNumber(
  invoiceNumber: string,
  existingInvoices: Array<{ id: string; invoiceNumber: string }>
): DuplicateCheckResult {
  if (!invoiceNumber.trim()) {
    return { isDuplicate: false };
  }

  const normalized = invoiceNumber.trim().toUpperCase();
  const duplicate = existingInvoices.find(
    (inv) => inv.invoiceNumber.toUpperCase() === normalized
  );

  if (duplicate) {
    return {
      isDuplicate: true,
      existingInvoiceId: duplicate.id,
      message: `Invoice number "${invoiceNumber}" already exists`,
    };
  }

  return { isDuplicate: false };
}

/**
 * Validate that the GST rate matches the HSN code
 */
export function validateRateForHSN(hsnCode: string, gstRate: number): { valid: boolean; message?: string } {
  const hsnResult = validateHSN(hsnCode);
  if (!hsnResult.valid) {
    return { valid: false, message: hsnResult.errors[0] };
  }

  if (hsnResult.suggestedRate && hsnResult.suggestedRate !== gstRate) {
    return {
      valid: false,
      message: `HSN ${hsnCode} typically uses ${hsnResult.suggestedRate}% GST rate. You entered ${gstRate}%.`,
    };
  }

  return { valid: true };
}

/**
 * Get all state codes and names
 */
export function getStateCodes(): Array<{ code: string; name: string }> {
  return Object.entries(STATE_NAMES).map(([code, name]) => ({ code, name }));
}

/**
 * Suggest HSN codes based on item description
 */
export function suggestHSNFromDescription(description: string): Array<{ code: string; description: string; rate: number }> {
  const lower = description.toLowerCase();
  const suggestions: Array<{ code: string; description: string; rate: number }> = [];

  const KEYWORD_MAP: Array<{ keywords: string[]; code: string; desc: string; rate: number }> = [
    { keywords: ['website', 'web', 'web design', 'web development'], code: '9983', desc: 'IT & Web Services', rate: 18 },
    { keywords: ['software', 'app', 'application', 'saas'], code: '9983', desc: 'Software Services', rate: 18 },
    { keywords: ['consulting', 'consultation', 'advisory'], code: '9983', desc: 'Consulting Services', rate: 18 },
    { keywords: ['training', 'teaching', 'workshop'], code: '9983', desc: 'Training Services', rate: 18 },
    { keywords: ['logo', 'branding', 'graphic', 'design'], code: '9983', desc: 'Design Services', rate: 18 },
    { keywords: ['seo', 'marketing', 'advertising'], code: '9983', desc: 'Marketing Services', rate: 18 },
    { keywords: ['hosting', 'server', 'cloud'], code: '9983', desc: 'Hosting Services', rate: 18 },
    { keywords: ['support', 'maintenance'], code: '9983', desc: 'Support Services', rate: 18 },
  ];

  for (const { keywords, code, desc, rate } of KEYWORD_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) {
      suggestions.push({ code, description: desc, rate });
    }
  }

  // If no match, return generic service code
  if (suggestions.length === 0) {
    suggestions.push({ code: '9983', description: 'Other Services', rate: 18 });
  }

  return suggestions.slice(0, 3); // Return top 3 matches
}

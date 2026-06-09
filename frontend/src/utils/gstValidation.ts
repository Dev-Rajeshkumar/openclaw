/**
 * Client-side GST & HSN validation helpers
 */

export function validateGSTINFormat(gstin: string): { valid: boolean; state?: string; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const cleaned = gstin.trim().toUpperCase();

  if (cleaned.length !== 15) {
    errors.push('GSTIN must be 15 characters');
    return { valid: false, errors, warnings };
  }

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(cleaned)) {
    errors.push('Invalid GSTIN format');
    return { valid: false, errors, warnings };
  }

  const stateCode = cleaned.substring(0, 2);
  const validStateCodes = [
    '01','02','03','04','05','06','07','08','09','10',
    '11','12','13','14','15','16','17','18','19','20',
    '21','22','23','24','25','26','27','28','29','30',
    '31','32','33','34','35','36','37','97','99',
  ];

  if (!validStateCodes.includes(stateCode)) {
    errors.push('Invalid state code');
  }

  // Check digit should be Z
  if (cleaned.charAt(13) !== 'Z') {
    warnings.push('Expected "Z" at position 14');
  }

  // PAN check
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  if (!panRegex.test(cleaned.substring(2, 12))) {
    warnings.push('PAN format in GSTIN appears incorrect');
  }

  return { valid: errors.length === 0, state: stateCode, errors, warnings };
}

export function validateHSNFormat(hsnCode: string): { valid: boolean; suggestedRate?: number; errors: string[] } {
  const errors: string[] = [];
  const cleaned = hsnCode.trim();

  if (!cleaned) {
    return { valid: false, errors: ['HSN code is required'] };
  }

  if (!/^\d{2}(\d{2}(\d{2}(\d-^{2})?)?)?$/.test(cleaned)) {
    errors.push('HSN must be 2, 4, 6, or 8 digits');
  }

  const HSN_RATES: Record<string, number> = {
    '99': 18, '61': 12, '62': 12, '84': 18, '85': 18,
    '87': 28, '30': 12, '22': 18,
  };

  const twoDigit = cleaned.substring(0, 2);
  const suggestedRate = HSN_RATES[twoDigit];

  return { valid: errors.length === 0, suggestedRate, errors };
}

export function suggestHSN(description: string): Array<{ code: string; description: string; rate: number }> {
  const lower = description.toLowerCase();

  const MAP: Array<{ keywords: string[]; code: string; desc: string; rate: number }> = [
    { keywords: ['website', 'web', 'web design', 'web development'], code: '9983', desc: 'IT & Web Services', rate: 18 },
    { keywords: ['software', 'app', 'application', 'saas'], code: '9983', desc: 'Software Services', rate: 18 },
    { keywords: ['consulting', 'consultation', 'advisory'], code: '9983', desc: 'Consulting Services', rate: 18 },
    { keywords: ['training', 'teaching', 'workshop'], code: '9983', desc: 'Training Services', rate: 18 },
    { keywords: ['logo', 'branding', 'graphic', 'design'], code: '9983', desc: 'Design Services', rate: 18 },
    { keywords: ['seo', 'marketing', 'advertising'], code: '9983', desc: 'Marketing Services', rate: 18 },
    { keywords: ['hosting', 'server', 'cloud'], code: '9983', desc: 'Hosting Services', rate: 18 },
    { keywords: ['support', 'maintenance'], code: '9983', desc: 'Support Services', rate: 18 },
  ];

  const results = MAP.filter(({ keywords }) => keywords.some((kw) => lower.includes(kw)));
  if (results.length === 0) {
    results.push({ code: '9983', desc: 'Other Services', rate: 18 });
  }
  return results.slice(0, 3).map(({ code, desc, rate }) => ({ code, description: desc, rate }));
}

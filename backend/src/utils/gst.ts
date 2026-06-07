import { GstType } from '../types/index.js';

export interface IGstBreakdown {
  cgst: number;
  sgst: number;
  igst: number;
  utgst: number;
  totalGst: number;
}

/**
 * Calculate GST breakdown based on type and rate
 */
export const calculateGst = (
  subtotal: number,
  gstRate: number,
  gstType: GstType
): IGstBreakdown => {
  const totalGst = Math.round((subtotal * gstRate) / 100 * 100) / 100;

  switch (gstType) {
    case GstType.CGST_SGST: {
      const half = Math.round((totalGst / 2) * 100) / 100;
      return { cgst: half, sgst: half, igst: 0, utgst: 0, totalGst };
    }
    case GstType.IGST:
      return { cgst: 0, sgst: 0, igst: totalGst, utgst: 0, totalGst };
    case GstType.UTGST: {
      const half = Math.round((totalGst / 2) * 100) / 100;
      return { cgst: 0, sgst: 0, igst: 0, utgst: half, totalGst: half * 2 };
    }
    default:
      return { cgst: 0, sgst: 0, igst: 0, utgst: 0, totalGst: 0 };
  }
};

/**
 * Calculate invoice totals from items
 */
export const calculateInvoiceTotals = (
  items: Array<{ quantity: number; rate: number }>,
  gstRate: number,
  gstType: GstType
): { subtotal: number; gstBreakdown: IGstBreakdown; total: number } => {
  const subtotal = items.reduce(
    (sum, item) => sum + Math.round(item.quantity * item.rate * 100) / 100,
    0
  );
  const gstBreakdown = calculateGst(subtotal, gstRate, gstType);
  const total = Math.round((subtotal + gstBreakdown.totalGst) * 100) / 100;

  return { subtotal, gstBreakdown, total };
};

/**
 * Format currency in Indian style
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Convert number to words (Indian numbering system)
 */
export const numberToWords = (num: number): string => {
  if (num === 0) return 'Zero';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0) {
    return decimalPart > 0
      ? `${convertHundreds(decimalPart)}Paise Only`
      : 'Zero';
  }

  let result = '';
  const crore = Math.floor(integerPart / 10000000);
  const lakh = Math.floor((integerPart % 10000000) / 100000);
  const thousand = Math.floor((integerPart % 100000) / 1000);
  const remainder = integerPart % 1000;

  if (crore > 0) result += convertHundreds(crore) + 'Crore ';
  if (lakh > 0) result += convertHundreds(lakh) + 'Lakh ';
  if (thousand > 0) result += convertHundreds(thousand) + 'Thousand ';
  if (remainder > 0) result += convertHundreds(remainder);

  result = result.trim() + ' Rupees';

  if (decimalPart > 0) {
    result += ' and ' + convertHundreds(decimalPart) + 'Paise';
  }

  return result + ' Only';
};

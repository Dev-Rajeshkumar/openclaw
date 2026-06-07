import { calculateGst, calculateInvoiceTotals, formatCurrency, numberToWords } from '../utils/gst.js';
import { GstType } from '../types/index.js';

describe('GST Calculations', () => {
  describe('calculateGst', () => {
    it('should calculate CGST + SGST correctly', () => {
      const result = calculateGst(10000, 18, GstType.CGST_SGST);
      expect(result.cgst).toBe(900);
      expect(result.sgst).toBe(900);
      expect(result.igst).toBe(0);
      expect(result.utgst).toBe(0);
      expect(result.totalGst).toBe(1800);
    });

    it('should calculate IGST correctly', () => {
      const result = calculateGst(50000, 18, GstType.IGST);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(9000);
      expect(result.totalGst).toBe(9000);
    });

    it('should calculate UTGST correctly', () => {
      const result = calculateGst(25000, 12, GstType.UTGST);
      expect(result.cgst).toBe(0);
      expect(result.sgst).toBe(0);
      expect(result.igst).toBe(0);
      expect(result.utgst).toBe(1500);
    });

    it('should handle zero rate', () => {
      const result = calculateGst(10000, 0, GstType.CGST_SGST);
      expect(result.totalGst).toBe(0);
    });

    it('should handle 28% rate', () => {
      const result = calculateGst(10000, 28, GstType.IGST);
      expect(result.igst).toBe(2800);
      expect(result.totalGst).toBe(2800);
    });
  });

  describe('calculateInvoiceTotals', () => {
    it('should calculate totals with multiple items', () => {
      const items = [
        { quantity: 10, rate: 100 },
        { quantity: 5, rate: 200 },
      ];
      const result = calculateInvoiceTotals(items, 18, GstType.CGST_SGST);
      expect(result.subtotal).toBe(2000);
      expect(result.gstBreakdown.totalGst).toBe(360);
      expect(result.total).toBe(2360);
    });

    it('should handle single item', () => {
      const items = [{ quantity: 1, rate: 5000 }];
      const result = calculateInvoiceTotals(items, 18, GstType.IGST);
      expect(result.subtotal).toBe(5000);
      expect(result.gstBreakdown.igst).toBe(900);
      expect(result.total).toBe(5900);
    });

    it('should handle fractional quantities', () => {
      const items = [{ quantity: 1.5, rate: 1000 }];
      const result = calculateInvoiceTotals(items, 18, GstType.CGST_SGST);
      expect(result.subtotal).toBe(1500);
      expect(result.gstBreakdown.totalGst).toBe(270);
      expect(result.total).toBe(1770);
    });
  });

  describe('formatCurrency', () => {
    it('should format in Indian currency style', () => {
      expect(formatCurrency(1000)).toBe('₹1,000.00');
      expect(formatCurrency(100000)).toBe('₹1,00,000.00');
      expect(formatCurrency(10000000)).toBe('₹1,00,00,000.00');
    });
  });

  describe('numberToWords', () => {
    it('should convert numbers to words', () => {
      expect(numberToWords(1)).toContain('One');
      expect(numberToWords(100)).toContain('Hundred');
      expect(numberToWords(1000)).toContain('Thousand');
      expect(numberToWords(100000)).toContain('Lakh');
      expect(numberToWords(10000000)).toContain('Crore');
    });

    it('should handle zero', () => {
      expect(numberToWords(0)).toBe('Zero');
    });

    it('should handle paise', () => {
      const result = numberToWords(99.50);
      expect(result).toContain('Paise');
    });
  });
});

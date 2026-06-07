import { PrismaClient } from '@prisma/client';
import { kebabCase } from 'lodash';

const prisma = new PrismaClient();

/**
 * Generate next invoice number for a user
 * Format: BB-00001 (auto-incrementing)
 */
export const generateInvoiceNumber = async (userId: string): Promise<string> => {
  const lastInvoice = await prisma.invoice.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });

  if (!lastInvoice) {
    return 'BB-00001';
  }

  // Extract numeric part
  const match = lastInvoice.invoiceNumber.match(/(\d+)$/);
  if (!match) {
    return 'BB-00001';
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `BB-${String(nextNum).padStart(5, '0')}`;
};

/**
 * Generate custom invoice number prefix based on business name
 */
export const generatePrefix = (businessName: string | null): string => {
  if (!businessName) return 'BB';
  const prefix = kebabCase(businessName).substring(0, 3).toUpperCase();
  return prefix || 'BB';
};

/**
 * Validate invoice number format
 */
export const isValidInvoiceNumber = (invoiceNumber: string): boolean => {
  return /^[A-Z]{2,5}-\d{3,10}$/.test(invoiceNumber);
};

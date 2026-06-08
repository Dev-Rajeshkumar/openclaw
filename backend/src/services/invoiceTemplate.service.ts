import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { Plan } from '../types/index.js';

// ─── 22 Built-in Invoice Templates ──────────────────────────
// Each template has a unique layout config AND customizable text fields
// Custom text fields can be overridden per-invoice by premium users

export const BUILT_IN_TEMPLATES = [
  // ═══════════════════════════════════════════════════════════
  // FREE TIER — 3 templates
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Classic',
    slug: 'classic',
    description: 'Traditional layout — business left, invoice right, bordered table',
    isPremium: false,
    layout: {
      primaryColor: '#1a1a2e', accentColor: '#e94560',
      headerStyle: 'split-left-right', tableStyle: 'bordered-rows',
      footerText: 'Thank you for your business!', category: 'standard',
      // customizable text fields
      labelInvoiceTitle: 'TAX INVOICE',
      labelBillTo: 'Bill To:',
      labelNotes: 'Notes:',
      labelTerms: 'Terms & Conditions:',
      labelSubtotal: 'Subtotal:',
      labelDiscount: 'Discount:',
      labelTax: 'Tax:',
      labelTotal: 'Total:',
    },
  },
  {
    name: 'Modern',
    slug: 'modern',
    description: 'Full-width banner header, striped table, colored total box',
    isPremium: false,
    layout: {
      primaryColor: '#6366f1', accentColor: '#818cf8',
      headerStyle: 'full-banner', tableStyle: 'striped',
      footerText: 'Thank you for your business!', category: 'standard',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'BILL TO',
      labelNotes: 'Notes',
      labelTerms: 'Terms & Conditions',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
  {
    name: 'Minimal',
    slug: 'minimal',
    description: 'Giant faded invoice number, ultra-clean, no borders',
    isPremium: false,
    layout: {
      primaryColor: '#111827', accentColor: '#6b7280',
      headerStyle: 'minimal-faded-number', tableStyle: 'no-borders',
      footerText: '', category: 'minimal',
      labelInvoiceTitle: '',
      labelBillTo: 'To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // STARTER TIER — 3 more (6 total)
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Top accent bar, two-column header, detailed 9-col table',
    isPremium: true, tier: 'starter',
    layout: {
      primaryColor: '#0f172a', accentColor: '#0ea5e9',
      headerStyle: 'accent-bar-two-col', tableStyle: 'detailed-grid',
      footerText: 'Payment is due within the specified terms.', category: 'corporate',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'BILL TO',
      labelNotes: 'Notes',
      labelTerms: 'Terms & Conditions',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL DUE',
    },
  },
  {
    name: 'Elegant',
    slug: 'elegant',
    description: 'Centered header, decorative line, double-line table header',
    isPremium: true, tier: 'starter',
    layout: {
      primaryColor: '#7c3aed', accentColor: '#a78bfa',
      headerStyle: 'centered-decorative', tableStyle: 'double-line-header',
      footerText: 'We appreciate your continued trust in our services.', category: 'creative',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Billed To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Bold',
    slug: 'bold',
    description: 'Full-bleed dark header, gold accents, dark-themed table',
    isPremium: true, tier: 'starter',
    layout: {
      primaryColor: '#000000', accentColor: '#f59e0b',
      headerStyle: 'full-bleed-dark', tableStyle: 'dark-minimal',
      footerText: 'We value your business!', category: 'bold',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'BILL TO',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // PROFESSIONAL TIER — 6 more (12 total)
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Gradient Blue',
    slug: 'gradient-blue',
    description: 'Blue gradient header, clean white body, rounded total',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#2563eb', accentColor: '#93c5fd',
      headerStyle: 'gradient-banner', tableStyle: 'clean-white',
      footerText: 'Thank you for choosing us!', category: 'gradient',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total Due',
    },
  },
  {
    name: 'Forest Green',
    slug: 'forest-green',
    description: 'Left accent bar, green-tinted rows, nature feel',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#166534', accentColor: '#22c55e',
      headerStyle: 'left-accent-bar', tableStyle: 'tinted-rows',
      footerText: 'Growing together with our clients.', category: 'nature',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
  {
    name: 'Sunset Orange',
    slug: 'sunset-orange',
    description: 'Warm orange banner, cream body, dot-leader totals',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#ea580c', accentColor: '#fed7aa',
      headerStyle: 'warm-banner', tableStyle: 'cream-rows',
      footerText: 'Your success is our priority!', category: 'warm',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Rose Gold',
    slug: 'rose-gold',
    description: 'Deep rose header, pink-tinted sections, luxury spacing',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#9f1239', accentColor: '#fda4af',
      headerStyle: 'luxury-rose', tableStyle: 'refined-rows',
      footerText: 'Crafted with care for our valued clients.', category: 'luxury',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Billed To',
      labelNotes: 'Notes',
      labelTerms: 'Terms & Conditions',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total Amount',
    },
  },
  {
    name: 'Tech Cyan',
    slug: 'tech-cyan',
    description: 'Dark slate with cyan blocks, grid-lines table, monospace numbers',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#0e7490', accentColor: '#22d3ee',
      headerStyle: 'tech-blocks', tableStyle: 'grid-lines',
      footerText: 'Innovation delivered, satisfaction guaranteed.', category: 'tech',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'CLIENT',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Disc',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
  {
    name: 'Arctic White',
    slug: 'arctic-white',
    description: 'Frost blue strip, airy spacing, ultra-clean minimal table',
    isPremium: true, tier: 'professional',
    layout: {
      primaryColor: '#1e40af', accentColor: '#dbeafe',
      headerStyle: 'frost-strip', tableStyle: 'airy-minimal',
      footerText: 'Crystal clear billing, every time.', category: 'clean',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },

  // ═══════════════════════════════════════════════════════════
  // BUSINESS TIER — 10 more (22 total)
  // ═══════════════════════════════════════════════════════════
  {
    name: 'Midnight Purple',
    slug: 'midnight-purple',
    description: 'Deep purple executive, gold trim, sidebar client box',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#3b0764', accentColor: '#d97706',
      headerStyle: 'executive-purple', tableStyle: 'executive-grid',
      footerText: 'Excellence in every detail.', category: 'executive',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms & Conditions',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total Due',
    },
  },
  {
    name: 'Coral Reef',
    slug: 'coral-reef',
    description: 'Dual-tone teal/pink header, colorful rounded status badge',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#0d9488', accentColor: '#f472b6',
      headerStyle: 'dual-tone-split', tableStyle: 'colorful-rounded',
      footerText: 'Making business a pleasure!', category: 'vibrant',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Hello',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Slate Pro',
    slug: 'slate-pro',
    description: 'Sharp slate, compact grid, no-nonsense corporate',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#334155', accentColor: '#94a3b8',
      headerStyle: 'sharp-slate', tableStyle: 'compact-grid',
      footerText: 'Precision billing for modern businesses.', category: 'corporate',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
  {
    name: 'Espresso',
    slug: 'espresso',
    description: 'Rich brown header, cream body, warm-toned table',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#78350f', accentColor: '#fbbf24',
      headerStyle: 'warm-espresso', tableStyle: 'cream-table',
      footerText: 'Brewed to perfection for your business.', category: 'warm',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Neon Edge',
    slug: 'neon-edge',
    description: 'Full dark header, neon lime accents, startup aesthetic',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#18181b', accentColor: '#a3e635',
      headerStyle: 'neon-dark', tableStyle: 'neon-grid',
      footerText: 'Disrupting invoicing, one invoice at a time.', category: 'startup',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'CLIENT',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Disc',
      labelTax: 'Tax',
      labelTotal: 'TOTAL DUE',
    },
  },
  {
    name: 'Ocean Breeze',
    slug: 'ocean-breeze',
    description: 'Aqua wave header, flowing blue tones, calming rows',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#0369a1', accentColor: '#67e8f9',
      headerStyle: 'aqua-wave', tableStyle: 'flowing-rows',
      footerText: 'Smooth sailing with every transaction.', category: 'calm',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Cherry Blossom',
    slug: 'cherry-blossom',
    description: 'Pink sakura header, delicate rows, Japanese aesthetic',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#be185d', accentColor: '#fce7f3',
      headerStyle: 'sakura-header', tableStyle: 'delicate-rows',
      footerText: 'Beauty in every detail.', category: 'creative',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Dear Client',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total Amount',
    },
  },
  {
    name: 'Gunmetal',
    slug: 'gunmetal',
    description: 'Industrial dark, copper accents, solid grid table',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#1c1917', accentColor: '#f59e0b',
      headerStyle: 'industrial-gunmetal', tableStyle: 'solid-grid',
      footerText: 'Built strong. Billed right.', category: 'industrial',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
  {
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    description: 'Soft purple gradient, gentle rows, wellness brand feel',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#6d28d9', accentColor: '#ddd6fe',
      headerStyle: 'soft-lavender', tableStyle: 'gentle-rows',
      footerText: 'Care in every transaction.', category: 'wellness',
      labelInvoiceTitle: 'Invoice',
      labelBillTo: 'Valued Client',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'Total',
    },
  },
  {
    name: 'Monochrome',
    slug: 'monochrome',
    description: 'Pure black and white, sharp lines, maximum contrast',
    isPremium: true, tier: 'business',
    layout: {
      primaryColor: '#000000', accentColor: '#525252',
      headerStyle: 'bw-sharp', tableStyle: 'bw-table',
      footerText: 'Simplicity is the ultimate sophistication.', category: 'minimal',
      labelInvoiceTitle: 'INVOICE',
      labelBillTo: 'Bill To',
      labelNotes: 'Notes',
      labelTerms: 'Terms',
      labelSubtotal: 'Subtotal',
      labelDiscount: 'Discount',
      labelTax: 'Tax',
      labelTotal: 'TOTAL',
    },
  },
];

// ─── Plan-based template access ────────────────────────────
export function getAvailableTemplates(plan: Plan): typeof BUILT_IN_TEMPLATES {
  switch (plan) {
    case Plan.Free:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium);
    case Plan.Starter:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium || t.tier === 'starter');
    case Plan.Professional:
      return BUILT_IN_TEMPLATES.filter(
        (t) => !t.isPremium || t.tier === 'starter' || t.tier === 'professional'
      );
    case Plan.Business:
      return BUILT_IN_TEMPLATES;
    default:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium).slice(0, 3);
  }
}

// ─── Merge custom text overrides into template layout ────────
export function mergeTemplateTextOverrides(
  template: typeof BUILT_IN_TEMPLATES[0],
  overrides: Record<string, string>
): typeof BUILT_IN_TEMPLATES[0] {
  return {
    ...template,
    layout: {
      ...template.layout,
      ...overrides,
    },
  };
}

export async function getTemplatesForUser(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (!business) throw new AppError('Business not found', 404);

  const availableTemplates = getAvailableTemplates(business.plan as Plan);
  const customTemplates = await prisma.invoiceTemplate.findMany({
    where: { businessId },
    orderBy: { createdAt: 'desc' },
  });

  return {
    builtIn: availableTemplates,
    custom: customTemplates,
    plan: business.plan,
    total: BUILT_IN_TEMPLATES.length,
  };
}

export async function getTemplateBySlug(slug: string, userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (!business) throw new AppError('Business not found', 404);

  const builtIn = BUILT_IN_TEMPLATES.find((t) => t.slug === slug);
  if (builtIn) {
    const available = getAvailableTemplates(business.plan as Plan);
    if (available.some((t) => t.slug === slug)) {
      return { ...builtIn, id: `builtin_${slug}`, isBuiltIn: true };
    }
    throw new AppError('Upgrade your plan to use this template', 403);
  }

  const custom = await prisma.invoiceTemplate.findFirst({
    where: { businessId, slug },
  });
  if (custom) return { ...custom, isBuiltIn: false };

  throw new AppError('Template not found', 404);
}

export async function createCustomTemplate(
  userId: string,
  businessId: string,
  data: { name: string; slug: string; description?: string; layout: Record<string, unknown> }
) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (!business) throw new AppError('Business not found', 404);

  if (business.plan === Plan.Free || business.plan === Plan.Starter) {
    throw new AppError('Upgrade to Professional to create custom templates', 403);
  }

  const existing = await prisma.invoiceTemplate.findFirst({
    where: { businessId, slug: data.slug },
  });
  if (existing) throw new AppError('Template with this slug already exists', 409);

  return prisma.invoiceTemplate.create({
    data: {
      businessId,
      name: data.name,
      slug: data.slug,
      description: data.description || '',
      layout: data.layout as any,
      isDefault: false,
      isPremium: false,
    },
  });
}

export async function setDefaultTemplate(userId: string, businessId: string, templateSlug: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (!business) throw new AppError('Business not found', 404);

  const available = getAvailableTemplates(business.plan as Plan);
  if (!available.some((t) => t.slug === templateSlug)) {
    throw new AppError('Template not available on your plan', 403);
  }

  const existing = await prisma.invoiceTemplate.findFirst({
    where: { businessId, isDefault: true },
  });
  if (existing) {
    await prisma.invoiceTemplate.update({
      where: { id: existing.id },
      data: { isDefault: false },
    });
  }

  const refTemplate = await prisma.invoiceTemplate.findFirst({
    where: { businessId, slug: `__default_${templateSlug}` },
  });
  if (refTemplate) {
    await prisma.invoiceTemplate.update({
      where: { id: refTemplate.id },
      data: { isDefault: true },
    });
  } else {
    await prisma.invoiceTemplate.create({
      data: {
        businessId,
        name: `Default: ${templateSlug}`,
        slug: `__default_${templateSlug}`,
        description: 'Default template reference',
        layout: {},
        isDefault: true,
        isPremium: false,
      },
    });
  }

  return { success: true, defaultTemplate: templateSlug };
}

export async function getDefaultTemplateSlug(businessId: string): Promise<string> {
  const defaultRecord = await prisma.invoiceTemplate.findFirst({
    where: { businessId, isDefault: true },
  });
  if (defaultRecord && defaultRecord.slug.startsWith('__default_')) {
    return defaultRecord.slug.replace('__default_', '');
  }
  return 'classic';
}

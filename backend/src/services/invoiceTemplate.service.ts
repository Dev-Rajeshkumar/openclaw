import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { Plan } from '../types/index.js';

// ─── 22 Built-in Invoice Templates ──────────────────────────
// Each template defines a unique visual identity for PDF generation

export const BUILT_IN_TEMPLATES = [
  // ── Free Tier (3 templates) ───────────────────────────────
  {
    name: 'Classic',
    slug: 'classic',
    description: 'Traditional invoice layout with clean typography',
    isPremium: false,
    layout: {
      primaryColor: '#1a1a2e',
      accentColor: '#e94560',
      fontFamily: 'Helvetica',
      headerStyle: 'left-aligned',
      tableStyle: 'bordered',
      footerText: 'Thank you for your business!',
      category: 'standard',
    },
  },
  {
    name: 'Modern',
    slug: 'modern',
    description: 'Bold header with colored accents and modern layout',
    isPremium: false,
    layout: {
      primaryColor: '#6366f1',
      accentColor: '#818cf8',
      fontFamily: 'Helvetica',
      headerStyle: 'full-width-banner',
      tableStyle: 'striped',
      footerText: 'Thank you for your business!',
      category: 'standard',
    },
  },
  {
    name: 'Minimal',
    slug: 'minimal',
    description: 'Clean, minimal design with lots of whitespace',
    isPremium: false,
    layout: {
      primaryColor: '#111827',
      accentColor: '#6b7280',
      fontFamily: 'Helvetica',
      headerStyle: 'minimal',
      tableStyle: 'simple',
      footerText: '',
      category: 'minimal',
    },
  },

  // ── Starter Tier (3 more = 6 total) ───────────────────────
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Corporate-style with detailed sections and branding',
    isPremium: true,
    tier: 'starter',
    layout: {
      primaryColor: '#0f172a',
      accentColor: '#0ea5e9',
      fontFamily: 'Helvetica',
      headerStyle: 'two-column',
      tableStyle: 'detailed',
      footerText: 'Payment is due within the specified terms. Late payments may incur additional charges.',
      category: 'corporate',
    },
  },
  {
    name: 'Elegant',
    slug: 'elegant',
    description: 'Sophisticated design with subtle colors and refined typography',
    isPremium: true,
    tier: 'starter',
    layout: {
      primaryColor: '#7c3aed',
      accentColor: '#a78bfa',
      fontFamily: 'Helvetica',
      headerStyle: 'centered',
      tableStyle: 'elegant',
      footerText: 'We appreciate your continued trust in our services.',
      category: 'creative',
    },
  },
  {
    name: 'Bold',
    slug: 'bold',
    description: 'High-contrast dark theme with eye-catching accents',
    isPremium: true,
    tier: 'starter',
    layout: {
      primaryColor: '#000000',
      accentColor: '#f59e0b',
      fontFamily: 'Helvetica',
      headerStyle: 'full-bleed-dark',
      tableStyle: 'minimal-dark',
      footerText: 'We value your business!',
      category: 'bold',
    },
  },

  // ── Professional Tier (6 more = 12 total) ─────────────────
  {
    name: 'Gradient Blue',
    slug: 'gradient-blue',
    description: 'Smooth blue gradient header with clean white body',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#2563eb',
      accentColor: '#3b82f6',
      fontFamily: 'Helvetica',
      headerStyle: 'gradient-banner',
      tableStyle: 'clean',
      footerText: 'Thank you for choosing us!',
      category: 'gradient',
    },
  },
  {
    name: 'Forest Green',
    slug: 'forest-green',
    description: 'Nature-inspired green tones with organic feel',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#166534',
      accentColor: '#22c55e',
      fontFamily: 'Helvetica',
      headerStyle: 'left-accent-bar',
      tableStyle: 'soft-rows',
      footerText: 'Growing together with our clients.',
      category: 'nature',
    },
  },
  {
    name: 'Sunset Orange',
    slug: 'sunset-orange',
    description: 'Warm sunset gradient with energetic orange tones',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#ea580c',
      accentColor: '#fb923c',
      fontFamily: 'Helvetica',
      headerStyle: 'warm-banner',
      tableStyle: 'striped-warm',
      footerText: 'Your success is our priority!',
      category: 'warm',
    },
  },
  {
    name: 'Rose Gold',
    slug: 'rose-gold',
    description: 'Luxurious rose gold palette with premium feel',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#9f1239',
      accentColor: '#fb7185',
      fontFamily: 'Helvetica',
      headerStyle: 'luxury-centered',
      tableStyle: 'refined',
      footerText: 'Crafted with care for our valued clients.',
      category: 'luxury',
    },
  },
  {
    name: 'Tech Cyan',
    slug: 'tech-cyan',
    description: 'Futuristic tech-inspired with cyan and dark slate',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#0e7490',
      accentColor: '#22d3ee',
      fontFamily: 'Helvetica',
      headerStyle: 'tech-block',
      tableStyle: 'grid-lines',
      footerText: 'Innovation delivered, satisfaction guaranteed.',
      category: 'tech',
    },
  },
  {
    name: 'Arctic White',
    slug: 'arctic-white',
    description: 'Ultra-clean white background with frost blue accents',
    isPremium: true,
    tier: 'professional',
    layout: {
      primaryColor: '#1e40af',
      accentColor: '#93c5fd',
      fontFamily: 'Helvetica',
      headerStyle: 'frost-header',
      tableStyle: 'airy',
      footerText: 'Crystal clear billing, every time.',
      category: 'clean',
    },
  },

  // ── Business Tier (10 more = 22 total) ────────────────────
  {
    name: 'Midnight Purple',
    slug: 'midnight-purple',
    description: 'Deep purple executive theme with gold trim',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#3b0764',
      accentColor: '#d97706',
      fontFamily: 'Helvetica',
      headerStyle: 'executive-dark',
      tableStyle: 'executive-table',
      footerText: 'Excellence in every detail.',
      category: 'executive',
    },
  },
  {
    name: 'Coral Reef',
    slug: 'coral-reef',
    description: 'Vibrant coral and teal for a fresh, lively look',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#0d9488',
      accentColor: '#f472b6',
      fontFamily: 'Helvetica',
      headerColor2: '#ec4899',
      headerStyle: 'dual-tone',
      tableStyle: 'colorful-rows',
      footerText: 'Making business a pleasure!',
      category: 'vibrant',
    },
  },
  {
    name: 'Slate Pro',
    slug: 'slate-pro',
    description: 'Ultra-professional slate gray with sharp lines',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#334155',
      accentColor: '#475569',
      fontFamily: 'Helvetica',
      headerStyle: 'sharp-minimal',
      tableStyle: 'compact-grid',
      footerText: 'Precision billing for modern businesses.',
      category: 'corporate',
    },
  },
  {
    name: 'Espresso',
    slug: 'espresso',
    description: 'Rich brown tones with warm cream highlights',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#78350f',
      accentColor: '#d97706',
      fontFamily: 'Helvetica',
      headerStyle: 'warm-cream',
      tableStyle: 'cream-rows',
      footerText: 'Brewed to perfection for your business.',
      category: 'warm',
    },
  },
  {
    name: 'Neon Edge',
    slug: 'neon-edge',
    description: 'Dark background with neon accents for startups',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#18181b',
      accentColor: '#a3e635',
      fontFamily: 'Helvetica',
      headerStyle: 'neon-dark',
      tableStyle: 'neon-grid',
      footerText: 'Disrupting invoicing, one invoice at a time.',
      category: 'startup',
    },
  },
  {
    name: 'Ocean Breeze',
    slug: 'ocean-breeze',
    description: 'Calming ocean blue with aqua highlights',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#0369a1',
      accentColor: '#67e8f9',
      fontFamily: 'Helvetica',
      headerStyle: 'aqua-wave',
      tableStyle: 'flowing-rows',
      footerText: 'Smooth sailing with every transaction.',
      category: 'calm',
    },
  },
  {
    name: 'Cherry Blossom',
    slug: 'cherry-blossom',
    description: 'Delicate pink palette inspired by Japanese aesthetics',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#be185d',
      accentColor: '#fda4af',
      fontFamily: 'Helvetica',
      headerStyle: 'sakura-header',
      tableStyle: 'delicate-rows',
      footerText: 'Beauty in every detail.',
      category: 'creative',
    },
  },
  {
    name: 'Gunmetal',
    slug: 'gunmetal',
    description: 'Industrial gunmetal gray with copper accents',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#1c1917',
      accentColor: '#b45309',
      fontFamily: 'Helvetica',
      headerStyle: 'industrial-header',
      tableStyle: 'solid-grid',
      footerText: 'Built strong. Billed right.',
      category: 'industrial',
    },
  },
  {
    name: 'Lavender Dreams',
    slug: 'lavender-dreams',
    description: 'Soft lavender with purple accents for wellness brands',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#6d28d9',
      accentColor: '#c4b5fd',
      fontFamily: 'Helvetica',
      headerStyle: 'soft-gradient',
      tableStyle: 'gentle-rows',
      footerText: 'Care in every transaction.',
      category: 'wellness',
    },
  },
  {
    name: 'Monochrome',
    slug: 'monochrome',
    description: 'Pure black and white for maximum clarity',
    isPremium: true,
    tier: 'business',
    layout: {
      primaryColor: '#000000',
      accentColor: '#525252',
      fontFamily: 'Helvetica',
      headerStyle: 'bw-header',
      tableStyle: 'bw-table',
      footerText: 'Simplicity is the ultimate sophistication.',
      category: 'minimal',
    },
  },
];

// ─── Plan-based template access ────────────────────────────
export function getAvailableTemplates(plan: Plan): typeof BUILT_IN_TEMPLATES {
  switch (plan) {
    case Plan.Free:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium); // 3 templates
    case Plan.Starter:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium || t.tier === 'starter'); // 6 templates
    case Plan.Professional:
      return BUILT_IN_TEMPLATES.filter(
        (t) => !t.isPremium || t.tier === 'starter' || t.tier === 'professional'
      ); // 12 templates
    case Plan.Business:
      return BUILT_IN_TEMPLATES; // all 22 templates
    default:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium).slice(0, 3);
  }
}

export async function getTemplatesForUser(userId: string, businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, userId, deletedAt: null },
  });
  if (!business) throw new AppError('Business not found', 404);

  const availableTemplates = getAvailableTemplates(business.plan as Plan);

  // Get custom templates for this business
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

  // Check built-in templates first
  const builtIn = BUILT_IN_TEMPLATES.find((t) => t.slug === slug);
  if (builtIn) {
    const available = getAvailableTemplates(business.plan as Plan);
    if (available.some((t) => t.slug === slug)) {
      return { ...builtIn, id: `builtin_${slug}`, isBuiltIn: true };
    }
    throw new AppError('Upgrade your plan to use this template', 403);
  }

  // Check custom templates
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

  // Only Professional and Business can create custom templates
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

  // Verify template is accessible
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

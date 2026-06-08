import prisma from '../prisma/index.js';
import { AppError } from '../utils/response.js';
import { Plan } from '../types/index.js';

// Template definitions — each template has a layout config for PDF generation
export const BUILT_IN_TEMPLATES = [
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
    },
  },
  {
    name: 'Minimal',
    slug: 'minimal',
    description: 'Clean, minimal design with lots of whitespace',
    isPremium: true,
    layout: {
      primaryColor: '#111827',
      accentColor: '#6b7280',
      fontFamily: 'Helvetica',
      headerStyle: 'minimal',
      tableStyle: 'simple',
      footerText: '',
    },
  },
  {
    name: 'Professional',
    slug: 'professional',
    description: 'Corporate-style with detailed sections and branding',
    isPremium: true,
    layout: {
      primaryColor: '#0f172a',
      accentColor: '#0ea5e9',
      fontFamily: 'Helvetica',
      headerStyle: 'two-column',
      tableStyle: 'detailed',
      footerText: 'Payment is due within the specified terms. Late payments may incur additional charges.',
    },
  },
  {
    name: 'Elegant',
    slug: 'elegant',
    description: 'Sophisticated design with subtle colors and refined typography',
    isPremium: true,
    layout: {
      primaryColor: '#7c3aed',
      accentColor: '#a78bfa',
      fontFamily: 'Helvetica',
      headerStyle: 'centered',
      tableStyle: 'elegant',
      footerText: 'We appreciate your continued trust in our services.',
    },
  },
];

// Plan-based template access
export function getAvailableTemplates(plan: Plan): typeof BUILT_IN_TEMPLATES {
  switch (plan) {
    case Plan.Free:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium).slice(0, 1); // Only Classic
    case Plan.Starter:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium); // Classic + Modern
    case Plan.Professional:
    case Plan.Business:
      return BUILT_IN_TEMPLATES; // All templates
    default:
      return BUILT_IN_TEMPLATES.filter((t) => !t.isPremium).slice(0, 1);
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

  // Store default template preference in business settings (using a simple approach)
  // We'll use the first custom template or just track it via a dedicated record
  const existing = await prisma.invoiceTemplate.findFirst({
    where: { businessId, isDefault: true },
  });

  if (existing) {
    await prisma.invoiceTemplate.update({
      where: { id: existing.id },
      data: { isDefault: false },
    });
  }

  // For built-in templates, we create a reference record
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
  return 'classic'; // fallback
}

/**
 * Forms Plugin for Strapi v5
 *
 * Features:
 *   - Form CRUD (admin)
 *   - Public form submission endpoint
 *   - Server-side field validation
 *   - Conditional logic evaluation
 *   - Spam detection for submissions
 *   - CSV export of submissions
 *   - Form analytics (completion rate, drop-off)
 *
 * @module forms
 */

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

interface FormField {
  id: string;
  type: 'text' | 'email' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'number' | 'tel' | 'url';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  conditional?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_empty';
    value?: string;
  };
}

interface FormConfig {
  fields: FormField[];
  settings?: {
    submitMessage?: string;
    redirectUrl?: string;
    captcha?: boolean;
    rateLimitPerIp?: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════════════════════

function validateField(field: FormField, value: any): string | null {
  if (field.required && (value === undefined || value === null || value === '')) {
    return `${field.label} is required`;
  }

  if (value === undefined || value === null || value === '') return null;

  switch (field.type) {
    case 'email':
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        return field.validation?.message || `${field.label} must be a valid email`;
      }
      break;

    case 'url':
      try { new URL(String(value)); } catch {
        return field.validation?.message || `${field.label} must be a valid URL`;
      }
      break;

    case 'number': {
      const num = Number(value);
      if (isNaN(num)) return `${field.label} must be a number`;
      if (field.validation?.min !== undefined && num < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }
      if (field.validation?.max !== undefined && num > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
      break;
    }

    case 'text':
    case 'textarea': {
      const str = String(value);
      if (field.validation?.min !== undefined && str.length < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min} characters`;
      }
      if (field.validation?.max !== undefined && str.length > field.validation.max) {
        return `${field.label} must be at most ${field.validation.max} characters`;
      }
      if (field.validation?.pattern) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(str)) {
          return field.validation.message || `${field.label} format is invalid`;
        }
      }
      break;
    }

    case 'checkbox':
      if (typeof value !== 'boolean') return `${field.label} must be a checkbox value`;
      break;
  }

  return null;
}

function evaluateConditional(conditional: FormField['conditional'], formData: Record<string, any>): boolean {
  if (!conditional) return true;

  const { field: targetField, operator, value } = conditional;
  const targetValue = formData[targetField];

  switch (operator) {
    case 'equals':
      return targetValue === value;
    case 'not_equals':
      return targetValue !== value;
    case 'contains':
      return String(targetValue || '').includes(value || '');
    case 'not_empty':
      return targetValue !== undefined && targetValue !== null && targetValue !== '';
    default:
      return true;
  }
}

// ═══════════════════════════════════════════════════════════════
// Spam Detection
// ═══════════════════════════════════════════════════════════════

function detectSubmissionSpam(data: Record<string, any>, ipAddress: string): boolean {
  // Honeypot check (hidden field named 'website' — bots fill it)
  if (data.website || data.url || data.website_url) return true;

  // Link scanning across all values
  const allValues = Object.values(data).join(' ');
  const linkCount = (allValues.match(/https?:\/\//g) || []).length;
  if (linkCount > 5) return true;

  // Excessive caps
  const textValues = Object.values(data).filter(v => typeof v === 'string').join(' ');
  if (textValues.length > 50) {
    const upperRatio = (textValues.match(/[A-Z]/g) || []).length / textValues.length;
    if (upperRatio > 0.8) return true;
  }

  // Rapid submissions from IP (check in middleware or rate limiter)
  return false;
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Admin: Form CRUD
      {
        method: 'GET',
        path: '/api/forms',
        handler: 'form.find',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/forms/:id',
        handler: 'form.findOne',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/forms',
        handler: 'form.create',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/forms/:id',
        handler: 'form.update',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/forms/:id',
        handler: 'form.delete',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: Form analytics
      {
        method: 'GET',
        path: '/api/forms/:id/analytics',
        handler: 'form.analytics',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: Export submissions
      {
        method: 'GET',
        path: '/api/forms/:id/submissions/export',
        handler: 'form.exportSubmissions',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: List submissions
      {
        method: 'GET',
        path: '/api/forms/:id/submissions',
        handler: 'form.submissions',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Public: Get form schema
      {
        method: 'GET',
        path: '/api/forms/public/:slug',
        handler: 'form.publicSchema',
        config: { policies: [], auth: false },
      },
      // Public: Submit form
      {
        method: 'POST',
        path: '/api/forms/submit/:slug',
        handler: 'form.submit',
        config: { policies: [], auth: false },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('form', () => ({
      /**
       * List all forms.
       *
       * GET /api/forms
       */
      async find(ctx: any) {
        const { page = 1, pageSize = 50 } = ctx.query;

        const forms = await prisma.form.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
          select: {
            id: true, name: true, slug: true, status: true,
            submissionCount: true, createdAt: true, updatedAt: true,
          },
        });

        const total = await prisma.form.count();

        return ctx.send({
          data: forms,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total,
              pageCount: Math.ceil(total / Number(pageSize)),
            },
          },
        });
      },

      /**
       * Get a single form with full field config.
       *
       * GET /api/forms/:id
       */
      async findOne(ctx: any) {
        const { id } = ctx.params;

        const form = await prisma.form.findUnique({
          where: { id },
        });

        if (!form) return ctx.notFound('Form not found');

        return ctx.send({
          data: {
            ...form,
            fields: form.fields as FormConfig['fields'],
            settings: form.settings as FormConfig['settings'],
          },
        });
      },

      /**
       * Create a new form.
       *
       * POST /api/forms
       * Body: { name, slug?, description?, fields, settings? }
       */
      async create(ctx: any) {
        const { name, slug, description, fields, settings } = ctx.request.body;

        if (!name) return ctx.badRequest('Form name is required');
        if (!Array.isArray(fields) || fields.length === 0) {
          return ctx.badRequest('At least one field is required');
        }

        // Validate field configs
        const errors: string[] = [];
        for (const field of fields) {
          if (!field.id) errors.push('Each field must have an id');
          if (!field.type) errors.push(`Field "${field.id}" must have a type`);
          if (!field.label) errors.push(`Field "${field.id}" must have a label`);
          if (!['text', 'email', 'textarea', 'select', 'checkbox', 'radio', 'number', 'tel', 'url'].includes(field.type)) {
            errors.push(`Field "${field.id}" has invalid type: ${field.type}`);
          }
        }

        if (errors.length > 0) {
          return ctx.badRequest('Field validation failed', { errors });
        }

        const generatedSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

        const form = await prisma.form.create({
          data: {
            name,
            slug: generatedSlug,
            description: description || null,
            fields: fields as any,
            settings: settings || {},
            status: 'active',
          },
        });

        return ctx.send({ data: form }, 201);
      },

      /**
       * Update a form.
       *
       * PUT /api/forms/:id
       */
      async update(ctx: any) {
        const { id } = ctx.params;
        const { name, fields, settings, status, description } = ctx.request.body;

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return ctx.notFound('Form not found');

        const updated = await prisma.form.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(description !== undefined && { description }),
            ...(fields && { fields: fields as any }),
            ...(settings && { settings: settings as any }),
            ...(status && { status }),
            updatedAt: new Date(),
          },
        });

        return ctx.send({ data: updated });
      },

      /**
       * Delete a form and its submissions.
       *
       * DELETE /api/forms/:id
       */
      async delete(ctx: any) {
        const { id } = ctx.params;

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return ctx.notFound('Form not found');

        // Delete submissions first (cascade)
        await prisma.formSubmission.deleteMany({ where: { formId: id } });
        await prisma.form.delete({ where: { id } });

        return ctx.send({ data: { id }, meta: { deleted: true } });
      },

      /**
       * Get form schema for public rendering (strips sensitive data).
       *
       * GET /api/forms/public/:slug
       */
      async publicSchema(ctx: any) {
        const { slug } = ctx.params;

        const form = await prisma.form.findUnique({
          where: { slug },
        });

        if (!form) return ctx.notFound('Form not found');
        if (form.status !== 'active') return ctx.badRequest('Form is not active');

        // Return only public-safe field config
        return ctx.send({
          data: {
            id: form.id,
            name: form.name,
            description: form.description,
            slug: form.slug,
            fields: (form.fields as FormConfig['fields']).map((f: FormField) => ({
              id: f.id,
              type: f.type,
              label: f.label,
              required: f.required || false,
              placeholder: f.placeholder,
              options: f.options,
              validation: f.validation ? {
                min: f.validation.min,
                max: f.validation.max,
                pattern: f.validation.pattern,
              } : undefined,
              conditional: f.conditional,
            })),
            settings: {
              submitMessage: (form.settings as FormConfig['settings'])?.submitMessage,
              captcha: (form.settings as FormConfig['settings'])?.captcha,
            },
          },
        });
      },

      /**
       * Submit a form (public).
       *
       * POST /api/forms/submit/:slug
       * Body: { <fieldData>, completionTime? }
       */
      async submit(ctx: any) {
        const { slug } = ctx.params;
        const formData = ctx.request.body;
        const ipAddress = ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown';
        const userAgent = ctx.request.headers['user-agent'];

        const form = await prisma.form.findUnique({
          where: { slug },
        });

        if (!form) return ctx.notFound('Form not found');
        if (form.status !== 'active') return ctx.badRequest('Form is not active');

        const fields = form.fields as FormConfig['fields'];
        const errors: { field: string; message: string }[] = [];

        // Validate all fields
        for (const field of fields) {
          // Check if field should be evaluated (conditional logic)
          if (!evaluateConditional(field.conditional, formData)) {
            continue;
          }

          const value = formData[field.id];
          const error = validateField(field, value);
          if (error) {
            errors.push({ field: field.id, message: error });
          }
        }

        if (errors.length > 0) {
          return ctx.badRequest('Validation failed', { errors });
        }

        // Spam detection
        const isSpam = detectSubmissionSpam(formData, ipAddress);

        const submission = await prisma.formSubmission.create({
          data: {
            formId: form.id,
            data: formData as any,
            ipAddress: String(ipAddress),
            userAgent: userAgent || null,
            completionTime: formData.completionTime || null,
            isSpam,
            createdAt: new Date(),
          },
        });

        // Increment submission count
        await prisma.form.update({
          where: { id: form.id },
          data: { submissionCount: { increment: 1 } },
        });

        const message = isSpam
          ? 'Submission received'
          : (form.settings as FormConfig['settings'])?.submitMessage || 'Thank you for your submission!';

        strapi.log.info(`[Forms] Submission for form "${slug}" from ${ipAddress}${isSpam ? ' (flagged as spam)' : ''}`);

        return ctx.send({
          data: { id: submission.id, status: isSpam ? 'received' : 'success' },
          meta: { message },
        }, 201);
      },

      /**
       * List form submissions.
       *
       * GET /api/forms/:id/submissions?page=1&pageSize=50&spam=false
       */
      async submissions(ctx: any) {
        const { id } = ctx.params;
        const { page = 1, pageSize = 50, spam } = ctx.query;

        const filters: any = { formId: id };
        if (spam !== undefined) filters.isSpam = spam === 'true';

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return ctx.notFound('Form not found');

        const [subs, total] = await Promise.all([
          prisma.formSubmission.findMany({
            where: filters,
            orderBy: { createdAt: 'desc' },
            skip: (Number(page) - 1) * Number(pageSize),
            take: Number(pageSize),
          }),
          prisma.formSubmission.count({ where: filters }),
        ]);

        return ctx.send({
          data: subs,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total,
              pageCount: Math.ceil(total / Number(pageSize)),
            },
          },
        });
      },

      /**
       * Export form submissions as CSV.
       *
       * GET /api/forms/:id/submissions/export
       */
      async exportSubmissions(ctx: any) {
        const { id } = ctx.params;

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return ctx.notFound('Form not found');

        const submissions = await prisma.formSubmission.findMany({
          where: { formId: id, isSpam: false },
          orderBy: { createdAt: 'desc' },
        });

        // Build CSV from field IDs + metadata
        const fields = (form.fields as FormConfig['fields']).map((f: FormField) => f.id);
        const headers = [...fields, 'IP Address', 'Completion Time', 'Submitted At'];

        const rows = submissions.map((sub: any) => {
          const data = sub.data as Record<string, any>;
          return [
            ...fields.map((fId: string) => {
              const val = data[fId];
              if (val === undefined || val === null) return '';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            }),
            sub.ipAddress || '',
            sub.completionTime || '',
            sub.createdAt.toISOString(),
          ];
        });

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

        ctx.set('Content-Type', 'text/csv');
        ctx.set('Content-Disposition', `attachment; filename="form-${form.slug}-submissions.csv"`);
        return ctx.send(csv);
      },

      /**
       * Get form analytics (completion rate, drop-off, field stats).
       *
       * GET /api/forms/:id/analytics
       */
      async analytics(ctx: any) {
        const { id } = ctx.params;

        const form = await prisma.form.findUnique({ where: { id } });
        if (!form) return ctx.notFound('Form not found');

        const fields = form.fields as FormConfig['fields'];

        const [totalSubmissions, spamCount, avgCompletionTime, submissionsByDay] = await Promise.all([
          prisma.formSubmission.count({ where: { formId: id } }),
          prisma.formSubmission.count({ where: { formId: id, isSpam: true } }),
          prisma.formSubmission.aggregate({
            where: { formId: id, isSpam: false, completionTime: { not: null } },
            _avg: { completionTime: true },
          }),
          prisma.$queryRaw<{ date: string; count: bigint }[]>`
            SELECT DATE("createdAt") as date, COUNT(*)::bigint as count
            FROM form_submissions
            WHERE "formId" = ${id} AND "isSpam" = false
            GROUP BY DATE("createdAt")
            ORDER BY date DESC
            LIMIT 30
          `,
        ]);

        // Field-level completion stats
        const fieldStats: Record<string, { filled: number; empty: number }> = {};
        const validSubmissions = await prisma.formSubmission.findMany({
          where: { formId: id, isSpam: false },
          select: { data: true },
        });

        for (const field of fields) {
          let filled = 0;
          let empty = 0;
          for (const sub of validSubmissions) {
            const data = sub.data as Record<string, any>;
            if (data[field.id] !== undefined && data[field.id] !== null && data[field.id] !== '') {
              filled++;
            } else {
              empty++;
            }
          }
          fieldStats[field.id] = { filled, empty };
        }

        const cleanRate = totalSubmissions > 0
          ? ((totalSubmissions - spamCount) / totalSubmissions) * 100
          : 0;

        return ctx.send({
          data: {
            formId: form.id,
            formName: form.name,
            totalSubmissions,
            validSubmissions: totalSubmissions - spamCount,
            spamSubmissions: spamCount,
            spamRate: Math.round((spamCount / Math.max(totalSubmissions, 1)) * 10000) / 100,
            cleanRate: Math.round(cleanRate * 100) / 100,
            avgCompletionTime: Math.round(avgCompletionTime._avg.completionTime || 0),
            submissionsByDay: submissionsByDay.map(d => ({ date: d.date, count: Number(d.count) })),
            fieldStats,
          },
        });
      },
    }));

    strapi.log.info('📝 Forms plugin registered');
  },

  bootstrap({ strapi }: any) {
    strapi.log.info('[Forms] Server-side validation, conditional logic, and spam detection ready');
  },
};

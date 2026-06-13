/**
 * Multi-Site Plugin for Strapi v5
 *
 * Features:
 *   - Site CRUD (admin)
 *   - Domain resolution middleware
 *   - Per-site content filtering
 *   - Shared media library option
 *
 * @module multi-site
 */

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Site Resolution Cache
// ═══════════════════════════════════════════════════════════════

const siteCache = new Map<string, { site: any; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function resolveSiteByDomain(domain: string): Promise<any> {
  const cached = siteCache.get(domain);
  if (cached && Date.now() < cached.expires) {
    return cached.site;
  }

  const site = await prisma.site.findFirst({
    where: {
      OR: [
        { domain },
        { domain: { contains: domain } },
      ],
      status: 'active',
    },
  });

  if (site) {
    siteCache.set(domain, { site, expires: Date.now() + CACHE_TTL });
  }

  return site;
}

function invalidateSiteCache(domain: string): void {
  siteCache.delete(domain);
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Admin: Site CRUD
      {
        method: 'GET',
        path: '/api/sites',
        handler: 'site.find',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'GET',
        path: '/api/sites/:id',
        handler: 'site.findOne',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'POST',
        path: '/api/sites',
        handler: 'site.create',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'PUT',
        path: '/api/sites/:id',
        handler: 'site.update',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      {
        method: 'DELETE',
        path: '/api/sites/:id',
        handler: 'site.delete',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Public: Get current site by domain
      {
        method: 'GET',
        path: '/api/sites/resolve',
        handler: 'site.resolve',
        config: { policies: [], auth: false },
      },
      // Per-site posts
      {
        method: 'GET',
        path: '/api/sites/:slug/posts',
        handler: 'site.sitePosts',
        config: { policies: [], auth: false },
      },
      // Site stats
      {
        method: 'GET',
        path: '/api/sites/:id/stats',
        handler: 'site.stats',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('site', () => ({
      /**
       * List all sites.
       *
       * GET /api/sites
       */
      async find(ctx: any) {
        const { status, page = 1, pageSize = 50 } = ctx.query;
        const filters: any = {};
        if (status) filters.status = status;

        const sites = await prisma.site.findMany({
          where: filters,
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
        });

        const total = await prisma.site.count({ where: filters });

        return ctx.send({
          data: sites,
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
       * Get a single site by ID.
       *
       * GET /api/sites/:id
       */
      async findOne(ctx: any) {
        const { id } = ctx.params;

        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return ctx.notFound('Site not found');

        return ctx.send({ data: site });
      },

      /**
       * Create a new site.
       *
       * POST /api/sites
       * Body: { name, slug, domain, description?, theme?, settings? }
       */
      async create(ctx: any) {
        const { name, slug, domain, description, theme, settings } = ctx.request.body;

        if (!name || !slug || !domain) {
          return ctx.badRequest('Missing required fields: name, slug, domain');
        }

        // Validate domain format
        try {
          new URL(domain.startsWith('http') ? domain : `https://${domain}`);
        } catch {
          return ctx.badRequest('Invalid domain format');
        }

        // Check uniqueness
        const existing = await prisma.site.findFirst({
          where: { OR: [{ slug }, { domain }] },
        });

        if (existing) {
          return ctx.badRequest('A site with this slug or domain already exists');
        }

        const site = await prisma.site.create({
          data: {
            name,
            slug,
            domain,
            description: description || null,
            theme: theme || {},
            settings: settings || {},
            status: 'active',
          },
        });

        strapi.log.info(`[Multi-Site] Created site: ${site.name} (${site.domain})`);

        return ctx.send({ data: site }, 201);
      },

      /**
       * Update a site.
       *
       * PUT /api/sites/:id
       */
      async update(ctx: any) {
        const { id } = ctx.params;
        const { name, domain, description, theme, settings, status } = ctx.request.body;

        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return ctx.notFound('Site not found');

        // Check domain uniqueness if changing
        if (domain && domain !== site.domain) {
          const existing = await prisma.site.findFirst({
            where: { domain, NOT: { id } },
          });
          if (existing) return ctx.badRequest('Domain is already in use');
        }

        const updated = await prisma.site.update({
          where: { id },
          data: {
            ...(name && { name }),
            ...(domain && { domain }),
            ...(description !== undefined && { description }),
            ...(theme && { theme }),
            ...(settings && { settings }),
            ...(status && { status }),
          },
        });

        // Invalidate cache
        invalidateSiteCache(site.domain);
        if (domain && domain !== site.domain) {
          invalidateSiteCache(domain);
        }

        strapi.log.info(`[Multi-Site] Updated site: ${updated.name}`);

        return ctx.send({ data: updated });
      },

      /**
       * Delete a site.
       *
       * DELETE /api/sites/:id
       */
      async delete(ctx: any) {
        const { id } = ctx.params;

        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return ctx.notFound('Site not found');

        // Soft delete: archive instead of hard delete
        await prisma.site.update({
          where: { id },
          data: { status: 'archived' },
        });

        invalidateSiteCache(site.domain);

        strapi.log.info(`[Multi-Site] Archived site: ${site.name}`);

        return ctx.send({ data: { id }, meta: { archived: true } });
      },

      /**
       * Resolve site by domain (public).
       * Used by frontend to detect which site is being viewed.
       *
       * GET /api/sites/resolve?domain=example.com
       */
      async resolve(ctx: any) {
        const domain = ctx.query.domain ||
          ctx.request.headers['x-forwarded-host'] ||
          ctx.request.headers['host'];

        if (!domain) return ctx.badRequest('Domain parameter is required');

        const site = await resolveSiteByDomain(domain);

        if (!site) {
          return ctx.notFound('No site configured for this domain');
        }

        return ctx.send({ data: site });
      },

      /**
       * Get posts for a specific site.
       *
       * GET /api/sites/:slug/posts?page=1&pageSize=20&locale=en&featured=true
       */
      async sitePosts(ctx: any) {
        const { slug } = ctx.params;
        const { page = 1, pageSize = 20, locale, featured, category, tag, search } = ctx.query;

        const site = await prisma.site.findUnique({ where: { slug } });
        if (!site) return ctx.notFound('Site not found');

        const settings = (site.settings as Record<string, any>) || {};
        const defaultLocale = settings.defaultLocale || 'en';

        // Build filters based on site settings and query params
        const filters: any = { status: 'published' };
        filters.locale = locale || defaultLocale;

        if (featured !== undefined) filters.featured = featured === 'true';
        if (category) filters.categories = { some: { slug: category } };
        if (tag) filters.tags = { some: { slug: tag } };

        // If site has allowed locales, filter by those
        const allowedLocales = settings.allowedLocales as string[] | undefined;
        if (allowedLocales?.length && !locale) {
          const resolvedLocale = defaultLocale;
          filters.locale = { in: allowedLocales };

          // Prioritize default locale but include all allowed
          const posts = await strapi.entityService.findMany('api::post.post', {
            filters,
            populate: {
              author: { fields: ['id', 'username'] },
              tags: { fields: ['name', 'slug'] },
              categories: { fields: ['name', 'slug'] },
            },
            sort: [
              { publishedAt: 'desc' },
              ...(locale ? [] : [{ locale: 'asc' }]),
            ],
            pagination: { page, pageSize },
          });

          const total = await strapi.entityService.count('api::post.post', { filters });

          return ctx.send({
            data: posts,
            meta: {
              site: { id: site.id, name: site.name, slug: site.slug, domain: site.domain },
              pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total,
                pageCount: Math.ceil(total / Number(pageSize)),
              },
              locale: locale || defaultLocale,
            },
          });
        }

        const posts = await strapi.entityService.findMany('api::post.post', {
          filters,
          populate: {
            author: { fields: ['id', 'username'] },
            tags: { fields: ['name', 'slug'] },
            categories: { fields: ['name', 'slug'] },
          },
          sort: { publishedAt: 'desc' },
          pagination: { page, pageSize },
        });

        const total = await strapi.entityService.count('api::post.post', { filters });

        return ctx.send({
          data: posts,
          meta: {
            site: { id: site.id, name: site.name, slug: site.slug, domain: site.domain },
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
       * Get site statistics.
       *
       * GET /api/sites/:id/stats
       */
      async stats(ctx: any) {
        const { id } = ctx.params;

        const site = await prisma.site.findUnique({ where: { id } });
        if (!site) return ctx.notFound('Site not found');

        const settings = (site.settings as Record<string, any>) || {};
        const locales = [settings.defaultLocale || 'en'];

        const [postCount, publishedCount, draftCount, totalViews, topPosts] = await Promise.all([
          prisma.post.count({
            where: { locale: { in: locales } },
          }),
          prisma.post.count({
            where: { locale: { in: locales }, status: 'published' },
          }),
          prisma.post.count({
            where: { locale: { in: locales }, status: 'draft' },
          }),
          prisma.post.aggregate({
            where: { locale: { in: locales } },
            _sum: { viewCount: true },
          }),
          prisma.post.findMany({
            where: { locale: { in: locales }, status: 'published' },
            orderBy: { viewCount: 'desc' },
            take: 5,
            select: { id: true, title: true, slug: true, viewCount: true },
          }),
        ]);

        return ctx.send({
          data: {
            site: { id: site.id, name: site.name, slug: site.slug, domain: site.domain },
            stats: {
              postCount,
              publishedCount,
              draftCount,
              totalViews: totalViews._sum.viewCount || 0,
              topPosts,
            },
          },
        });
      },
    }));

    // ── Domain Resolution Middleware ──────────────────────────

    // Attach site context to all incoming requests based on domain
    strapi.server.use(async (ctx: any, next: any) => {
      const domain = ctx.request.headers['x-forwarded-host'] ||
        ctx.request.headers['host'] ||
        ctx.request.headers['origin'];

      if (domain) {
        try {
          const site = await resolveSiteByDomain(domain);
          if (site) {
            ctx.state.site = site;
            ctx.state.siteId = site.id;
          }
        } catch {
          // Silently continue — don't block requests on site resolution failure
        }
      }

      return next();
    });

    strapi.log.info('🌐 Multi-Site plugin registered');
  },

  bootstrap({ strapi }: any) {
    strapi.log.info('[Multi-Site] Domain resolution and per-site filtering ready');
  },
};

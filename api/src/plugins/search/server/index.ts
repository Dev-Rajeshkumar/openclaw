/**
 * Search Plugin for Strapi v5
 *
 * Meilisearch integration with:
 *   - Auto-index on post publish/unpublish (lifecycle hooks)
 *   - Search endpoint with faceted filtering and highlighting
 *   - Reindex management endpoints
 *   - Search analytics (popular queries, no-result queries)
 *
 * @module search
 */

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// Meilisearch Client
// ═══════════════════════════════════════════════════════════════

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_API_KEY = process.env.MEILI_API_KEY || 'masterKey';
const POST_INDEX = 'posts';

let meiliClient: any = null;

async function getMeiliClient() {
  if (!meiliClient) {
    const MeiliSearch = (await import('meilisearch')).default;
    meiliClient = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY });
  }
  return meiliClient;
}

// ═══════════════════════════════════════════════════════════════
// Index Management
// ═══════════════════════════════════════════════════════════════

async function configureIndex(): Promise<void> {
  const client = await getMeiliClient();
  try {
    await client.createIndex(POST_INDEX, { primaryKey: 'id' });
  } catch (e: any) {
    if (!e.message?.includes('already exists')) throw e;
  }

  await client.index(POST_INDEX).updateSettings({
    searchableAttributes: ['title', 'content', 'excerpt', 'seoKeywords', 'authorName'],
    filterableAttributes: ['status', 'locale', 'tags', 'categories', 'authorId', 'publishedAt', 'featured'],
    sortableAttributes: ['publishedAt', 'viewCount', 'readingTimeMinutes'],
    rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness', 'publishedAt:desc'],
    typoTolerance: { enabled: true, minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
    pagination: { maxTotalHits: 1000 },
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function indexPost(post: any): Promise<void> {
  const client = await getMeiliClient();
  const doc = {
    id: post.id,
    title: post.title,
    content: stripHtml(post.content || ''),
    excerpt: post.excerpt || '',
    slug: post.slug,
    featured: post.featured || false,
    status: post.status,
    locale: post.locale || 'en',
    authorId: post.author?.id || post.authorId,
    authorName: post.author?.username || 'Unknown',
    tags: (post.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)),
    categories: (post.categories || []).map((c: any) => (typeof c === 'string' ? c : c.name)),
    publishedAt: post.publishedAt ? new Date(post.publishedAt).getTime() : null,
    viewCount: post.viewCount || 0,
    readingTimeMinutes: post.readingTimeMinutes || 0,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    seoKeywords: post.seoKeywords || '',
  };
  await client.index(POST_INDEX).addDocuments([doc]);
}

async function removePostFromIndex(postId: string): Promise<void> {
  const client = await getMeiliClient();
  await client.index(POST_INDEX).deleteDocument(postId);
}

// ═══════════════════════════════════════════════════════════════
// Search Analytics
// ═══════════════════════════════════════════════════════════════

async function logSearchQuery(query: string, resultCount: number, userId?: string): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: resultCount === 0 ? 'search_no_results' : 'search_query',
      entityType: 'search',
      entityId: query.toLowerCase().trim(),
      newValue: { query, resultCount, timestamp: new Date().toISOString() } as any,
      actorId: userId || null,
    },
  });
}

async function getPopularQueries(limit = 20): Promise<{ query: string; count: number }[]> {
  const results = await prisma.$queryRaw<{ entityId: string; count: bigint }[]>`
    SELECT "entityId", COUNT(*) as count
    FROM audit_logs
    WHERE action = 'search_query'
      AND "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY "entityId"
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return results.map(r => ({ query: r.entityId, count: Number(r.count) }));
}

async function getNoResultQueries(limit = 20): Promise<{ query: string; count: number }[]> {
  const results = await prisma.$queryRaw<{ entityId: string; count: bigint }[]>`
    SELECT "entityId", COUNT(*) as count
    FROM audit_logs
    WHERE action = 'search_no_results'
      AND "createdAt" >= NOW() - INTERVAL '30 days'
    GROUP BY "entityId"
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return results.map(r => ({ query: r.entityId, count: Number(r.count) }));
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default {
  register({ strapi }: any) {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Public search
      {
        method: 'GET',
        path: '/api/search',
        handler: 'search.search',
        config: { policies: [], auth: false },
      },
      // Facet counts
      {
        method: 'GET',
        path: '/api/search/facets',
        handler: 'search.facets',
        config: { policies: [], auth: false },
      },
      // Admin: reindex
      {
        method: 'POST',
        path: '/api/search/reindex',
        handler: 'search.reindex',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: reindex single post
      {
        method: 'POST',
        path: '/api/search/reindex/:postId',
        handler: 'search.reindexOne',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: search analytics
      {
        method: 'GET',
        path: '/api/search/analytics',
        handler: 'search.analytics',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Admin: index status
      {
        method: 'GET',
        path: '/api/search/status',
        handler: 'search.status',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('search', () => ({
      /**
       * Search posts with faceted filtering, highlighting, and sorting.
       *
       * GET /api/search?q=keyword&tags=tech,news&categories=ai&authorId=123
       *      &featured=true&dateFrom=2025-01-01&dateTo=2025-12-31
       *      &page=1&pageSize=20&sort=publishedAt:desc&locale=en
       */
      async search(ctx: any) {
        const {
          q = '',
          tags,
          categories,
          authorId,
          featured,
          dateFrom,
          dateTo,
          locale,
          page = 1,
          pageSize = 20,
          sort,
        } = ctx.query;

        const filterParts: string[] = ['status = "published"'];

        if (locale) filterParts.push(`locale = "${locale}"`);
        if (authorId) filterParts.push(`authorId = "${authorId}"`);
        if (featured !== undefined) filterParts.push(`featured = ${featured === 'true'}`);
        if (tags) {
          const tagList = tags.split(',').map((t: string) => `"${t.trim()}"`);
          filterParts.push(`tags IN [${tagList.join(',')}]`);
        }
        if (categories) {
          const catList = categories.split(',').map((c: string) => `"${c.trim()}"`);
          filterParts.push(`categories IN [${catList.join(',')}]`);
        }
        if (dateFrom) filterParts.push(`publishedAt >= ${new Date(dateFrom).getTime()}`);
        if (dateTo) filterParts.push(`publishedAt <= ${new Date(dateTo).getTime()}`);

        const searchParams: any = {
          limit: Number(pageSize),
          offset: (Number(page) - 1) * Number(pageSize),
          filter: filterParts.join(' AND '),
          attributesToHighlight: ['title', 'content', 'excerpt'],
          highlightPreTag: '<mark>',
          highlightPostTag: '</mark>',
          attributesToCrop: ['content'],
          cropLength: 200,
        };

        if (sort) {
          const [field, order] = sort.split(':');
          searchParams.sort = [`${field}:${order}`];
        }

        try {
          const client = await getMeiliClient();
          const results = await client.index(POST_INDEX).search(q, searchParams);

          // Log search analytics (fire-and-forget)
          logSearchQuery(q, results.estimatedTotalHits || 0, ctx.state.user?.id).catch(() => {});

          return ctx.send({
            data: results.hits.map((hit: any) => ({
              id: hit.id,
              title: hit._formatted?.title || hit.title,
              excerpt: hit._formatted?.excerpt || hit.excerpt,
              content: hit._formatted?.content || '',
              slug: hit.slug,
              authorName: hit.authorName,
              tags: hit.tags,
              categories: hit.categories,
              publishedAt: hit.publishedAt ? new Date(hit.publishedAt).toISOString() : null,
              viewCount: hit.viewCount,
              readingTimeMinutes: hit.readingTimeMinutes,
            })),
            meta: {
              pagination: {
                page: Number(page),
                pageSize: Number(pageSize),
                total: results.estimatedTotalHits || 0,
                totalPages: Math.ceil((results.estimatedTotalHits || 0) / Number(pageSize)),
              },
              processingTimeMs: results.processingTimeMs,
              query: results.query,
            },
          });
        } catch (error: any) {
          strapi.log.error('[Search] Search failed:', error.message);
          // Fallback to database search
          return fallbackDBSearch(ctx);
        }
      },

      /**
       * Get facet counts for search results.
       *
       * GET /api/search/facets?q=keyword&locale=en
       */
      async facets(ctx: any) {
        const { q = '', locale } = ctx.query;
        const filterParts: string[] = ['status = "published"'];
        if (locale) filterParts.push(`locale = "${locale}"`);

        try {
          const client = await getMeiliClient();
          const results = await client.index(POST_INDEX).search(q, {
            filter: filterParts.join(' AND '),
            facets: ['tags', 'categories', 'locale', 'authorName'],
            limit: 0,
          });

          return ctx.send({
            data: results.facetDistribution || {},
            meta: { query: q },
          });
        } catch (error: any) {
          strapi.log.error('[Search] Facets failed:', error.message);
          return ctx.send({ data: {}, meta: { error: 'Facet computation failed' } });
        }
      },

      /**
       * Reindex all published posts.
       *
       * POST /api/search/reindex
       */
      async reindex(ctx: any) {
        try {
          const posts = await strapi.entityService.findMany('api::post.post', {
            filters: { status: 'published' },
            populate: {
              author: { fields: ['id', 'username'] },
              tags: { fields: ['name'] },
              categories: { fields: ['name'] },
            },
            pagination: { limit: 10000 },
          });

          const client = await getMeiliClient();

          // Delete and recreate index for clean reindex
          try {
            await client.index(POST_INDEX).deleteAllDocuments();
          } catch {
            // Index might not exist yet
          }

          // Batch index in chunks of 100
          const BATCH_SIZE = 100;
          let indexed = 0;
          for (let i = 0; i < posts.length; i += BATCH_SIZE) {
            const batch = posts.slice(i, i + BATCH_SIZE);
            const docs = batch.map((post: any) => ({
              id: post.id,
              title: post.title,
              content: stripHtml(post.content || ''),
              excerpt: post.excerpt || '',
              slug: post.slug,
              featured: post.featured || false,
              status: post.status,
              locale: post.locale || 'en',
              authorId: post.author?.id || post.authorId,
              authorName: post.author?.username || 'Unknown',
              tags: (post.tags || []).map((t: any) => (typeof t === 'string' ? t : t.name)),
              categories: (post.categories || []).map((c: any) => (typeof c === 'string' ? c : c.name)),
              publishedAt: post.publishedAt ? new Date(post.publishedAt).getTime() : null,
              viewCount: post.viewCount || 0,
              readingTimeMinutes: post.readingTimeMinutes || 0,
              seoTitle: post.seoTitle || '',
              seoDescription: post.seoDescription || '',
              seoKeywords: post.seoKeywords || '',
            }));
            await client.index(POST_INDEX).addDocuments(docs);
            indexed += docs.length;
          }

          strapi.log.info(`[Search] Reindexed ${indexed} posts`);

          return ctx.send({
            data: { indexed, total: posts.length },
            meta: { status: 'success' },
          });
        } catch (error: any) {
          strapi.log.error('[Search] Reindex failed:', error.message);
          return ctx.internalServerError('Reindex failed', { error: error.message });
        }
      },

      /**
       * Reindex a single post.
       *
       * POST /api/search/reindex/:postId
       */
      async reindexOne(ctx: any) {
        const { postId } = ctx.params;

        const post = await strapi.entityService.findOne('api::post.post', postId, {
          populate: {
            author: { fields: ['id', 'username'] },
            tags: { fields: ['name'] },
            categories: { fields: ['name'] },
          },
        });

        if (!post) return ctx.notFound('Post not found');

        if (post.status === 'published') {
          await indexPost(post);
        } else {
          await removePostFromIndex(postId);
        }

        return ctx.send({ data: { id: postId, action: post.status === 'published' ? 'indexed' : 'removed' } });
      },

      /**
       * Get search analytics.
       *
       * GET /api/search/analytics?limit=20
       */
      async analytics(ctx: any) {
        const { limit = 20 } = ctx.query;

        const [popularQueries, noResultQueries, totalSearches] = await Promise.all([
          getPopularQueries(Number(limit)),
          getNoResultQueries(Number(limit)),
          prisma.auditLog.count({
            where: {
              action: { in: ['search_query', 'search_no_results'] },
              createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            },
          }),
        ]);

        return ctx.send({
          data: {
            popularQueries,
            noResultQueries,
            totalSearches,
            period: '30d',
          },
        });
      },

      /**
       * Get Meilisearch index status.
       *
       * GET /api/search/status
       */
      async status(ctx: any) {
        try {
          const client = await getMeiliClient();
          const stats = await client.index(POST_INDEX).getStats();
          const health = await client.health();

          return ctx.send({
            data: {
              health,
              stats: {
                numberOfDocuments: stats.numberOfDocuments,
                isIndexing: stats.isIndexing,
                fieldDistribution: stats.fieldDistribution,
              },
              config: {
                host: MEILI_HOST,
                index: POST_INDEX,
              },
            },
          });
        } catch (error: any) {
          return ctx.send({
            data: {
              health: 'unavailable',
              error: error.message,
            },
          });
        }
      },
    }));

    // ── Lifecycle Hooks ───────────────────────────────────────

    strapi.db.lifecycles.subscribe({
      models: ['api::post.post'],
      async afterCreate(event: any) {
        const result = event.result;
        if (result?.status === 'published') {
          try {
            await indexPost(result);
            strapi.log.info(`[Search] Indexed new post #${result.id}`);
          } catch (e: any) {
            strapi.log.error(`[Search] Failed to index post #${result.id}:`, e.message);
          }
        }
      },
      async afterUpdate(event: any) {
        const result = event.result;
        if (!result) return;

        try {
          if (result.status === 'published') {
            await indexPost(result);
            strapi.log.info(`[Search] Re-indexed post #${result.id}`);
          } else {
            await removePostFromIndex(result.id);
            strapi.log.info(`[Search] Removed post #${result.id} from index (status: ${result.status})`);
          }
        } catch (e: any) {
          strapi.log.error(`[Search] Failed to update index for post #${result.id}:`, e.message);
        }
      },
      async afterDelete(event: any) {
        const result = event.result;
        if (result?.id) {
          try {
            await removePostFromIndex(result.id);
            strapi.log.info(`[Search] Removed deleted post #${result.id} from index`);
          } catch (e: any) {
            strapi.log.error(`[Search] Failed to remove post #${result.id}:`, e.message);
          }
        }
      },
    });

    strapi.log.info('🔍 Search plugin registered — Meilisearch integration');
  },

  async bootstrap({ strapi }: any) {
    try {
      await configureIndex();
      strapi.log.info('[Search] Meilisearch index configured ✓');
    } catch (e: any) {
      strapi.log.warn('[Search] Meilisearch not available — search will use DB fallback', e.message);
    }
  },
};

// ═══════════════════════════════════════════════════════════════
// Fallback DB Search (when Meilisearch is unavailable)
// ═══════════════════════════════════════════════════════════════

async function fallbackDBSearch(ctx: any) {
  const { q = '', page = 1, pageSize = 20, locale, tags, categories } = ctx.query;

  const filters: any = { status: 'published' };
  if (locale) filters.locale = locale;
  if (q) {
    filters.or = [
      { title: { contains: q, mode: 'insensitive' } },
      { content: { contains: q, mode: 'insensitive' } },
      { excerpt: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (tags) {
    filters.tags = { name: { in: tags.split(',') } };
  }
  if (categories) {
    filters.categories = { name: { in: categories.split(',') } };
  }

  const posts = await strapi.entityService.findMany('api::post.post', {
    filters,
    populate: {
      author: { fields: ['id', 'username'] },
      tags: { fields: ['name'] },
      categories: { fields: ['name'] },
    },
    sort: { publishedAt: 'desc' },
    pagination: { page, pageSize },
  });

  const total = await strapi.entityService.count('api::post.post', { filters });

  return ctx.send({
    data: posts,
    meta: {
      pagination: {
        page: Number(page),
        pageSize: Number(pageSize),
        total,
        pageCount: Math.ceil(total / Number(pageSize)),
      },
      fallback: true,
    },
  });
}

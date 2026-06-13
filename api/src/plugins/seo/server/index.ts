'use strict';

import prisma from '../../../lib/prisma';

// ═══════════════════════════════════════════════════════════════
// SEO Toolkit Plugin
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a URL-friendly slug from a string.
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculate Flesch-Kincaid readability score.
 * Returns a score 0-100 (higher = easier to read).
 */
function fleschKincaid(text: string): number {
  const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const syllables = words.reduce((total, word) => {
    return total + countSyllables(word);
  }, 0);

  const sentenceCount = Math.max(sentences.length, 1);
  const wordCount = Math.max(words.length, 1);

  const score =
    206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);

  return Math.max(0, Math.min(100, Math.round(score)));
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
}

/**
 * Count keyword density in text.
 */
function keywordDensity(text: string, keyword: string): number {
  const cleanText = text.toLowerCase().replace(/<[^>]*>/g, '');
  const words = cleanText.split(/\s+/).filter((w) => w.length > 0);
  const keywordCount = words.filter((w) =>
    w.includes(keyword.toLowerCase())
  ).length;
  return words.length > 0 ? Math.round((keywordCount / words.length) * 10000) / 100 : 0;
}

/**
 * Extract heading structure from HTML content.
 */
function extractHeadings(content: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    });
  }
  return headings;
}

/**
 * Count internal and external links.
 */
function countLinks(content: string): { internal: number; external: number } {
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let internal = 0;
  let external = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const href = match[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      external++;
    } else {
      internal++;
    }
  }
  return { internal, external };
}

// ═══════════════════════════════════════════════════════════════
// Plugin Registration
// ═══════════════════════════════════════════════════════════════

export default ({ strapi }) => ({
  register() {
    // ── Routes ────────────────────────────────────────────────

    strapi.server.routes([
      // Dynamic sitemap
      {
        method: 'GET',
        path: '/sitemap.xml',
        handler: 'seo.sitemap',
        config: { auth: false, policies: [] },
      },
      // Robots.txt
      {
        method: 'GET',
        path: '/robots.txt',
        handler: 'seo.robots',
        config: { auth: false, policies: [] },
      },
      // SEO analysis
      {
        method: 'POST',
        path: '/api/seo/analyze',
        handler: 'seo.analyze',
        config: { auth: { scope: ['admin'] } },
      },
      // Schema.org JSON-LD
      {
        method: 'GET',
        path: '/api/seo/schema/:postId',
        handler: 'seo.schema',
        config: { auth: false },
      },
    ]);

    // ── Controllers ───────────────────────────────────────────

    strapi.controller('seo', () => ({
      /**
       * GET /sitemap.xml
       * Dynamic sitemap with all published posts and pages.
       */
      async sitemap(ctx: any) {
        const posts = await prisma.post.findMany({
          where: { status: 'published' },
          select: {
            slug: true,
            updatedAt: true,
            publishedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        });

        const baseUrl =
          process.env.PUBLIC_URL ||
          `${ctx.request.protocol}://${ctx.request.host}`;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        // Homepage
        xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;

        for (const post of posts) {
          xml += `  <url>\n`;
          xml += `    <loc>${baseUrl}/posts/${post.slug}</loc>\n`;
          xml += `    <lastmod>${(post.updatedAt || post.publishedAt || new Date()).toISOString()}</lastmod>\n`;
          xml += `    <changefreq>weekly</changefreq>\n`;
          xml += `    <priority>0.8</priority>\n`;
          xml += `  </url>\n`;
        }

        xml += '</urlset>';

        ctx.set('Content-Type', 'application/xml');
        return ctx.send(xml);
      },

      /**
       * GET /robots.txt
       * Robots.txt with sitemap reference.
       */
      async robots(ctx: any) {
        const baseUrl =
          process.env.PUBLIC_URL ||
          `${ctx.request.protocol}://${ctx.request.host}`;

        const lines = [
          'User-agent: '*,
          'Allow: /',
          'Disallow: /api/',
          'Disallow: /admin/',
          '',
          `Sitemap: ${baseUrl}/sitemap.xml`,
        ];

        ctx.set('Content-Type', 'text/plain');
        return ctx.send(lines.join('\n'));
      },

      /**
       * POST /api/seo/analyze
       * Analyze content for SEO metrics.
       * Body: { content: string, keyword?: string, title?: string }
       */
      async analyze(ctx: any) {
        const { content, keyword, title } = ctx.request.body;

        if (!content) {
          ctx.status = 400;
          ctx.body = { error: 'Missing required field: content' };
          return;
        }

        const cleanText = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        const words = cleanText.split(/\s+/).filter((w: string) => w.length > 0);
        const wordCount = words.length;
        const headings = extractHeadings(content);
        const links = countLinks(content);
        const readability = fleschKincaid(cleanText);

        const analysis: any = {
          wordCount,
          readability: {
            score: readability,
            label:
              readability >= 80
                ? 'Very Easy'
                : readability >= 60
                  ? 'Easy'
                  : readability >= 40
                    ? 'Moderate'
                    : readability >= 20
                      ? 'Difficult'
                      : 'Very Difficult',
          },
          headings: {
            total: headings.length,
            h1: headings.filter((h) => h.level === 1).length,
            h2: headings.filter((h) => h.level === 2).length,
            h3: headings.filter((h) => h.level === 3).length,
            structure: headings,
          },
          links,
          suggestions: [] as string[],
        };

        // Keyword analysis
        if (keyword) {
          analysis.keyword = {
            term: keyword,
            density: keywordDensity(cleanText, keyword),
            inTitle: title ? title.toLowerCase().includes(keyword.toLowerCase()) : false,
          };
        }

        // Generate suggestions
        if (wordCount < 300) analysis.suggestions.push('Content is short. Aim for 300+ words for better SEO.');
        if (headings.filter((h) => h.level === 1).length === 0)
          analysis.suggestions.push('Add an H1 heading containing your target keyword.');
        if (headings.filter((h) => h.level === 1).length > 1)
          analysis.suggestions.push('Multiple H1 headings detected. Use only one H1 per page.');
        if (readability < 40) analysis.suggestions.push('Content readability is low. Use shorter sentences.');
        if (links.internal === 0) analysis.suggestions.push('Add internal links to related content.');
        if (keyword && !analysis.keyword.inTitle)
          analysis.suggestions.push('Include the target keyword in the title.');
        if (keyword && analysis.keyword.density < 0.5)
          analysis.suggestions.push('Keyword density is low. Use the keyword more naturally.');
        if (keyword && analysis.keyword.density > 3)
          analysis.suggestions.push('Keyword density is high. Avoid keyword stuffing.');

        return { data: analysis };
      },

      /**
       * GET /api/seo/schema/:postId
       * Generate Schema.org JSON-LD for a post.
       */
      async schema(ctx: any) {
        const { postId } = ctx.params;

        const post = await prisma.post.findUnique({
          where: { id: postId },
          include: {
            author: { select: { username: true } },
            tags: { select: { name: true } },
            categories: { select: { name: true } },
          },
        });

        if (!post) {
          ctx.status = 404;
          ctx.body = { error: 'Post not found' };
          return;
        }

        const baseUrl =
          process.env.PUBLIC_URL || 'https://example.com';

        const schemaData = {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: post.title,
          description: post.seoDescription || post.excerpt || '',
          url: `${baseUrl}/posts/${post.slug}`,
          datePublished: post.publishedAt?.toISOString() || post.createdAt.toISOString(),
          dateModified: post.updatedAt.toISOString(),
          author: {
            '@type': 'Person',
            name: post.author?.username || 'Unknown',
          },
          keywords: post.tags.map((t) => t.name),
          articleSection: post.categories.map((c) => c.name),
          wordCount: post.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        };

        return { data: schemaData };
      },
    }));

    strapi.log.info('🔍 SEO Toolkit plugin registered');
  },

  bootstrap() {
    strapi.log.info('[SEO] Sitemap, robots.txt, and analysis endpoints ready');

    // Lifecycle hook: auto-set meta fields on post create/update
    strapi.db?.lifecycles?.subscribe?.({
      models: ['post'],
      async afterCreate(event: any) {
        await applySeoDefaults(event.result);
      },
      async afterUpdate(event: any) {
        await applySeoDefaults(event.result);
      },
    });
  },
});

/**
 * Auto-generate SEO meta fields if not set.
 */
async function applySeoDefaults(post: any) {
  if (!post) return;

  const updates: any = {};

  if (!post.seoTitle && post.title) {
    updates.seoTitle = post.title.slice(0, 60);
  }

  if (!post.seoDescription && (post.excerpt || post.content)) {
    const source = post.excerpt || post.content.replace(/<[^>]*>/g, ' ');
    updates.seoDescription = source.slice(0, 155).trim();
  }

  if (Object.keys(updates).length > 0) {
    try {
      await prisma.post.update({
        where: { id: post.id },
        data: updates,
      });
    } catch {
      // Silently fail — post may have been deleted
    }
  }
}

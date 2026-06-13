/**
 * Search Service — Meilisearch integration
 * 
 * Features:
 *   - Auto-index on content publish/unpublish
 *   - Faceted search (author, tags, date, locale)
 *   - Typo-tolerant, sub-50ms queries
 *   - Multi-language index support
 */

import MeiliSearch from 'meilisearch';

const MEILI_HOST = process.env.MEILI_HOST || 'http://localhost:7700';
const MEILI_API_KEY = process.env.MEILI_API_KEY || 'masterKey';

const client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_API_KEY });

const POST_INDEX = 'posts';

// --- Index Settings ---
export async function configureSearchIndex(): Promise<void> {
  try {
    // Create index if not exists
    await client.createIndex(POST_INDEX, { primaryKey: 'id' });
  } catch (e: any) {
    if (!e.message?.includes('already exists')) throw e;
  }

  await client.index(POST_INDEX).updateSettings({
    searchableAttributes: ['title', 'content', 'excerpt', 'seoKeywords', 'authorName'],
    filterableAttributes: ['status', 'locale', 'tags', 'categories', 'authorId', 'publishedAt', 'featured'],
    sortableAttributes: ['publishedAt', 'viewCount', 'readingTimeMinutes'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
      'publishedAt:desc',
    ],
    typoTolerance: {
      enabled: true,
      minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
    },
    pagination: { maxTotalHits: 1000 },
  });

  console.log('[Search] Meilisearch index configured ✓');
}

// --- Index Operations ---
export async function indexPost(post: any): Promise<void> {
  const doc = {
    id: post.id,
    title: post.title,
    content: stripHtml(post.content),
    excerpt: post.excerpt || '',
    slug: post.slug,
    featured: post.featured,
    status: post.status,
    locale: post.locale,
    authorId: post.author?.id,
    authorName: post.author?.username || 'Unknown',
    tags: (post.tags || []).map((t: any) => t.name),
    categories: (post.categories || []).map((c: any) => c.name),
    publishedAt: post.publishedAt ? new Date(post.publishedAt).getTime() : null,
    viewCount: post.viewCount || 0,
    readingTimeMinutes: post.readingTimeMinutes || 0,
    seoTitle: post.seoTitle || '',
    seoDescription: post.seoDescription || '',
    seoKeywords: post.seoKeywords || '',
  };

  await client.index(POST_INDEX).addDocuments([doc]);
}

export async function removePostFromIndex(postId: number): Promise<void> {
  await client.index(POST_INDEX).deleteDocument(postId);
}

export async function bulkIndexPosts(posts: any[]): Promise<void> {
  const docs = posts.map(post => ({
    id: post.id,
    title: post.title,
    content: stripHtml(post.content),
    excerpt: post.excerpt || '',
    slug: post.slug,
    featured: post.featured,
    status: post.status,
    locale: post.locale,
    authorId: post.author?.id,
    authorName: post.author?.username || 'Unknown',
    tags: (post.tags || []).map((t: any) => t.name),
    categories: (post.categories || []).map((c: any) => c.name),
    publishedAt: post.publishedAt ? new Date(post.publishedAt).getTime() : null,
    viewCount: post.viewCount || 0,
    readingTimeMinutes: post.readingTimeMinutes || 0,
  }));

  await client.index(POST_INDEX).addDocuments(docs);
}

// --- Search ---
export interface SearchOptions {
  query: string;
  filters?: {
    locale?: string;
    authorId?: number;
    tags?: string[];
    categories?: string[];
    featured?: boolean;
    dateFrom?: string;
    dateTo?: string;
  };
  page?: number;
  pageSize?: number;
  sortBy?: string;
}

export async function searchPosts(opts: SearchOptions) {
  const { query, filters, page = 1, pageSize = 20, sortBy } = opts;

  const filterParts: string[] = ['status = "published"'];

  if (filters?.locale) filterParts.push(`locale = "${filters.locale}"`);
  if (filters?.authorId) filterParts.push(`authorId = ${filters.authorId}`);
  if (filters?.featured !== undefined) filterParts.push(`featured = ${filters.featured}`);
  if (filters?.tags?.length) filterParts.push(`tags IN [${filters.tags.map(t => `"${t}"`).join(',')}]`);
  if (filters?.categories?.length) filterParts.push(`categories IN [${filters.categories.map(c => `"${c}"`).join(',')}]`);
  if (filters?.dateFrom) filterParts.push(`publishedAt >= ${new Date(filters.dateFrom).getTime()}`);
  if (filters?.dateTo) filterParts.push(`publishedAt <= ${new Date(filters.dateTo).getTime()}`);

  const searchParams: any = {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    filter: filterParts.join(' AND '),
    attributesToHighlight: ['title', 'content', 'excerpt'],
    highlightPreTag: '<mark>',
    highlightPostTag: '</mark>',
    attributesToCrop: ['content'],
    cropLength: 200,
  };

  if (sortBy) {
    searchParams.sort = [sortBy];
  }

  const results = await client.index(POST_INDEX).search(query, searchParams);

  return {
    hits: results.hits,
    totalHits: results.estimatedTotalHits,
    page,
    pageSize,
    totalPages: Math.ceil((results.estimatedTotalHits || 0) / pageSize),
    processingTimeMs: results.processingTimeMs,
    query: results.query,
  };
}

// --- Facet Counts ---
export async function getFacetCounts(query: string, locale?: string) {
  const filterParts: string[] = ['status = "published"'];
  if (locale) filterParts.push(`locale = "${locale}"`);

  const results = await client.index(POST_INDEX).search(query, {
    filter: filterParts.join(' AND '),
    facets: ['tags', 'categories', 'locale', 'authorName'],
    limit: 0,
  });

  return results.facetDistribution || {};
}

// --- Helpers ---
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export { client as meilisearchClient };

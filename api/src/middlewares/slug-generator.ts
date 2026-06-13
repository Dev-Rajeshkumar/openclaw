/**
 * Slug Generator Middleware
 *
 * Auto-generates URL-friendly slugs for posts, tags, categories.
 * Runs before create/update operations.
 *
 * Rules:
 *   - Lowercase, hyphens instead of spaces
 *   - Remove special characters
 *   - Append random suffix if duplicate
 *   - Max 80 characters
 */

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')     // Remove special chars
    .replace(/[\s_]+/g, '-')       // Spaces/underscores → hyphens
    .replace(/-+/g, '-')           // Collapse multiple hyphens
    .replace(/^-|-$/g, '')         // Trim leading/trailing hyphens
    .slice(0, 80);                  // Max length
}

function generateUniqueSlug(base: string, suffix?: string): string {
  const slug = suffix ? `${base}-${suffix}` : base;
  return slug.length > 80 ? slug.slice(0, 80) : slug;
}

export default (config: any, { strapi }: any) => {
  return async (ctx: any, next: any) => {
    const { method, url } = ctx.request;
    if (!['POST', 'PUT', 'PATCH'].includes(method)) return next();

    const body = ctx.request.body?.data || ctx.request.body;
    if (!body) return next();

    // Auto-generate slug for posts
    if (url.includes('/api/posts') && body.title && !body.slug) {
      const baseSlug = generateSlug(body.title);
      // Check uniqueness
      const existing = await strapi.db.query('api::post.post').findOne({
        where: { slug: baseSlug },
      });
      if (existing) {
        const suffix = Date.now().toString(36);
        body.slug = generateUniqueSlug(baseSlug, suffix);
      } else {
        body.slug = baseSlug;
      }
    }

    // Auto-generate slug for tags
    if (url.includes('/api/tags') && body.name && !body.slug) {
      body.slug = generateSlug(body.name);
    }

    // Auto-generate slug for categories
    if (url.includes('/api/categories') && body.name && !body.slug) {
      body.slug = generateSlug(body.name);
    }

    ctx.request.body = ctx.request.body?.data
      ? { data: body }
      : body;

    return next();
  };
};

export { generateSlug, generateUniqueSlug };

/**
 * View Tracker Middleware
 * 
 * Tracks post views when a post is fetched by slug.
 * Fire-and-forget — doesn't block the response.
 */

export default (config: any, { strapi }: any) => {
  return (ctx: any, next: any) => {
    const url = ctx.request.url;

    // Match single post fetch by slug pattern
    if (ctx.request.method === 'GET' && url.match(/\/api\/posts\/(?!.*\?).+$/)) {
      const postId = extractPostId(url);
      if (postId) {
        // Fire-and-forget view tracking
        trackView(strapi, {
          postId,
          userId: ctx.state.user?.id,
          ipAddress: ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown',
          userAgent: ctx.request.headers['user-agent'] || '',
          referrer: ctx.request.headers['referer'],
          timestamp: new Date(),
        }).catch(() => {}); // Silently fail
      }
    }

    return next();
  };
};

function extractPostId(url: string): number | null {
  const match = url.match(/\/api\/posts\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

async function trackView(strapi: any, event: any): Promise<void> {
  await strapi.db.query('api::post.post').update({
    where: { id: event.postId },
    data: { viewCount: { $increment: 1 } },
  });
}

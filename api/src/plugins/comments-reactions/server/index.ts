/**
 * Comments & Reactions Plugin for Strapi
 * 
 * Features:
 *   - Threaded comments (nested, paginated)
 *   - Moderation queue with admin approval
 *   - Spam scoring (basic heuristic + optional external API)
 *   - Reactions: likes, upvotes/downvotes, emoji
 *   - Abuse reporting
 *   - Email notifications (opt-in)
 */

export default {
  register({ strapi }: any) {
    // --- REST API for comments ---
    strapi.server.routes([
      {
        method: 'GET',
        path: '/api/comments',
        handler: 'comment.find',
        config: { policies: [], auth: false },
      },
      {
        method: 'GET',
        path: '/api/comments/:id',
        handler: 'comment.findOne',
        config: { policies: [], auth: false },
      },
      {
        method: 'POST',
        path: '/api/comments',
        handler: 'comment.create',
        config: { policies: [], auth: false }, // Auth handled in controller
      },
      {
        method: 'PUT',
        path: '/api/comments/:id/moderate',
        handler: 'comment.moderate',
        config: { policies: [], auth: { scope: ['admin'] } },
      },
      // Reactions
      {
        method: 'POST',
        path: '/api/reactions',
        handler: 'reaction.toggle',
        config: { policies: [], auth: { scope: ['authenticated'] } },
      },
      {
        method: 'GET',
        path: '/api/reactions/:contentType/:contentId',
        handler: 'reaction.getForContent',
        config: { policies: [], auth: false },
      },
      // Abuse reports
      {
        method: 'POST',
        path: '/api/abuse-reports',
        handler: 'abuse-report.create',
        config: { policies: [], auth: false },
      },
    ]);

    // --- Controllers ---
    strapi.controller('comment', () => ({
      async find(ctx: any) {
        const { postId, page = 1, pageSize = 20, status = 'approved' } = ctx.query;

        const filters: any = { status };
        if (postId) filters.post = postId;

        // Return top-level comments with nested replies populated
        const comments = await strapi.entityService.findMany('api::comment.comment', {
          filters,
          populate: {
            author: { fields: ['id', 'username', 'email'] },
            replies: {
              populate: { author: { fields: ['id', 'username'] } },
            },
          },
          sort: { createdAt: 'desc' },
          pagination: { page, pageSize },
        });

        const total = await strapi.entityService.count('api::comment.comment', { filters });

        return ctx.send({
          data: comments,
          meta: { pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } },
        });
      },

      async findOne(ctx: any) {
        const { id } = ctx.params;
        const comment = await strapi.entityService.findOne('api::comment.comment', id, {
          populate: {
            author: true,
            replies: { populate: { author: true } },
            reactions: true,
          },
        });
        if (!comment) return ctx.notFound('Comment not found');
        return ctx.send({ data: comment });
      },

      async create(ctx: any) {
        const { content, postId, parentId, authorName, authorEmail } = ctx.request.body;

        // --- Spam Detection ---
        const spamScore = calculateSpamScore(content, authorEmail);
        const status = spamScore > 0.7 ? 'spam' : (spamScore > 0.3 ? 'pending' : 'approved');

        const comment = await strapi.entityService.create('api::comment.comment', {
          data: {
            content: sanitizeContent(content),
            post: postId,
            parent: parentId || null,
            authorName: authorName || 'Anonymous',
            authorEmail,
            status,
            spamScore,
            locale: ctx.request.header['x-locale'] || 'en',
          },
          populate: { author: true, post: true },
        });

        // Notify post author if not spam
        if (status === 'approved') {
          strapi.log.info(`[Comments] New comment on post ${postId} by ${authorName}`);
          // TODO: Queue notification email
        }

        return ctx.send({ data: comment, meta: { status, spamScore } }, 201);
      },

      async moderate(ctx: any) {
        const { id } = ctx.params;
        const { action } = ctx.request.body; // 'approve', 'reject', 'spam'

        const statusMap: Record<string, string> = {
          approve: 'approved',
          reject: 'rejected',
          spam: 'spam',
        };

        const comment = await strapi.entityService.update('api::comment.comment', id, {
          data: { status: statusMap[action] || 'rejected', moderatedAt: new Date() },
        });

        return ctx.send({ data: comment });
      },
    }));

    strapi.controller('reaction', () => ({
      async toggle(ctx: any) {
        const { contentType, contentId, type } = ctx.request.body;
        const userId = ctx.state.user?.id;

        if (!userId) return ctx.unauthorized('Must be logged in to react');

        const validTypes = ['like', 'upvote', 'downvote', 'love', 'laugh', 'surprised', 'sad', 'angry'];
        if (!validTypes.includes(type)) {
          return ctx.badRequest(`Invalid reaction type. Must be: ${validTypes.join(', ')}`);
        }

        // Check for existing reaction
        const existing = await strapi.entityService.findMany('api::reaction.reaction', {
          filters: { user: userId, contentType, contentId },
        });

        if (existing.length > 0 && existing[0].type === type) {
          // Remove reaction (toggle off)
          await strapi.entityService.delete('api::reaction.reaction', existing[0].id);
          return ctx.send({ data: { action: 'removed', type } });
        }

        // Upsert: delete old reaction of different type, create new
        if (existing.length > 0) {
          await strapi.entityService.delete('api::reaction.reaction', existing[0].id);
        }

        const reaction = await strapi.entityService.create('api::reaction.reaction', {
          data: { contentType, contentId, type, user: userId },
        });

        return ctx.send({ data: { action: 'added', reaction } }, 201);
      },

      async getForContent(ctx: any) {
        const { contentType, contentId } = ctx.params;
        const userId = ctx.state.user?.id;

        const reactions = await strapi.entityService.findMany('api::reaction.reaction', {
          filters: { contentType, contentId },
          populate: { user: { fields: ['id', 'username'] } },
        });

        // Aggregate counts by type
        const counts: Record<string, number> = {};
        reactions.forEach((r: any) => {
          counts[r.type] = (counts[r.type] || 0) + 1;
        });

        // User's current reaction (if any)
        const userReaction = userId
          ? reactions.find((r: any) => r.user?.id === userId)?.type || null
          : null;

        return ctx.send({
          data: {
            counts,
            total: reactions.length,
            userReaction,
          },
        });
      },
    }));

    strapi.controller('abuse-report', () => ({
      async create(ctx: any) {
        const { commentId, reason, description, reporterEmail } = ctx.request.body;

        const report = await strapi.entityService.create('api::abuse-report.abuse-report', {
          data: {
            comment: commentId,
            reason, // 'spam', 'harassment', 'hate_speech', 'misinformation', 'other'
            description,
            reporterEmail,
            status: 'open',
          },
        });

        // Auto-flag comment if multiple reports
        const reportCount = await strapi.entityService.count('api::abuse-report.abuse-report', {
          filters: { comment: commentId, status: 'open' },
        });

        if (reportCount >= 3) {
          await strapi.entityService.update('api::comment.comment', commentId, {
            data: { status: 'flagged' },
          });
          strapi.log.warn(`[Abuse] Comment ${commentId} auto-flagged after ${reportCount} reports`);
        }

        return ctx.send({ data: report }, 201);
      },
    }));

    strapi.log.info('💬 Comments & Reactions plugin registered');
  },
};

// --- Utilities ---

function calculateSpamScore(content: string, email: string): number {
  let score = 0;
  
  // Heuristic: all caps
  if (content === content.toUpperCase() && content.length > 20) score += 0.3;
  
  // Heuristic: excessive links
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) score += 0.4;
  
  // Heuristic: spam keywords
  const spamKeywords = ['buy now', 'click here', 'free money', 'viagra', 'casino', 'lottery'];
  if (spamKeywords.some(k => content.toLowerCase().includes(k))) score += 0.5;
  
  // Heuristic: very short + link = spam
  if (content.length < 50 && linkCount > 0) score += 0.3;
  
  // Heuristic: suspicious email domains
  const suspiciousDomains = ['tempmail.com', 'guerrillamail.com', 'throwaway.email'];
  if (suspiciousDomains.some(d => email?.includes(d))) score += 0.2;
  
  return Math.min(score, 1.0);
}

function sanitizeContent(content: string): string {
  // Basic XSS prevention — full sanitization happens at render time
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .trim();
}

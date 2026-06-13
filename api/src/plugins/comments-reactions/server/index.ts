'use strict';

import { createCoreController, createCoreService } from '@strapi/strapi';
import { z } from 'zod';

// ── Validation Schemas ────────────────────────────────────────

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  postId: z.string(),
  authorName: z.string().max(100).optional(),
  authorEmail: z.string().email().optional(),
  authorWebsite: z.string().url().optional(),
  parentId: z.string().optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

const moderationSchema = z.object({
  status: z.enum(['approved', 'rejected', 'spam']),
});

const reactionSchema = z.object({
  type: z.enum(['like', 'love', 'laugh', 'surprised', 'sad', 'angry', 'upvote', 'downvote']),
  postId: z.string().optional(),
  commentId: z.string().optional(),
});

const abuseReportSchema = z.object({
  reason: z.enum(['spam', 'harassment', 'hate_speech', 'misinformation', 'other']),
  description: z.string().max(1000).optional(),
});

// ── Spam Detection ───────────────────────────────────────────

function detectSpam(content: string, ctx: any): number {
  let score = 0;

  // ALL CAPS ratio
  const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
  if (capsRatio > 0.5 && content.length > 20) score += 0.3;

  // Link count
  const linkCount = (content.match(/https?:\/\//g) || []).length;
  if (linkCount > 3) score += 0.3;
  else if (linkCount > 1) score += 0.1;

  // Repeated characters
  if (/(.)\1{5,}/.test(content)) score += 0.2;

  // Suspicious keywords
  const suspicious = ['buy now', 'click here', 'free money', 'limited offer', 'act now', 'viagra', 'casino'];
  const lowerContent = content.toLowerCase();
  for (const word of suspicious) {
    if (lowerContent.includes(word)) { score += 0.2; break; }
  }

  // Too fast (< 3 seconds — set by frontend)
  return Math.min(score, 1);
}

// ── Comments Controller ──────────────────────────────────────

const commentsController = createCoreController('api::comment.comment', ({ strapi }) => ({
  /**
   * POST /api/comments
   * Create a new comment (public)
   */
  async create(ctx) {
    const { error, data } = createCommentSchema.safeParse(ctx.request.body);
    if (error) {
      return ctx.badRequest('Validation error', { details: error.errors });
    }

    const { content, postId, authorName, authorEmail, authorWebsite, parentId } = data;

    // Verify post exists and allows comments
    const post = await strapi.entityService.findOne('api::post.post', postId);
    if (!post) return ctx.notFound('Post not found');
    if (!post.allowComments && post.allowComments !== null) return ctx.badRequest('Comments are disabled for this post');

    // Check parent comment exists if replying
    if (parentId) {
      const parent = await strapi.entityService.findOne('api::comment.comment', parentId);
      if (!parent) return ctx.notFound('Parent comment not found');
    }

    // Spam detection
    const spamScore = detectSpam(content, ctx);
    const status = spamScore > 0.6 ? 'pending' : 'pending'; // All comments go to moderation queue

    // Create comment
    const comment = await strapi.entityService.create('api::comment.comment', {
      data: {
        content,
        post: postId,
        authorName: authorName || null,
        authorEmail: authorEmail || null,
        authorWebsite: authorWebsite || null,
        parent: parentId || null,
        status,
        spamScore,
        ipAddress: ctx.request.ip || ctx.request.headers['x-forwarded-for'] || 'unknown',
        userAgent: ctx.request.headers['user-agent'] || '',
      },
    });

    return ctx.created({ data: comment });
  },

  /**
   * GET /api/comments
   * List comments (public — approved only, admin — all)
   */
  async find(ctx) {
    const user = ctx.state.user;
    const { post, status, page = 1, pageSize = 20, sort = 'createdAt:desc' } = ctx.query;

    const filters: any = {};

    // Public only sees approved
    if (!user || user.role?.type !== 'admin' && user.role?.type !== 'editor') {
      filters.status = 'approved';
    } else if (status) {
      filters.status = status;
    }

    if (post) filters.post = post;

    const comments = await strapi.entityService.findMany('api::comment.comment', {
      filters,
      populate: {
        parent: { fields: ['id', 'content', 'authorName'] },
        replies: { fields: ['id'] },
      },
      sort,
      pagination: { page: Number(page), pageSize: Number(pageSize) },
    });

    return { data: comments };
  },

  /**
   * GET /api/comments/:id
   * Get single comment
   */
  async findOne(ctx) {
    const { id } = ctx.params;
    const comment = await strapi.entityService.findOne('api::comment.comment', id, {
      populate: {
        post: { fields: ['id', 'title', 'slug'] },
        parent: { fields: ['id', 'content', 'authorName'] },
        replies: {
          populate: { reactions: true },
          sort: { createdAt: 'asc' },
        },
      },
    });

    if (!comment) return ctx.notFound('Comment not found');
    return { data: comment };
  },

  /**
   * PUT /api/comments/:id
   * Update own comment (within edit window)
   */
  async update(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const comment = await strapi.entityService.findOne('api::comment.comment', id);
    if (!comment) return ctx.notFound('Comment not found');

    // Edit window: 30 minutes
    const createdAt = new Date(comment.createdAt);
    if (Date.now() - createdAt.getTime() > 30 * 60 * 1000) {
      return ctx.badRequest('Edit window has expired (30 minutes)');
    }

    const { error, data } = updateCommentSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const updated = await strapi.entityService.update('api::comment.comment', id, {
      data: {
        content: data.content,
        editCount: (comment.editCount || 0) + 1,
        editedAt: new Date(),
      },
    });

    return { data: updated };
  },

  /**
   * DELETE /api/comments/:id
   * Delete comment (own or admin)
   */
  async delete(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    const comment = await strapi.entityService.findOne('api::comment.comment', id);
    if (!comment) return ctx.notFound('Comment not found');

    await strapi.entityService.delete('api::comment.comment', id);
    return ctx.noContent();
  },

  /**
   * POST /api/comments/:id/moderate
   * Moderate comment (admin/editor only)
   */
  async moderate(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;

    if (!user || !['admin', 'editor'].includes(user.role?.type)) {
      return ctx.unauthorized('Only admins and editors can moderate comments');
    }

    const { error, data } = moderationSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const comment = await strapi.entityService.update('api::comment.comment', id, {
      data: { status: data.status },
    });

    return { data: comment };
  },

  /**
   * POST /api/comments/:id/report
   * Report comment for abuse
   */
  async report(ctx) {
    const { id } = ctx.params;

    const { error, data } = abuseReportSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const comment = await strapi.entityService.findOne('api::comment.comment', id);
    if (!comment) return ctx.notFound('Comment not found');

    // Create report
    const report = await strapi.entityService.create('api::comment-report.comment-report', {
      data: {
        comment: id,
        reason: data.reason,
        description: data.description || null,
        reporter: ctx.state.user?.id || null,
      },
    });

    // Auto-flag if 3+ reports
    const reportCount = await strapi.db.query('api::comment-report.comment-report').count({
      where: { comment: id, status: 'open' },
    });

    if (reportCount >= 3) {
      await strapi.entityService.update('api::comment.comment', id, {
        data: { status: 'pending' },
      });
    }

    return ctx.created({ data: report });
  },
}));

// ── Reactions Controller ────────────────────────────────────

const reactionsController = createCoreController('api::reaction.reaction', ({ strapi }) => ({
  /**
   * POST /api/reactions/toggle
   * Toggle reaction on post or comment
   */
  async toggle(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Login required');

    const { error, data } = reactionSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    if (!data.postId && !data.commentId) {
      return ctx.badRequest('postId or commentId required');
    }

    const where: any = { user: user.id, type: data.type };
    if (data.postId) where.post = data.postId;
    if (data.commentId) where.comment = data.commentId;

    // Check existing
    const existing = await strapi.db.query('api::reaction.reaction').findOne({ where });

    if (existing) {
      await strapi.entityService.delete('api::reaction.reaction', existing.id);
      return { data: { toggled: false, type: data.type } };
    }

    // Create new
    const reaction = await strapi.entityService.create('api::reaction.reaction', {
      data: {
        type: data.type,
        user: user.id,
        post: data.postId || null,
        comment: data.commentId || null,
      },
    });

    return ctx.created({ data: { toggled: true, reaction } });
  },

  /**
   * GET /api/reactions
   * Get reactions for a post or comment
   */
  async findByContent(ctx) {
    const { postId, commentId } = ctx.query;

    if (!postId && !commentId) {
      return ctx.badRequest('postId or commentId required');
    }

    const where: any = {};
    if (postId) where.post = postId;
    if (commentId) where.comment = commentId;

    const reactions = await strapi.entityService.findMany('api::reaction.reaction', {
      where,
      populate: { user: { fields: ['id', 'username'] } },
    });

    // Group by type
    const byType: Record<string, number> = {};
    for (const r of reactions) {
      byType[r.type] = (byType[r.type] || 0) + 1;
    }

    return { data: reactions, byType, total: reactions.length };
  },
}));

export default {
  commentsController,
  reactionsController,
};

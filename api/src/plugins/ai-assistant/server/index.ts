'use strict';

import { generateContent, streamContent } from '../../ai-service';
import { z } from 'zod';
import prisma from '../../../lib/prisma';

// ── Validation Schemas ────────────────────────────────────────

const generateSchema = z.object({
  type: z.enum(['title', 'intro', 'outline', 'full_post', 'seo_meta', 'excerpt', 'alt_text', 'social_captions', 'faq']),
  topic: z.string().min(1).max(500),
  tone: z.enum(['professional', 'casual', 'technical', 'friendly']).default('professional'),
  wordCount: z.number().min(100).max(10000).default(1500),
  keywords: z.array(z.string()).max(10).default([]),
  existingContent: z.string().max(5000).optional(),
});

const scoreSchema = z.object({
  content: z.string().min(50).max(10000),
  title: z.string().optional(),
});

const usageTrackingSchema = z.object({
  userId: z.string(),
  tokensUsed: number,
  type: string,
});

// ── Rate Limiter ──────────────────────────────────────────────

const usageTracker = new Map<string, { count: number; tokens: number; resetAt: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = usageTracker.get(userId);

  if (!entry || now > entry.resetAt) {
    usageTracker.set(userId, { count: 0, tokens: 0, resetAt: now + 3600000 }); // 1 hour window
    return { allowed: true, remaining: 50 };
  }

  const maxRequests = 50; // per hour
  const maxTokens = 100000; // per hour

  if (entry.count >= maxRequests || entry.tokens >= maxTokens) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: maxRequests - entry.count };
}

function trackUsage(userId: string, tokens: number) {
  const entry = usageTracker.get(userId) || { count: 0, tokens: 0, resetAt: Date.now() + 3600000 };
  entry.count++;
  entry.tokens += tokens;
  usageTracking.set(userId, entry);
}

// ── Controller ────────────────────────────────────────────────

export default ({ strapi }) => ({
  /**
   * POST /ai/generate
   * Generate content using AI (streaming via SSE)
   */
  async generate(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Login required');

    const rateCheck = checkRateLimit(user.id);
    if (!rateCheck.allowed) {
      return ctx.tooManyRequests('AI rate limit exceeded. Try again later.', {
        retryAfter: 3600,
      });
    }

    const { error, data } = generateSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error', { details: error.errors });

    if (ctx.request.headers.accept === 'text/event-stream') {
      // SSE streaming
      ctx.set('Content-Type', 'text/event-stream');
      ctx.set('Cache-Control', 'no-cache');
      ctx.set('Connection', 'keep-alive');

      try {
        const generator = streamContent({
          type: data.type,
          topic: data.topic,
          tone: data.tone,
          wordCount: data.wordCount,
          keywords: data.keywords,
          existingContent: data.existingContent,
        });

        for await (const chunk of generator) {
          ctx.res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }

        ctx.res.write(`data: [DONE]\n\n`);
      } catch (err: any) {
        ctx.res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      }

      ctx.res.end();
      return;
    }

    // Non-streaming
    const result = await generateContent({
      type: data.type,
      topic: data.topic,
      tone: data.tone,
      wordCount: data.wordCount,
      keywords: data.keywords,
      existingContent: data.existingContent,
    });

    trackUsage(user.id, result.tokensUsed);

    // Log usage
    await prisma.auditLog.create({
      data: {
        action: 'ai_generate',
        entityType: 'ai_usage',
        entityId: user.id,
        newValue: { type: data.type, tokensUsed: result.tokensUsed },
        ipAddress: ctx.request.ip || 'unknown',
        userAgent: ctx.request.headers['user-agent'] || '',
        actorId: user.id,
      },
    }).catch(() => {});

    return {
      data: {
        content: result.text,
        tokensUsed: result.tokensUsed,
        model: result.model,
        provider: result.provider,
        remaining: rateCheck.remaining - 1,
      },
    };
  },

  /**
   * POST /ai/score
   * Score content quality (readability, SEO, engagement)
   */
  async score(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Login required');

    const { error, data } = scoreSchema.safeParse(ctx.request.body);
    if (error) return ctx.badRequest('Validation error');

    const systemPrompt = `You are an expert content analyst. Score the content on a scale of 0-100 for:
1. Readability (clear, well-structured sentences)
2. SEO optimization (keywords, headings, meta)
3. Engagement potential (hooks, examples, call-to-action)
4. Structure (headings, lists, paragraphs)

Return as JSON: { "readability": N, "seo": N, "engagement": N, "structure": N, "overall": N, "suggestions": ["..."] }`;

    const prompt = `Title: ${data.title || 'N/A'}\n\nContent:\n${data.content}`;

    const result = await generateContent({
      type: 'excerpt' as any,
      topic: prompt,
    });

    // Parse score from AI response
    let score = { readability: 0, seo: 0, engagement: 0, structure: 0, overall: 0, suggestions: [] };
    try {
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        score = JSON.parse(jsonMatch[0]);
      }
    } catch { /* use defaults */ }

    // Update post score if applicable
    if (data.title) {
      await prisma.post.updateMany({
        where: { title: data.title },
        data: { contentScore: score.overall },
      }).catch(() => {});
    }

    return { data: { score, tokensUsed: result.tokensUsed } };
  },

  /**
   * POST /ai/detect-decay
   * Detect content decay for posts with declining engagement
   */
  async detectDecay(ctx) {
    const user = ctx.state.user;
    if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const posts = await prisma.post.findMany({
      where: { status: 'published' },
      select: { id: true, title: true, slug: true },
    });

    const decaying = [];
    for (const post of posts) {
      const views30d = await prisma.pageView.count({
        where: { postId: post.id, viewedAt: { gte: thirtyDaysAgo } },
      });
      const viewsPrev60d = await prisma.pageView.count({
        where: {
          postId: post.id,
          viewedAt: { gte: ninetyDaysAgo, lt: thirtyDaysAgo },
        },
      });

      if (viewsPrev60d > 0 && views30d < viewsPrev60d * 0.7) {
        decaying.push({
          postId: post.id,
          title: post.title,
          slug: post.slug,
          views30d,
          viewsPrev60d,
          decline: Math.round(((viewsPrev60d - views30d) / viewsPrev60d) * 100),
        });
      }
    }

    return { data: decaying.sort((a, b) => b.decline - a.decline) };
  },

  /**
   * GET /ai/usage
   * Get AI usage stats for current user
   */
  async usage(ctx) {
    const user = ctx.state.user;
    if (!user) return ctx.unauthorized('Login required');

    const entry = usageTracker.get(user.id);
    return {
      data: {
        requestsUsed: entry?.count || 0,
        requestsRemaining: 50 - (entry?.count || 0),
        tokensUsed: entry?.tokens || 0,
        tokensRemaining: 100000 - (entry?.tokens || 0),
        resetsAt: entry?.resetAt ? new Date(entry.resetAt).toISOString() : null,
      },
    };
  },
});

/**
 * Comment Moderation AI Plugin
 * Auto-flag spam, detect toxicity, sentiment analysis
 */
import prisma from '../../../lib/prisma';

const SPAM_PATTERNS = [/buy now/i, /click here/i, /free money/i, /earn \$\d+/i, /limited time/i, /act now/i, /discount code/i, /casino/i, /lottery/i, /viagra/i, /crypto.*opportunity/i];

const TOXIC_WORDS = [/stupid/i, /idiot/i, /hate/i, /kill/i, /die/i, /moron/i, /dumb/i, /loser/i, /trash/i, /garbage/i, /sucks/i, /worst/i];

const POSITIVE_WORDS = [/great/i, /awesome/i, /amazing/i, /love/i, /excellent/i, /wonderful/i, /fantastic/i, /brilliant/i, /helpful/i, /thanks/i, /thank you/i, /appreciate/i, /perfect/i, /best/i];

const NEGATIVE_WORDS = [/bad/i, /terrible/i, /awful/i, /horrible/i, /hate/i, /worst/i, /boring/i, /useless/i, /disappointing/i, /poor/i, /waste/i, /annoying/i, /frustrat/i];

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      { method: 'GET', path: '/api/moderation/queue', handler: 'moderation.getQueue', config: { auth: { scope: ['admin', 'editor'] } } },
      { method: 'POST', path: '/api/moderation/:commentId/approve', handler: 'moderation.approve', config: { auth: { scope: ['admin', 'editor'] } } },
      { method: 'POST', path: '/api/moderation/:commentId/reject', handler: 'moderation.reject', config: { auth: { scope: ['admin', 'editor'] } } },
      { method: 'POST', path: '/api/moderation/:commentId/spam', handler: 'moderation.markSpam', config: { auth: { scope: ['admin', 'editor'] } } },
      { method: 'GET', path: '/api/moderation/stats', handler: 'moderation.getStats', config: { auth: { scope: ['admin'] } } },
      { method: 'POST', path: '/api/moderation/analyze', handler: 'moderation.analyze', config: { auth: true } },
    ]);

    strapi.controller('moderation', () => ({
      async getQueue(ctx: any) {
        const { status = 'pending', page = 1, pageSize = 20 } = ctx.query;
        const comments = await prisma.comment.findMany({
          where: { status },
          include: { post: { select: { id: true, title: true } } },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
        });
        const total = await prisma.comment.count({ where: { status } });
        return { data: comments, meta: { pagination: { page: Number(page), pageSize: Number(pageSize), total, pageCount: Math.ceil(total / Number(pageSize)) } } };
      },

      async approve(ctx: any) {
        const { commentId } = ctx.params;
        const comment = await prisma.comment.update({ where: { id: commentId }, data: { status: 'approved' } });
        return { data: comment };
      },

      async reject(ctx: any) {
        const { commentId } = ctx.params;
        const comment = await prisma.comment.update({ where: { id: commentId }, data: { status: 'rejected' } });
        return { data: comment };
      },

      async markSpam(ctx: any) {
        const { commentId } = ctx.params;
        const comment = await prisma.comment.update({ where: { id: commentId }, data: { status: 'spam' } });
        return { data: comment };
      },

      async getStats() {
        const [pending, approved, rejected, spam] = await Promise.all([
          prisma.comment.count({ where: { status: 'pending' } }),
          prisma.comment.count({ where: { status: 'approved' } }),
          prisma.comment.count({ where: { status: 'rejected' } }),
          prisma.comment.count({ where: { status: 'spam' } }),
        ]);
        return { data: { pending, approved, rejected, spam, total: pending + approved + rejected + spam } };
      },

      async analyze(ctx: any) {
        const { text } = ctx.request.body;
        if (!text) return ctx.badRequest('Text is required');
        const analysis = analyzeComment(text);
        return { data: analysis };
      },
    }));

    // Auto-moderation on comment create
    strapi.db.lifecycles.subscribe({
      models: ['api::comment.comment'],
      async beforeCreate(event: any) {
        const content = event.params.data?.content || '';
        const analysis = analyzeComment(content);
        if (analysis.isSpam || analysis.toxicityScore > 0.7) {
          event.params.data.status = 'pending';
        } else if (analysis.sentiment === 'positive') {
          event.params.status = 'approved';
        }
      },
    });

    strapi.log.info('🛡️ Comment Moderation AI plugin registered');
  },
});

function analyzeComment(text: string) {
  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);
  const wordCount = words.length;

  // Spam detection
  const isSpam = SPAM_PATTERNS.some(p => p.test(text));

  // Toxicity score
  const toxicCount = words.filter(w => TOXIC_WORDS.some(p => p.test(w))).length;
  const toxicityScore = wordCount > 0 ? Math.min(toxicCount / wordCount * 5, 1) : 0;

  // Sentiment
  const positiveCount = words.filter(w => POSITIVE_WORDS.some(p => p.test(w))).length;
  const negativeCount = words.filter(w => NEGATIVE_WORDS.some(p => p.test(w))).length;
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let sentimentScore = 0;
  if (positiveCount > negativeCount) { sentiment = 'positive'; sentimentScore = positiveCount / wordCount; }
  else if (negativeCount > positiveCount) { sentiment = 'negative'; sentimentScore = negativeCount / wordCount; }

  return { isSpam, toxicityScore, sentiment, sentimentScore, wordCount, analyzedAt: new Date().toISOString() };
}

/**
 * Content Versioning Plugin
 *
 * Tracks full revision history for posts and pages.
 * Features:
 *   - Auto-save drafts every 60 seconds
 *   - Named versions (milestones)
 *   - Side-by-side diff viewer
 *   - One-click rollback to any version
 *   - Version comparison API
 */

import prisma from '../../../lib/prisma';

interface VersionData {
  title: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  featuredImage?: string;
  tags?: string[];
  categories?: string[];
}

interface DiffResult {
  field: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'removed' | 'changed';
}

export default ({ strapi }) => ({
  register() {
    // Register routes
    strapi.server.routes([
      // Get all versions for a post
      {
        method: 'GET',
        path: '/api/posts/:id/versions',
        handler: 'contentVersioning.list',
        config: { auth: { scope: ['admin', 'editor', 'author'] } },
      },
      // Get specific version
      {
        method: 'GET',
        path: '/api/posts/:id/versions/:versionId',
        handler: 'contentVersioning.get',
        config: { auth: { scope: ['admin', 'editor', 'author'] } },
      },
      // Create named version (milestone)
      {
        method: 'POST',
        path: '/api/posts/:id/versions',
        handler: 'contentVersioning.create',
        config: { auth: { scope: ['admin', 'editor', 'author'] } },
      },
      // Compare two versions
      {
        method: 'GET',
        path: '/api/posts/:id/versions/compare',
        handler: 'contentVersioning.compare',
        config: { auth: { scope: ['admin', 'editor', 'author'] } },
      },
      // Rollback to version
      {
        method: 'POST',
        path: '/api/posts/:id/versions/:versionId/rollback',
        handler: 'contentVersioning.rollback',
        config: { auth: { scope: ['admin', 'editor'] } },
      },
      // Delete version
      {
        method: 'DELETE',
        path: '/api/posts/:id/versions/:versionId',
        handler: 'contentVersioning.delete',
        config: { auth: { scope: ['admin'] } },
      },
    ]);

    // Register content type fields
    strapi.contentType('api::post.post').attributes.versions = {
      type: 'relation',
      relation: 'oneToMany',
      target: 'api::content-version.content-version',
      mappedBy: 'post',
    };

    strapi.controller('contentVersioning', () => ({
      /**
       * GET /api/posts/:id/versions
       * List all versions for a post
       */
      async list(ctx: any) {
        const { id } = ctx.params;
        const { page = 1, pageSize = 20, sort = 'createdAt:desc' } = ctx.query;

        const versions = await prisma.contentVersion.findMany({
          where: { postId: id },
          orderBy: { createdAt: 'desc' },
          skip: (Number(page) - 1) * Number(pageSize),
          take: Number(pageSize),
          select: {
            id: true,
            versionName: true,
            title: true,
            excerpt: true,
            createdAt: true,
            createdBy: true,
            changeSummary: true,
            wordCountDiff: true,
          },
        });

        const total = await prisma.contentVersion.count({ where: { postId: id } });

        return {
          data: versions,
          meta: {
            pagination: {
              page: Number(page),
              pageSize: Number(pageSize),
              total,
              pageCount: Math.ceil(total / Number(pageSize)),
            },
          },
        };
      },

      /**
       * GET /api/posts/:id/versions/:versionId
       * Get a specific version with full content
       */
      async get(ctx: any) {
        const { id, versionId } = ctx.params;

        const version = await prisma.contentVersion.findFirst({
          where: { id: versionId, postId: id },
        });

        if (!version) {
          return ctx.notFound('Version not found');
        }

        return { data: version };
      },

      /**
       * POST /api/posts/:id/versions
       * Create a named version (milestone)
       */
      async create(ctx: any) {
        const { id } = ctx.params;
        const { versionName, changeSummary, note } = ctx.request.body;

        // Get current post data
        const post = await prisma.post.findUnique({ where: { id } });
        if (!post) return ctx.notFound('Post not found');

        // Get current version number
        const count = await prisma.contentVersion.count({ where: { postId: id } });

        const version = await prisma.contentVersion.create({
          data: {
            postId: id,
            versionName: versionName || `v${count + 1}`,
            title: post.title,
            content: post.content,
            excerpt: post.excerpt,
            metaTitle: post.metaTitle,
            metaDescription: post.metaDescription,
            tags: post.tags || [],
            categories: post.categories || [],
            changeSummary: changeSummary || 'Manual save',
            note: note || '',
            wordCount: post.content.split(/\s+/).length,
            createdBy: ctx.state.user?.id?.toString() || 'system',
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: 'version_created',
            entityType: 'post',
            entityId: id,
            user: ctx.state.user?.id?.toString(),
            newValue: { versionId: version.id, versionName: version.versionName },
          },
        }).catch(() => {});

        return { data: version };
      },

      /**
       * GET /api/posts/:id/versions/compare?from=X&to=Y
       * Compare two versions with diff
       */
      async compare(ctx: any) {
        const { id } = ctx.params;
        const { from, to } = ctx.query;

        if (!from || !to) {
          return ctx.badRequest('Both "from" and "to" version IDs are required');
        }

        const [fromVersion, toVersion] = await Promise.all([
          prisma.contentVersion.findFirst({ where: { id: from, postId: id } }),
          prisma.contentVersion.findFirst({ where: { id: to, postId: id } }),
        ]);

        if (!fromVersion || !toVersion) {
          return ctx.notFound('One or both versions not found');
        }

        const diffs: DiffResult[] = [];

        // Compare each field
        const fieldsToCompare: (keyof VersionData)[] = [
          'title', 'content', 'excerpt', 'metaTitle', 'metaDescription',
        ];

        for (const field of fieldsToCompare) {
          const oldVal = (fromVersion as any)[field];
          const newVal = (toVersion as any)[field];

          if (oldVal !== newVal) {
            if (!oldVal && newVal) {
              diffs.push({ field, oldValue: null, newValue: newVal, type: 'added' });
            } else if (oldVal && !newVal) {
              diffs.push({ field, oldValue: oldVal, newValue: null, type: 'removed' });
            } else {
              diffs.push({ field, oldValue: oldVal, newValue: newVal, type: 'changed' });
            }
          }
        }

        return {
          data: {
            from: { id: fromVersion.id, name: fromVersion.versionName, createdAt: fromVersion.createdAt },
            to: { id: toVersion.id, name: toVersion.versionName, createdAt: toVersion.createdAt },
            diffs,
            stats: {
              fieldsChanged: diffs.length,
              wordCountDiff: toVersion.wordCount - fromVersion.wordCount,
            },
          },
        };
      },

      /**
       * POST /api/posts/:id/versions/:versionId/rollback
       * Rollback post to a specific version
       */
      async rollback(ctx: any) {
        const { id, versionId } = ctx.params;

        const version = await prisma.contentVersion.findFirst({
          where: { id: versionId, postId: id },
        });

        if (!version) {
          return ctx.notFound('Version not found');
        }

        // Save current state as a new version before rollback
        const currentPost = await prisma.post.findUnique({ where: { id } });
        if (currentPost) {
          const count = await prisma.contentVersion.count({ where: { postId: id } });
          await prisma.contentVersion.create({
            data: {
              postId: id,
              versionName: `pre-rollback-v${count + 1}`,
              title: currentPost.title,
              content: currentPost.content,
              excerpt: currentPost.excerpt,
              metaTitle: currentPost.metaTitle,
              metaDescription: currentPost.metaDescription,
              tags: currentPost.tags || [],
              categories: currentPost.categories || [],
              changeSummary: `Auto-save before rollback to ${version.versionName}`,
              wordCount: currentPost.content.split(/\s+/).length,
              createdBy: ctx.state.user?.id?.toString() || 'system',
            },
          });
        }

        // Restore version data
        await prisma.post.update({
          where: { id },
          data: {
            title: version.title,
            content: version.content,
            excerpt: version.excerpt,
            metaTitle: version.metaTitle,
            metaDescription: version.metaDescription,
          },
        });

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: 'version_rollback',
            entityType: 'post',
            entityId: id,
            user: ctx.state.user?.id?.toString(),
            newValue: { rolledBackTo: versionId, versionName: version.versionName },
          },
        }).catch(() => {});

        return {
          data: {
            message: `Rolled back to version "${version.versionName}"`,
            versionId: version.id,
          },
        };
      },

      /**
       * DELETE /api/posts/:id/versions/:versionId
       * Delete a version (admin only)
       */
      async delete(ctx: any) {
        const { id, versionId } = ctx.params;

        await prisma.contentVersion.delete({
          where: { id: versionId },
        });

        await prisma.auditLog.create({
          data: {
            action: 'version_deleted',
            entityType: 'post',
            entityId: id,
            user: ctx.state.user?.id?.toString(),
            newValue: { deletedVersionId: versionId },
          },
        }).catch(() => {});

        return { data: { deleted: true } };
      },
    }));

    // Auto-versioning lifecycle hook
    strapi.db.lifecycles.subscribe({
      models: ['api::post.post'],
      async afterUpdate(event: any) {
        const { result } = event;
        // Auto-create version on significant changes (not just view count updates)
        if (event.params.data?.title || event.params.data?.content) {
          const count = await prisma.contentVersion.count({ where: { postId: result.id } });
          await prisma.contentVersion.create({
            data: {
              postId: result.id,
              versionName: `auto-v${count + 1}`,
              title: result.title,
              content: result.content,
              excerpt: result.excerpt,
              metaTitle: result.metaTitle,
              metaDescription: result.metaDescription,
              tags: result.tags || [],
              categories: result.categories || [],
              changeSummary: 'Auto-saved on edit',
              wordCount: result.content?.split(/\s+/).length || 0,
              createdBy: 'auto',
            },
          }).catch(() => {});
        }
      },
    });

    strapi.log.info('📝 Content Versioning plugin registered');
  },
});

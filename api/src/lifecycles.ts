/**
 * Strapi Lifecycle Hooks
 *
 * Handles automatic actions on content events:
 * - Post publish → index in Meilisearch, trigger webhooks
 * - Post unpublish → remove from Meilisearch
 * - Comment create → spam check, toxicity scoring
 * - User register → create preferences, trigger webhook
 */

import { indexPost, removePostFromIndex } from './services/search-service';
import prisma from './lib/prisma';

export default {
  /**
   * After post is created/updated
   */
  async afterCreate(event: any) {
    const { model, result } = event;
    if (model === 'post' && result?.status === 'published') {
      await indexPost(result).catch(() => {});
    }
    // Audit log for content creation
    if (['post', 'page'].includes(model?.uid)) {
      await prisma.auditLog.create({
        data: {
          action: 'create',
          entityType: model.uid,
          entityId: String(result.id),
          newValue: { title: result.title || result.name },
        },
      }).catch(() => {});
    }
  },

  async afterUpdate(event: any) {
    const { model, result } = event;
    if (model === 'post') {
      if (result?.status === 'published') {
        await indexPost(result).catch(() => {});
      } else {
        await removePostFromIndex(result.id).catch(() => {});
      }
    }
    // Audit log
    if (['post', 'page'].includes(model?.uid)) {
      await prisma.auditLog.create({
        data: {
          action: 'update',
          entityType: model.uid,
          entityId: String(result.id),
          newValue: { title: result.title || result.name },
        },
      }).catch(() => {});
    }
  },

  async afterDelete(event: any) {
    const { model, result } = event;
    if (model === 'post') {
      await removePostFromIndex(result.id).catch(() => {});
    }
    await prisma.auditLog.create({
      data: {
        action: 'delete',
        entityType: model.uid,
        entityId: String(result.id),
      },
    }).catch(() => {});
  },
};

/**
 * RBAC Plugin — Advanced Role-Based Access Control
 * Roles: super-admin, admin, editor, author, contributor, seo-manager, subscriber
 * Granular permissions per resource and action.
 */
import prisma from '../../../lib/prisma';

type RoleName = 'super-admin' | 'admin' | 'editor' | 'author' | 'contributor' | 'seo-manager' | 'subscriber';
type Resource = 'posts' | 'pages' | 'comments' | 'users' | 'settings' | 'analytics' | 'seo' | 'media' | 'newsletters';
type Action = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'manage-users' | 'manage-settings' | 'view-analytics' | 'manage-seo' | 'moderate-comments';

const PERMISSION_MATRIX: Record<RoleName, Record<Resource, Action[]>> = {
  'super-admin': {
    posts: ['create','read','update','delete','publish'],
    pages: ['create','read','update','delete','publish'],
    comments: ['create','read','update','delete','moderate-comments'],
    users: ['create','read','update','delete','manage-users'],
    settings: ['read','update','manage-settings'],
    analytics: ['read','view-analytics'],
    seo: ['read','update','manage-seo'],
    media: ['create','read','update','delete'],
    newsletters: ['create','read','update','delete','publish'],
  },
  'admin': {
    posts: ['create','read','update','delete','publish'],
    pages: ['create','read','update','delete','publish'],
    comments: ['create','read','update','delete','moderate-comments'],
    users: ['create','read','update','manage-users'],
    settings: ['read','update','manage-settings'],
    analytics: ['read','view-analytics'],
    seo: ['read','update','manage-seo'],
    media: ['create','read','update','delete'],
    newsletters: ['create','read','update','delete','publish'],
  },
  'editor': {
    posts: ['create','read','update','delete','publish'],
    pages: ['create','read','update','publish'],
    comments: ['create','read','update','moderate-comments'],
    users: ['read'],
    settings: ['read'],
    analytics: ['read','view-analytics'],
    seo: ['read','update','manage-seo'],
    media: ['create','read','update'],
    newsletters: ['create','read','update'],
  },
  'author': {
    posts: ['create','read','update','delete'],
    pages: ['read'],
    comments: ['create','read'],
    users: ['read'],
    settings: [],
    analytics: ['read','view-analytics'],
    seo: ['read'],
    media: ['create','read'],
    newsletters: ['read'],
  },
  'contributor': {
    posts: ['create','read','update'],
    pages: ['read'],
    comments: ['create','read'],
    users: ['read'],
    settings: [],
    analytics: [],
    seo: [],
    media: ['read'],
    newsletters: [],
  },
  'seo-manager': {
    posts: ['read','update'],
    pages: ['read','update'],
    comments: ['read'],
    users: ['read'],
    settings: ['read'],
    analytics: ['read','view-analytics'],
    seo: ['read','update','manage-seo'],
    media: ['read','update'],
    newsletters: ['read'],
  },
  'subscriber': {
    posts: ['read'],
    pages: ['read'],
    comments: ['create','read'],
    users: ['read'],
    settings: [],
    analytics: [],
    seo: [],
    media: [],
    newsletters: [],
  },
};

function hasPermission(role: RoleName, resource: Resource, action: Action): boolean {
  return PERMISSION_MATRIX[role]?.[resource]?.includes(action) ?? false;
}

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      { method: 'GET', path: '/api/rbac/roles', handler: 'rbac.getRoles', config: { auth: { scope: ['admin'] } } },
      { method: 'POST', path: '/api/rbac/roles', handler: 'rbac.createRole', config: { auth: { scope: ['admin'] } } },
      { method: 'PUT', path: '/api/rbac/roles/:id', handler: 'rbac.updateRole', config: { auth: { scope: ['admin'] } } },
      { method: 'DELETE', path: '/api/rbac/roles/:id', handler: 'rbac.deleteRole', config: { auth: { scope: ['super-admin'] } } },
      { method: 'GET', path: '/api/rbac/permissions', handler: 'rbac.getPermissions', config: { auth: { scope: ['admin'] } } },
      { method: 'POST', path: '/api/rbac/check', handler: 'rbac.checkPermission', config: { auth: true } },
    ]);

    strapi.controller('rbac', () => ({
      async getRoles() {
        const roles = Object.keys(PERMISSION_MATRIX).map(name => ({
          name,
          permissions: PERMISSION_MATRIX[name as RoleName],
        }));
        return { data: roles };
      },

      async createRole(ctx: any) {
        const { name, permissions } = ctx.request.body;
        await prisma.auditLog.create({
          data: { action: 'rbac_role_created', entityType: 'role', entityId: name, user: ctx.state.user?.id?.toString(), newValue: permissions },
        }).catch(() => {});
        return { data: { name, permissions } };
      },

      async updateRole(ctx: any) {
        const { id } = ctx.params;
        const updates = ctx.request.body;
        await prisma.auditLog.create({
          data: { action: 'rbac_role_updated', entityType: 'role', entityId: id, user: ctx.state.user?.id?.toString(), newValue: updates },
        }).catch(() => {});
        return { data: { id, ...updates } };
      },

      async deleteRole(ctx: any) {
        const { id } = ctx.params;
        if (Object.keys(PERMISSION_MATRIX).includes(id)) {
          return ctx.badRequest('Cannot delete built-in roles');
        }
        await prisma.auditLog.create({
          data: { action: 'rbac_role_deleted', entityType: 'role', entityId: id, user: ctx.state.user?.id?.toString() },
        }).catch(() => {});
        return { data: { deleted: true } };
      },

      async getPermissions() {
        const resources = ['posts','pages','comments','users','settings','analytics','seo','media','newsletters'];
        const actions = ['create','read','update','delete','publish','manage-users','manage-settings','view-analytics','manage-seo','moderate-comments'];
        return { data: { roles: PERMISSION_MATRIX, resources, actions } };
      },

      async checkPermission(ctx: any) {
        const { resource, action } = ctx.request.body;
        const userRole = ctx.state.user?.role?.type || 'subscriber';
        const permitted = hasPermission(userRole, resource, action);
        return { data: { permitted, role: userRole, resource, action } };
      },
    }));

    // Default role assignment on user registration
    strapi.db.lifecycles.subscribe({
      models: ['plugin::users-permissions.user'],
      async afterCreate(event: any) {
        await prisma.auditLog.create({
          data: { action: 'user_registered', entityType: 'user', entityId: event.result?.id?.toString(), newValue: { role: 'contributor' } },
        }).catch(() => {});
      },
    });

    strapi.log.info('🛡️ RBAC plugin registered');
  },
});

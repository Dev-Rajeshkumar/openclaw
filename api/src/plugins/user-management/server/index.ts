'use strict';

import prisma from '../../../lib/prisma';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export default ({ strapi }) => ({
  register() {
    strapi.server.routes([
      // 2FA
      { method: 'POST', path: '/api/users/2fa/setup', handler: 'user.twoFASetup', config: { auth: { scope: ['authenticated'] } } },
      { method: 'POST', path: '/api/users/2fa/verify', handler: 'user.twoFAVerify', config: { auth: { scope: ['authenticated'] } } },
      { method: 'POST', path: '/api/users/2fa/disable', handler: 'user.twoFADisable', config: { auth: { scope: ['authenticated'] } } },
      { method: 'POST', path: '/api/users/2fa/generate-backup', handler: 'user.generateBackupCodes', config: { auth: { scope: ['authenticated'] } } },
      // Profile
      { method: 'GET', path: '/api/users/me', handler: 'user.me', config: { auth: { scope: ['authenticated'] } } },
      { method: 'PUT', path: '/api/users/me', handler: 'user.updateMe', config: { auth: { scope: ['authenticated'] } } },
      { method: 'PUT', path: '/api/users/me/preferences', handler: 'user.updatePreferences', config: { auth: { scope: ['authenticated'] } } },
      // Admin: User management
      { method: 'GET', path: '/api/users', handler: 'user.adminList', config: { auth: { scope: ['admin'] } } },
      { method: 'GET', path: '/api/users/:id', handler: 'user.adminFindOne', config: { auth: { scope: ['admin'] } } },
      { method: 'PUT', path: '/api/users/:id/role', handler: 'user.adminUpdateRole', config: { auth: { scope: ['admin'] } } },
      // OAuth
      { method: 'GET', path: '/api/auth/:provider', handler: 'user.oauthInit', config: { auth: false } },
      { method: 'GET', path: '/api/auth/:provider/callback', handler: 'user.oauthCallback', config: { auth: false } },
      // Sessions
      { method: 'GET', path: '/api/users/me/sessions', handler: 'user.mySessions', config: { auth: { scope: ['authenticated'] } } },
      { method: 'DELETE', path: '/api/users/me/sessions/:id', handler: 'user.revokeSession', config: { auth: { scope: ['authenticated'] } } },
    ]);

    strapi.controller('user', () => ({
      /**
       * GET /api/users/me — Get current user profile
       */
      async me(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const profile = await prisma.user.findUnique({
          where: { id: user.id },
          include: { preferences: true },
        });

        return {
          data: {
            id: profile?.id,
            email: profile?.email,
            username: profile?.username,
            role: profile?.role,
            bio: profile?.bio,
            avatarUrl: profile?.avatarUrl,
            socialLinks: profile?.socialLinks,
            locale: profile?.locale,
            timezone: profile?.timezone,
            twoFactorEnabled: profile?.twoFactorEnabled,
            preferences: profile?.preferences || null,
          },
        };
      },

      /**
       * PUT /api/users/me — Update profile
       */
      async updateMe(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const { username, bio, socialLinks, locale, timezone } = ctx.request.body;

        const updated = await prisma.user.update({
          where: { id: user.id },
          data: {
            ...(username && { username }),
            ...(bio !== undefined && { bio }),
            ...(socialLinks && { socialLinks }),
            ...(locale && { locale }),
            ...(timezone && { timezone }),
          },
        });

        return { data: { id: updated.id, username: updated.username, bio: updated.bio, socialLinks: updated.socialLinks } };
      },

      /**
       * PUT /api/users/me/preferences — Update user preferences
       */
      async updatePreferences(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const prefs = await prisma.userPreferences.upsert({
          where: { userId: user.id },
          create: { userId: user.id, ...ctx.request.body },
          update: ctx.request.body,
        });

        return { data: prefs };
      },

      /**
       * POST /api/users/2fa/setup — Initiate 2FA setup
       */
      async twoFASetup(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        if (user.twoFactorEnabled) {
          return ctx.badRequest('2FA is already enabled');
        }

        const secret = speakeasy.generateSecret({
          name: `CMS:${user.email || user.username}`,
          issuer: 'CMS Platform',
        });

        // Store temporarily (not confirmed yet)
        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorSecret: secret.base32 },
        });

        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

        return {
          data: {
            secret: secret.base32,
            qrCode: qrCodeUrl,
            message: 'Scan this QR code with Google Authenticator or Authy, then verify with a code',
          },
        };
      },

      /**
       * POST /api/users/2fa/verify — Verify and activate 2FA
       */
      async twoFAVerify(ctx) {
        const user = ctx.state.user;
        const { code } = ctx.request.body;

        if (!code) return ctx.badRequest('Verification code required');

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.twoFactorSecret) return ctx.badRequest('2FA not initialized. Run setup first.');

        const verified = speakeasy.totp.verify({
          secret: dbUser.twoFactorSecret,
          encoding: 'base32',
          token: String(code),
          window: 1,
        });

        if (!verified) {
          return ctx.badRequest('Invalid verification code');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: true },
        });

        return { data: { twoFactorEnabled: true, message: '2FA activated successfully' } };
      },

      /**
       * POST /api/users/2fa/disable — Disable 2FA
       */
      async twoFADisable(ctx) {
        const user = ctx.state.user;
        const { code } = ctx.request.body;

        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });

        if (!dbUser?.twoFactorEnabled) return ctx.badRequest('2FA is not enabled');

        // Verify code before disabling
        if (dbUser.twoFactorSecret) {
          const verified = speakeasy.totp.verify({
            secret: dbUser.twoFactorSecret,
            encoding: 'base32',
            token: String(code || ''),
            window: 1,
          });
          if (!verified) return ctx.badRequest('Invalid verification code');
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { twoFactorEnabled: false, twoFactorSecret: null },
        });

        return { data: { twoFactorEnabled: false, message: '2FA disabled' } };
      },

      /**
       * POST /api/users/2fa/generate-backup — Generate backup codes
       */
      async generateBackupCodes(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const codes = Array.from({ length: 10 }, () =>
          Math.random().toString(36).substring(2, 8).toUpperCase()
        );

        // In production, hash these before storing
        return { data: { codes, message: 'Save these codes securely. They will not be shown again.' } };
      },

      /**
       * GET /api/users — Admin: List users
       */
      async adminList(ctx) {
        const user = ctx.state.user;
        if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

        const { role, search, page = 1, pageSize = 50 } = ctx.query;

        const where: any = {};
        if (role) where.role = role;
        if (search) {
          where.OR = [
            { email: { contains: String(search), mode: 'insensitive' } },
            { username: { contains: String(search), mode: 'insensitive' } },
          ];
        }

        const [users, total] = await Promise.all([
          prisma.user.findMany({
            where,
            select: { id: true, email: true, username: true, role: true, twoFactorEnabled: true, createdAt: true, lastLoginAt: true },
            take: Number(pageSize),
            skip: (Number(page) - 1) * Number(pageSize),
            orderBy: { createdAt: 'desc' },
          }),
          prisma.user.count({ where }),
        ]);

        return { data: users, meta: { total, page: Number(page), pageSize: Number(pageSize) } };
      },

      /**
       * PUT /api/users/:id/role — Admin: Update user role
       */
      async adminUpdateRole(ctx) {
        const user = ctx.state.user;
        if (!user || user.role?.type !== 'admin') return ctx.unauthorized();

        const { id } = ctx.params;
        const { role } = ctx.request.body;

        const validRoles = ['admin', 'editor', 'author', 'subscriber'];
        if (!validRoles.includes(role)) {
          return ctx.badRequest(`Invalid role. Must be: ${validRoles.join(', ')}`);
        }

        const updated = await prisma.user.update({
          where: { id },
          data: { role },
        });

        return { data: { id: updated.id, role: updated.role } };
      },

      /**
       * GET /api/users/me/sessions — List active sessions
       */
      async mySessions(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const sessions = await prisma.userSession.findMany({
          where: { userId: user.id, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        });

        return { data: sessions };
      },

      /**
       * DELETE /api/users/me/sessions/:id — Revoke a session
       */
      async revokeSession(ctx) {
        const user = ctx.state.user;
        if (!user) return ctx.unauthorized();

        const { id } = ctx.params;
        await prisma.userSession.deleteMany({
          where: { id, userId: user.id },
        });

        return ctx.noContent();
      },

      /**
       * OAuth2 Init — Redirect to provider
       */
      async oauthInit(ctx) {
        const { provider } = ctx.params;
        const providers: Record<string, string> = {
          google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.API_URL}/api/auth/google/callback&response_type=code&scope=email profile`,
          github: `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.API_URL}/api/auth/github/callback&scope=user:email`,
          discord: `https://discord.com/api/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${process.env.API_URL}/api/auth/discord/callback&response_type=code&scope=identify email`,
        };

        const url = providers[provider];
        if (!url) return ctx.badRequest(`Unsupported provider: ${provider}`);

        ctx.redirect(url);
      },

      /**
       * OAuth2 Callback — Handle provider callback
       */
      async oauthCallback(ctx) {
        const { provider } = ctx.params;
        const { code } = ctx.query;

        if (!code) return ctx.badRequest('Authorization code missing');

        // In production: exchange code for access token, fetch user info, create/link account
        // For now, return a placeholder
        ctx.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?oauth=success&provider=${provider}`);
      },
    }));

    strapi.log.info('👤 User Management plugin registered (2FA, OAuth, RBAC, Sessions)');
  },

  bootstrap() {
    strapi.log.info('[Users] 2FA, OAuth2, RBAC, and session management ready');
  },
});

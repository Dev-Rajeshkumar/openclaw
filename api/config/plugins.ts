export default ({ env }) => ({
  // ── Strapi Built-in Plugins ────────────────────────────────
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '30d',
      },
      ratelimit: {
        interval: 60000,
        max: 10,
      },
    },
  },

  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env('NODE_ENV') === 'development',
      defaultLimit: 25,
      maxLimit: 100,
      apolloServer: {
        introspection: env('NODE_ENV') === 'development',
      },
    },
  },

  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'it', 'ar'],
    },
  },

  email: {
    enabled: true,
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host: env('SMTP_HOST', 'smtp'),
        port: env.int('SMTP_PORT', 1025),
        auth: {
          user: env('SMTP_USERNAME', ''),
          pass: env('SMTP_PASSWORD', ''),
        },
        ignoreTLS: env('NODE_ENV') === 'development',
      },
      settings: {
        defaultFrom: env('DEFAULT_FROM_EMAIL', 'noreply@cms.local'),
        defaultReplyTo: env('DEFAULT_REPLY_TO', 'noreply@cms.local'),
      },
    },
  },

  upload: {
    enabled: true,
    config: {
      provider: 'local',
      providerOptions: {
        sizeLimit: 10 * 1024 * 1024, // 10MB
      },
      breakpoints: {
        xlarge: 1920,
        large: 1000,
        medium: 750,
        small: 500,
        xsmall: 64,
      },
    },
  },

  // ── Custom Plugins ─────────────────────────────────────────
  'comments-reactions': {
    enabled: true,
    resolve: './src/plugins/comments-reactions',
  },

  'ai-assistant': {
    enabled: true,
    resolve: './src/plugins/ai-assistant',
  },

  search: {
    enabled: true,
    resolve: './src/plugins/search',
  },

  newsletter: {
    enabled: true,
    resolve: './src/plugins/newsletter',
  },

  forms: {
    enabled: true,
    resolve: './src/plugins/forms',
  },

  analytics: {
    enabled: true,
    resolve: './src/plugins/analytics',
  },

  paywall: {
    enabled: true,
    resolve: './src/plugins/paywall',
  },

  'multi-site': {
    enabled: true,
    resolve: './src/plugins/multi-site',
  },

  webhooks: {
    enabled: true,
    resolve: './src/plugins/webhooks',
  },

  'audit-log': {
    enabled: true,
    resolve: './src/plugins/audit-log',
  },

  health: {
    enabled: true,
    resolve: './src/plugins/health',
  },

  'email-bounce': {
    enabled: true,
    resolve: './src/plugins/email-bounce',
  },
});

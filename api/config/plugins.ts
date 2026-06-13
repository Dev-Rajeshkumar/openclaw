export default ({ env }) => ({
  // --- Built-in Strapi plugins ---
  graphql: {
    enabled: true,
    config: {
      endpoint: '/graphql',
      shadowCRUD: true,
      playgroundAlways: env('NODE_ENV') !== 'production',
      depthLimit: 7,
      amountLimit: 100,
    },
  },
  email: {
    enabled: true,
    config: {
      provider: env('EMAIL_PROVIDER', 'nodemailer'),
      providerOptions: {
        host: env('SMTP_HOST', 'smtp.sendgrid.net'),
        port: env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME', 'apikey'),
          pass: env('SMTP_PASSWORD', ''),
        },
      },
      settings: {
        defaultFrom: env('DEFAULT_FROM_EMAIL', 'noreply@cms.local'),
        defaultReplyTo: env('DEFAULT_REPLY_TO', 'admin@cms.local'),
      },
    },
  },
  upload: {
    enabled: true,
    config: {
      provider: env('UPLOAD_PROVIDER', 'local'),
      providerOptions: {
        ...(env('UPLOAD_PROVIDER') === 'aws-s3'
          ? {
              accessKeyId: env('AWS_ACCESS_KEY_ID'),
              secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
              region: env('AWS_REGION', 'us-east-1'),
              params: { Bucket: env('AWS_BUCKET') },
            }
          : {}),
      },
      sizeLimit: 10 * 1024 * 1024, // 10MB
    },
  },
  'users-permissions': {
    enabled: true,
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: '7d',
      },
      refreshToken: {
        expiresIn: '30d',
      },
    },
  },
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales: ['en', 'es', 'fr', 'de', 'hi', 'ja', 'zh'],
    },
  },
});

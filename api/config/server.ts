export default ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS', ['toBeModified1', 'toBeModified2']),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  logger: {
    level: env('LOG_LEVEL', 'info'),
    exposeInWebsocket: env('NODE_ENV') === 'development',
  },
  cors: {
    origin: env.array('CORS_ORIGIN', ['http://localhost:3000']),
  },
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'change-me-in-production'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT', 'change-me-in-production'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT', 'change-me-in-production'),
      },
    },
  },
});

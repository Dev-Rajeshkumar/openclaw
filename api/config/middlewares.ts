export default ({ env }) => ({
  load: {
    before: ['errors', 'logger', 'cors', 'responses', 'gzip'],
    order: [
      'Define the middlewares\' load order by putting their name in this array in the right order',
    ],
    after: ['parser', 'router'],
  },
  settings: {
    cors: {
      enabled: true,
      origin: env.array('CORS_ORIGIN', ['http://localhost:3000', 'http://localhost:1337']),
      headers: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
    helmet: {
      enabled: true,
      crossOriginEmbedderPolicy: false,
    },
    rateLimiter: {
      enabled: true,
    },
  },
});

export default [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  {
    name: 'global::csp',
    config: {},
  },
  {
    name: 'global::api-cache',
    config: {},
  },
  {
    name: 'global::slug-generator',
    config: {},
  },
  {
    name: 'global::rate-limiter',
    config: {},
  },
  {
    name: 'global::virus-scan',
    config: {},
  },
];

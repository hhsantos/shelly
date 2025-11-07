module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      host: env('STRAPI_POSTGRES_HOST', '127.0.0.1'),
      port: env.int('STRAPI_POSTGRES_PORT', 5432),
      database: env('STRAPI_POSTGRES_DB', 'shelly'),
      user: env('STRAPI_POSTGRES_USER', 'postgres'),
      password: env('STRAPI_POSTGRES_PASSWORD', undefined),
      ssl: env.bool('STRAPI_POSTGRES_SSL', true) ? {
        rejectUnauthorized: env.bool('STRAPI_POSTGRES_SSL_REJECT_UNAUTHORIZED', false),
      } : false,
    },
  },
});

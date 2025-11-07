module.exports = ({ env }) => ({
  'users-permissions': {
    enabled: false,
    config: {
      jwtSecret: env('JWT_SECRET'),
      jwt: {
        expiresIn: env('STRAPI_JWT_EXPIRES_IN', '7d'),
      },
    },
  },
});

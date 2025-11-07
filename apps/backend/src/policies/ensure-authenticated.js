'use strict';

module.exports = async (ctx, config) => {
  if (ctx.state?.user || ctx.state?.isAuthenticated || ctx.state?.auth?.strategy) {
    return true;
  }

  const header = ctx.request?.header?.authorization || ctx.request?.headers?.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  const expectedToken = config?.token || process.env.API_TOKEN || process.env.GRAPHQL_TOKEN;

  if (expectedToken && token === expectedToken) {
    return true;
  }

  return ctx.unauthorized('Authentication is required to access this resource');
};

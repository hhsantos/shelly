'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/cost-summaries',
      handler: 'cost-summary.find',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/cost-summaries/:id',
      handler: 'cost-summary.findOne',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/cost-summaries',
      handler: 'cost-summary.create',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'PUT',
      path: '/cost-summaries/:id',
      handler: 'cost-summary.update',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'DELETE',
      path: '/cost-summaries/:id',
      handler: 'cost-summary.delete',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    }
  ],
};

'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/tariff-periods',
      handler: 'tariff-period.find',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/tariff-periods/:id',
      handler: 'tariff-period.findOne',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/tariff-periods',
      handler: 'tariff-period.create',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'PUT',
      path: '/tariff-periods/:id',
      handler: 'tariff-period.update',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
    {
      method: 'DELETE',
      path: '/tariff-periods/:id',
      handler: 'tariff-period.delete',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};

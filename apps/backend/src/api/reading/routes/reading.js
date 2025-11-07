'use strict';

module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/readings',
      handler: 'reading.find',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/readings/:id',
      handler: 'reading.findOne',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'GET',
      path: '/readings/aggregate',
      handler: 'reading.aggregate',
      config: {
        policies: ['global::ensure-authenticated'],
      },
    },
    {
      method: 'POST',
      path: '/readings',
      handler: 'reading.create',
      config: {
        policies: ['admin::isAuthenticatedAdmin'],
      },
    },
  ],
};

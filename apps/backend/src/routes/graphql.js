'use strict';

module.exports = [
  {
    method: 'GET',
    path: '/graphql',
    handler: 'graphql.handle',
    config: {
      policies: ['global::ensure-authenticated'],
    },
  },
  {
    method: 'POST',
    path: '/graphql',
    handler: 'graphql.handle',
    config: {
      policies: ['global::ensure-authenticated'],
    },
  },
];

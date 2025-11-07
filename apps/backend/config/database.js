'use strict';

const path = require('path');

module.exports = ({ env }) => ({
  connection: {
    client: env('DATABASE_CLIENT', 'sqlite'),
    connection: {
      filename: env('DATABASE_FILENAME', path.join(__dirname, '..', '.tmp', 'data.db')),
    },
    useNullAsDefault: true,
    pool: {
      min: 0,
      max: 10,
    },
    acquireTimeoutMillis: 20000,
  },
});

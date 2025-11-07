'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::reading.reading', ({ strapi }) => ({
  async aggregate(ctx) {
    const { start, end } = ctx.query;

    const aggregates = await strapi.service('api::reading.reading').aggregate({ start, end });

    ctx.body = aggregates;
  },
}));

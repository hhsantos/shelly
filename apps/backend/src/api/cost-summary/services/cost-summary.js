'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::cost-summary.cost-summary', ({ strapi }) => ({
  async createFromAggregate({ periodStart, periodEnd, breakdown }) {
    if (!Array.isArray(breakdown) || !breakdown.length) {
      return [];
    }

    const summaries = await Promise.all(
      breakdown.map((entry) =>
        strapi.entityService.create('api::cost-summary.cost-summary', {
          data: {
            periodStart,
            periodEnd,
            totalEnergy: entry.totalEnergy,
            totalCost: entry.totalCost,
            tariffPeriod: entry.tariffPeriod?.id,
          },
        })
      )
    );

    return summaries;
  },
}));

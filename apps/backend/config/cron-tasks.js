'use strict';

const { runHourlyAggregation, runDailyAggregation } = require('../src/utils/summary-jobs');

module.exports = {
  '10 * * * *': async ({ strapi }) => {
    await runHourlyAggregation(strapi);
  },
  '20 0 * * *': async ({ strapi }) => {
    await runDailyAggregation(strapi);
  },
};

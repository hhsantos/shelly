'use strict';

const {
  runHourlyAggregation,
  runDailyAggregation,
} = require('../src/utils/summary-jobs');

module.exports = {
  '*/5 * * * *': async ({ strapi }) => {
    try {
      await strapi.service('api::reading.reading').fetchShellyData();
    } catch (error) {
      strapi.log.error('Cron failed to fetch Shelly data', error);
    }
  },
  '10 * * * *': async ({ strapi }) => {
    await runHourlyAggregation(strapi);
  },
  '20 0 * * *': async ({ strapi }) => {
    await runDailyAggregation(strapi);
  },
};

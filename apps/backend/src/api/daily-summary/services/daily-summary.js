'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::daily-summary.daily-summary');

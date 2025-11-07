'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::daily-summary.daily-summary');

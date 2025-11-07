'use strict';

const { before, after, afterEach } = require('node:test');
const Strapi = require('@strapi/strapi');
const path = require('path');

const fetchMock = (...args) => {
  fetchMock.calls.push(args);
  return fetchMock.impl(...args);
};

fetchMock.calls = [];
fetchMock.impl = async () => {
  throw new Error('Fetch mock implementation not provided');
};

const fetchModuleId = require.resolve('node-fetch');
require.cache[fetchModuleId] = { exports: fetchMock };

let instance;

before(async () => {
  process.env.NODE_ENV = 'test';
  process.env.APP_KEYS = process.env.APP_KEYS || 'testKey1,testKey2';
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'testSecret';
  process.env.API_TOKEN_SALT = process.env.API_TOKEN_SALT || 'testTokenSalt';
  process.env.SHELLY_DEVICE_BASE_URL = process.env.SHELLY_DEVICE_BASE_URL || 'http://localhost';

  try {
    instance = await Strapi({
      appDir: path.resolve(__dirname, '../..'),
    }).load();
  } catch (error) {
    console.error('Failed to bootstrap Strapi test instance:', error);
    throw error;
  }

  global.strapi = instance;
  global.fetchMock = fetchMock;
});

after(async () => {
  if (instance) {
    await instance.destroy();
  }
});

afterEach(async () => {
  fetchMock.calls = [];
  fetchMock.impl = async () => {
    throw new Error('Fetch mock implementation not provided');
  };

  if (!global.strapi) {
    return;
  }

  const contentTypes = [
    'api::reading.reading',
    'api::tariff-period.tariff-period',
    'api::cost-summary.cost-summary',
    'api::holiday.holiday',
    'api::hourly-summary.hourly-summary',
    'api::daily-summary.daily-summary',
  ];

  await Promise.all(
    contentTypes.map((uid) =>
      global.strapi.entityService.deleteMany(uid, {
        filters: {},
      })
    )
  );
});

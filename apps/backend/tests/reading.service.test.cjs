'use strict';

require('./helpers/strapi');

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

beforeEach(() => {
  global.fetchMock.calls = [];
  global.fetchMock.impl = async () => {
    throw new Error('Fetch mock implementation not provided');
  };
});

test('fetchShellyData stores a reading parsed from Shelly responses', async () => {
  const statusPayload = {
    unixtime: 1700000000,
    temperature: 42.5,
  };

  const emeterPayload = {
    total: 1234.5,
    power: 456.7,
    voltage: 228.9,
    current: 1.23,
  };

  global.fetchMock.impl = async (url) => {
    if (url.endsWith('/status')) {
      return {
        ok: true,
        status: 200,
        json: async () => statusPayload,
      };
    }

    if (url.endsWith('/emeter/0')) {
      return {
        ok: true,
        status: 200,
        json: async () => emeterPayload,
      };
    }

    throw new Error(`Unexpected URL: ${url}`);
  };

  const service = strapi.service('api::reading.reading');

  const reading = await service.fetchShellyData({ baseUrl: 'http://device.local' });

  assert.strictEqual(global.fetchMock.calls.length, 2);
  assert.strictEqual(global.fetchMock.calls[0][0], 'http://device.local/status');
  assert.strictEqual(global.fetchMock.calls[1][0], 'http://device.local/emeter/0');

  assert.strictEqual(reading.energy, emeterPayload.total);
  assert.strictEqual(reading.power, emeterPayload.power);
  assert.strictEqual(reading.voltage, emeterPayload.voltage);
  assert.strictEqual(reading.current, emeterPayload.current);
  assert.strictEqual(new Date(reading.timestamp).getTime(), 1700000000 * 1000);

  const stored = await strapi.entityService.findMany('api::reading.reading');
  assert.strictEqual(stored.length, 1);
  assert.deepStrictEqual(stored[0].statusPayload, statusPayload);
});

test('aggregate returns consumption metrics and tariff breakdown', async () => {
  await strapi.entityService.create('api::tariff-period.tariff-period', {
    data: {
      name: 'Night',
      startTime: '00:00:00',
      endTime: '06:00:00',
      rate: 0.1,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
  });

  await strapi.entityService.create('api::tariff-period.tariff-period', {
    data: {
      name: 'Day',
      startTime: '06:00:00',
      endTime: '23:59:59',
      rate: 0.2,
      weekdays: [0, 1, 2, 3, 4, 5, 6],
    },
  });

  const readings = [
    {
      timestamp: '2024-01-01T01:00:00.000Z',
      energy: 100,
      power: 400,
      voltage: 228,
    },
    {
      timestamp: '2024-01-01T05:00:00.000Z',
      energy: 200,
      power: 500,
      voltage: 229,
    },
    {
      timestamp: '2024-01-01T10:00:00.000Z',
      energy: 350,
      power: 600,
      voltage: 230,
    },
  ];

  await Promise.all(
    readings.map((reading) =>
      strapi.entityService.create('api::reading.reading', {
        data: reading,
      })
    )
  );

  const service = strapi.service('api::reading.reading');

  const result = await service.aggregate({
    start: '2024-01-01T00:00:00.000Z',
    end: '2024-01-02T00:00:00.000Z',
  });

  assert.strictEqual(result.count, readings.length);
  assert.ok(Math.abs(result.totalEnergy - 250) < 0.000001);
  assert.ok(Math.abs(result.averagePower - ((400 + 500 + 600) / 3)) < 0.000001);
  assert.strictEqual(result.minVoltage, 228);
  assert.strictEqual(result.maxVoltage, 230);

  const night = result.tariffBreakdown.find((entry) => entry.tariffPeriod.name === 'Night');
  const day = result.tariffBreakdown.find((entry) => entry.tariffPeriod.name === 'Day');

  assert.ok(night);
  assert.ok(day);
  assert.ok(Math.abs(night.totalEnergy - 100) < 0.000001);
  assert.ok(Math.abs(night.totalCost - 10) < 0.000001);
  assert.ok(Math.abs(day.totalEnergy - 150) < 0.000001);
  assert.ok(Math.abs(day.totalCost - 30) < 0.000001);
});

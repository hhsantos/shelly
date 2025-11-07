'use strict';

require('./helpers/strapi');

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { runHourlyAggregation, runDailyAggregation } = require('../src/utils/summary-jobs');

const createTariffPeriods = async () => {
  const entries = [
    { code: 'P3', name: 'Valle noche', startTime: '00:00:00', endTime: '08:00:00', rate: 0.1, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P2', name: 'Llano mañana', startTime: '08:00:00', endTime: '10:00:00', rate: 0.2, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P1', name: 'Punta mañana', startTime: '10:00:00', endTime: '14:00:00', rate: 0.25, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P2', name: 'Llano tarde', startTime: '14:00:00', endTime: '18:00:00', rate: 0.2, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P1', name: 'Punta tarde', startTime: '18:00:00', endTime: '22:00:00', rate: 0.25, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P2', name: 'Llano noche', startTime: '22:00:00', endTime: '00:00:00', rate: 0.2, weekdays: [1, 2, 3, 4, 5] },
    { code: 'P3', name: 'Valle fin de semana', startTime: '00:00:00', endTime: '00:00:00', rate: 0.1, weekdays: [0, 6] },
  ];

  await Promise.all(
    entries.map((data) =>
      strapi.entityService.create('api::tariff-period.tariff-period', {
        data,
      })
    )
  );
};

test('hourly and daily aggregation groups readings and honours holidays', async () => {
  await createTariffPeriods();

  await strapi.entityService.create('api::holiday.holiday', {
    data: { date: '2024-01-02', name: 'Festivo de prueba' },
  });

  const readings = [
    { timestamp: '2024-01-01T09:30:00.000Z', energy: 0, power: 300 },
    { timestamp: '2024-01-01T10:15:00.000Z', energy: 1, power: 320 },
    { timestamp: '2024-01-01T15:45:00.000Z', energy: 2.5, power: 350 },
    { timestamp: '2024-01-01T23:15:00.000Z', energy: 3.5, power: 360 },
    { timestamp: '2024-01-02T07:15:00.000Z', energy: 4.5, power: 340 },
    { timestamp: '2024-01-02T10:15:00.000Z', energy: 5.5, power: 330 },
    { timestamp: '2024-01-02T19:15:00.000Z', energy: 6.0, power: 310 },
    { timestamp: '2024-01-03T01:15:00.000Z', energy: 6.5, power: 300 },
  ];

  await Promise.all(
    readings.map((reading) =>
      strapi.entityService.create('api::reading.reading', {
        data: reading,
      })
    )
  );

  const hourlyResult = await runHourlyAggregation(strapi);
  const dailyResult = await runDailyAggregation(strapi);

  assert.strictEqual(hourlyResult.processed, 7);
  assert.strictEqual(dailyResult.processed, 3);

  const hourlySummaries = await strapi.entityService.findMany('api::hourly-summary.hourly-summary', {
    sort: { periodStart: 'asc' },
  });

  assert.strictEqual(hourlySummaries.length, 7);

  const findSummary = (iso) => hourlySummaries.find((item) => new Date(item.periodStart).toISOString() === iso);

  const h10 = findSummary('2024-01-01T10:00:00.000Z');
  const h15 = findSummary('2024-01-01T15:00:00.000Z');
  const h23 = findSummary('2024-01-01T23:00:00.000Z');
  const h07Holiday = findSummary('2024-01-02T07:00:00.000Z');
  const h10Holiday = findSummary('2024-01-02T10:00:00.000Z');
  const h19Holiday = findSummary('2024-01-02T19:00:00.000Z');
  const h01 = findSummary('2024-01-03T01:00:00.000Z');

  assert.ok(h10);
  assert.strictEqual(Number(h10.p1Energy), 1);
  assert.strictEqual(Number(h10.totalEnergy), 1);
  assert.strictEqual(Number(h10.p1Cost), 0.25);

  assert.ok(h15);
  assert.strictEqual(Number(h15.p2Energy), 1.5);
  assert.strictEqual(Number(h15.p2Cost), 0.3);

  assert.ok(h23);
  assert.strictEqual(Number(h23.p2Energy), 1);
  assert.strictEqual(Number(h23.p2Cost), 0.2);

  assert.ok(h07Holiday);
  assert.strictEqual(Number(h07Holiday.p3Energy), 1);
  assert.strictEqual(Number(h07Holiday.p3Cost), 0.1);

  assert.ok(h10Holiday);
  assert.strictEqual(Number(h10Holiday.p1Energy), 0);
  assert.strictEqual(Number(h10Holiday.p3Energy), 1);
  assert.strictEqual(Number(h10Holiday.p3Cost), 0.1);

  assert.ok(h19Holiday);
  assert.strictEqual(Number(h19Holiday.p3Energy), 0.5);
  assert.strictEqual(Number(h19Holiday.p3Cost), 0.05);

  assert.ok(h01);
  assert.strictEqual(Number(h01.p3Energy), 0.5);
  assert.strictEqual(Number(h01.totalCost), 0.05);

  const dailySummaries = await strapi.entityService.findMany('api::daily-summary.daily-summary', {
    sort: { periodStart: 'asc' },
  });

  assert.strictEqual(dailySummaries.length, 3);

  const day1 = dailySummaries[0];
  const day2 = dailySummaries[1];
  const day3 = dailySummaries[2];

  assert.strictEqual(new Date(day1.periodStart).toISOString(), '2024-01-01T00:00:00.000Z');
  assert.strictEqual(Number(day1.totalEnergy), 3.5);
  assert.strictEqual(Number(day1.p1Energy), 1);
  assert.strictEqual(Number(day1.p2Energy), 2.5);
  assert.strictEqual(Number(day1.totalCost), 0.75);

  assert.strictEqual(new Date(day2.periodStart).toISOString(), '2024-01-02T00:00:00.000Z');
  assert.strictEqual(Number(day2.totalEnergy), 2.5);
  assert.strictEqual(Number(day2.p3Energy), 2.5);
  assert.strictEqual(Number(day2.totalCost), 0.25);

  assert.strictEqual(new Date(day3.periodStart).toISOString(), '2024-01-03T00:00:00.000Z');
  assert.strictEqual(Number(day3.totalEnergy), 0.5);
  assert.strictEqual(Number(day3.p3Energy), 0.5);
  assert.strictEqual(Number(day3.totalCost), 0.05);

  const rerunHourly = await runHourlyAggregation(strapi);
  const rerunDaily = await runDailyAggregation(strapi);

  assert.strictEqual(rerunHourly.processed, 0);
  assert.strictEqual(rerunDaily.processed, 0);
});

test('hourly aggregation handles DST forward transition', async () => {
  await createTariffPeriods();

  const readings = [
    { timestamp: '2024-03-30T22:30:00.000Z', energy: 0, power: 305 },
    { timestamp: '2024-03-31T00:30:00+01:00', energy: 0.7, power: 295 },
    { timestamp: '2024-03-31T01:30:00+01:00', energy: 1.5, power: 290 },
    { timestamp: '2024-03-31T03:30:00+02:00', energy: 2.4, power: 285 },
  ];

  await Promise.all(
    readings.map((reading) =>
      strapi.entityService.create('api::reading.reading', {
        data: reading,
      })
    )
  );

  const result = await runHourlyAggregation(strapi);
  assert.strictEqual(result.processed, 3);

  const summaries = await strapi.entityService.findMany('api::hourly-summary.hourly-summary', {
    sort: { periodStart: 'asc' },
  });

  assert.strictEqual(summaries.length, 3);

  summaries.forEach((summary) => {
    assert.strictEqual(Number(summary.p3Energy), Number(summary.totalEnergy));
  });

  const energies = summaries.map((summary) => Number(summary.totalEnergy));
  assert.deepStrictEqual(energies, [0.7, 0.8, 0.9]);
});

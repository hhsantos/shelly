'use strict';

const {
  aggregateReadings,
  collectTariffRates,
  prepareHolidaySet,
  GRANULARITIES,
} = require('./aggregations');
const { toDate } = require('./tariff');

const READING_UID = 'api::reading.reading';
const HOURLY_SUMMARY_UID = 'api::hourly-summary.hourly-summary';
const DAILY_SUMMARY_UID = 'api::daily-summary.daily-summary';
const TARIFF_PERIOD_UID = 'api::tariff-period.tariff-period';
const HOLIDAY_UID = 'api::holiday.holiday';

const SUMMARY_UID_BY_GRANULARITY = {
  hourly: HOURLY_SUMMARY_UID,
  daily: DAILY_SUMMARY_UID,
};

const getSummaryUid = (granularity) => {
  const uid = SUMMARY_UID_BY_GRANULARITY[granularity];

  if (!uid) {
    throw new Error(`Unsupported granularity: ${granularity}`);
  }

  return uid;
};

const loadContext = async (strapi) => {
  const [tariffPeriods, holidays] = await Promise.all([
    strapi.entityService.findMany(TARIFF_PERIOD_UID, {
      sort: { startTime: 'asc' },
      publicationState: 'live',
      limit: 500,
    }),
    strapi.entityService.findMany(HOLIDAY_UID, {
      fields: ['date'],
      publicationState: 'live',
      limit: 365,
    }),
  ]);

  const schedule = tariffPeriods.map((period) => ({
    code: period.code,
    startTime: period.startTime,
    endTime: period.endTime,
    weekdays: period.weekdays,
  }));

  return {
    schedule,
    rates: collectTariffRates(tariffPeriods),
    holidaySet: prepareHolidaySet(holidays),
  };
};

const fetchReadings = async (strapi, { startBoundary } = {}) => {
  const filters = {};

  if (startBoundary) {
    filters.timestamp = { $gte: startBoundary };
  }

  const readings = await strapi.entityService.findMany(READING_UID, {
    filters,
    sort: { timestamp: 'asc' },
    publicationState: 'live',
    limit: 5000,
  });

  if (!startBoundary || !readings.length) {
    return readings;
  }

  const [previous] = await strapi.entityService.findMany(READING_UID, {
    filters: { timestamp: { $lt: startBoundary } },
    sort: { timestamp: 'desc' },
    limit: 1,
  });

  if (previous) {
    return [previous, ...readings];
  }

  return readings;
};

const determineBoundaries = ({ readings, granularity, startBoundary: initialStart }) => {
  const config = GRANULARITIES[granularity];

  if (!readings.length) {
    return { startBoundary: initialStart, endBoundary: initialStart };
  }

  const earliest = toDate(readings[0].timestamp);
  const latest = toDate(readings[readings.length - 1].timestamp);

  if (!latest) {
    return { startBoundary: initialStart, endBoundary: initialStart };
  }

  const startBoundary = initialStart || config.startOf(earliest);
  const latestBoundary = config.startOf(latest);
  const endBoundary = latestBoundary ? new Date(latestBoundary.getTime() + config.durationMs) : null;

  return { startBoundary, endBoundary };
};

const upsertSummary = async (strapi, uid, data) => {
  const existing = await strapi.entityService.findMany(uid, {
    filters: { periodStart: data.periodStart.toISOString() },
    limit: 1,
  });

  if (existing.length) {
    await strapi.entityService.update(uid, existing[0].id, { data });
    return existing[0].id;
  }

  const entry = await strapi.entityService.create(uid, { data });
  return entry.id;
};

const transformBucketToPayload = (bucket) => ({
  periodStart: bucket.periodStart,
  periodEnd: bucket.periodEnd,
  totalEnergy: bucket.totalEnergy,
  totalCost: bucket.totalCost,
  readingCount: bucket.readingCount,
  p1Energy: bucket.energyByPeriod.P1 ?? 0,
  p2Energy: bucket.energyByPeriod.P2 ?? 0,
  p3Energy: bucket.energyByPeriod.P3 ?? 0,
  p1Cost: bucket.costByPeriod.P1 ?? 0,
  p2Cost: bucket.costByPeriod.P2 ?? 0,
  p3Cost: bucket.costByPeriod.P3 ?? 0,
});

const runAggregationJob = async (strapi, granularity) => {
  const { schedule, holidaySet, rates } = await loadContext(strapi);
  const summaryUid = getSummaryUid(granularity);

  const [latestSummary] = await strapi.entityService.findMany(summaryUid, {
    sort: { periodEnd: 'desc' },
    limit: 1,
  });

  const startBoundary = latestSummary?.periodEnd ? toDate(latestSummary.periodEnd) : null;

  const readings = await fetchReadings(strapi, { startBoundary });

  if (readings.length < 2) {
    return { processed: 0 };
  }

  const boundaries = determineBoundaries({ readings, granularity, startBoundary });

  if (!boundaries.startBoundary || !boundaries.endBoundary) {
    return { processed: 0 };
  }

  const aggregated = aggregateReadings({
    readings,
    schedule,
    holidays: holidaySet,
    granularity,
    startBoundary: boundaries.startBoundary,
    endBoundary: boundaries.endBoundary,
    rates,
  });

  let processed = 0;

  for (const bucket of aggregated) {
    if (bucket.periodStart < boundaries.startBoundary || bucket.periodStart >= boundaries.endBoundary) {
      continue;
    }

    await upsertSummary(strapi, summaryUid, transformBucketToPayload(bucket));
    processed += 1;
  }

  return { processed };
};

const runHourlyAggregation = (strapi) => runAggregationJob(strapi, 'hourly');
const runDailyAggregation = (strapi) => runAggregationJob(strapi, 'daily');

module.exports = {
  runAggregationJob,
  runHourlyAggregation,
  runDailyAggregation,
};

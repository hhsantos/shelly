'use strict';

const { getTariffBand, toNumber, toDate } = require('./tariff');

const GRANULARITIES = {
  hourly: {
    durationMs: 60 * 60 * 1000,
    startOf(date) {
      const normalized = toDate(date);
      return normalized
        ? new Date(Date.UTC(
            normalized.getUTCFullYear(),
            normalized.getUTCMonth(),
            normalized.getUTCDate(),
            normalized.getUTCHours(),
            0,
            0,
            0
          ))
        : null;
    },
  },
  daily: {
    durationMs: 24 * 60 * 60 * 1000,
    startOf(date) {
      const normalized = toDate(date);
      return normalized
        ? new Date(
            Date.UTC(
              normalized.getUTCFullYear(),
              normalized.getUTCMonth(),
              normalized.getUTCDate(),
              0,
              0,
              0,
              0
            )
          )
        : null;
    },
  },
};

const addDuration = (date, durationMs) => new Date(date.getTime() + durationMs);

const byTimestampAsc = (a, b) => new Date(a.timestamp) - new Date(b.timestamp);

const prepareHolidaySet = (holidays = []) => new Set(holidays.map((holiday) => holiday.date));

const collectTariffRates = (periods = []) => {
  const rates = new Map();

  periods.forEach((period) => {
    if (!period?.code) {
      return;
    }

    const code = String(period.code).toUpperCase();

    if (!rates.has(code)) {
      rates.set(code, toNumber(period.rate, 0));
    }
  });

  return rates;
};

const createEmptyBucket = (start, durationMs) => ({
  periodStart: start,
  periodEnd: addDuration(start, durationMs),
  totalEnergy: 0,
  totalCost: 0,
  readingCount: 0,
  energyByPeriod: {
    P1: 0,
    P2: 0,
    P3: 0,
  },
  costByPeriod: {
    P1: 0,
    P2: 0,
    P3: 0,
  },
});

const roundValue = (value, precision = 6) => {
  const factor = 10 ** precision;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
};

const aggregateReadings = ({
  readings = [],
  schedule = [],
  holidays = new Set(),
  granularity = 'hourly',
  startBoundary,
  endBoundary,
  rates = new Map(),
}) => {
  const config = GRANULARITIES[granularity];

  if (!config) {
    throw new Error(`Unsupported granularity: ${granularity}`);
  }

  const sorted = readings.slice().sort(byTimestampAsc);

  if (sorted.length < 2) {
    return [];
  }

  const durationMs = config.durationMs;
  const buckets = new Map();

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];

    const previousDate = toDate(previous.timestamp);
    const currentDate = toDate(current.timestamp);

    if (!currentDate || !previousDate) {
      continue;
    }

    const energyDelta = toNumber(current.energy) - toNumber(previous.energy);

    if (!(energyDelta > 0)) {
      continue;
    }

    const bucketStart = config.startOf(currentDate);

    if (!bucketStart) {
      continue;
    }

    if (startBoundary && bucketStart < startBoundary) {
      continue;
    }

    if (endBoundary && bucketStart >= endBoundary) {
      continue;
    }

    const key = bucketStart.toISOString();
    const bucket = buckets.get(key) || createEmptyBucket(bucketStart, durationMs);

    const periodCode = getTariffBand(currentDate, { schedule, holidays });

    if (!bucket.energyByPeriod[periodCode]) {
      bucket.energyByPeriod[periodCode] = 0;
    }

    if (!bucket.costByPeriod[periodCode]) {
      bucket.costByPeriod[periodCode] = 0;
    }

    bucket.totalEnergy += energyDelta;
    bucket.energyByPeriod[periodCode] += energyDelta;
    bucket.readingCount += 1;
    buckets.set(key, bucket);
  }

  const results = Array.from(buckets.values()).map((bucket) => {
    const enriched = { ...bucket };
    const entries = Object.entries(bucket.energyByPeriod);

    entries.forEach(([code, value]) => {
      const rate = rates.get(code) ?? 0;
      const cost = roundValue(toNumber(value) * toNumber(rate));
      enriched.costByPeriod[code] = cost;
      enriched.totalCost += cost;
    });

    enriched.totalEnergy = roundValue(enriched.totalEnergy);
    enriched.totalCost = roundValue(enriched.totalCost);

    Object.keys(enriched.energyByPeriod).forEach((code) => {
      enriched.energyByPeriod[code] = roundValue(enriched.energyByPeriod[code]);
      enriched.costByPeriod[code] = roundValue(enriched.costByPeriod[code]);
    });

    return enriched;
  });

  return results.sort((a, b) => a.periodStart - b.periodStart);
};

module.exports = {
  GRANULARITIES,
  addDuration,
  aggregateReadings,
  collectTariffRates,
  createEmptyBucket,
  prepareHolidaySet,
  roundValue,
};

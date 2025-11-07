'use strict';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseArguments = (argsString = '') => {
  const args = {};
  const trimmed = argsString.trim();

  if (!trimmed) {
    return args;
  }

  const parts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  for (const part of parts) {
    const [rawKey, rawValue] = part.split(':');

    if (!rawKey || rawValue == null) {
      continue;
    }

    const key = rawKey.trim();
    const value = rawValue.trim();

    if (value.startsWith('"') && value.endsWith('"')) {
      args[key] = value.slice(1, -1);
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      args[key] = Number(value);
    } else if (/^(true|false)$/i.test(value)) {
      args[key] = value.toLowerCase() === 'true';
    } else {
      args[key] = value;
    }
  }

  return args;
};

const parseQuery = (query) => {
  if (typeof query !== 'string') {
    throw new Error('Query must be a string');
  }

  const normalized = query
    .replace(/#[^\n]*\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const match = normalized.match(/\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*(\([^)]*\))?/);

  if (!match) {
    throw new Error('Unsupported query');
  }

  const [, name, argsExpression] = match;
  const args = parseArguments(argsExpression ? argsExpression.slice(1, -1) : '');

  return { name, args };
};

const sanitizeReading = (reading) => ({
  id: reading.id,
  timestamp: reading.timestamp,
  energy: toNumber(reading.energy),
  power: toNumber(reading.power),
  voltage: reading.voltage == null ? null : toNumber(reading.voltage),
  current: reading.current == null ? null : toNumber(reading.current),
  temperature: reading.temperature == null ? null : toNumber(reading.temperature),
});

const sanitizeTariffPeriod = (tariff) => ({
  id: tariff.id,
  name: tariff.name,
  startTime: tariff.startTime,
  endTime: tariff.endTime,
  rate: toNumber(tariff.rate),
  weekdays: Array.isArray(tariff.weekdays)
    ? tariff.weekdays.map((day) => Number(day))
    : tariff.weekdays,
});

const sanitizeCostSummary = (summary) => ({
  id: summary.id,
  periodStart: summary.periodStart,
  periodEnd: summary.periodEnd,
  totalEnergy: toNumber(summary.totalEnergy),
  totalCost: toNumber(summary.totalCost),
  tariffPeriod: summary.tariffPeriod
    ? sanitizeTariffPeriod(summary.tariffPeriod)
    : null,
});

module.exports = {
  async handle(ctx) {
    const query = ctx.method === 'GET'
      ? ctx.query?.query || ctx.query?.q
      : ctx.request.body?.query;

    if (!query) {
      ctx.status = 400;
      ctx.body = {
        errors: [{ message: 'The "query" parameter is required.' }],
      };
      return;
    }

    let operation;

    try {
      operation = parseQuery(query);
    } catch (error) {
      ctx.status = 400;
      ctx.body = {
        errors: [{ message: error.message }],
      };
      return;
    }

    try {
      switch (operation.name) {
        case 'readings': {
          const { start, end, limit } = operation.args;
          const filters = {};

          if (start) {
            filters.timestamp = { ...(filters.timestamp || {}), $gte: new Date(start) };
          }

          if (end) {
            filters.timestamp = { ...(filters.timestamp || {}), $lte: new Date(end) };
          }

          const options = {
            filters,
            sort: { timestamp: 'desc' },
          };

          if (limit) {
            options.limit = Number(limit);
          }

          const readings = await strapi.entityService.findMany('api::reading.reading', options);

          ctx.body = {
            data: {
              readings: readings.map(sanitizeReading),
            },
          };
          return;
        }
        case 'readingsAggregate': {
          const aggregates = await strapi.service('api::reading.reading').aggregate(operation.args);

          ctx.body = {
            data: {
              readingsAggregate: {
                ...aggregates,
                tariffBreakdown: aggregates.tariffBreakdown.map((entry) => ({
                  tariffPeriod: entry.tariffPeriod ? sanitizeTariffPeriod(entry.tariffPeriod) : null,
                  totalEnergy: entry.totalEnergy,
                  totalCost: entry.totalCost,
                })),
              },
            },
          };
          return;
        }
        case 'tariffPeriods': {
          const tariffPeriods = await strapi.entityService.findMany('api::tariff-period.tariff-period');
          ctx.body = {
            data: {
              tariffPeriods: tariffPeriods.map(sanitizeTariffPeriod),
            },
          };
          return;
        }
        case 'costSummaries': {
          const filters = {};
          if (operation.args.tariffPeriod) {
            filters.tariffPeriod = Number(operation.args.tariffPeriod);
          }

          const costSummaries = await strapi.entityService.findMany('api::cost-summary.cost-summary', {
            filters,
            populate: { tariffPeriod: true },
          });

          ctx.body = {
            data: {
              costSummaries: costSummaries.map(sanitizeCostSummary),
            },
          };
          return;
        }
        default:
          ctx.status = 400;
          ctx.body = {
            errors: [{ message: `Unsupported query field: ${operation.name}` }],
          };
          return;
      }
    } catch (error) {
      ctx.status = 500;
      ctx.body = {
        errors: [{ message: error.message }],
      };
    }
  },
};

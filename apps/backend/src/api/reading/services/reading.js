'use strict';

const fetch = require('node-fetch');

const { createCoreService } = require('@strapi/strapi').factories;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseTimeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map((part) => Number(part));
  return hours * 60 + minutes + seconds / 60;
};

const isTimeInRange = (minutes, start, end) => {
  if (start == null || end == null || minutes == null) {
    return false;
  }

  if (start <= end) {
    return minutes >= start && minutes < end;
  }

  return minutes >= start || minutes < end;
};

const normalizeWeekdays = (value) => {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map((day) => Number(day));
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[\[\]\s]/g, '');

    if (!sanitized) {
      return null;
    }

    return sanitized
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item));
  }

  return null;
};

const resolveTariffForDate = (date, periods) => {
  if (!periods?.length) {
    return null;
  }

  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const weekday = date.getDay();

  return periods.find((period) => {
    const startMinutes = parseTimeToMinutes(period.startTime);
    const endMinutes = parseTimeToMinutes(period.endTime);
    const days = normalizeWeekdays(period.weekdays);
    const matchesDay = !days?.length || days.includes(weekday);

    return matchesDay && isTimeInRange(currentMinutes, startMinutes, endMinutes);
  }) || null;
};

module.exports = createCoreService('api::reading.reading', ({ strapi }) => ({
  async fetchShellyData({ baseUrl } = {}) {
    const deviceBaseUrl = baseUrl || process.env.SHELLY_DEVICE_BASE_URL || process.env.SHELLY_BASE_URL;

    if (!deviceBaseUrl) {
      throw new Error('SHELLY_DEVICE_BASE_URL is not configured');
    }

    const [statusResponse, emeterResponse] = await Promise.all([
      fetch(new URL('/status', deviceBaseUrl).toString()),
      fetch(new URL('/emeter/0', deviceBaseUrl).toString()),
    ]);

    if (!statusResponse.ok) {
      const message = `Failed to fetch Shelly status (${statusResponse.status})`;
      throw new Error(message);
    }

    if (!emeterResponse.ok) {
      const message = `Failed to fetch Shelly energy data (${emeterResponse.status})`;
      throw new Error(message);
    }

    const statusPayload = await statusResponse.json();
    const emeterPayload = await emeterResponse.json();

    const emeterData = Array.isArray(emeterPayload) ? emeterPayload[0] : emeterPayload;

    const timestamp = statusPayload.unixtime
      ? new Date(statusPayload.unixtime * 1000)
      : new Date();

    const reading = await strapi.entityService.create('api::reading.reading', {
      data: {
        timestamp,
        energy: toNumber(emeterData.total),
        power: toNumber(emeterData.power),
        voltage: toNumber(emeterData.voltage, null),
        current: toNumber(emeterData.current, null),
        temperature: toNumber(statusPayload.device?.temperature ?? statusPayload.temperature, null),
        statusPayload,
        emeterPayload,
      },
    });

    return reading;
  },

  async aggregate({ start, end } = {}) {
    const filters = {};

    if (start) {
      filters.timestamp = { ...(filters.timestamp || {}), $gte: new Date(start) };
    }

    if (end) {
      filters.timestamp = { ...(filters.timestamp || {}), $lte: new Date(end) };
    }

    const readings = await strapi.entityService.findMany('api::reading.reading', {
      filters,
      sort: { timestamp: 'asc' },
      publicationState: 'live',
    });

    if (!readings.length) {
      return {
        count: 0,
        totalEnergy: 0,
        averagePower: 0,
        minVoltage: null,
        maxVoltage: null,
        tariffBreakdown: [],
      };
    }

    const sorted = readings.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const totalEnergy = Math.max(
      0,
      toNumber(sorted[sorted.length - 1].energy) - toNumber(sorted[0].energy)
    );

    const powerValues = sorted.map((reading) => toNumber(reading.power));
    const averagePower = powerValues.length
      ? powerValues.reduce((sum, value) => sum + value, 0) / powerValues.length
      : 0;

    const voltageValues = sorted
      .map((reading) => (reading.voltage == null ? null : toNumber(reading.voltage)))
      .filter((value) => value != null);

    const minVoltage = voltageValues.length ? Math.min(...voltageValues) : null;
    const maxVoltage = voltageValues.length ? Math.max(...voltageValues) : null;

    const tariffPeriods = await strapi.entityService.findMany('api::tariff-period.tariff-period', {
      populate: { costSummaries: true },
    });

    const breakdownMap = new Map();

    tariffPeriods.forEach((period) => {
      breakdownMap.set(period.id, {
        tariffPeriod: {
          id: period.id,
          name: period.name,
          rate: toNumber(period.rate),
          startTime: period.startTime,
          endTime: period.endTime,
          weekdays: normalizeWeekdays(period.weekdays),
        },
        totalEnergy: 0,
        totalCost: 0,
      });
    });

    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      const delta = toNumber(current.energy) - toNumber(previous.energy);

      if (!(delta > 0)) {
        continue;
      }

      const timestampDate = new Date(current.timestamp);
      const period = resolveTariffForDate(timestampDate, tariffPeriods);

      if (!period) {
        continue;
      }

      const breakdown = breakdownMap.get(period.id);
      breakdown.totalEnergy += delta;
    }

    const tariffBreakdown = Array.from(breakdownMap.values()).map((entry) => ({
      ...entry,
      totalCost: Number((entry.totalEnergy * toNumber(entry.tariffPeriod.rate)).toFixed(6)),
    }));

    return {
      count: readings.length,
      totalEnergy,
      averagePower: Number(averagePower.toFixed(6)),
      minVoltage,
      maxVoltage,
      tariffBreakdown,
    };
  },
}));

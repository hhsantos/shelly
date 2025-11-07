'use strict';

const MINUTES_PER_DAY = 24 * 60;

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toDate = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseTimeToMinutes = (time) => {
  if (!time) {
    return null;
  }

  if (typeof time !== 'string') {
    return null;
  }

  const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map((part) => Number(part));

  if ([hours, minutes, seconds].some((part) => !Number.isFinite(part))) {
    return null;
  }

  const totalMinutes = hours * 60 + minutes + seconds / 60;

  if (totalMinutes === 0 && /^0{2}:0{2}:0{2}$/.test(time)) {
    return MINUTES_PER_DAY;
  }

  return totalMinutes;
};

const isTimeInRange = (minutes, startMinutes, endMinutes) => {
  if (minutes == null || startMinutes == null || endMinutes == null) {
    return false;
  }

  if (startMinutes === endMinutes) {
    return true;
  }

  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }

  return minutes >= startMinutes || minutes < endMinutes;
};

const normalizeWeekdays = (value) => {
  if (!value && value !== 0) {
    return null;
  }

  if (Array.isArray(value)) {
    const result = value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item))
      .map((item) => ((item % 7) + 7) % 7);

    return result.length ? result : null;
  }

  if (typeof value === 'string') {
    const sanitized = value.replace(/[\[\]\s]/g, '');

    if (!sanitized) {
      return null;
    }

    const parts = sanitized
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((part) => Number(part))
      .filter((item) => Number.isFinite(item))
      .map((item) => ((item % 7) + 7) % 7);

    return parts.length ? parts : null;
  }

  return null;
};

const isWeekend = (date) => {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
};

const isHoliday = (date, holidays) => {
  if (!holidays?.size) {
    return false;
  }

  const key = date.toISOString().slice(0, 10);
  return holidays.has(key);
};

const buildSchedule = (periods = []) =>
  periods
    .map((period) => ({
      code: period.code ? String(period.code).toUpperCase() : null,
      startMinutes: parseTimeToMinutes(period.startTime),
      endMinutes: parseTimeToMinutes(period.endTime),
      weekdays: normalizeWeekdays(period.weekdays),
    }))
    .filter((period) => period.code && period.startMinutes != null && period.endMinutes != null);

const resolveTariffPeriod = (date, schedule, defaultCode = 'P3') => {
  const currentMinutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const currentWeekday = date.getUTCDay();

  const entry = schedule.find((period) => {
    const matchesDay = !period.weekdays?.length || period.weekdays.includes(currentWeekday);
    return matchesDay && isTimeInRange(currentMinutes, period.startMinutes, period.endMinutes);
  });

  return entry?.code || defaultCode;
};

const getTariffBand = (dateInput, { schedule = [], holidays } = {}) => {
  const date = toDate(dateInput);

  if (!date) {
    return 'P3';
  }

  const preparedSchedule = buildSchedule(schedule);
  const defaultCode = 'P3';

  if (!preparedSchedule.length) {
    return defaultCode;
  }

  if (isWeekend(date) || isHoliday(date, holidays)) {
    const valleyPeriods = preparedSchedule.filter((period) => period.code === 'P3');

    if (!valleyPeriods.length) {
      return defaultCode;
    }

    return resolveTariffPeriod(date, valleyPeriods, defaultCode);
  }

  return resolveTariffPeriod(date, preparedSchedule, defaultCode);
};

module.exports = {
  buildSchedule,
  getTariffBand,
  isHoliday,
  isWeekend,
  normalizeWeekdays,
  parseTimeToMinutes,
  resolveTariffPeriod,
  toNumber,
  toDate,
};

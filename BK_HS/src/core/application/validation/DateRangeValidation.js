const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const MAX_CONSUMPTION_PERIOD_DAYS = 366;

function assertMaxPeriodDays(from, to, maxDays = MAX_CONSUMPTION_PERIOD_DAYS) {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  const days = Math.floor((end - start) / DAY_IN_MILLISECONDS) + 1;

  if (days > maxDays) {
    const error = new Error(`El periodo no puede superar ${maxDays} días`);
    error.status = 400;
    throw error;
  }
}

module.exports = { MAX_CONSUMPTION_PERIOD_DAYS, assertMaxPeriodDays };

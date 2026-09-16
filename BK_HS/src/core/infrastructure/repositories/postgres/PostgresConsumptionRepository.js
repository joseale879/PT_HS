const { ConsumptionSummary } = require('../../../domain/entities/ConsumptionSummary');
const { withTransaction } = require('../../../../infrastructure/db');

class PostgresConsumptionRepository {
  async ingestTelemetry({ deviceCode, mqttMessageId, consumptionLiters, recordedAt, flowRateLpm, totalLiters, pulses, sampleIntervalSeconds, wifiRssiDbm, signalQuality, batteryLevel, voltage, temperature }) {
    const result = await withTransaction(null, (client) => client.query(
      `SELECT inserted, reading_id, home_id
         FROM device.fn_ingest_sensor_reading($1::varchar, $2::varchar, $3::numeric, $4::timestamptz,
           $5::numeric, $6::numeric, $7::integer, $8::numeric, $9::integer, $10::integer,
           $11::integer, $12::numeric, $13::numeric)`,
      [deviceCode, mqttMessageId, consumptionLiters, recordedAt, flowRateLpm, totalLiters, pulses, sampleIntervalSeconds, wifiRssiDbm, signalQuality, batteryLevel, voltage, temperature]
    ));
    const row = result.rows[0] || {};
    return {
      inserted: row.inserted === true,
      readingId: row.reading_id || null,
      homeId: row.home_id || null,
      duplicate: row.inserted === false
    };
  }

  async calculateSummary({ userId, homeId, from, to }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT * FROM consumption.fn_calculate_consumption($1::uuid, $2::date, $3::date)`,
      [homeId, from, to]
    ));
    const row = result.rows[0] || {};
    return new ConsumptionSummary({
      homeId,
      from,
      to,
      totalM3: row.total_m3,
      totalLiters: row.total_liters,
      totalCost: row.total_cost,
      readingCount: row.reading_count
    });
  }

  async getDaily({ userId, homeId, date }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_get_daily_consumption($1::uuid, $2::date) AS consumption_liters`, [homeId, date]
    ));
    return { homeId, date, consumptionLiters: Number(result.rows[0]?.consumption_liters || 0) };
  }

  async getMonthly({ userId, homeId, year, month }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_get_monthly_consumption($1::uuid, $2::integer, $3::integer) AS consumption_liters`, [homeId, year, month]
    ));
    return { homeId, year, month, consumptionLiters: Number(result.rows[0]?.consumption_liters || 0) };
  }

  async getHourly({ userId, homeId }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT home_id, hour, avg_consumption_m3, avg_consumption_liters, sample_count, refreshed_at
         FROM consumption.fn_get_home_hourly_consumption($1::uuid)`, [homeId]
    ));
    return result.rows.map((row) => ({
      homeId: row.home_id,
      hour: Number(row.hour),
      averageConsumptionM3: Number(row.avg_consumption_m3 || 0),
      averageConsumptionLiters: Number(row.avg_consumption_liters || 0),
      sampleCount: Number(row.sample_count || 0),
      refreshedAt: row.refreshed_at
    }));
  }

  async calculatePeriodCost({ userId, homeId, from, to }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT consumption.fn_calculate_period_cost($1::uuid, $2::date, $3::date) AS total_cost`,
      [homeId, from, to]
    ));
    const value = result.rows[0]?.total_cost;
    return { homeId, from, to, totalCost: value === null ? null : Number(value) };
  }

  async getSeries({ userId, homeId, from, to, groupBy }) {
    const result = await withTransaction(userId, (client) => client.query(
      `SELECT group_key, bucket_date, bucket_hour, location,
              consumption_liters, consumption_m3, reading_count,
              average_flow_lpm, peak_flow_lpm
         FROM consumption.fn_get_consumption_series($1::uuid, $2::date, $3::date, $4::varchar)`,
      [homeId, from, to, groupBy]
    ));

    return result.rows.map((row) => ({
      groupKey: row.group_key,
      bucketDate: row.bucket_date,
      bucketHour: row.bucket_hour === null ? null : Number(row.bucket_hour),
      location: row.location,
      consumptionLiters: Number(row.consumption_liters || 0),
      consumptionM3: Number(row.consumption_m3 || 0),
      readingCount: Number(row.reading_count || 0),
      averageFlowLpm: row.average_flow_lpm === null ? null : Number(row.average_flow_lpm),
      peakFlowLpm: row.peak_flow_lpm === null ? null : Number(row.peak_flow_lpm)
    }));
  }
}

module.exports = { PostgresConsumptionRepository };

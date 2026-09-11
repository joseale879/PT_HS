-- PostgreSQL does not allow changing the type of a source column while a
-- generated column depends on it. Recreate the generated value after raising
-- the precision of the MQTT sample value. The two reporting materialized
-- views also depend on that generated column, so recreate them afterwards.
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_hourly_consumption_avg;
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_home_monthly_consumption;

ALTER TABLE consumption.sensor_reading
  DROP COLUMN consumption_m3;

ALTER TABLE consumption.sensor_reading
  ALTER COLUMN consumption_liters TYPE NUMERIC(14,5);

ALTER TABLE consumption.sensor_reading
  ADD COLUMN consumption_m3 NUMERIC(14,8)
    GENERATED ALWAYS AS ((consumption_liters / 1000::numeric)) STORED;

ALTER TABLE consumption.sensor_reading
  ADD COLUMN IF NOT EXISTS flow_rate_lpm NUMERIC(10,3) NULL,
  ADD COLUMN IF NOT EXISTS total_liters NUMERIC(14,5) NULL,
  ADD COLUMN IF NOT EXISTS pulses INTEGER NULL CHECK (pulses IS NULL OR pulses >= 0),
  ADD COLUMN IF NOT EXISTS sample_interval_seconds NUMERIC(10,3) NULL CHECK (
    sample_interval_seconds IS NULL OR sample_interval_seconds > 0
  ),
  ADD COLUMN IF NOT EXISTS mqtt_message_id VARCHAR(100) NULL;

CREATE MATERIALIZED VIEW consumption.mv_hourly_consumption_avg AS
SELECT
    sr.home_id,
    EXTRACT(HOUR FROM sr.recorded_at)::INTEGER AS hour,
    ROUND(AVG(sr.consumption_m3)::NUMERIC, 4) AS avg_consumption_m3,
    ROUND(AVG(sr.consumption_liters)::NUMERIC, 2) AS avg_consumption_liters,
    COUNT(*) AS sample_count,
    NOW() AS refreshed_at
FROM consumption.sensor_reading sr
WHERE sr.recorded_at > NOW() - INTERVAL '30 days'
  AND sr.consumption_m3 > 0
GROUP BY sr.home_id, EXTRACT(HOUR FROM sr.recorded_at)
ORDER BY sr.home_id, hour;

CREATE UNIQUE INDEX idx_mv_hourly_consumption_avg_home_hour
  ON consumption.mv_hourly_consumption_avg (home_id, hour);

CREATE MATERIALIZED VIEW consumption.mv_home_monthly_consumption AS
SELECT
    sr.home_id,
    DATE_TRUNC('month', sr.recorded_at)::DATE AS month_start,
    SUM(sr.consumption_m3) AS total_consumption_m3,
    SUM(sr.estimated_cost) AS total_cost,
    COUNT(*) AS reading_count,
    MAX(sr.recorded_at) AS last_reading_at,
    NOW() AS refreshed_at
FROM consumption.sensor_reading sr
GROUP BY sr.home_id, DATE_TRUNC('month', sr.recorded_at);

CREATE UNIQUE INDEX idx_mv_home_monthly_consumption_pk
  ON consumption.mv_home_monthly_consumption (home_id, month_start);
CREATE INDEX idx_mv_home_monthly_consumption_home
  ON consumption.mv_home_monthly_consumption (home_id);

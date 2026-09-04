DROP MATERIALIZED VIEW IF EXISTS consumption.mv_hourly_consumption_avg;

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

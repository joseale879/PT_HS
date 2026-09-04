DROP MATERIALIZED VIEW IF EXISTS consumption.mv_home_monthly_consumption;

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
WHERE sr.recorded_at >= '2024-01-01'
GROUP BY sr.home_id, DATE_TRUNC('month', sr.recorded_at);

CREATE UNIQUE INDEX idx_mv_home_monthly_consumption_pk
    ON consumption.mv_home_monthly_consumption (home_id, month_start);
CREATE INDEX idx_mv_home_monthly_consumption_home
    ON consumption.mv_home_monthly_consumption (home_id);
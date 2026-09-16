-- Conserva la precision de las lecturas pequenas del caudalimetro.
-- Una muestra de 0.040 L debe conservarse como 0.000040 m3.

-- Estas vistas dependen de la columna generada y se reconstruyen al final.
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_hourly_consumption_avg;
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_home_monthly_consumption;

ALTER TABLE consumption.sensor_reading
    DROP COLUMN consumption_m3;

ALTER TABLE consumption.sensor_reading
    ALTER COLUMN consumption_liters TYPE NUMERIC(14,3);

ALTER TABLE consumption.sensor_reading
    ADD COLUMN consumption_m3 NUMERIC(14,6)
        GENERATED ALWAYS AS (consumption_liters / 1000) STORED;

ALTER TABLE consumption.daily_consumption_summary
    ALTER COLUMN total_consumption_liters TYPE NUMERIC(14,3),
    ALTER COLUMN total_consumption_m3 TYPE NUMERIC(14,6);

ALTER TABLE consumption.hourly_consumption_history
    ALTER COLUMN consumption_liters TYPE NUMERIC(14,3),
    ALTER COLUMN consumption_m3 TYPE NUMERIC(14,6);

ALTER TABLE consumption.monthly_consumption_history
    ALTER COLUMN total_consumption_m3 TYPE NUMERIC(14,6);

ALTER TABLE consumption.consumption_prediction
    ALTER COLUMN estimated_consumption_m3 TYPE NUMERIC(14,6);

CREATE MATERIALIZED VIEW consumption.mv_home_monthly_consumption AS
SELECT home_id,
       DATE_TRUNC('month', recorded_at)::DATE AS month_start,
       SUM(consumption_m3) AS total_consumption_m3,
       SUM(estimated_cost) AS total_cost,
       COUNT(*) AS reading_count,
       MAX(recorded_at) AS last_reading_at,
       NOW() AS refreshed_at
  FROM consumption.sensor_reading
 GROUP BY home_id, DATE_TRUNC('month', recorded_at)::DATE;

CREATE UNIQUE INDEX idx_mv_home_monthly_consumption_pk
    ON consumption.mv_home_monthly_consumption(home_id, month_start);
CREATE INDEX idx_mv_home_monthly_consumption_home
    ON consumption.mv_home_monthly_consumption(home_id);

CREATE MATERIALIZED VIEW consumption.mv_hourly_consumption_avg AS
SELECT home_id,
       EXTRACT(HOUR FROM recorded_at)::INTEGER AS hour,
       ROUND(AVG(consumption_m3), 6) AS avg_consumption_m3,
       ROUND(AVG(consumption_liters), 3) AS avg_consumption_liters,
       COUNT(*) AS sample_count,
       NOW() AS refreshed_at
  FROM consumption.sensor_reading
 WHERE recorded_at > NOW() - INTERVAL '30 days'
   AND consumption_m3 > 0
 GROUP BY home_id, EXTRACT(HOUR FROM recorded_at)
 ORDER BY home_id, EXTRACT(HOUR FROM recorded_at)::INTEGER;

CREATE UNIQUE INDEX idx_mv_hourly_consumption_avg_home_hour
    ON consumption.mv_hourly_consumption_avg(home_id, hour);

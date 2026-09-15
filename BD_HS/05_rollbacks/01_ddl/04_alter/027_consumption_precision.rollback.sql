-- Reversa la precision ampliada y reconstruye las vistas derivadas originales.
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_hourly_consumption_avg;
DROP MATERIALIZED VIEW IF EXISTS consumption.mv_home_monthly_consumption;

ALTER TABLE consumption.sensor_reading
    DROP COLUMN consumption_m3;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
          FROM consumption.sensor_reading
         WHERE consumption_liters IS NOT NULL
           AND consumption_liters != ROUND(consumption_liters, 2)
    ) THEN
        RAISE EXCEPTION 'No se puede reducir consumption_liters a dos decimales: existen valores con mas precision';
    END IF;
END;
$$;

ALTER TABLE consumption.sensor_reading
    ALTER COLUMN consumption_liters TYPE NUMERIC(10,2);

ALTER TABLE consumption.sensor_reading
    ADD COLUMN consumption_m3 NUMERIC(10,4)
        GENERATED ALWAYS AS (consumption_liters / 1000) STORED;

ALTER TABLE consumption.daily_consumption_summary
    ALTER COLUMN total_consumption_liters TYPE NUMERIC(10,2),
    ALTER COLUMN total_consumption_m3 TYPE NUMERIC(10,4);

ALTER TABLE consumption.hourly_consumption_history
    ALTER COLUMN consumption_liters TYPE NUMERIC(10,2),
    ALTER COLUMN consumption_m3 TYPE NUMERIC(10,4);

ALTER TABLE consumption.monthly_consumption_history
    ALTER COLUMN total_consumption_m3 TYPE NUMERIC(10,4);

ALTER TABLE consumption.consumption_prediction
    ALTER COLUMN estimated_consumption_m3 TYPE NUMERIC(10,4);

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
       ROUND(AVG(consumption_m3), 4) AS avg_consumption_m3,
       ROUND(AVG(consumption_liters), 2) AS avg_consumption_liters,
       COUNT(*) AS sample_count,
       NOW() AS refreshed_at
  FROM consumption.sensor_reading
 WHERE recorded_at > NOW() - INTERVAL '30 days'
   AND consumption_m3 > 0
 GROUP BY home_id, EXTRACT(HOUR FROM recorded_at)
 ORDER BY home_id, EXTRACT(HOUR FROM recorded_at)::INTEGER;

CREATE UNIQUE INDEX idx_mv_hourly_consumption_avg_home_hour
    ON consumption.mv_hourly_consumption_avg(home_id, hour);

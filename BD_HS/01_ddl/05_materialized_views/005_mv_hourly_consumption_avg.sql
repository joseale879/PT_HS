-- ============================================================
-- VISTA MATERIALIZADA: mv_hourly_consumption_avg
-- DOMINIO: consumption
-- PROPÓSITO: Promedio de consumo por hora (últimos 30 días) para análisis de hábitos
-- ============================================================
CREATE MATERIALIZED VIEW consumption.mv_hourly_consumption_avg AS
SELECT
    EXTRACT(HOUR FROM sr.recorded_at)::INTEGER AS hour,
    ROUND(AVG(sr.consumption_m3)::NUMERIC, 4) AS avg_consumption_m3,
    ROUND(AVG(sr.consumption_liters)::NUMERIC, 2) AS avg_consumption_liters,
    COUNT(*) AS sample_count,
    NOW() AS refreshed_at
FROM consumption.sensor_reading sr
WHERE sr.recorded_at > NOW() - INTERVAL '30 days'
  AND sr.consumption_m3 > 0
GROUP BY EXTRACT(HOUR FROM sr.recorded_at)
ORDER BY hour;

COMMENT ON MATERIALIZED VIEW consumption.mv_hourly_consumption_avg IS
'Promedio de consumo por hora (últimos 30 días). Utilizado para análisis de hábitos y horas pico (RF5.2).';

CREATE UNIQUE INDEX idx_mv_hourly_consumption_avg_hour
    ON consumption.mv_hourly_consumption_avg (hour);
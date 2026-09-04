-- ============================================================
-- VISTA MATERIALIZADA: mv_home_monthly_consumption
-- DOMINIO: consumption
-- PROPÓSITO: Resumen mensual de consumo por hogar para reportes
-- ============================================================
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
WHERE sr.recorded_at >= '2024-01-01'  -- Evita datos muy antiguos si no se necesitan
GROUP BY sr.home_id, DATE_TRUNC('month', sr.recorded_at);

COMMENT ON MATERIALIZED VIEW consumption.mv_home_monthly_consumption IS
'Resumen mensual de consumo por hogar. Utilizado para reportes mensuales y anuales (RF5.1.2, RF5.1.3).';

-- Índices para la vista materializada (se crean después de la vista)
CREATE UNIQUE INDEX idx_mv_home_monthly_consumption_pk
    ON consumption.mv_home_monthly_consumption (home_id, month_start);
CREATE INDEX idx_mv_home_monthly_consumption_home
    ON consumption.mv_home_monthly_consumption (home_id);
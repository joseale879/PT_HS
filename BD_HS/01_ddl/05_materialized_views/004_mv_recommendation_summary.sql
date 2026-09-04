-- ============================================================
-- VISTA MATERIALIZADA: mv_recommendation_summary
-- DOMINIO: analytics_support
-- PROPÓSITO: Resumen de recomendaciones aplicadas/pendientes por hogar
-- ============================================================
CREATE MATERIALIZED VIEW analytics_support.mv_recommendation_summary AS
SELECT
    ur.home_id,
    COUNT(*) AS total_recommendations,
    COUNT(*) FILTER (WHERE ur.status = 'Applied') AS applied_count,
    COUNT(*) FILTER (WHERE ur.status = 'Pending') AS pending_count,
    COUNT(*) FILTER (WHERE ur.status = 'Dismissed') AS dismissed_count,
    AVG(CASE WHEN ur.usefulness THEN 1.0 WHEN NOT ur.usefulness THEN 0.0 END) AS avg_usefulness,
    NOW() AS refreshed_at
FROM analytics_support.user_recommendation ur
WHERE ur.home_id IS NOT NULL
GROUP BY ur.home_id;

COMMENT ON MATERIALIZED VIEW analytics_support.mv_recommendation_summary IS
'Resumen de recomendaciones aplicadas/pendientes por hogar. Utilizado para análisis de hábitos (RF5.2, RF5.5).';

CREATE INDEX idx_mv_recommendation_summary_home
    ON analytics_support.mv_recommendation_summary (home_id);

-- ============================================================
-- VISTA MATERIALIZADA: mv_pending_alerts
-- DOMINIO: alert_rate
-- PROPÓSITO: Resumen de alertas pendientes por hogar para el dashboard
-- ============================================================
CREATE MATERIALIZED VIEW alert_rate.mv_pending_alerts AS
SELECT
    ae.home_id,
    COUNT(*) AS pending_count,
    MAX(ae.generated_at) AS last_alert_at,
    NOW() AS refreshed_at
FROM alert_rate.alert_event ae
WHERE ae.status IN ('Pending', 'Sent')
GROUP BY ae.home_id;

COMMENT ON MATERIALIZED VIEW alert_rate.mv_pending_alerts IS
'Resumen de alertas pendientes por hogar. Utilizado para el dashboard principal y notificaciones (RF5.4).';

CREATE INDEX idx_mv_pending_alerts_home
    ON alert_rate.mv_pending_alerts (home_id);
CREATE INDEX idx_mv_pending_alerts_count
    ON alert_rate.mv_pending_alerts (pending_count DESC);

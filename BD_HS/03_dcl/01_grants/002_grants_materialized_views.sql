-- ============================================================
-- PERMISOS DE LECTURA PARA VISTAS MATERIALIZADAS
-- ============================================================

GRANT SELECT ON consumption.mv_home_monthly_consumption TO hidro_smart_app, hidro_smart_readonly;
GRANT SELECT ON alert_rate.mv_pending_alerts TO hidro_smart_app, hidro_smart_readonly;
GRANT SELECT ON device.mv_active_devices TO hidro_smart_app, hidro_smart_readonly;
GRANT SELECT ON analytics_support.mv_recommendation_summary TO hidro_smart_app, hidro_smart_readonly;
GRANT SELECT ON consumption.mv_hourly_consumption_avg TO hidro_smart_app, hidro_smart_readonly;

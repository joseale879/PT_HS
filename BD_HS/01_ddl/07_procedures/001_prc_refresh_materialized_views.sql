-- ============================================================
-- PROCEDIMIENTO: prc_refresh_materialized_views
-- DOMINIO: Varios (consumption, alert_rate, device, analytics_support)
-- PROPÓSITO: Refresca todas las vistas materializadas de forma concurrente
-- ============================================================
CREATE OR REPLACE PROCEDURE analytics_support.prc_refresh_materialized_views()
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, alert_rate, device, analytics_support, public, pg_temp
AS $$
BEGIN
    RAISE NOTICE 'Iniciando refresh de vistas materializadas...';

    -- 1. Refrescar mv_home_monthly_consumption
    RAISE NOTICE 'Refrescando mv_home_monthly_consumption...';
    REFRESH MATERIALIZED VIEW consumption.mv_home_monthly_consumption;

    -- 2. Refrescar mv_pending_alerts
    RAISE NOTICE 'Refrescando mv_pending_alerts...';
    REFRESH MATERIALIZED VIEW alert_rate.mv_pending_alerts;

    -- 3. Refrescar mv_active_devices
    RAISE NOTICE 'Refrescando mv_active_devices...';
    REFRESH MATERIALIZED VIEW device.mv_active_devices;

    -- 4. Refrescar mv_recommendation_summary
    RAISE NOTICE 'Refrescando mv_recommendation_summary...';
    REFRESH MATERIALIZED VIEW analytics_support.mv_recommendation_summary;

    -- 5. Refrescar mv_hourly_consumption_avg
    RAISE NOTICE 'Refrescando mv_hourly_consumption_avg...';
    REFRESH MATERIALIZED VIEW consumption.mv_hourly_consumption_avg;

    RAISE NOTICE '✅ Todas las vistas materializadas han sido refrescadas correctamente.';
END;
$$;

COMMENT ON PROCEDURE analytics_support.prc_refresh_materialized_views() IS
'Refresca todas las vistas materializadas del sistema de forma concurrente.
Este procedimiento debe ejecutarse periódicamente (ej. cada hora) mediante un job programado.';

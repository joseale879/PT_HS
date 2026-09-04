CREATE OR REPLACE PROCEDURE analytics_support.prc_refresh_materialized_views()
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, alert_rate, device, analytics_support, public, pg_temp
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY consumption.mv_home_monthly_consumption;
    REFRESH MATERIALIZED VIEW CONCURRENTLY alert_rate.mv_pending_alerts;
    REFRESH MATERIALIZED VIEW CONCURRENTLY device.mv_active_devices;
    REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_support.mv_recommendation_summary;
    REFRESH MATERIALIZED VIEW CONCURRENTLY consumption.mv_hourly_consumption_avg;
END;
$$;

COMMENT ON PROCEDURE analytics_support.prc_refresh_materialized_views() IS
'Refresca las cinco vistas materializadas con la modalidad CONCURRENTLY. Cada vista debe conservar un indice unico sin filtro.';
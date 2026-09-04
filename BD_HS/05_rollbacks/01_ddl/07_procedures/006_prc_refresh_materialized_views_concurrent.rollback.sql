CREATE OR REPLACE PROCEDURE analytics_support.prc_refresh_materialized_views()
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = consumption, alert_rate, device, analytics_support, public, pg_temp
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW consumption.mv_home_monthly_consumption;
    REFRESH MATERIALIZED VIEW alert_rate.mv_pending_alerts;
    REFRESH MATERIALIZED VIEW device.mv_active_devices;
    REFRESH MATERIALIZED VIEW analytics_support.mv_recommendation_summary;
    REFRESH MATERIALIZED VIEW consumption.mv_hourly_consumption_avg;
END;
$$;
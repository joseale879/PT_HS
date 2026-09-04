-- Restauracion del estado amplio anterior a este changeset.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy TO hidro_smart_app;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy TO hidro_smart_app;
GRANT SELECT ON consumption.mv_home_monthly_consumption,
    consumption.mv_hourly_consumption_avg,
    alert_rate.mv_pending_alerts,
    device.mv_active_devices,
    analytics_support.mv_recommendation_summary
TO hidro_smart_app, hidro_smart_readonly;
REVOKE EXECUTE ON FUNCTION consumption.fn_get_home_monthly_consumption(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION consumption.fn_get_home_hourly_consumption(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION alert_rate.fn_get_home_pending_alerts(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION device.fn_get_home_active_devices(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION analytics_support.fn_get_home_recommendation_summary(UUID) FROM hidro_smart_app;
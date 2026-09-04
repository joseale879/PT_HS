-- El rol readonly queda limitado a reportes agregados autorizados.
REVOKE ALL ON ALL TABLES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy FROM hidro_smart_readonly;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy FROM hidro_smart_readonly;

GRANT SELECT ON consumption.mv_home_monthly_consumption,
    consumption.mv_hourly_consumption_avg,
    alert_rate.mv_pending_alerts,
    device.mv_active_devices,
    analytics_support.mv_recommendation_summary
TO hidro_smart_readonly;
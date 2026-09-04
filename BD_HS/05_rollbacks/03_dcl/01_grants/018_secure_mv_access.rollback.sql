-- Restauracion del acceso directo previo al endurecimiento.
GRANT SELECT ON consumption.mv_home_monthly_consumption,
    consumption.mv_hourly_consumption_avg,
    alert_rate.mv_pending_alerts,
    device.mv_active_devices,
    analytics_support.mv_recommendation_summary
TO hidro_smart_app, hidro_smart_readonly;
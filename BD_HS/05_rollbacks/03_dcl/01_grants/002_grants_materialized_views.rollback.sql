REVOKE SELECT ON consumption.mv_home_monthly_consumption FROM hidro_smart_app, hidro_smart_readonly;
REVOKE SELECT ON alert_rate.mv_pending_alerts FROM hidro_smart_app, hidro_smart_readonly;
REVOKE SELECT ON device.mv_active_devices FROM hidro_smart_app, hidro_smart_readonly;
REVOKE SELECT ON analytics_support.mv_recommendation_summary FROM hidro_smart_app, hidro_smart_readonly;
REVOKE SELECT ON consumption.mv_hourly_consumption_avg FROM hidro_smart_app, hidro_smart_readonly;

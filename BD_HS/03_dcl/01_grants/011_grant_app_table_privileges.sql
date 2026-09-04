-- El rol de aplicacion no recibe CRUD global. Cada tabla se autoriza de forma explicita.
REVOKE ALL ON ALL TABLES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy FROM hidro_smart_app;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy FROM hidro_smart_app;

GRANT SELECT, UPDATE ON user_account.user_account TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE ON user_account.user_profile TO hidro_smart_app;
GRANT SELECT ON user_account.role, user_account.permission, user_account.user_role TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON preference.user_preference TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE ON home.home TO hidro_smart_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON home.home_user, home.home_user_function, home.home_device, home.home_member_request, home.vacation_mode, home.saving_goal TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON device.device TO hidro_smart_app;
GRANT SELECT, INSERT ON device.calibration_history TO hidro_smart_app;
GRANT SELECT ON device.device_history, device.device_telemetry_history TO hidro_smart_app;

GRANT SELECT ON consumption.sensor_reading, consumption.daily_consumption_summary,
    consumption.hourly_consumption_history, consumption.monthly_consumption_history,
    consumption.consumption_prediction TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON alert_rate.threshold_configuration,
    alert_rate.alert_rule, alert_rate.alert_event, alert_rate.alert_notification,
    alert_rate.home_rate TO hidro_smart_app;
GRANT SELECT ON alert_rate.estratos TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE ON analytics_support.user_recommendation,
    analytics_support.generated_report, analytics_support.ticket,
    analytics_support.ticket_response TO hidro_smart_app;
GRANT SELECT ON analytics_support.recommendation, analytics_support.recommendation_category,
    analytics_support.ticket_category, analytics_support.ticket_priority,
    analytics_support.ticket_status TO hidro_smart_app;

GRANT SELECT, INSERT, UPDATE ON privacy.user_consent, privacy.arco_request TO hidro_smart_app;

REVOKE SELECT ON consumption.mv_home_monthly_consumption,
    consumption.mv_hourly_consumption_avg,
    alert_rate.mv_pending_alerts,
    device.mv_active_devices,
    analytics_support.mv_recommendation_summary
FROM hidro_smart_app, hidro_smart_readonly;

REVOKE ALL ON FUNCTION consumption.fn_get_home_monthly_consumption(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION consumption.fn_get_home_hourly_consumption(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION alert_rate.fn_get_home_pending_alerts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION device.fn_get_home_active_devices(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION analytics_support.fn_get_home_recommendation_summary(UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION consumption.fn_get_home_monthly_consumption(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION consumption.fn_get_home_hourly_consumption(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION alert_rate.fn_get_home_pending_alerts(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION device.fn_get_home_active_devices(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION analytics_support.fn_get_home_recommendation_summary(UUID) TO hidro_smart_app;
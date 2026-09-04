DROP FUNCTION IF EXISTS analytics_support.fn_get_home_recommendation_summary(UUID);
DROP FUNCTION IF EXISTS device.fn_get_home_active_devices(UUID);
DROP FUNCTION IF EXISTS alert_rate.fn_get_home_pending_alerts(UUID);
DROP FUNCTION IF EXISTS consumption.fn_get_home_hourly_consumption(UUID);
DROP FUNCTION IF EXISTS consumption.fn_get_home_monthly_consumption(UUID);
DROP FUNCTION IF EXISTS user_account.fn_app_has_permission(VARCHAR);
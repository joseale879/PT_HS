REVOKE SELECT ON consumption.mv_home_monthly_consumption,
    consumption.mv_hourly_consumption_avg,
    alert_rate.mv_pending_alerts,
    device.mv_active_devices,
    analytics_support.mv_recommendation_summary
FROM hidro_smart_readonly;

GRANT SELECT ON ALL TABLES IN SCHEMA user_account, preference, home, device, consumption, alert_rate, analytics_support, audit, privacy TO hidro_smart_readonly;
REVOKE SELECT ON user_account.user_credential, user_account.password_reset_token,
    user_account.token, user_account.session, user_account.user_mfa,
    user_account.login_attempt, user_account.role_permission,
    privacy.user_consent, privacy.arco_request, audit.audit_log, audit.log_error
FROM hidro_smart_readonly;
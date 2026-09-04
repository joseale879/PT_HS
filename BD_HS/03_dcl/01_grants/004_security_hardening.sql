REVOKE SELECT ON user_account.user_credential, user_account.password_reset_token,
    user_account.token, user_account.session, user_account.user_mfa,
    user_account.login_attempt, user_account.role_permission,
    privacy.user_consent, privacy.arco_request, audit.audit_log, audit.log_error
FROM hidro_smart_readonly;

REVOKE SELECT ON user_account.user_credential, user_account.password_reset_token,
    user_account.token, user_account.user_mfa
FROM hidro_smart_app;

REVOKE ALL ON FUNCTION user_account.fn_register_user(VARCHAR, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION home.fn_create_home_with_owner(VARCHAR, VARCHAR, VARCHAR, SMALLINT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION consumption.fn_calculate_cost(DECIMAL, UUID, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_register_user(VARCHAR, VARCHAR) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION home.fn_create_home_with_owner(VARCHAR, VARCHAR, VARCHAR, SMALLINT, UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION consumption.fn_calculate_cost(DECIMAL, UUID, DATE) TO hidro_smart_app;

REVOKE ALL ON FUNCTION user_account.fn_record_login_failure(UUID, VARCHAR) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_reset_login_attempts(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_record_login_failure(UUID, VARCHAR) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_reset_login_attempts(UUID) TO hidro_smart_app;
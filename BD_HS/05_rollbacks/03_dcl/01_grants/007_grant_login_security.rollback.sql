REVOKE EXECUTE ON FUNCTION user_account.fn_record_login_failure(UUID, VARCHAR) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_reset_login_attempts(UUID) FROM hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_record_login_failure(UUID, VARCHAR) TO PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_reset_login_attempts(UUID) TO PUBLIC;
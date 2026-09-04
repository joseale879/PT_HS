REVOKE ALL ON FUNCTION user_account.fn_get_login_security_state(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_get_login_security_state(UUID) TO hidro_smart_app;

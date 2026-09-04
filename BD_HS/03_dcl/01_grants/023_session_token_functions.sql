REVOKE ALL ON FUNCTION user_account.fn_create_session(UUID, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_rotate_refresh_token(TEXT, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_revoke_refresh_session(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_create_session(UUID, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_rotate_refresh_token(TEXT, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_revoke_refresh_session(TEXT) TO hidro_smart_app;

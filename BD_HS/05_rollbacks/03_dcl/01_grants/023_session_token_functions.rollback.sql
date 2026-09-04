REVOKE EXECUTE ON FUNCTION user_account.fn_create_session(UUID, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_rotate_refresh_token(TEXT, TEXT, TIMESTAMPTZ, VARCHAR, TEXT) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_revoke_refresh_session(TEXT) FROM hidro_smart_app;

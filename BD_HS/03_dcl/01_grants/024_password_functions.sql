REVOKE ALL ON FUNCTION user_account.fn_get_credential_for_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_change_password_hash(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_create_password_reset_token(VARCHAR, TEXT, TIMESTAMPTZ) FROM PUBLIC;
REVOKE ALL ON FUNCTION user_account.fn_consume_password_reset(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION user_account.fn_get_credential_for_user(UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_change_password_hash(UUID, TEXT) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_create_password_reset_token(VARCHAR, TEXT, TIMESTAMPTZ) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_consume_password_reset(TEXT, TEXT) TO hidro_smart_app;

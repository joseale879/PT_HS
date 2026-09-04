REVOKE EXECUTE ON FUNCTION user_account.fn_get_credential_for_user(UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_change_password_hash(UUID, TEXT) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_create_password_reset_token(VARCHAR, TEXT, TIMESTAMPTZ) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_consume_password_reset(TEXT, TEXT) FROM hidro_smart_app;

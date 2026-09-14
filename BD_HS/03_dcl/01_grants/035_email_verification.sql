GRANT EXECUTE ON FUNCTION user_account.fn_create_email_verification_token(UUID, TEXT, TIMESTAMPTZ) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_verify_email(TEXT) TO hidro_smart_app;

REVOKE EXECUTE ON FUNCTION user_account.fn_create_email_verification_token(VARCHAR, TEXT, TIMESTAMPTZ) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_consume_email_verification(TEXT) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION user_account.fn_is_session_active(UUID, UUID) FROM hidro_smart_app;
REVOKE EXECUTE ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ) FROM hidro_smart_app;

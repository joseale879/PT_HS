GRANT EXECUTE ON FUNCTION user_account.fn_create_email_verification_token(VARCHAR, TEXT, TIMESTAMPTZ) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_consume_email_verification(TEXT) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION user_account.fn_is_session_active(UUID, UUID) TO hidro_smart_app;
GRANT EXECUTE ON FUNCTION device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ) TO hidro_smart_app;

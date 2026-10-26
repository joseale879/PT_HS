DROP FUNCTION IF EXISTS device.fn_ingest_sensor_reading(VARCHAR, VARCHAR, NUMERIC, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS user_account.fn_is_session_active(UUID, UUID);
DROP FUNCTION IF EXISTS user_account.fn_consume_email_verification(TEXT);
DROP FUNCTION IF EXISTS user_account.fn_create_email_verification_token(VARCHAR, TEXT, TIMESTAMPTZ);
DROP TABLE IF EXISTS user_account.email_verification_token;
ALTER TABLE user_account.user_account DROP COLUMN IF EXISTS email_verified_at;

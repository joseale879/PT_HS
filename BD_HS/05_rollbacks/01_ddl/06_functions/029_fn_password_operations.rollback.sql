DROP FUNCTION IF EXISTS user_account.fn_consume_password_reset(TEXT, TEXT);
DROP FUNCTION IF EXISTS user_account.fn_create_password_reset_token(VARCHAR, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS user_account.fn_change_password_hash(UUID, TEXT);
DROP FUNCTION IF EXISTS user_account.fn_get_credential_for_user(UUID);

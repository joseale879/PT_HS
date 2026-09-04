DROP FUNCTION IF EXISTS user_account.fn_revoke_refresh_session(TEXT);
DROP FUNCTION IF EXISTS user_account.fn_rotate_refresh_token(TEXT, TEXT, TIMESTAMPTZ, VARCHAR, TEXT);
DROP FUNCTION IF EXISTS user_account.fn_create_session(UUID, TEXT, TIMESTAMPTZ, VARCHAR, TEXT);

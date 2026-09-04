DROP FUNCTION IF EXISTS user_account.fn_upsert_mfa(UUID, VARCHAR, BYTEA, JSONB);
DROP FUNCTION IF EXISTS user_account.fn_set_password_hash(UUID, TEXT, UUID, BOOLEAN);
DROP FUNCTION IF EXISTS user_account.fn_get_credential_for_login(VARCHAR);

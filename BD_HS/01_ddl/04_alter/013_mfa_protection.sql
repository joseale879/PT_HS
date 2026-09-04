ALTER TABLE user_account.user_mfa
    ADD COLUMN IF NOT EXISTS secret_totp_ciphertext BYTEA NULL,
    ADD COLUMN IF NOT EXISTS backup_codes_hashes JSONB NULL;

ALTER TABLE user_account.user_mfa
    DROP CONSTRAINT IF EXISTS ck_user_mfa_totp;

ALTER TABLE user_account.user_mfa
    ADD CONSTRAINT ck_user_mfa_protected_secret CHECK (
        method <> 'TOTP'
        OR secret_totp IS NOT NULL
        OR secret_totp_ciphertext IS NOT NULL
    );

COMMENT ON COLUMN user_account.user_mfa.secret_totp IS
'Legacy plaintext field. New MFA writes must use secret_totp_ciphertext.';

COMMENT ON COLUMN user_account.user_mfa.backup_codes IS
'Legacy plaintext field. New MFA writes must use backup_codes_hashes.';

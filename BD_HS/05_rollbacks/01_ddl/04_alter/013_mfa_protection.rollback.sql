ALTER TABLE user_account.user_mfa
    DROP CONSTRAINT IF EXISTS ck_user_mfa_protected_secret;

ALTER TABLE user_account.user_mfa
    ADD CONSTRAINT ck_user_mfa_totp CHECK (method <> 'TOTP' OR secret_totp IS NOT NULL);

ALTER TABLE user_account.user_mfa
    DROP COLUMN IF EXISTS secret_totp_ciphertext,
    DROP COLUMN IF EXISTS backup_codes_hashes;

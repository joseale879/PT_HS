ALTER TABLE user_account.user_account
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ NULL;

ALTER TABLE user_account.user_account
  DROP CONSTRAINT IF EXISTS user_account_status_check,
  DROP CONSTRAINT IF EXISTS ck_user_account_suspension;

ALTER TABLE user_account.user_account
  ADD CONSTRAINT user_account_status_check CHECK (status IN ('Pending', 'Active', 'Suspended', 'Blocked')),
  ADD CONSTRAINT ck_user_account_suspension CHECK (
    status IN ('Active', 'Pending') OR suspended_at IS NOT NULL
  );

CREATE TABLE IF NOT EXISTS user_account.email_verification_token (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_account_id UUID NOT NULL REFERENCES user_account.user_account(user_account_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ NULL,
  CONSTRAINT ck_email_verification_token_expires CHECK (expires_at > created_at),
  CONSTRAINT ck_email_verification_token_used CHECK (used = FALSE OR used_at IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_email_verification_token_user
  ON user_account.email_verification_token(user_account_id) WHERE used = FALSE;

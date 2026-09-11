ALTER TABLE user_account.user_profile
  ADD COLUMN IF NOT EXISTS avatar_data_url TEXT NULL;

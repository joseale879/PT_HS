ALTER TABLE IF EXISTS user_account.user_account DROP CONSTRAINT IF EXISTS fk_user_account_suspended_by;
ALTER TABLE IF EXISTS user_account.user_role DROP CONSTRAINT IF EXISTS fk_user_role_assigned_by;
ALTER TABLE IF EXISTS user_account.user_credential DROP CONSTRAINT IF EXISTS fk_user_credential_policy;
